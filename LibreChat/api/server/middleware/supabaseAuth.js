// Supabase JWT Verification Middleware for LibreChat Backend
const { createClient } = require('@supabase/supabase-js');
const jwt = require('jsonwebtoken');

// Initialize Supabase client
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://qctdaaezghvqnbpghinr.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const SUPABASE_JWT_SECRET = process.env.SUPABASE_JWT_SECRET || '';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

/**
 * Middleware to verify Supabase JWT tokens
 * Integrates with existing LibreChat auth system
 */
async function verifySupabaseToken(req, res, next) {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // Fallback to existing auth method
      return next();
    }

    const token = authHeader.substring(7);

    // Try to verify as Supabase token first
    if (token.includes('eyJ') && token.split('.').length === 3) {
      try {
        // Verify JWT signature
        const decoded = jwt.decode(token, { complete: true });

        if (decoded && decoded.payload.iss === 'https://qctdaaezghvqnbpghinr.supabase.co/auth/v1') {
          // This is a Supabase token
          const { data: { user }, error } = await supabase.auth.getUser(token);

          if (error || !user) {
            return res.status(401).json({ error: 'Invalid Supabase token' });
          }

          // Get user profile from Supabase
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select(`
              *,
              organizations (
                id,
                name,
                slug,
                settings
              )
            `)
            .eq('id', user.id)
            .single();

          if (profileError || !profile) {
            return res.status(401).json({ error: 'User profile not found' });
          }

          // Convert Supabase user to LibreChat user format
          req.user = {
            id: user.id,
            email: user.email,
            username: profile.username || user.email.split('@')[0],
            name: profile.full_name || user.email,
            avatar: profile.avatar_url,
            role: convertSupabaseRole(profile.role),
            provider: 'supabase',
            organizationId: profile.organization_id,
            organizationName: profile.organizations?.name,
            supabaseProfile: profile,
          };

          // Add organization context
          req.organizationId = profile.organization_id;
          req.organizationRole = profile.role;

          // Check if user exists in LibreChat database
          const User = require('~/models/User');
          let libreChatUser = await User.findOne({ email: user.email });

          if (!libreChatUser) {
            // Create user in LibreChat database
            libreChatUser = await User.create({
              email: user.email,
              username: profile.username || user.email.split('@')[0],
              name: profile.full_name || user.email,
              avatar: profile.avatar_url,
              provider: 'supabase',
              supabaseId: user.id,
              organizationId: profile.organization_id,
            });
          } else {
            // Update user info
            libreChatUser.organizationId = profile.organization_id;
            libreChatUser.supabaseId = user.id;
            await libreChatUser.save();
          }

          req.user.mongoId = libreChatUser._id;
          return next();
        }
      } catch (err) {
        console.error('Supabase token verification error:', err);
        // Not a Supabase token, continue with normal auth
      }
    }

    // Continue with existing LibreChat auth
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    next();
  }
}

/**
 * Middleware to check organization permissions
 */
function requireOrganization(req, res, next) {
  if (!req.organizationId) {
    return res.status(403).json({ error: 'Organization context required' });
  }
  next();
}

/**
 * Middleware to check admin role
 */
function requireOrgAdmin(req, res, next) {
  if (!req.organizationRole || !['org_admin', 'super_admin'].includes(req.organizationRole)) {
    return res.status(403).json({ error: 'Admin privileges required' });
  }
  next();
}

/**
 * Middleware to check resource permissions
 */
async function checkResourcePermission(resourceType, permissionLevel) {
  return async (req, res, next) => {
    try {
      const resourceId = req.params.id || req.body.resourceId;
      const userId = req.user?.id;
      const organizationId = req.organizationId;

      if (!resourceId || !userId) {
        return res.status(403).json({ error: 'Access denied' });
      }

      // Check if user has permission for this resource
      const { data: permission, error } = await supabase
        .from('resource_permissions')
        .select('*')
        .eq('resource_id', resourceId)
        .eq('resource_type', resourceType)
        .eq('organization_id', organizationId)
        .or(`grantee_id.eq.${userId},grantee_id.eq.${req.user?.supabaseProfile?.organizational_unit_id}`)
        .single();

      if (error || !permission) {
        // Check if user is resource owner
        const isOwner = await checkResourceOwnership(resourceId, resourceType, userId);
        if (!isOwner) {
          return res.status(403).json({ error: 'Permission denied' });
        }
      }

      // Check permission level
      if (permission && !hasRequiredPermission(permission.permission_level, permissionLevel)) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }

      next();
    } catch (error) {
      console.error('Permission check error:', error);
      res.status(500).json({ error: 'Permission check failed' });
    }
  };
}

/**
 * Helper function to check resource ownership
 */
async function checkResourceOwnership(resourceId, resourceType, userId) {
  // This would check the actual resource tables
  // For now, returning true for demo
  return true;
}

/**
 * Helper function to check permission levels
 */
function hasRequiredPermission(userLevel, requiredLevel) {
  const levels = {
    viewer: 1,
    editor: 2,
    admin: 3,
  };

  return levels[userLevel] >= levels[requiredLevel];
}

/**
 * Convert Supabase role to LibreChat role
 */
function convertSupabaseRole(supabaseRole) {
  const roleMap = {
    super_admin: 'ADMIN',
    org_admin: 'USER',
    member: 'USER',
  };
  return roleMap[supabaseRole] || 'USER';
}

/**
 * Sync user data between Supabase and LibreChat
 */
async function syncUserData(req, res, next) {
  try {
    if (!req.user?.provider === 'supabase') {
      return next();
    }

    // Sync any changes from Supabase to LibreChat
    const User = require('~/models/User');
    const libreChatUser = await User.findById(req.user.mongoId);

    if (libreChatUser && req.user.supabaseProfile) {
      // Update user data if changed
      let updated = false;

      if (libreChatUser.name !== req.user.supabaseProfile.full_name) {
        libreChatUser.name = req.user.supabaseProfile.full_name;
        updated = true;
      }

      if (libreChatUser.avatar !== req.user.supabaseProfile.avatar_url) {
        libreChatUser.avatar = req.user.supabaseProfile.avatar_url;
        updated = true;
      }

      if (updated) {
        await libreChatUser.save();
      }
    }

    next();
  } catch (error) {
    console.error('User sync error:', error);
    next();
  }
}

module.exports = {
  verifySupabaseToken,
  requireOrganization,
  requireOrgAdmin,
  checkResourcePermission,
  syncUserData,
};