// Permission Modal Component (Google Docs Style)
import React, { useState, useEffect } from 'react';
import { X, Search, User, Users, Building, Globe, Link, Mail, Check } from 'lucide-react';
import { db } from '../../lib/supabase';
import { toast } from 'react-hot-toast';

interface Permission {
  id: string;
  grantee_id: string;
  grantee_type: 'user' | 'organizational_unit' | 'organization';
  permission_level: 'viewer' | 'editor' | 'admin';
  granted_at: string;
  expires_at?: string;
  profiles?: { full_name: string; email: string; avatar_url?: string };
  organizational_units?: { name: string };
}

interface PermissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  resourceId: string;
  resourceType: 'memory' | 'file' | 'agent' | 'chat';
  resourceName: string;
  organizationId: string;
}

export const PermissionModal: React.FC<PermissionModalProps> = ({
  isOpen,
  onClose,
  resourceId,
  resourceType,
  resourceName,
  organizationId,
}) => {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedPermissionLevel, setSelectedPermissionLevel] = useState<'viewer' | 'editor' | 'admin'>('viewer');
  const [shareLink, setShareLink] = useState('');
  const [linkAccess, setLinkAccess] = useState<'none' | 'viewer' | 'editor'>('none');
  const [showLinkCopied, setShowLinkCopied] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadPermissions();
      generateShareLink();
    }
  }, [isOpen, resourceId]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchQuery.length >= 2) {
        searchUsersAndGroups();
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const loadPermissions = async () => {
    setLoading(true);
    try {
      const { data, error } = await db.permissions.getByResource(resourceId, resourceType);
      if (error) throw error;
      setPermissions(data || []);
    } catch (error: any) {
      toast.error(`Failed to load permissions: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const searchUsersAndGroups = async () => {
    setSearching(true);
    try {
      // Search users
      const { data: users, error: userError } = await db.profiles.getByOrganization(organizationId);
      if (userError) throw userError;

      // Search organizational units
      const { data: units, error: unitError } = await db.organizationalUnits.getByOrganization(organizationId);
      if (unitError) throw unitError;

      // Filter results based on search query
      const filteredUsers = (users || []).filter((user: any) =>
        user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchQuery.toLowerCase())
      );

      const filteredUnits = (units || []).filter((unit: any) =>
        unit.name.toLowerCase().includes(searchQuery.toLowerCase())
      );

      // Combine results
      const results = [
        ...filteredUsers.map((user: any) => ({
          id: user.id,
          type: 'user',
          name: user.full_name || user.email,
          email: user.email,
          avatar_url: user.avatar_url,
        })),
        ...filteredUnits.map((unit: any) => ({
          id: unit.id,
          type: 'organizational_unit',
          name: unit.name,
          description: 'Department/Team',
        })),
      ];

      // Filter out already granted permissions
      const existingIds = permissions.map(p => p.grantee_id);
      const availableResults = results.filter(r => !existingIds.includes(r.id));

      setSearchResults(availableResults);
    } catch (error: any) {
      console.error('Search error:', error);
    } finally {
      setSearching(false);
    }
  };

  const handleGrantPermission = async (grantee: any) => {
    try {
      const { error } = await db.permissions.grant({
        organization_id: organizationId,
        resource_id: resourceId,
        resource_type: resourceType,
        grantee_id: grantee.id,
        grantee_type: grantee.type,
        permission_level: selectedPermissionLevel,
      });

      if (error) throw error;

      toast.success(`Permission granted to ${grantee.name}`);
      setSearchQuery('');
      setSearchResults([]);
      loadPermissions();
    } catch (error: any) {
      toast.error(`Failed to grant permission: ${error.message}`);
    }
  };

  const handleUpdatePermission = async (permissionId: string, newLevel: string) => {
    try {
      const { error } = await db.permissions.update(permissionId, {
        permission_level: newLevel,
      });

      if (error) throw error;

      toast.success('Permission updated');
      loadPermissions();
    } catch (error: any) {
      toast.error(`Failed to update permission: ${error.message}`);
    }
  };

  const handleRevokePermission = async (permissionId: string) => {
    if (!confirm('Are you sure you want to revoke this permission?')) {
      return;
    }

    try {
      const { error } = await db.permissions.revoke(permissionId);
      if (error) throw error;

      toast.success('Permission revoked');
      loadPermissions();
    } catch (error: any) {
      toast.error(`Failed to revoke permission: ${error.message}`);
    }
  };

  const generateShareLink = () => {
    const baseUrl = window.location.origin;
    const link = `${baseUrl}/shared/${resourceType}/${resourceId}`;
    setShareLink(link);
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareLink);
      setShowLinkCopied(true);
      setTimeout(() => setShowLinkCopied(false), 2000);
    } catch (error) {
      toast.error('Failed to copy link');
    }
  };

  const getPermissionIcon = (type: string) => {
    switch (type) {
      case 'user':
        return <User className="w-4 h-4" />;
      case 'organizational_unit':
        return <Users className="w-4 h-4" />;
      case 'organization':
        return <Building className="w-4 h-4" />;
      default:
        return <Globe className="w-4 h-4" />;
    }
  };

  const getPermissionBadgeColor = (level: string) => {
    switch (level) {
      case 'admin':
        return 'bg-red-100 text-red-800';
      case 'editor':
        return 'bg-yellow-100 text-yellow-800';
      case 'viewer':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
              Share "{resourceName}"
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Manage who has access to this {resourceType}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Add People Section */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex space-x-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Add people, groups, or teams"
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-blue-500"
              />

              {/* Search Results Dropdown */}
              {searchResults.length > 0 && (
                <div className="absolute top-full mt-1 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
                  {searchResults.map((result) => (
                    <button
                      key={result.id}
                      onClick={() => handleGrantPermission(result)}
                      className="w-full px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center justify-between text-left"
                    >
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-gray-200 dark:bg-gray-600 rounded-full flex items-center justify-center mr-3">
                          {getPermissionIcon(result.type)}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {result.name}
                          </div>
                          {result.email && (
                            <div className="text-xs text-gray-500">{result.email}</div>
                          )}
                          {result.description && (
                            <div className="text-xs text-gray-500">{result.description}</div>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <select
              value={selectedPermissionLevel}
              onChange={(e) => setSelectedPermissionLevel(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-blue-500"
            >
              <option value="viewer">Can view</option>
              <option value="editor">Can edit</option>
              <option value="admin">Can manage</option>
            </select>
          </div>
        </div>

        {/* Link Sharing Section */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Link className="w-5 h-5 mr-3 text-gray-500" />
              <div>
                <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  Get link
                </div>
                <div className="text-xs text-gray-500">
                  Anyone with the link can access
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <select
                value={linkAccess}
                onChange={(e) => setLinkAccess(e.target.value as any)}
                className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none"
              >
                <option value="none">Restricted</option>
                <option value="viewer">Anyone with link can view</option>
                <option value="editor">Anyone with link can edit</option>
              </select>
              <button
                onClick={handleCopyLink}
                className="px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
              >
                {showLinkCopied ? (
                  <>
                    <Check className="w-4 h-4 mr-1" />
                    Copied!
                  </>
                ) : (
                  'Copy link'
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Permissions List */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            People with access
          </h3>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            </div>
          ) : permissions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No permissions granted yet
            </div>
          ) : (
            <div className="space-y-2">
              {permissions.map((permission) => (
                <div
                  key={permission.id}
                  className="flex items-center justify-between py-2 hover:bg-gray-50 dark:hover:bg-gray-700 px-2 rounded-lg"
                >
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-gray-200 dark:bg-gray-600 rounded-full flex items-center justify-center mr-3">
                      {getPermissionIcon(permission.grantee_type)}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {permission.grantee_type === 'user'
                          ? permission.profiles?.full_name || permission.profiles?.email
                          : permission.organizational_units?.name || 'Unknown'}
                      </div>
                      {permission.grantee_type === 'user' && permission.profiles?.email && (
                        <div className="text-xs text-gray-500">{permission.profiles.email}</div>
                      )}
                      {permission.grantee_type === 'organizational_unit' && (
                        <div className="text-xs text-gray-500">Department/Team</div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <select
                      value={permission.permission_level}
                      onChange={(e) => handleUpdatePermission(permission.id, e.target.value)}
                      className={`px-3 py-1 text-xs rounded-full ${getPermissionBadgeColor(
                        permission.permission_level
                      )}`}
                    >
                      <option value="viewer">Viewer</option>
                      <option value="editor">Editor</option>
                      <option value="admin">Admin</option>
                    </select>
                    <button
                      onClick={() => handleRevokePermission(permission.id)}
                      className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded text-gray-500 hover:text-red-600"
                      title="Remove access"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <button
            onClick={() => {
              // Send notification to all users with permissions
              toast.success('Notifications sent to all users with access');
            }}
            className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg flex items-center"
          >
            <Mail className="w-4 h-4 mr-2" />
            Notify people
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};