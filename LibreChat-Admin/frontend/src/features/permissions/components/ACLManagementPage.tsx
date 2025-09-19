import React, { useState, useEffect } from 'react';
import {
  Shield,
  Share2,
  Search,
  Filter,
  FileText,
  Folder,
  Database,
  Box
} from 'lucide-react';
import { supabase } from '../../../lib/supabase/client';
import { PermissionsList } from './PermissionsList';
import { ShareDialog } from './ShareDialog';
import { ACL, ACLFormData, Permission, ShareSettings } from '../types';

interface Resource {
  id: string;
  name: string;
  type: 'memory' | 'file' | 'folder' | 'project';
  created_at: string;
  owner_id: string;
  shareSettings?: ShareSettings;
}

export const ACLManagementPage: React.FC = () => {
  const [resources, setResources] = useState<Resource[]>([]);
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
  const [permissions, setPermissions] = useState<ACL[]>([]);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [currentUserId, setCurrentUserId] = useState<string>('');

  useEffect(() => {
    loadResources();
    getCurrentUser();
  }, []);

  useEffect(() => {
    if (selectedResource) {
      loadPermissions(selectedResource.id);
    }
  }, [selectedResource]);

  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setCurrentUserId(user.id);
    }
  };

  const loadResources = async () => {
    setLoading(true);
    try {
      // For demo, we'll create mock resources
      // In production, fetch from memories and files tables
      const mockResources: Resource[] = [
        {
          id: '1',
          name: 'Q4 Financial Report.pdf',
          type: 'file',
          created_at: new Date().toISOString(),
          owner_id: currentUserId,
          shareSettings: {
            isPublic: false,
            linkSharing: false,
            defaultPermission: 'view'
          }
        },
        {
          id: '2',
          name: 'Marketing Strategies',
          type: 'folder',
          created_at: new Date().toISOString(),
          owner_id: currentUserId,
          shareSettings: {
            isPublic: true,
            linkSharing: true,
            shareLink: 'abc123',
            linkPermission: 'view',
            defaultPermission: 'view'
          }
        },
        {
          id: '3',
          name: 'Customer Database',
          type: 'memory',
          created_at: new Date().toISOString(),
          owner_id: currentUserId,
          shareSettings: {
            isPublic: false,
            linkSharing: false,
            defaultPermission: 'view'
          }
        },
        {
          id: '4',
          name: 'Product Roadmap 2025',
          type: 'project',
          created_at: new Date().toISOString(),
          owner_id: currentUserId,
          shareSettings: {
            isPublic: false,
            linkSharing: true,
            shareLink: 'xyz789',
            linkPermission: 'comment',
            defaultPermission: 'view'
          }
        }
      ];

      setResources(mockResources);
      if (mockResources.length > 0 && !selectedResource) {
        setSelectedResource(mockResources[0]);
      }
    } catch (error) {
      console.error('Error loading resources:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPermissions = async (resourceId: string) => {
    try {
      const { data, error } = await supabase
        .from('acls')
        .select(`
          *,
          grantee:profiles!grantee_id(id, email, full_name)
        `)
        .eq('resource_id', resourceId);

      if (error) throw error;

      // Map the data to ACL type
      const mappedData: ACL[] = (data || []).map(item => ({
        ...item,
        grantee: item.grantee ? {
          id: item.grantee.id,
          name: item.grantee.full_name || item.grantee.email,
          email: item.grantee.email
        } : undefined
      }));

      setPermissions(mappedData);
    } catch (error) {
      console.error('Error loading permissions:', error);
      // For demo, use mock data if no real data
      setPermissions([]);
    }
  };

  const handleShare = async (data: ACLFormData) => {
    if (!selectedResource) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Create ACL entries for each email
      for (const email of data.emails) {
        // Look up user by email
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id')
          .eq('email', email)
          .single();

        if (profiles) {
          await supabase
            .from('acls')
            .insert({
              resource_type: selectedResource.type,
              resource_id: selectedResource.id,
              grantor_id: user.id,
              grantee_type: 'user',
              grantee_id: profiles.id,
              permission: data.permission,
              expires_at: data.expiresAt || null
            });
        }
      }

      // Reload permissions
      await loadPermissions(selectedResource.id);
    } catch (error) {
      console.error('Error sharing resource:', error);
    }
  };

  const handleUpdatePermission = async (id: string, permission: Permission) => {
    try {
      const { error } = await supabase
        .from('acls')
        .update({ permission })
        .eq('id', id);

      if (error) throw error;

      // Update local state
      setPermissions(prev =>
        prev.map(p => p.id === id ? { ...p, permission } : p)
      );
    } catch (error) {
      console.error('Error updating permission:', error);
    }
  };

  const handleRemovePermission = async (id: string) => {
    try {
      const { error } = await supabase
        .from('acls')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Update local state
      setPermissions(prev => prev.filter(p => p.id !== id));
    } catch (error) {
      console.error('Error removing permission:', error);
    }
  };

  const handleUpdateShareSettings = async (settings: Partial<ShareSettings>) => {
    if (!selectedResource) return;

    // Update local state
    setSelectedResource({
      ...selectedResource,
      shareSettings: {
        ...selectedResource.shareSettings!,
        ...settings
      }
    });

    // In production, save to database
    console.log('Updated share settings:', settings);
  };

  const getResourceIcon = (type: string) => {
    switch (type) {
      case 'file':
        return <FileText className="w-5 h-5" />;
      case 'folder':
        return <Folder className="w-5 h-5" />;
      case 'memory':
        return <Database className="w-5 h-5" />;
      case 'project':
        return <Box className="w-5 h-5" />;
      default:
        return <FileText className="w-5 h-5" />;
    }
  };

  const filteredResources = resources.filter(r => {
    const matchesSearch = r.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === 'all' || r.type === filterType;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Shield className="w-6 h-6" />
          Access Control Management
        </h1>
        <p className="text-gray-600 mt-1">
          Manage permissions and sharing settings for your resources
        </p>
      </div>

      <div className="flex gap-6">
        {/* Resources list */}
        <div className="w-1/3 bg-white rounded-lg shadow">
          <div className="p-4 border-b">
            <div className="flex items-center gap-2 mb-3">
              <Search className="w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search resources..."
                className="flex-1 text-sm outline-none"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                className="flex-1 text-sm border border-gray-300 rounded px-2 py-1"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
              >
                <option value="all">All types</option>
                <option value="file">Files</option>
                <option value="folder">Folders</option>
                <option value="memory">Memories</option>
                <option value="project">Projects</option>
              </select>
            </div>
          </div>

          <div className="overflow-y-auto" style={{ maxHeight: '600px' }}>
            {filteredResources.map((resource) => (
              <button
                key={resource.id}
                onClick={() => setSelectedResource(resource)}
                className={`w-full p-4 flex items-start gap-3 hover:bg-gray-50 border-b ${
                  selectedResource?.id === resource.id ? 'bg-blue-50' : ''
                }`}
              >
                <div className={`mt-0.5 ${
                  selectedResource?.id === resource.id ? 'text-blue-600' : 'text-gray-600'
                }`}>
                  {getResourceIcon(resource.type)}
                </div>
                <div className="flex-1 text-left">
                  <div className={`text-sm font-medium ${
                    selectedResource?.id === resource.id ? 'text-blue-600' : 'text-gray-900'
                  }`}>
                    {resource.name}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {resource.shareSettings?.isPublic ? 'Public' : 'Restricted'} •
                    {resource.shareSettings?.linkSharing ? ' Link sharing on' : ' Link sharing off'}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Permissions panel */}
        <div className="flex-1 bg-white rounded-lg shadow">
          {selectedResource ? (
            <>
              <div className="p-4 border-b flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    {getResourceIcon(selectedResource.type)}
                    {selectedResource.name}
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    {selectedResource.shareSettings?.isPublic ? 'Public resource' : 'Restricted resource'}
                  </p>
                </div>
                <button
                  onClick={() => setShareDialogOpen(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
                >
                  <Share2 className="w-4 h-4" />
                  Share
                </button>
              </div>

              <PermissionsList
                permissions={permissions}
                currentUserId={currentUserId}
                onUpdatePermission={handleUpdatePermission}
                onRemovePermission={handleRemovePermission}
                loading={loading}
              />
            </>
          ) : (
            <div className="p-8 text-center">
              <Shield className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">Select a resource to manage permissions</p>
            </div>
          )}
        </div>
      </div>

      {/* Share dialog */}
      {selectedResource && (
        <ShareDialog
          isOpen={shareDialogOpen}
          onClose={() => setShareDialogOpen(false)}
          resourceName={selectedResource.name}
          resourceType={selectedResource.type}
          shareSettings={selectedResource.shareSettings || {
            isPublic: false,
            linkSharing: false,
            defaultPermission: 'view'
          }}
          onShare={handleShare}
          onUpdateSettings={handleUpdateShareSettings}
        />
      )}
    </div>
  );
};