// Resource Permissions List Component
import React, { useState, useEffect } from 'react';
import { Shield, Share2, Lock, Unlock, Eye, Edit, Settings, Search, Filter } from 'lucide-react';
import { db } from '../../lib/supabase';
import { PermissionModal } from './PermissionModal';
import { toast } from 'react-hot-toast';

interface Resource {
  id: string;
  name: string;
  type: 'memory' | 'file' | 'agent' | 'chat';
  created_at: string;
  owner_id?: string;
  owner_name?: string;
  permission_count?: number;
  is_public?: boolean;
  last_accessed?: string;
}

interface ResourcePermissionsListProps {
  organizationId: string;
  resourceType?: 'memory' | 'file' | 'agent' | 'chat' | 'all';
  userId?: string;
}

export const ResourcePermissionsList: React.FC<ResourcePermissionsListProps> = ({
  organizationId,
  resourceType = 'all',
  userId,
}) => {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>(resourceType);
  const [filterAccess, setFilterAccess] = useState<'all' | 'owned' | 'shared'>('all');
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [sortBy, setSortBy] = useState<'name' | 'created' | 'accessed'>('created');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    loadResources();
  }, [organizationId, filterType, filterAccess, userId]);

  const loadResources = async () => {
    setLoading(true);
    try {
      // This would typically load from your actual resource tables
      // For demo purposes, using mock data
      const mockResources: Resource[] = [
        {
          id: '1',
          name: 'Q4 2024 Strategy Document',
          type: 'file',
          created_at: '2024-10-15',
          owner_id: userId,
          owner_name: 'John Doe',
          permission_count: 5,
          is_public: false,
          last_accessed: '2024-10-20',
        },
        {
          id: '2',
          name: 'Customer Support Knowledge Base',
          type: 'memory',
          created_at: '2024-09-01',
          owner_id: '2',
          owner_name: 'Jane Smith',
          permission_count: 12,
          is_public: true,
          last_accessed: '2024-10-21',
        },
        {
          id: '3',
          name: 'Sales Assistant Agent',
          type: 'agent',
          created_at: '2024-08-15',
          owner_id: userId,
          owner_name: 'John Doe',
          permission_count: 3,
          is_public: false,
          last_accessed: '2024-10-19',
        },
        {
          id: '4',
          name: 'Team Discussion - Product Launch',
          type: 'chat',
          created_at: '2024-10-10',
          owner_id: '3',
          owner_name: 'Mike Johnson',
          permission_count: 8,
          is_public: false,
          last_accessed: '2024-10-21',
        },
        {
          id: '5',
          name: 'API Documentation',
          type: 'file',
          created_at: '2024-07-01',
          owner_id: userId,
          owner_name: 'John Doe',
          permission_count: 20,
          is_public: true,
          last_accessed: '2024-10-21',
        },
      ];

      // Apply filters
      let filtered = mockResources;

      if (filterType !== 'all') {
        filtered = filtered.filter(r => r.type === filterType);
      }

      if (filterAccess === 'owned') {
        filtered = filtered.filter(r => r.owner_id === userId);
      } else if (filterAccess === 'shared') {
        filtered = filtered.filter(r => r.owner_id !== userId && r.permission_count! > 0);
      }

      if (searchQuery) {
        filtered = filtered.filter(r =>
          r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          r.owner_name?.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }

      // Apply sorting
      filtered.sort((a, b) => {
        let comparison = 0;
        switch (sortBy) {
          case 'name':
            comparison = a.name.localeCompare(b.name);
            break;
          case 'created':
            comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
            break;
          case 'accessed':
            comparison = new Date(a.last_accessed || 0).getTime() - new Date(b.last_accessed || 0).getTime();
            break;
        }
        return sortOrder === 'asc' ? comparison : -comparison;
      });

      setResources(filtered);
    } catch (error: any) {
      toast.error(`Failed to load resources: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleManagePermissions = (resource: Resource) => {
    setSelectedResource(resource);
    setShowPermissionModal(true);
  };

  const handleTogglePublic = async (resource: Resource) => {
    try {
      // Toggle public access
      toast.success(
        resource.is_public
          ? `${resource.name} is now private`
          : `${resource.name} is now public`
      );
      loadResources();
    } catch (error: any) {
      toast.error(`Failed to update access: ${error.message}`);
    }
  };

  const getResourceIcon = (type: string) => {
    switch (type) {
      case 'memory':
        return '🧠';
      case 'file':
        return '📄';
      case 'agent':
        return '🤖';
      case 'chat':
        return '💬';
      default:
        return '📦';
    }
  };

  const getResourceTypeColor = (type: string) => {
    switch (type) {
      case 'memory':
        return 'bg-purple-100 text-purple-800';
      case 'file':
        return 'bg-blue-100 text-blue-800';
      case 'agent':
        return 'bg-green-100 text-green-800';
      case 'chat':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
              Resource Permissions
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Manage access control for all resources in your organization
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center">
              <Share2 className="w-4 h-4 mr-2" />
              Share Resource
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4">
          {/* Search */}
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search resources..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Type Filter */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-blue-500"
          >
            <option value="all">All Types</option>
            <option value="memory">Memories</option>
            <option value="file">Files</option>
            <option value="agent">Agents</option>
            <option value="chat">Chats</option>
          </select>

          {/* Access Filter */}
          <select
            value={filterAccess}
            onChange={(e) => setFilterAccess(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-blue-500"
          >
            <option value="all">All Resources</option>
            <option value="owned">My Resources</option>
            <option value="shared">Shared with Me</option>
          </select>

          {/* Sort */}
          <select
            value={`${sortBy}-${sortOrder}`}
            onChange={(e) => {
              const [by, order] = e.target.value.split('-');
              setSortBy(by as any);
              setSortOrder(order as any);
            }}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-blue-500"
          >
            <option value="name-asc">Name (A-Z)</option>
            <option value="name-desc">Name (Z-A)</option>
            <option value="created-desc">Newest First</option>
            <option value="created-asc">Oldest First</option>
            <option value="accessed-desc">Recently Accessed</option>
          </select>
        </div>
      </div>

      {/* Resources List */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Resource
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Owner
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Access
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Shared With
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Last Accessed
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {loading ? (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center">
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                  </div>
                </td>
              </tr>
            ) : resources.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                  No resources found
                </td>
              </tr>
            ) : (
              resources.map((resource) => (
                <tr key={resource.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className="text-2xl mr-3">{getResourceIcon(resource.type)}</span>
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {resource.name}
                        </div>
                        <div className="text-xs text-gray-500">
                          Created {new Date(resource.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getResourceTypeColor(resource.type)}`}>
                      {resource.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {resource.owner_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => handleTogglePublic(resource)}
                      className="flex items-center text-sm"
                    >
                      {resource.is_public ? (
                        <>
                          <Unlock className="w-4 h-4 mr-1 text-green-600" />
                          <span className="text-green-600">Public</span>
                        </>
                      ) : (
                        <>
                          <Lock className="w-4 h-4 mr-1 text-gray-600" />
                          <span className="text-gray-600">Private</span>
                        </>
                      )}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                      <Shield className="w-4 h-4 mr-1" />
                      {resource.permission_count || 0} people
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {resource.last_accessed
                      ? new Date(resource.last_accessed).toLocaleDateString()
                      : 'Never'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleManagePermissions(resource)}
                        className="text-blue-600 hover:text-blue-900 flex items-center"
                        title="Manage permissions"
                      >
                        <Settings className="w-4 h-4" />
                      </button>
                      {resource.owner_id === userId ? (
                        <button
                          className="text-green-600 hover:text-green-900"
                          title="You own this resource"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      ) : (
                        <button
                          className="text-gray-600 hover:text-gray-900"
                          title="View only"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Permission Modal */}
      {selectedResource && (
        <PermissionModal
          isOpen={showPermissionModal}
          onClose={() => {
            setShowPermissionModal(false);
            setSelectedResource(null);
          }}
          resourceId={selectedResource.id}
          resourceType={selectedResource.type}
          resourceName={selectedResource.name}
          organizationId={organizationId}
        />
      )}
    </div>
  );
};