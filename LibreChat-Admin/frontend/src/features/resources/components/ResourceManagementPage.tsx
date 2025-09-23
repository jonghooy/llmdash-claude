import React, { useState, useEffect } from 'react';
import {
  Database,
  FileText,
  Upload,
  Plus,
  Settings,
  Download,
  BarChart3
} from 'lucide-react';
import { supabase } from '../../../lib/supabase/client';
import { ResourceList } from './ResourceList';
import { ResourceStats } from './ResourceStats';
import { Memory, File as FileType, ResourceFilters, ResourceStats as ResourceStatsType } from '../types';

export const ResourceManagementPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'list' | 'stats'>('list');
  const [memories, setMemories] = useState<Memory[]>([]);
  const [files, setFiles] = useState<FileType[]>([]);
  const [stats, setStats] = useState<ResourceStatsType>({
    totalMemories: 0,
    totalFiles: 0,
    totalSizeBytes: 0,
    activeUsers: 0,
    recentActivity: [],
    topTags: [],
    storageByType: []
  });
  const [filters, setFilters] = useState<ResourceFilters>({
    type: 'all',
    access: 'all',
    sortBy: 'date',
    sortOrder: 'desc'
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadResources();
    loadStats();
  }, []);

  const loadResources = async () => {
    setLoading(true);
    try {
      // Load memories
      const { data: memoriesData, error: memoriesError } = await supabase
        .from('memories')
        .select('*')
        .order('created_at', { ascending: false });

      if (!memoriesError && memoriesData) {
        setMemories(memoriesData);
      }

      // Load files
      const { data: filesData, error: filesError } = await supabase
        .from('files')
        .select('*')
        .order('created_at', { ascending: false });

      if (!filesError && filesData) {
        setFiles(filesData);
      }

      // If no real data, use mock data for demo
      if (!memoriesData || memoriesData.length === 0) {
        setMemories(getMockMemories());
      }
      if (!filesData || filesData.length === 0) {
        setFiles(getMockFiles());
      }
    } catch (error) {
      console.error('Error loading resources:', error);
      // Use mock data on error
      setMemories(getMockMemories());
      setFiles(getMockFiles());
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    // Generate mock stats
    const mockStats: ResourceStatsType = {
      totalMemories: 1234,
      totalFiles: 567,
      totalSizeBytes: 5368709120, // 5GB
      activeUsers: 42,
      recentActivity: [
        { date: 'Mon', memories: 45, files: 23, accesses: 156 },
        { date: 'Tue', memories: 52, files: 31, accesses: 189 },
        { date: 'Wed', memories: 38, files: 28, accesses: 143 },
        { date: 'Thu', memories: 61, files: 35, accesses: 201 },
        { date: 'Fri', memories: 47, files: 29, accesses: 167 },
        { date: 'Sat', memories: 23, files: 12, accesses: 89 },
        { date: 'Sun', memories: 19, files: 8, accesses: 67 }
      ],
      topTags: [
        { tag: 'marketing', count: 234 },
        { tag: 'sales', count: 189 },
        { tag: 'product', count: 156 },
        { tag: 'engineering', count: 143 },
        { tag: 'hr', count: 98 },
        { tag: 'finance', count: 87 },
        { tag: 'customer', count: 76 },
        { tag: 'research', count: 65 }
      ],
      storageByType: [
        { type: 'Documents', size: 2147483648, count: 234 },
        { type: 'Images', size: 1610612736, count: 156 },
        { type: 'Videos', size: 1073741824, count: 45 },
        { type: 'Memories', size: 536870912, count: 1234 }
      ]
    };

    setStats(mockStats);
  };

  const getMockMemories = (): Memory[] => [
    {
      id: '1',
      organization_id: 'org1',
      created_by: 'user1',
      title: 'Q4 Marketing Strategy',
      content: 'Comprehensive marketing strategy for Q4 2024 including social media campaigns, email marketing, and influencer partnerships.',
      tags: ['marketing', 'strategy', 'q4'],
      created_at: new Date('2024-01-15').toISOString(),
      updated_at: new Date('2024-01-20').toISOString(),
      access_level: 'organization',
      usage_count: 156,
      size_bytes: 4096
    },
    {
      id: '2',
      organization_id: 'org1',
      created_by: 'user2',
      title: 'Customer Feedback Analysis',
      content: 'Analysis of customer feedback from Q3 surveys showing 85% satisfaction rate with new features.',
      tags: ['customer', 'feedback', 'analysis'],
      created_at: new Date('2024-01-10').toISOString(),
      updated_at: new Date('2024-01-10').toISOString(),
      access_level: 'team',
      usage_count: 89,
      size_bytes: 2048
    },
    {
      id: '3',
      organization_id: 'org1',
      created_by: 'user3',
      title: 'Product Roadmap 2025',
      content: 'Detailed product roadmap for 2025 including new feature releases, technical debt reduction, and platform improvements.',
      tags: ['product', 'roadmap', 'planning'],
      created_at: new Date('2024-01-05').toISOString(),
      updated_at: new Date('2024-01-18').toISOString(),
      access_level: 'private',
      usage_count: 234,
      size_bytes: 8192
    }
  ];

  const getMockFiles = (): FileType[] => [
    {
      id: '1',
      organization_id: 'org1',
      uploaded_by: 'user1',
      filename: 'Financial_Report_Q3_2024.pdf',
      mime_type: 'application/pdf',
      size_bytes: 2457600,
      storage_path: '/files/reports/financial_q3_2024.pdf',
      tags: ['finance', 'report', 'q3'],
      created_at: new Date('2024-01-12').toISOString(),
      updated_at: new Date('2024-01-12').toISOString(),
      access_level: 'organization',
      download_count: 45,
      status: 'ready'
    },
    {
      id: '2',
      organization_id: 'org1',
      uploaded_by: 'user2',
      filename: 'Product_Demo_Video.mp4',
      mime_type: 'video/mp4',
      size_bytes: 104857600,
      storage_path: '/files/videos/product_demo.mp4',
      tags: ['product', 'demo', 'video'],
      created_at: new Date('2024-01-08').toISOString(),
      updated_at: new Date('2024-01-08').toISOString(),
      access_level: 'public',
      download_count: 123,
      status: 'ready'
    },
    {
      id: '3',
      organization_id: 'org1',
      uploaded_by: 'user3',
      filename: 'Team_Presentation.pptx',
      mime_type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      size_bytes: 5242880,
      storage_path: '/files/presentations/team_presentation.pptx',
      tags: ['presentation', 'team', 'meeting'],
      created_at: new Date('2024-01-03').toISOString(),
      updated_at: new Date('2024-01-03').toISOString(),
      access_level: 'team',
      download_count: 67,
      status: 'ready'
    }
  ];

  const handleView = (type: 'memory' | 'file', id: string) => {
    console.log('View', type, id);
    // Implement view logic
  };

  const handleEdit = (type: 'memory' | 'file', id: string) => {
    console.log('Edit', type, id);
    // Implement edit logic
  };

  const handleDelete = async (type: 'memory' | 'file', id: string) => {
    if (!confirm(`Are you sure you want to delete this ${type}?`)) return;

    try {
      if (type === 'memory') {
        const { error } = await supabase
          .from('memories')
          .delete()
          .eq('id', id);

        if (!error) {
          setMemories(prev => prev.filter(m => m.id !== id));
        }
      } else {
        const { error } = await supabase
          .from('files')
          .delete()
          .eq('id', id);

        if (!error) {
          setFiles(prev => prev.filter(f => f.id !== id));
        }
      }
    } catch (error) {
      console.error('Error deleting resource:', error);
    }
  };

  const handleDownload = (fileId: string) => {
    const file = files.find(f => f.id === fileId);
    if (file) {
      // Implement download logic
      console.log('Download', file.filename);
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Database className="w-6 h-6" />
          Resource Management
        </h1>
        <p className="text-gray-600 mt-1">
          Manage memories, files, and knowledge resources across your organization
        </p>
      </div>

      {/* Action Bar */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex gap-2">
          <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2">
            <Plus className="w-4 h-4" />
            New Memory
          </button>
          <button className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center gap-2">
            <Upload className="w-4 h-4" />
            Upload File
          </button>
          <button className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('list')}
            className={`px-4 py-2 rounded-md flex items-center gap-2 ${
              activeTab === 'list'
                ? 'bg-gray-100 text-gray-900'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <FileText className="w-4 h-4" />
            List View
          </button>
          <button
            onClick={() => setActiveTab('stats')}
            className={`px-4 py-2 rounded-md flex items-center gap-2 ${
              activeTab === 'stats'
                ? 'bg-gray-100 text-gray-900'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            Analytics
          </button>
          <button className="p-2 hover:bg-gray-100 rounded-md">
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      {activeTab === 'list' ? (
        <ResourceList
          memories={memories}
          files={files}
          filters={filters}
          onFilterChange={setFilters}
          onView={handleView}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onDownload={handleDownload}
          loading={loading}
        />
      ) : (
        <ResourceStats stats={stats} loading={loading} />
      )}
    </div>
  );
};