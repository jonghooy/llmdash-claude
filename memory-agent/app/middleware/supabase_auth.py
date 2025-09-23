"""
Supabase JWT Authentication Middleware for Memory Agent
"""
from typing import Optional, Dict, Any
from fastapi import Request, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from supabase import create_client, Client
from functools import lru_cache
import jwt
import os
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

# Supabase configuration
SUPABASE_URL = os.getenv("SUPABASE_URL", "https://qctdaaezghvqnbpghinr.supabase.co")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFjdGRhYWV6Z2h2cW5icGdoaW5yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgyNzU3NTMsImV4cCI6MjA3Mzg1MTc1M30.WJVWs7aruIuo_jpa6o0xXbXefN8DCIK_1CTr_afVRos")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
SUPABASE_JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET", "")

# Initialize Supabase client
@lru_cache()
def get_supabase_client() -> Client:
    """Get cached Supabase client instance."""
    return create_client(
        SUPABASE_URL,
        SUPABASE_SERVICE_KEY or SUPABASE_ANON_KEY,
        options={
            "auto_refresh_token": False,
            "persist_session": False,
        }
    )

# HTTP Bearer for token extraction
security = HTTPBearer()

class AuthContext:
    """Authentication context containing user and organization information."""

    def __init__(self, user_data: Dict[str, Any], profile_data: Dict[str, Any]):
        self.user_id = user_data.get("id")
        self.email = user_data.get("email")
        self.user_data = user_data

        self.profile = profile_data
        self.organization_id = profile_data.get("organization_id")
        self.organizational_unit_id = profile_data.get("organizational_unit_id")
        self.role = profile_data.get("role", "member")
        self.username = profile_data.get("username") or self.email
        self.full_name = profile_data.get("full_name")

        # Organization details
        self.organization = profile_data.get("organizations", {})
        self.organization_name = self.organization.get("name")
        self.organization_slug = self.organization.get("slug")

    def is_admin(self) -> bool:
        """Check if user is an admin (org_admin or super_admin)."""
        return self.role in ["org_admin", "super_admin"]

    def is_super_admin(self) -> bool:
        """Check if user is a super admin."""
        return self.role == "super_admin"

    def to_dict(self) -> Dict[str, Any]:
        """Convert context to dictionary."""
        return {
            "user_id": self.user_id,
            "email": self.email,
            "username": self.username,
            "full_name": self.full_name,
            "role": self.role,
            "organization_id": self.organization_id,
            "organization_name": self.organization_name,
            "organizational_unit_id": self.organizational_unit_id,
        }

