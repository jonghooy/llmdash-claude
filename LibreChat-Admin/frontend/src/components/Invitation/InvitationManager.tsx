// Invitation Manager Component
import React, { useState, useEffect } from 'react';
import { Mail, Send, X, UserPlus, Clock, CheckCircle, XCircle, Link, Upload } from 'lucide-react';
import { db, functions } from '../../lib/supabase';
import { toast } from 'react-hot-toast';
import Papa from 'papaparse';

interface Invitation {
  id: string;
  email: string;
  role: string;
  status: string;
  expires_at: string;
  created_at: string;
  organizational_units?: { name: string };
  profiles?: { full_name: string };
}

interface InvitationManagerProps {
  organizationId: string;
}

export const InvitationManager: React.FC<InvitationManagerProps> = ({ organizationId }) => {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'pending' | 'accepted' | 'all'>('pending');

  // Single invite form
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'member' | 'org_admin'>('member');
  const [inviteUnitId, setInviteUnitId] = useState<string>('');
  const [organizationUnits, setOrganizationUnits] = useState<any[]>([]);

  // Bulk invite
  const [bulkEmails, setBulkEmails] = useState<any[]>([]);
  const [csvFile, setCsvFile] = useState<File | null>(null);

  useEffect(() => {
    loadInvitations();
    loadOrganizationUnits();
  }, [organizationId]);

  const loadInvitations = async () => {
    setLoading(true);
    try {
      const { data, error } = await db.invitations.getByOrganization(organizationId);
      if (error) throw error;
      setInvitations(data || []);
    } catch (error: any) {
      toast.error(`Failed to load invitations: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const loadOrganizationUnits = async () => {
    try {
      const { data, error } = await db.organizationalUnits.getByOrganization(organizationId);
      if (error) throw error;
      setOrganizationUnits(data || []);
    } catch (error: any) {
      console.error('Failed to load organization units:', error);
    }
  };

  const handleSendInvite = async () => {
    if (!inviteEmail || !validateEmail(inviteEmail)) {
      toast.error('Please enter a valid email address');
      return;
    }

    try {
      const { data, error } = await functions.createInvitation({
        email: inviteEmail,
        role: inviteRole,
        organizational_unit_id: inviteUnitId || null,
      });

      if (error) throw error;

      toast.success('Invitation sent successfully');
      setShowInviteModal(false);
      resetInviteForm();
      loadInvitations();

      // Send email
      if (data?.invitation?.id) {
        await functions.sendInvitationEmail(data.invitation.id);
      }
    } catch (error: any) {
      toast.error(`Failed to send invitation: ${error.message}`);
    }
  };

  const handleCancelInvitation = async (invitationId: string) => {
    if (!confirm('Are you sure you want to cancel this invitation?')) {
      return;
    }

    try {
      const { error } = await db.invitations.cancel(invitationId);
      if (error) throw error;
      toast.success('Invitation cancelled');
      loadInvitations();
    } catch (error: any) {
      toast.error(`Failed to cancel invitation: ${error.message}`);
    }
  };

  const handleResendInvitation = async (invitationId: string) => {
    try {
      const { error } = await functions.sendInvitationEmail(invitationId);
      if (error) throw error;
      toast.success('Invitation email resent');
    } catch (error: any) {
      toast.error(`Failed to resend invitation: ${error.message}`);
    }
  };

  const handleCopyInviteLink = async (invitation: Invitation) => {
    const baseUrl = window.location.origin;
    const inviteUrl = `${baseUrl}/invite/${invitation.token}`;

    try {
      await navigator.clipboard.writeText(inviteUrl);
      toast.success('Invitation link copied to clipboard');
    } catch (error) {
      toast.error('Failed to copy link');
    }
  };

  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCsvFile(file);

    Papa.parse(file, {
      header: true,
      complete: (results) => {
        const validEmails = results.data
          .filter((row: any) => row.email && validateEmail(row.email))
          .map((row: any) => ({
            email: row.email,
            role: row.role || 'member',
            department: row.department || '',
          }));

        setBulkEmails(validEmails);
        if (validEmails.length === 0) {
          toast.error('No valid emails found in CSV');
        } else {
          toast.success(`Found ${validEmails.length} valid emails`);
        }
      },
      error: (error) => {
        toast.error(`Failed to parse CSV: ${error.message}`);
      },
    });
  };

  const handleBulkInvite = async () => {
    if (bulkEmails.length === 0) {
      toast.error('No emails to invite');
      return;
    }

    let successCount = 0;
    let failCount = 0;

    for (const emailData of bulkEmails) {
      try {
        await functions.createInvitation({
          email: emailData.email,
          role: emailData.role,
          organizational_unit_id: null,
        });
        successCount++;
      } catch (error) {
        failCount++;
        console.error(`Failed to invite ${emailData.email}:`, error);
      }
    }

    toast.success(`Sent ${successCount} invitations${failCount > 0 ? `, ${failCount} failed` : ''}`);
    setShowBulkModal(false);
    setBulkEmails([]);
    setCsvFile(null);
    loadInvitations();
  };

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const resetInviteForm = () => {
    setInviteEmail('');
    setInviteRole('member');
    setInviteUnitId('');
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'accepted':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'expired':
      case 'cancelled':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return null;
    }
  };

  const filteredInvitations = invitations.filter(inv => {
    if (selectedTab === 'all') return true;
    return inv.status === selectedTab;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
            Invitations
          </h2>
          <div className="flex space-x-2">
            <button
              onClick={() => setShowBulkModal(true)}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center"
            >
              <Upload className="w-4 h-4 mr-2" />
              Bulk Invite
            </button>
            <button
              onClick={() => setShowInviteModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Invite User
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 mt-4">
          {(['pending', 'accepted', 'all'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setSelectedTab(tab)}
              className={`px-4 py-2 rounded-md transition-colors ${
                selectedTab === tab
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                  : 'text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
              <span className="ml-2 text-sm">
                ({invitations.filter(inv => tab === 'all' || inv.status === tab).length})
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Invitations List */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Department
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Invited By
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Expires
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {filteredInvitations.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                  No invitations found
                </td>
              </tr>
            ) : (
              filteredInvitations.map((invitation) => (
                <tr key={invitation.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                    {invitation.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                      {invitation.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {invitation.organizational_units?.name || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex items-center">
                      {getStatusIcon(invitation.status)}
                      <span className="ml-2">{invitation.status}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {invitation.profiles?.full_name || 'System'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {new Date(invitation.expires_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      {invitation.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleCopyInviteLink(invitation)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Copy invite link"
                          >
                            <Link className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleResendInvitation(invitation.id)}
                            className="text-green-600 hover:text-green-900"
                            title="Resend email"
                          >
                            <Send className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleCancelInvitation(invitation.id)}
                            className="text-red-600 hover:text-red-900"
                            title="Cancel invitation"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Single Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-96">
            <h3 className="text-lg font-semibold mb-4">Invite New User</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Email Address *</label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500"
                  placeholder="user@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Role</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as 'member' | 'org_admin')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500"
                >
                  <option value="member">Member</option>
                  <option value="org_admin">Organization Admin</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Department (Optional)</label>
                <select
                  value={inviteUnitId}
                  onChange={(e) => setInviteUnitId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500"
                >
                  <option value="">No department</option>
                  {organizationUnits.map((unit) => (
                    <option key={unit.id} value={unit.id}>
                      {unit.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end space-x-2 mt-6">
              <button
                onClick={() => {
                  setShowInviteModal(false);
                  resetInviteForm();
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleSendInvite}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
              >
                <Mail className="w-4 h-4 mr-2" />
                Send Invitation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Invite Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-[500px]">
            <h3 className="text-lg font-semibold mb-4">Bulk Invite Users</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Upload CSV File</label>
                <p className="text-xs text-gray-500 mb-2">
                  CSV should have columns: email (required), role (optional), department (optional)
                </p>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleCSVUpload}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              {bulkEmails.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2">
                    Preview ({bulkEmails.length} emails)
                  </p>
                  <div className="max-h-48 overflow-y-auto border border-gray-300 rounded p-2">
                    {bulkEmails.slice(0, 10).map((email, idx) => (
                      <div key={idx} className="text-sm py-1">
                        {email.email} - {email.role}
                      </div>
                    ))}
                    {bulkEmails.length > 10 && (
                      <div className="text-sm text-gray-500">
                        ... and {bulkEmails.length - 10} more
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-2 mt-6">
              <button
                onClick={() => {
                  setShowBulkModal(false);
                  setBulkEmails([]);
                  setCsvFile(null);
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkInvite}
                disabled={bulkEmails.length === 0}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 flex items-center"
              >
                <Send className="w-4 h-4 mr-2" />
                Send {bulkEmails.length} Invitations
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};