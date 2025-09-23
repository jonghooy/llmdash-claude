import React from 'react';
import {
  Database,
  FileText,
  HardDrive,
  Users,
  TrendingUp,
  Tag
} from 'lucide-react';
import { ResourceStats as ResourceStatsType } from '../types';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface ResourceStatsProps {
  stats: ResourceStatsType;
  loading?: boolean;
}

export const ResourceStats: React.FC<ResourceStatsProps> = ({ stats, loading }) => {
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
            <div className="h-8 bg-gray-200 rounded w-3/4"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div>
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600 text-sm">Total Memories</span>
            <Database className="w-5 h-5 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {stats.totalMemories.toLocaleString()}
          </div>
          <div className="text-xs text-green-600 mt-1">
            <TrendingUp className="w-3 h-3 inline mr-1" />
            +12% from last month
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600 text-sm">Total Files</span>
            <FileText className="w-5 h-5 text-green-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {stats.totalFiles.toLocaleString()}
          </div>
          <div className="text-xs text-green-600 mt-1">
            <TrendingUp className="w-3 h-3 inline mr-1" />
            +8% from last month
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600 text-sm">Storage Used</span>
            <HardDrive className="w-5 h-5 text-purple-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {formatBytes(stats.totalSizeBytes)}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            of 100 GB quota
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600 text-sm">Active Users</span>
            <Users className="w-5 h-5 text-orange-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {stats.activeUsers.toLocaleString()}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Last 7 days
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Activity Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Resource Activity</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={stats.recentActivity}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="memories" stroke="#3B82F6" name="Memories" />
              <Line type="monotone" dataKey="files" stroke="#10B981" name="Files" />
              <Line type="monotone" dataKey="accesses" stroke="#F59E0B" name="Accesses" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Storage by Type */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Storage by Type</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={stats.storageByType}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ type, size }) => `${type}: ${formatBytes(size)}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="size"
              >
                {stats.storageByType.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => formatBytes(value)} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Tags */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Tag className="w-5 h-5" />
          Popular Tags
        </h3>
        <div className="flex flex-wrap gap-2">
          {stats.topTags.map((tag) => (
            <span
              key={tag.tag}
              className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
            >
              {tag.tag}
              <span className="ml-1 text-xs text-gray-500">({tag.count})</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};