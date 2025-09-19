import React, { useState } from 'react';
import {
  User,
  Users,
  Building2,
  MoreVertical,
  Trash2,
  Clock,
  Shield
} from 'lucide-react';
import { ACL, Permission } from '../types';
import { PermissionSelector } from './PermissionSelector';
import { format } from 'date-fns';

interface PermissionsListProps {
  permissions: ACL[];
  currentUserId: string;
  onUpdatePermission: (id: string, permission: Permission) => Promise<void>;
  onRemovePermission: (id: string) => Promise<void>;
  loading?: boolean;
}

export const PermissionsList: React.FC<PermissionsListProps> = ({
  permissions,
  currentUserId,
  onUpdatePermission,
  onRemovePermission,
  loading = false
}) => {
  const [updating, setUpdating] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  const handleUpdatePermission = async (id: string, permission: Permission) => {
    setUpdating(id);
    try {
      await onUpdatePermission(id, permission);
    } finally {
      setUpdating(null);
    }
  };

  const handleRemove = async (id: string) => {
    if (!confirm('Are you sure you want to remove this permission?')) return;

    setUpdating(id);
    try {
      await onRemovePermission(id);
    } finally {
      setUpdating(null);
      setMenuOpen(null);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'user':
        return <User className="w-4 h-4" />;
      case 'team':
        return <Users className="w-4 h-4" />;
      case 'organization':
        return <Building2 className="w-4 h-4" />;
      default:
        return <User className="w-4 h-4" />;
    }
  };

  const isOwner = (acl: ACL) => acl.grantor_id === currentUserId;

  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent mx-auto" />
        <p className="text-sm text-gray-500 mt-2">Loading permissions...</p>
      </div>
    );
  }

  if (permissions.length === 0) {
    return (
      <div className="p-8 text-center">
        <Shield className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500">No permissions configured yet</p>
        <p className="text-sm text-gray-400 mt-1">
          Share this resource to grant access to others
        </p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-200">
      <div className="p-4">
        <h3 className="text-sm font-medium text-gray-700">Who has access</h3>
      </div>

      {permissions.map((acl) => (
        <div
          key={acl.id}
          className={`p-4 flex items-center justify-between hover:bg-gray-50 ${
            updating === acl.id ? 'opacity-50' : ''
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
              {acl.grantee?.avatar ? (
                <img
                  src={acl.grantee.avatar}
                  alt={acl.grantee.name}
                  className="w-10 h-10 rounded-full"
                />
              ) : (
                getIcon(acl.grantee_type)
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">
                  {acl.grantee?.name || acl.grantee?.email || 'Unknown'}
                </span>
                {isOwner(acl) && (
                  <span className="px-2 py-0.5 text-xs bg-purple-100 text-purple-700 rounded-full">
                    Owner
                  </span>
                )}
              </div>
              {acl.grantee?.email && acl.grantee.email !== acl.grantee.name && (
                <div className="text-xs text-gray-500">{acl.grantee.email}</div>
              )}
              {acl.expires_at && (
                <div className="flex items-center gap-1 mt-1">
                  <Clock className="w-3 h-3 text-gray-400" />
                  <span className="text-xs text-gray-500">
                    Expires {format(new Date(acl.expires_at), 'MMM d, yyyy')}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <PermissionSelector
              value={acl.permission}
              onChange={(p) => handleUpdatePermission(acl.id, p)}
              disabled={isOwner(acl) || updating === acl.id}
            />

            {!isOwner(acl) && (
              <div className="relative">
                <button
                  onClick={() => setMenuOpen(menuOpen === acl.id ? null : acl.id)}
                  className="p-1 hover:bg-gray-100 rounded"
                  disabled={updating === acl.id}
                >
                  <MoreVertical className="w-4 h-4 text-gray-600" />
                </button>

                {menuOpen === acl.id && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setMenuOpen(null)}
                    />
                    <div className="absolute right-0 mt-1 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-20">
                      <button
                        onClick={() => handleRemove(acl.id)}
                        className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                      >
                        <Trash2 className="w-4 h-4" />
                        Remove access
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};