async def verify_supabase_token(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> AuthContext:
    """
    Verify Supabase JWT token and return authentication context.

    Args:
        credentials: HTTP Bearer token from request

    Returns:
        AuthContext with user and organization information

    Raises:
        HTTPException: If token is invalid or user not found
    """
    token = credentials.credentials

    try:
        # Get Supabase client
        supabase = get_supabase_client()

        # Verify token with Supabase
        user_response = supabase.auth.get_user(token)

        if not user_response or not user_response.user:
            raise HTTPException(
                status_code=401,
                detail="Invalid authentication token"
            )

        user = user_response.user

        # Get user profile with organization data
        profile_response = supabase.table("profiles").select(
            "*, organizations(id, name, slug, settings), organizational_units(id, name)"
        ).eq("id", user.id).single().execute()

        if not profile_response.data:
            raise HTTPException(
                status_code=401,
                detail="User profile not found"
            )

        profile = profile_response.data

        # Create and return auth context
        return AuthContext(user.dict(), profile)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Token verification error: {str(e)}")
        raise HTTPException(
            status_code=401,
            detail="Authentication failed"
        )

async def get_current_user(
    auth_context: AuthContext = Depends(verify_supabase_token)
) -> Dict[str, Any]:
    """
    Get current authenticated user.

    Args:
        auth_context: Authentication context from token verification

    Returns:
        User information dictionary
    """
    return auth_context.to_dict()

async def require_organization(
    auth_context: AuthContext = Depends(verify_supabase_token)
) -> AuthContext:
    """
    Require that user belongs to an organization.

    Args:
        auth_context: Authentication context

    Returns:
        AuthContext if user has organization

    Raises:
        HTTPException: If user doesn't belong to organization
    """
    if not auth_context.organization_id:
        raise HTTPException(
            status_code=403,
            detail="Organization membership required"
        )

    return auth_context

async def require_admin(
    auth_context: AuthContext = Depends(verify_supabase_token)
) -> AuthContext:
    """
    Require admin privileges (org_admin or super_admin).

    Args:
        auth_context: Authentication context

    Returns:
        AuthContext if user is admin

    Raises:
        HTTPException: If user is not admin
    """
    if not auth_context.is_admin():
        raise HTTPException(
            status_code=403,
            detail="Admin privileges required"
        )

    return auth_context

async def require_super_admin(
    auth_context: AuthContext = Depends(verify_supabase_token)
) -> AuthContext:
    """
    Require super admin privileges.

    Args:
        auth_context: Authentication context

    Returns:
        AuthContext if user is super admin

    Raises:
        HTTPException: If user is not super admin
    """
    if not auth_context.is_super_admin():
        raise HTTPException(
            status_code=403,
            detail="Super admin privileges required"
        )

    return auth_context

class ACLChecker:
    """Access Control List checker for resource permissions."""

    def __init__(self, resource_type: str, permission_level: str = "viewer"):
        self.resource_type = resource_type
        self.permission_level = permission_level

    async def __call__(
        self,
        request: Request,
        auth_context: AuthContext = Depends(verify_supabase_token)
    ) -> bool:
        """
        Check if user has required permission for resource.

        Args:
            request: FastAPI request object
            auth_context: Authentication context

        Returns:
            True if permission granted

        Raises:
            HTTPException: If permission denied
        """
        # Extract resource ID from request
        resource_id = None

        # Try to get from path parameters
        if hasattr(request, "path_params"):
            resource_id = request.path_params.get("resource_id") or \
                         request.path_params.get("id")

        # Try to get from query parameters
        if not resource_id and hasattr(request, "query_params"):
            resource_id = request.query_params.get("resource_id")

        # Try to get from body (for POST/PUT requests)
        if not resource_id and request.method in ["POST", "PUT"]:
            try:
                body = await request.json()
                resource_id = body.get("resource_id")
            except:
                pass

        if not resource_id:
            raise HTTPException(
                status_code=400,
                detail="Resource ID not provided"
            )

        # Check permissions in database
        supabase = get_supabase_client()

        # Check direct user permission
        user_perm = supabase.table("resource_permissions").select("*").eq(
            "resource_id", resource_id
        ).eq(
            "resource_type", self.resource_type
        ).eq(
            "grantee_id", auth_context.user_id
        ).eq(
            "grantee_type", "user"
        ).execute()

        if user_perm.data:
            permission = user_perm.data[0]
            if self._has_required_permission(permission["permission_level"]):
                return True

        # Check organizational unit permission
        if auth_context.organizational_unit_id:
            unit_perm = supabase.table("resource_permissions").select("*").eq(
                "resource_id", resource_id
            ).eq(
                "resource_type", self.resource_type
            ).eq(
                "grantee_id", auth_context.organizational_unit_id
            ).eq(
                "grantee_type", "organizational_unit"
            ).execute()

            if unit_perm.data:
                permission = unit_perm.data[0]
                if self._has_required_permission(permission["permission_level"]):
                    return True

        # Check if user is admin (admins have access to all resources in org)
        if auth_context.is_admin():
            return True

        # Permission denied
        raise HTTPException(
            status_code=403,
            detail=f"Insufficient permissions for {self.resource_type}"
        )

    def _has_required_permission(self, user_level: str) -> bool:
        """Check if user permission level meets requirements."""
        levels = {
            "viewer": 1,
            "editor": 2,
            "admin": 3
        }

        return levels.get(user_level, 0) >= levels.get(self.permission_level, 1)

# Convenience dependency functions
def require_memory_viewer():
    """Require viewer access to memory resource."""
    return ACLChecker("memory", "viewer")

def require_memory_editor():
    """Require editor access to memory resource."""
    return ACLChecker("memory", "editor")

def require_memory_admin():
    """Require admin access to memory resource."""
    return ACLChecker("memory", "admin")

# Metadata filter for LlamaIndex queries
def get_organization_filter(
    auth_context: AuthContext = Depends(require_organization)
) -> Dict[str, Any]:
    """
    Get metadata filter for organization-scoped queries.

    Args:
        auth_context: Authentication context

    Returns:
        Metadata filter dictionary for LlamaIndex
    """
    return {
        "organization_id": auth_context.organization_id
    }

async def get_accessible_resources(
    auth_context: AuthContext,
    resource_type: str
) -> list[str]:
    """
    Get list of resource IDs user has access to.

    Args:
        auth_context: Authentication context
        resource_type: Type of resource (memory, file, agent, chat)

    Returns:
        List of accessible resource IDs
    """
    supabase = get_supabase_client()

    # Build query for accessible resources
    query = supabase.table("resource_permissions").select("resource_id")
    query = query.eq("resource_type", resource_type)
    query = query.eq("organization_id", auth_context.organization_id)

    # Filter by user or organizational unit
    filters = [f"grantee_id.eq.{auth_context.user_id}"]
    if auth_context.organizational_unit_id:
        filters.append(f"grantee_id.eq.{auth_context.organizational_unit_id}")

    query = query.or_(",".join(filters))

    result = query.execute()

    if result.data:
        return [item["resource_id"] for item in result.data]

    return []

# Logging middleware
async def log_access(
    request: Request,
    auth_context: AuthContext,
    action: str,
    resource_type: Optional[str] = None,
    resource_id: Optional[str] = None
):
    """
    Log access attempt to audit table.

    Args:
        request: FastAPI request
        auth_context: Authentication context
        action: Action being performed
        resource_type: Type of resource being accessed
        resource_id: ID of resource being accessed
    """
    try:
        supabase = get_supabase_client()

        audit_entry = {
            "organization_id": auth_context.organization_id,
            "user_id": auth_context.user_id,
            "action": action,
            "resource_type": resource_type,
            "resource_id": resource_id,
            "details": {
                "method": request.method,
                "path": str(request.url.path),
                "user_agent": request.headers.get("user-agent"),
            },
            "ip_address": request.client.host if request.client else None,
        }

        supabase.table("audit_logs").insert(audit_entry).execute()

    except Exception as e:
        logger.error(f"Failed to log audit entry: {str(e)}")
        # Don't fail the request if audit logging fails