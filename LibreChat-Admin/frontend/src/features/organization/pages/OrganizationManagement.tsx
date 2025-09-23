/**
 * Organization Management Page
 * Main page for managing organizational structure and members
 */

import React, { useState, useEffect } from 'react';
import { Building2, Users, Settings, Activity } from 'lucide-react';
import { OrganizationTree } from '../components/OrganizationTree';
import { MemberPanel } from '../components/MemberPanel';
import { supabase, db } from '../../../lib/supabase/client';
import type { Database } from '../../../lib/supabase/types/database';

type Organization = Database['public']['Tables']['organizations']['Row'];
type OrganizationalUnit = Database['public']['Tables']['organizational_units']['Row'];

export const OrganizationManagement: React.FC = () => {
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [selectedUnit, setSelectedUnit] = useState<OrganizationalUnit | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUnits: 0,
    totalMembers: 0,
    activeMembers: 0
  });

  useEffect(() => {
    loadOrganization();
  }, []);

  const loadOrganization = async () => {
    try {
      setLoading(true);

      // Get the first organization (for demo)
      const { data: orgs, error: orgError } = await db.organizations()
        .select('*')
        .limit(1)
        .single();

      if (orgError) throw orgError;
      setOrganization(orgs);

      // Load statistics
      if (orgs) {
        await loadStatistics(orgs.id);
      }
    } catch (error) {
      console.error('Error loading organization:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStatistics = async (orgId: string) => {
    try {
      // Count organizational units
      const { count: unitCount } = await db.organizational_units()
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', orgId);

      // Count profiles
      const { data: profiles } = await db.profiles()
        .select('status')
        .eq('organization_id', orgId);

      const totalMembers = profiles?.length || 0;
      const activeMembers = profiles?.filter(p => p.status === 'active').length || 0;

      setStats({
        totalUnits: unitCount || 0,
        totalMembers,
        activeMembers
      });
    } catch (error) {
      console.error('Error loading statistics:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!organization) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Building2 size={64} className="mx-auto mb-4 text-gray-300" />
          <h2 className="text-2xl font-semibold mb-2">No Organization Found</h2>
          <p className="text-gray-600">Please create an organization first</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Organization Management
                </h1>
                <p className="mt-1 text-sm text-gray-600">
                  Manage your organization structure, departments, and team members
                </p>
              </div>
              <button
                onClick={() => alert('Settings feature coming soon!')}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                <Settings size={20} />
                Settings
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Organization Info */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              {organization.logo_url ? (
                <img
                  src={organization.logo_url}
                  alt={organization.name}
                  className="w-16 h-16 rounded-lg"
                />
              ) : (
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <Building2 size={32} className="text-white" />
                </div>
              )}
              <div>
                <h2 className="text-xl font-bold">{organization.name}</h2>
                <p className="text-gray-600">{organization.description}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                    {organization.subscription_tier}
                  </span>
                  <span className="text-sm text-gray-500">
                    Max Users: {organization.max_users}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-3 gap-4 mt-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Building2 size={20} className="text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Departments</p>
                  <p className="text-2xl font-bold">{stats.totalUnits}</p>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Users size={20} className="text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Members</p>
                  <p className="text-2xl font-bold">{stats.totalMembers}</p>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Activity size={20} className="text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Active Members</p>
                  <p className="text-2xl font-bold">{stats.activeMembers}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Organization Tree */}
          <div className="bg-white rounded-lg shadow-sm border">
            <OrganizationTree
              organizationId={organization.id}
              onSelectUnit={setSelectedUnit}
              selectedUnitId={selectedUnit?.id}
            />
          </div>

          {/* Member Panel */}
          <div className="bg-white rounded-lg shadow-sm border flex">
            <MemberPanel
              unit={selectedUnit}
              organizationId={organization.id}
            />
          </div>
        </div>
      </div>
    </div>
  );
};