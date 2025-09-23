// Organization Management Page
import React, { useState, useEffect } from 'react';
import { Building, Users, Mail, Shield, Settings, ChevronRight } from 'lucide-react';
import { OrganizationTree } from '../components/Organization/OrganizationTree';
import { InvitationManager } from '../components/Invitation/InvitationManager';
import { ResourcePermissionsList } from '../components/Permissions/ResourcePermissionsList';
import { db, auth } from '../lib/supabase';
import { toast } from 'react-hot-toast';

interface TabProps {
  id: string;
  label: string;
  icon: React.ReactNode;
  component: React.ReactNode;
}

export const OrganizationManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [organizationId, setOrganizationId] = useState<string>('');
  const [organization, setOrganization] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [selectedUnit, setSelectedUnit] = useState<any>(null);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalDepartments: 0,
    pendingInvitations: 0,
    activeResources: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initializeOrganization();
  }, []);

  const initializeOrganization = async () => {
    try {
      // Get current user
      const { user, error: userError } = await auth.getUser();
      if (userError || !user) {
        toast.error('Please sign in to continue');
        return;
      }

      // Get user profile
      const { data: profile, error: profileError } = await db.profiles.get(user.id);
      if (profileError || !profile) {
        toast.error('User profile not found');
        return;
      }

      setCurrentUser(profile);
      setOrganizationId(profile.organization_id);

      // Load organization data
      if (profile.organization_id) {
        const { data: org, error: orgError } = await db.organizations.get(profile.organization_id);
        if (!orgError && org) {
          setOrganization(org);
        }

        // Load stats
        await loadOrganizationStats(profile.organization_id);
      }
    } catch (error: any) {
      console.error('Initialization error:', error);
      toast.error('Failed to load organization data');
    } finally {
      setLoading(false);
    }
  };

  const loadOrganizationStats = async (orgId: string) => {
    try {
      // Load various stats (simplified for demo)
      const { data: users } = await db.profiles.getByOrganization(orgId);
      const { data: units } = await db.organizationalUnits.getByOrganization(orgId);
      const { data: invitations } = await db.invitations.getByOrganization(orgId);

      setStats({
        totalUsers: users?.length || 0,
        totalDepartments: units?.length || 0,
        pendingInvitations: invitations?.filter((i: any) => i.status === 'pending').length || 0,
        activeResources: 42, // Mock value
      });
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const tabs: TabProps[] = [
    {
      id: 'overview',
      label: 'Overview',
      icon: <Building className="w-4 h-4" />,
      component: <OrganizationOverview organization={organization} stats={stats} />,
    },
    {
      id: 'structure',
      label: 'Organization Structure',
      icon: <Users className="w-4 h-4" />,
      component: organizationId ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <OrganizationTree
            organizationId={organizationId}
            onSelectUnit={setSelectedUnit}
            selectedUnitId={selectedUnit?.id}
          />
          <UnitDetails unit={selectedUnit} organizationId={organizationId} />
        </div>
      ) : (
        <div>Loading...</div>
      ),
    },
    {
      id: 'invitations',
      label: 'Invitations',
      icon: <Mail className="w-4 h-4" />,
      component: organizationId ? (
        <InvitationManager organizationId={organizationId} />
      ) : (
        <div>Loading...</div>
      ),
    },
    {
      id: 'permissions',
      label: 'Permissions',
      icon: <Shield className="w-4 h-4" />,
      component: organizationId ? (
        <ResourcePermissionsList
          organizationId={organizationId}
          userId={currentUser?.id}
        />
      ) : (
        <div>Loading...</div>
      ),
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: <Settings className="w-4 h-4" />,
      component: <OrganizationSettings organization={organization} />,
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Organization Management
                </h1>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Manage your organization structure, users, and permissions
                </p>
              </div>
              {organization && (
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {organization.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {organization.subscription_tier} Plan
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className="border-t border-gray-200 dark:border-gray-700">
            <nav className="-mb-px flex space-x-8">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {tabs.find((tab) => tab.id === activeTab)?.component}
      </div>
    </div>
  );
};

// Organization Overview Component
const OrganizationOverview: React.FC<{ organization: any; stats: any }> = ({ organization, stats }) => {
  if (!organization) {
    return <div>No organization data available</div>;
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard
          title="Total Users"
          value={stats.totalUsers}
          icon={<Users className="w-6 h-6" />}
          color="blue"
        />
        <StatCard
          title="Departments"
          value={stats.totalDepartments}
          icon={<Building className="w-6 h-6" />}
          color="green"
        />
        <StatCard
          title="Pending Invitations"
          value={stats.pendingInvitations}
          icon={<Mail className="w-6 h-6" />}
          color="yellow"
        />
        <StatCard
          title="Active Resources"
          value={stats.activeResources}
          icon={<Shield className="w-6 h-6" />}
          color="purple"
        />
      </div>

      {/* Organization Details */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Organization Details</h2>
        <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Name</dt>
            <dd className="mt-1 text-sm text-gray-900 dark:text-white">{organization.name}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Subscription</dt>
            <dd className="mt-1 text-sm text-gray-900 dark:text-white capitalize">
              {organization.subscription_tier}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">User Limit</dt>
            <dd className="mt-1 text-sm text-gray-900 dark:text-white">
              {stats.totalUsers} / {organization.max_users}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Storage</dt>
            <dd className="mt-1 text-sm text-gray-900 dark:text-white">
              {organization.max_storage_gb} GB
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Created</dt>
            <dd className="mt-1 text-sm text-gray-900 dark:text-white">
              {new Date(organization.created_at).toLocaleDateString()}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Slug</dt>
            <dd className="mt-1 text-sm text-gray-900 dark:text-white">{organization.slug}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
};

// Unit Details Component
const UnitDetails: React.FC<{ unit: any; organizationId: string }> = ({ unit, organizationId }) => {
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (unit) {
      loadUnitMembers();
    }
  }, [unit]);

  const loadUnitMembers = async () => {
    if (!unit) return;

    setLoading(true);
    try {
      const { data, error } = await db.profiles.getByOrganization(organizationId);
      if (!error && data) {
        const unitMembers = data.filter((p: any) => p.organizational_unit_id === unit.id);
        setMembers(unitMembers);
      }
    } catch (error) {
      console.error('Failed to load unit members:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!unit) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="text-center text-gray-500 py-8">
          Select a department or team to view details
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4">Unit Details</h3>

      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Name</label>
          <p className="text-gray-900 dark:text-white">{unit.name}</p>
        </div>

        {unit.description && (
          <div>
            <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Description</label>
            <p className="text-gray-900 dark:text-white">{unit.description}</p>
          </div>
        )}

        <div>
          <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Level</label>
          <p className="text-gray-900 dark:text-white">
            {unit.level === 0 ? 'Department' : `Level ${unit.level}`}
          </p>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
            Members ({members.length})
          </label>
          {loading ? (
            <div className="mt-2">Loading members...</div>
          ) : members.length === 0 ? (
            <div className="mt-2 text-gray-500">No members assigned</div>
          ) : (
            <div className="mt-2 space-y-2">
              {members.map((member) => (
                <div key={member.id} className="flex items-center justify-between py-2 px-3 bg-gray-50 dark:bg-gray-700 rounded">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {member.full_name || member.email}
                    </p>
                    <p className="text-xs text-gray-500">{member.job_title || member.role}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Organization Settings Component
const OrganizationSettings: React.FC<{ organization: any }> = ({ organization }) => {
  if (!organization) {
    return <div>No organization settings available</div>;
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold mb-4">Organization Settings</h2>
      <p className="text-gray-500">Settings configuration coming soon...</p>
    </div>
  );
};

// Stat Card Component
const StatCard: React.FC<{
  title: string;
  value: number;
  icon: React.ReactNode;
  color: string;
}> = ({ title, value, icon, color }) => {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300',
    green: 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300',
    yellow: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900 dark:text-yellow-300',
    purple: 'bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-300',
  }[color];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <div className="flex items-center">
        <div className={`p-3 rounded-lg ${colorClasses}`}>{icon}</div>
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
          <p className="text-2xl font-semibold text-gray-900 dark:text-white">{value}</p>
        </div>
      </div>
    </div>
  );
};