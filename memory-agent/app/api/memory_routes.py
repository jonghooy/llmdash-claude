"""
Memory API Routes with Supabase Authentication and ACL
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
from datetime import datetime
import uuid

from ..middleware.supabase_auth import (
    AuthContext,
    require_organization,
    require_admin,
    require_memory_viewer,
    require_memory_editor,
    require_memory_admin,
    get_organization_filter,
    get_accessible_resources,
    log_access
)

# Create router
router = APIRouter(
    prefix="/api/v1/memories",
    tags=["memories"],
    dependencies=[Depends(require_organization)]  # All routes require org
)

# Pydantic models
class MemoryCreate(BaseModel):
    """Model for creating a new memory."""
    title: str
    content: str
    type: str = "text"
    metadata: Dict[str, Any] = {}
    tags: List[str] = []
    is_public: bool = False

class MemoryUpdate(BaseModel):
    """Model for updating a memory."""
    title: Optional[str] = None
    content: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None
    tags: Optional[List[str]] = None
    is_public: Optional[bool] = None

class MemoryResponse(BaseModel):
    """Model for memory response."""
    id: str
    organization_id: str
    title: str
    content: str
    type: str
    metadata: Dict[str, Any]
    tags: List[str]
    is_public: bool
    created_by: str
    created_at: datetime
    updated_at: datetime
    permission_level: Optional[str] = None

class MemorySearchRequest(BaseModel):
    """Model for memory search request."""
    query: str
    limit: int = 10
    filters: Dict[str, Any] = {}
    include_public: bool = True

# Routes
@router.post("/", response_model=MemoryResponse)
async def create_memory(
    memory: MemoryCreate,
    auth_context: AuthContext = Depends(require_organization)
):
    """
    Create a new memory.

    This endpoint creates a new memory and automatically grants admin permission
    to the creator.
    """
    # Generate memory ID
    memory_id = str(uuid.uuid4())

    # Create memory data with organization context
    memory_data = {
        "id": memory_id,
        "organization_id": auth_context.organization_id,
        "title": memory.title,
        "content": memory.content,
        "type": memory.type,
        "metadata": {
            **memory.metadata,
            "organization_id": auth_context.organization_id,
            "created_by": auth_context.user_id,
            "created_by_name": auth_context.full_name or auth_context.username,
        },
        "tags": memory.tags,
        "is_public": memory.is_public,
        "created_by": auth_context.user_id,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }

    # TODO: Store in LlamaIndex with metadata
    # index.insert_document(memory_data)

    # Grant creator admin permission
    from ..middleware.supabase_auth import get_supabase_client
    supabase = get_supabase_client()

    permission_data = {
        "organization_id": auth_context.organization_id,
        "resource_id": memory_id,
        "resource_type": "memory",
        "grantee_id": auth_context.user_id,
        "grantee_type": "user",
        "permission_level": "admin",
        "granted_by": auth_context.user_id,
    }

    supabase.table("resource_permissions").insert(permission_data).execute()

    # Log creation
    await log_access(
        request=None,  # Would be passed from FastAPI
        auth_context=auth_context,
        action="memory_created",
        resource_type="memory",
        resource_id=memory_id
    )

    memory_data["permission_level"] = "admin"
    return MemoryResponse(**memory_data)

@router.get("/{memory_id}", response_model=MemoryResponse)
async def get_memory(
    memory_id: str,
    auth_context: AuthContext = Depends(require_organization),
    has_permission: bool = Depends(require_memory_viewer())
):
    """
    Get a specific memory by ID.

    Requires at least viewer permission for the memory.
    """
    # TODO: Fetch from LlamaIndex
    # memory = index.get_document(memory_id, filters=get_organization_filter(auth_context))

    # Mock response for demo
    memory_data = {
        "id": memory_id,
        "organization_id": auth_context.organization_id,
        "title": "Sample Memory",
        "content": "This is a sample memory content.",
        "type": "text",
        "metadata": {},
        "tags": ["sample"],
        "is_public": False,
        "created_by": auth_context.user_id,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
        "permission_level": "viewer",
    }

    return MemoryResponse(**memory_data)

@router.put("/{memory_id}", response_model=MemoryResponse)
async def update_memory(
    memory_id: str,
    memory: MemoryUpdate,
    auth_context: AuthContext = Depends(require_organization),
    has_permission: bool = Depends(require_memory_editor())
):
    """
    Update a memory.

    Requires editor permission for the memory.
    """
    # TODO: Update in LlamaIndex
    # existing = index.get_document(memory_id)
    # updated = merge_updates(existing, memory.dict(exclude_unset=True))
    # index.update_document(memory_id, updated)

    # Mock response
    memory_data = {
        "id": memory_id,
        "organization_id": auth_context.organization_id,
        "title": memory.title or "Updated Memory",
        "content": memory.content or "Updated content",
        "type": "text",
        "metadata": memory.metadata or {},
        "tags": memory.tags or [],
        "is_public": memory.is_public or False,
        "created_by": auth_context.user_id,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
        "permission_level": "editor",
    }

    # Log update
    await log_access(
        request=None,
        auth_context=auth_context,
        action="memory_updated",
        resource_type="memory",
        resource_id=memory_id
    )

    return MemoryResponse(**memory_data)

@router.delete("/{memory_id}")
async def delete_memory(
    memory_id: str,
    auth_context: AuthContext = Depends(require_organization),
    has_permission: bool = Depends(require_memory_admin())
):
    """
    Delete a memory.

    Requires admin permission for the memory.
    """
    # TODO: Delete from LlamaIndex
    # index.delete_document(memory_id)

    # Delete permissions
    from ..middleware.supabase_auth import get_supabase_client
    supabase = get_supabase_client()

    supabase.table("resource_permissions").delete().eq(
        "resource_id", memory_id
    ).eq("resource_type", "memory").execute()

    # Log deletion
    await log_access(
        request=None,
        auth_context=auth_context,
        action="memory_deleted",
        resource_type="memory",
        resource_id=memory_id
    )

    return {"message": "Memory deleted successfully"}

@router.post("/search", response_model=List[MemoryResponse])
async def search_memories(
    search: MemorySearchRequest,
    auth_context: AuthContext = Depends(require_organization)
):
    """
    Search memories with ACL filtering.

    Returns only memories the user has access to within their organization.
    """
    # Get accessible resource IDs
    accessible_ids = await get_accessible_resources(auth_context, "memory")

    # Build search filters
    filters = {
        **search.filters,
        "organization_id": auth_context.organization_id,
    }

    # Add resource ID filter
    if not auth_context.is_admin():
        # Non-admins can only see memories they have explicit access to
        filters["resource_id"] = {"$in": accessible_ids}

    if search.include_public:
        # Also include public memories from the organization
        filters["$or"] = [
            {"resource_id": {"$in": accessible_ids}},
            {"is_public": True}
        ]

    # TODO: Search in LlamaIndex
    # results = index.search(
    #     query=search.query,
    #     limit=search.limit,
    #     filters=filters
    # )

    # Mock response
    results = [
        {
            "id": str(uuid.uuid4()),
            "organization_id": auth_context.organization_id,
            "title": f"Search Result for: {search.query}",
            "content": "This is a search result content.",
            "type": "text",
            "metadata": {},
            "tags": ["search", "result"],
            "is_public": False,
            "created_by": auth_context.user_id,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
            "permission_level": "viewer",
        }
    ]

    return [MemoryResponse(**r) for r in results]

@router.get("/", response_model=List[MemoryResponse])
async def list_memories(
    limit: int = Query(10, le=100),
    offset: int = Query(0, ge=0),
    filter_type: Optional[str] = None,
    filter_tags: Optional[List[str]] = Query(None),
    auth_context: AuthContext = Depends(require_organization)
):
    """
    List memories with pagination.

    Returns memories the user has access to.
    """
    # Get accessible resource IDs
    accessible_ids = await get_accessible_resources(auth_context, "memory")

    # Build filters
    filters = {
        "organization_id": auth_context.organization_id,
    }

    if not auth_context.is_admin():
        filters["resource_id"] = {"$in": accessible_ids}

    if filter_type:
        filters["type"] = filter_type

    if filter_tags:
        filters["tags"] = {"$in": filter_tags}

    # TODO: Query from LlamaIndex or database
    # memories = index.list_documents(
    #     filters=filters,
    #     limit=limit,
    #     offset=offset
    # )

    # Mock response
    memories = [
        {
            "id": str(uuid.uuid4()),
            "organization_id": auth_context.organization_id,
            "title": f"Memory {i}",
            "content": f"Content for memory {i}",
            "type": "text",
            "metadata": {},
            "tags": ["sample"],
            "is_public": False,
            "created_by": auth_context.user_id,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
            "permission_level": "viewer",
        }
        for i in range(min(limit, 5))
    ]

    return [MemoryResponse(**m) for m in memories]

@router.post("/{memory_id}/share")
async def share_memory(
    memory_id: str,
    grantee_id: str,
    grantee_type: str = Query(..., regex="^(user|organizational_unit|organization)$"),
    permission_level: str = Query("viewer", regex="^(viewer|editor|admin)$"),
    auth_context: AuthContext = Depends(require_organization),
    has_permission: bool = Depends(require_memory_admin())
):
    """
    Share a memory with a user or group.

    Requires admin permission for the memory.
    """
    from ..middleware.supabase_auth import get_supabase_client
    supabase = get_supabase_client()

    # Check if permission already exists
    existing = supabase.table("resource_permissions").select("*").eq(
        "resource_id", memory_id
    ).eq("resource_type", "memory").eq(
        "grantee_id", grantee_id
    ).eq("grantee_type", grantee_type).execute()

    if existing.data:
        # Update existing permission
        supabase.table("resource_permissions").update({
            "permission_level": permission_level,
            "granted_by": auth_context.user_id,
            "granted_at": datetime.utcnow().isoformat()
        }).eq("id", existing.data[0]["id"]).execute()
    else:
        # Create new permission
        permission_data = {
            "organization_id": auth_context.organization_id,
            "resource_id": memory_id,
            "resource_type": "memory",
            "grantee_id": grantee_id,
            "grantee_type": grantee_type,
            "permission_level": permission_level,
            "granted_by": auth_context.user_id,
        }
        supabase.table("resource_permissions").insert(permission_data).execute()

    # Log sharing
    await log_access(
        request=None,
        auth_context=auth_context,
        action="memory_shared",
        resource_type="memory",
        resource_id=memory_id
    )

    return {"message": f"Memory shared with {grantee_type} successfully"}

@router.delete("/{memory_id}/share")
async def revoke_memory_access(
    memory_id: str,
    grantee_id: str,
    grantee_type: str = Query(..., regex="^(user|organizational_unit|organization)$"),
    auth_context: AuthContext = Depends(require_organization),
    has_permission: bool = Depends(require_memory_admin())
):
    """
    Revoke access to a memory.

    Requires admin permission for the memory.
    """
    from ..middleware.supabase_auth import get_supabase_client
    supabase = get_supabase_client()

    # Delete permission
    supabase.table("resource_permissions").delete().eq(
        "resource_id", memory_id
    ).eq("resource_type", "memory").eq(
        "grantee_id", grantee_id
    ).eq("grantee_type", grantee_type).execute()

    # Log revocation
    await log_access(
        request=None,
        auth_context=auth_context,
        action="memory_access_revoked",
        resource_type="memory",
        resource_id=memory_id
    )

    return {"message": "Access revoked successfully"}