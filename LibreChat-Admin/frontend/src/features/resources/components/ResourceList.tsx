import React, { useState } from 'react';
import {
  Database,
  FileText,
  Download,
  Eye,
  Edit2,
  Trash2,
  MoreVertical,
  Lock,
  Users,
  Globe,
  Building2,
  Calendar,
  Tag,
  Search,
  Filter,
  ChevronDown
} from 'lucide-react';
import { Memory, File as FileType, ResourceFilters } from '../types';
import { format } from 'date-fns';

interface ResourceListProps {
  memories: Memory[];
  files: FileType[];
  filters: ResourceFilters;
  onFilterChange: (filters: ResourceFilters) => void;
  onView: (type: 'memory' | 'file', id: string) => void;
  onEdit: (type: 'memory' | 'file', id: string) => void;
  onDelete: (type: 'memory' | 'file', id: string) => void;
  onDownload?: (fileId: string) => void;
  loading?: boolean;
}

export const ResourceList: React.FC<ResourceListProps> = ({
  memories,
  files,
  filters,
  onFilterChange,
  onView,
  onEdit,
  onDelete,
  onDownload,
  loading
}) => {
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getAccessIcon = (level: string) => {
    switch (level) {
      case 'private':
        return <Lock className="w-4 h-4 text-gray-500" />;
      case 'team':
        return <Users className="w-4 h-4 text-blue-500" />;
      case 'organization':
        return <Building2 className="w-4 h-4 text-green-500" />;
      case 'public':
        return <Globe className="w-4 h-4 text-purple-500" />;
      default:
        return <Lock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getAccessLabel = (level: string) => {
    const labels = {
      private: 'Private',
      team: 'Team',
      organization: 'Organization',
      public: 'Public'
    };
    return labels[level as keyof typeof labels] || 'Private';
  };

  const allItems = [
    ...memories.map(m => ({ ...m, type: 'memory' as const })),
    ...files.map(f => ({ ...f, type: 'file' as const }))
  ].sort((a, b) => {
    const field = filters.sortBy || 'date';
    const order = filters.sortOrder || 'desc';

    let comparison = 0;
    if (field === 'name') {
      comparison = (a.title || a.filename || '').localeCompare(b.title || b.filename || '');
    } else if (field === 'date') {
      comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    } else if (field === 'size') {
      const aSize = a.type === 'file' ? a.size_bytes : (a.size_bytes || 0);
      const bSize = b.type === 'file' ? b.size_bytes : (b.size_bytes || 0);
      comparison = aSize - bSize;
    } else if (field === 'usage') {
      const aUsage = a.type === 'memory' ? a.usage_count : (a.download_count || 0);
      const bUsage = b.type === 'memory' ? b.usage_count : (b.download_count || 0);
      comparison = aUsage - bUsage;
    }

    return order === 'desc' ? -comparison : comparison;
  });

  const filteredItems = allItems.filter(item => {
    if (filters.type && filters.type !== 'all' && item.type !== filters.type) return false;
    if (filters.access && filters.access !== 'all' && item.access_level !== filters.access) return false;
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      const name = (item.type === 'memory' ? item.title : item.filename).toLowerCase();
      const content = item.type === 'memory' ? item.content.toLowerCase() : '';
      if (!name.includes(searchTerm) && !content.includes(searchTerm)) return false;
    }
    if (filters.tags && filters.tags.length > 0) {
      if (!item.tags || !filters.tags.some(tag => item.tags?.includes(tag))) return false;
    }
    return true;
  });

  const toggleSelection = (id: string) => {
    const newSelection = new Set(selectedItems);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedItems(newSelection);
  };

  const toggleAll = () => {
    if (selectedItems.size === filteredItems.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(filteredItems.map(item => item.id)));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Filters Bar */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search resources..."
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={filters.search || ''}
                onChange={(e) => onFilterChange({ ...filters, search: e.target.value })}
              />
            </div>
          </div>

          <select
            className="px-3 py-2 border border-gray-300 rounded-md"
            value={filters.type || 'all'}
            onChange={(e) => onFilterChange({ ...filters, type: e.target.value as any })}
          >
            <option value="all">All Types</option>
            <option value="memory">Memories</option>
            <option value="file">Files</option>
          </select>

          <select
            className="px-3 py-2 border border-gray-300 rounded-md"
            value={filters.access || 'all'}
            onChange={(e) => onFilterChange({ ...filters, access: e.target.value as any })}
          >
            <option value="all">All Access</option>
            <option value="private">Private</option>
            <option value="team">Team</option>
            <option value="organization">Organization</option>
            <option value="public">Public</option>
          </select>

          <select
            className="px-3 py-2 border border-gray-300 rounded-md"
            value={`${filters.sortBy || 'date'}-${filters.sortOrder || 'desc'}`}
            onChange={(e) => {
              const [sortBy, sortOrder] = e.target.value.split('-');
              onFilterChange({ ...filters, sortBy: sortBy as any, sortOrder: sortOrder as any });
            }}
          >
            <option value="name-asc">Name (A-Z)</option>
            <option value="name-desc">Name (Z-A)</option>
            <option value="date-desc">Newest First</option>
            <option value="date-asc">Oldest First</option>
            <option value="size-desc">Largest First</option>
            <option value="size-asc">Smallest First</option>
            <option value="usage-desc">Most Used</option>
            <option value="usage-asc">Least Used</option>
          </select>

          <button className="p-2 hover:bg-gray-100 rounded-md">
            <Filter className="w-4 h-4" />
          </button>
        </div>

        {selectedItems.size > 0 && (
          <div className="flex items-center gap-3 mt-3 p-3 bg-blue-50 rounded-md">
            <span className="text-sm text-blue-700">
              {selectedItems.size} item{selectedItems.size !== 1 ? 's' : ''} selected
            </span>
            <button className="text-sm text-blue-600 hover:text-blue-700">
              Delete Selected
            </button>
            <button className="text-sm text-blue-600 hover:text-blue-700">
              Change Access
            </button>
            <button
              onClick={() => setSelectedItems(new Set())}
              className="text-sm text-gray-600 hover:text-gray-700 ml-auto"
            >
              Clear Selection
            </button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="w-8 px-4 py-3">
                <input
                  type="checkbox"
                  checked={selectedItems.size === filteredItems.length && filteredItems.length > 0}
                  onChange={toggleAll}
                  className="rounded text-blue-600"
                />
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Access</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Size</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Usage</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Modified</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tags</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredItems.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selectedItems.has(item.id)}
                    onChange={() => toggleSelection(item.id)}
                    className="rounded text-blue-600"
                  />
                </td>
                <td className="px-4 py-3">
                  {item.type === 'memory' ? (
                    <Database className="w-5 h-5 text-blue-600" />
                  ) : (
                    <FileText className="w-5 h-5 text-green-600" />
                  )}
                </td>
                <td className="px-4 py-3">
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {item.type === 'memory' ? item.title : item.filename}
                    </div>
                    {item.type === 'memory' && (
                      <div className="text-xs text-gray-500 truncate max-w-xs">
                        {item.content}
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    {getAccessIcon(item.access_level)}
                    <span className="text-sm text-gray-600">
                      {getAccessLabel(item.access_level)}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {item.type === 'file'
                    ? formatBytes(item.size_bytes)
                    : item.size_bytes
                      ? formatBytes(item.size_bytes)
                      : '-'}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {item.type === 'memory'
                    ? `${item.usage_count} uses`
                    : `${item.download_count} downloads`}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {format(new Date(item.updated_at), 'MMM d, yyyy')}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {item.tags?.slice(0, 2).map(tag => (
                      <span
                        key={tag}
                        className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                    {item.tags && item.tags.length > 2 && (
                      <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded-full">
                        +{item.tags.length - 2}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onView(item.type, item.id)}
                      className="p-1 hover:bg-gray-100 rounded"
                      title="View"
                    >
                      <Eye className="w-4 h-4 text-gray-600" />
                    </button>
                    <button
                      onClick={() => onEdit(item.type, item.id)}
                      className="p-1 hover:bg-gray-100 rounded"
                      title="Edit"
                    >
                      <Edit2 className="w-4 h-4 text-gray-600" />
                    </button>
                    {item.type === 'file' && onDownload && (
                      <button
                        onClick={() => onDownload(item.id)}
                        className="p-1 hover:bg-gray-100 rounded"
                        title="Download"
                      >
                        <Download className="w-4 h-4 text-gray-600" />
                      </button>
                    )}
                    <div className="relative">
                      <button
                        onClick={() => setMenuOpen(menuOpen === item.id ? null : item.id)}
                        className="p-1 hover:bg-gray-100 rounded"
                      >
                        <MoreVertical className="w-4 h-4 text-gray-600" />
                      </button>

                      {menuOpen === item.id && (
                        <>
                          <div
                            className="fixed inset-0 z-10"
                            onClick={() => setMenuOpen(null)}
                          />
                          <div className="absolute right-0 mt-1 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-20">
                            <button
                              onClick={() => {
                                onDelete(item.type, item.id);
                                setMenuOpen(null);
                              }}
                              className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                            >
                              <Trash2 className="w-4 h-4" />
                              Delete
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredItems.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No resources found matching your filters
          </div>
        )}
      </div>

      {/* Pagination */}
      {filteredItems.length > 0 && (
        <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Showing {filteredItems.length} of {allItems.length} resources
          </div>
          <div className="flex gap-2">
            <button className="px-3 py-1 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50">
              Previous
            </button>
            <button className="px-3 py-1 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50">
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};