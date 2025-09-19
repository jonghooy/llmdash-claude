/**
 * MemberPanel Component
 * Shows members of selected organizational unit
 * Allows adding/removing members and role management
 */

import React, { useState, useEffect } from 'react';
import {
  User,
  UserPlus,
  Shield,
  MoreVertical,
  Mail,
  Phone,
  Trash2,
  Edit2,
  Search
} from 'lucide-react';
import { db } from '../../../lib/supabase/client';
import type { Database } from '../../../lib/supabase/types/database';

type Profile = Database['public']['Tables']['profiles']['Row'];
type OrganizationalUnit = Database['public']['Tables']['organizational_units']['Row'];

interface MemberPanelProps {
  unit: OrganizationalUnit | null;
  organizationId: string;
}

export const MemberPanel: React.FC<MemberPanelProps> = ({
  unit,
  organizationId
}) => {
  const [members, setMembers] = useState<Profile[]>([]);
  const [allProfiles, setAllProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddMember, setShowAddMember] = useState(false);

  useEffect(() => {
    if (unit) {
      loadMembers();
      loadAllProfiles();
    }
  }, [unit?.id]);

  const loadMembers = async () => {
    if (!unit) return;

    try {
      setLoading(true);
      const { data, error } = await db.profiles()
        .select('*')
        .eq('organizational_unit_id', unit.id)
        .order('full_name');

      if (error) throw error;
      setMembers(data || []);
    } catch (error) {
      console.error('Error loading members:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAllProfiles = async () => {
    try {
      const { data, error } = await db.profiles()
        .select('*')
        .eq('organization_id', organizationId)
        .order('full_name');

      if (error) throw error;
      setAllProfiles(data || []);
    } catch (error) {
      console.error('Error loading profiles:', error);
    }
  };

  const handleAddMember = async (profileId: string) => {
    if (!unit) return;

    try {
      const { error } = await db.profiles()
        .update({ organizational_unit_id: unit.id })
        .eq('id', profileId);

      if (error) throw error;
      await loadMembers();
      setShowAddMember(false);
    } catch (error) {
      console.error('Error adding member:', error);
    }
  };

  const handleRemoveMember = async (profileId: string) => {
    if (!confirm('Remove this member from the unit?')) return;

    try {
      const { error } = await db.profiles()
        .update({ organizational_unit_id: null })
        .eq('id', profileId);

      if (error) throw error;
      await loadMembers();
    } catch (error) {
      console.error('Error removing member:', error);
    }
  };

  const handleChangeRole = async (profileId: string, newRole: Profile['role']) => {
    try {
      const { error } = await db.profiles()
        .update({ role: newRole })
        .eq('id', profileId);

      if (error) throw error;
      await loadMembers();
    } catch (error) {
      console.error('Error changing role:', error);
    }
  };

  const getRoleBadgeColor = (role: Profile['role']) => {
    switch (role) {
      case 'super_admin':
        return 'bg-purple-100 text-purple-800';
      case 'org_admin':
        return 'bg-blue-100 text-blue-800';
      case 'member':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const availableProfiles = allProfiles.filter(
    p => p.organizational_unit_id !== unit?.id
  );

  const filteredAvailable = availableProfiles.filter(p =>
    p.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!unit) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-500">
        <div className="text-center">
          <User size={48} className="mx-auto mb-4 text-gray-300" />
          <p>Select an organizational unit to view members</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold">{unit.name} Members</h3>
          <button
            onClick={() => setShowAddMember(!showAddMember)}
            className="flex items-center gap-2 px-3 py-1.5 text-sm bg-green-500 text-white rounded hover:bg-green-600"
          >
            <UserPlus size={16} />
            Add Member
          </button>
        </div>
        {unit.description && (
          <p className="text-sm text-gray-600">{unit.description}</p>
        )}
      </div>

      {/* Add Member Panel */}
      {showAddMember && (
        <div className="p-4 bg-gray-50 border-b">
          <div className="mb-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="max-h-48 overflow-y-auto">
            {filteredAvailable.length > 0 ? (
              filteredAvailable.map(profile => (
                <div
                  key={profile.id}
                  className="flex items-center justify-between p-2 hover:bg-white rounded cursor-pointer"
                  onClick={() => handleAddMember(profile.id)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                      <User size={16} className="text-gray-600" />
                    </div>
                    <div>
                      <p className="font-medium">{profile.full_name || 'Unnamed'}</p>
                      <p className="text-sm text-gray-500">{profile.email}</p>
                    </div>
                  </div>
                  <button className="text-blue-500 hover:text-blue-600">
                    Add
                  </button>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-500 py-4">
                No available members to add
              </p>
            )}
          </div>
        </div>
      )}

      {/* Members List */}
      <div className="flex-1 overflow-auto p-4">
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : members.length > 0 ? (
          <div className="space-y-3">
            {members.map(member => (
              <div
                key={member.id}
                className="bg-white border rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    {member.avatar_url ? (
                      <img
                        src={member.avatar_url}
                        alt={member.full_name || ''}
                        className="w-12 h-12 rounded-full"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
                        <User size={20} className="text-gray-600" />
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold">{member.full_name || 'Unnamed'}</h4>
                        <span className={`px-2 py-0.5 text-xs rounded-full ${getRoleBadgeColor(member.role)}`}>
                          {member.role.replace('_', ' ')}
                        </span>
                        {member.status !== 'active' && (
                          <span className="px-2 py-0.5 text-xs rounded-full bg-red-100 text-red-800">
                            {member.status}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">{member.job_title || 'No title'}</p>
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Mail size={14} />
                          {member.email}
                        </span>
                        {member.phone && (
                          <span className="flex items-center gap-1">
                            <Phone size={14} />
                            {member.phone}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="relative group">
                    <button className="p-2 hover:bg-gray-100 rounded">
                      <MoreVertical size={16} />
                    </button>
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border hidden group-hover:block z-10">
                      <button
                        onClick={() => {
                          const newRole = prompt('Select role: super_admin, org_admin, or member', member.role);
                          if (newRole && ['super_admin', 'org_admin', 'member'].includes(newRole)) {
                            handleChangeRole(member.id, newRole as Profile['role']);
                          }
                        }}
                        className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 w-full text-left"
                      >
                        <Shield size={16} />
                        Change Role
                      </button>
                      <button
                        onClick={() => handleRemoveMember(member.id)}
                        className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 w-full text-left text-red-600"
                      >
                        <Trash2 size={16} />
                        Remove from Unit
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <User size={48} className="mx-auto mb-4 text-gray-300" />
            <p>No members in this unit</p>
            <p className="text-sm mt-2">Add members using the button above</p>
          </div>
        )}
      </div>
    </div>
  );
};