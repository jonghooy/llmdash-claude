import React, { useState, useEffect } from 'react';
import {
  Mail,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Send,
  Copy,
  Trash2,
  RefreshCw
} from 'lucide-react';
import { supabase } from '../../../lib/supabase/client';
import { Invitation, InvitationFilters } from '../types';
import { format } from 'date-fns';

export const InvitationList: React.FC = () => {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<InvitationFilters>({
    status: 'pending',
    searchTerm: ''
  });

  const loadInvitations = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('invitations')
        .select(`
          *,
          organizational_unit:organizational_units(id, name),
          inviter:profiles!invited_by(id, email, full_name)
        `)
        .order('created_at', { ascending: false });

      if (filters.status) {
        query = query.eq('status', filters.status);
      }

      if (filters.searchTerm) {
        query = query.ilike('email', `%${filters.searchTerm}%`);
      }

      const { data, error } = await query;

      if (error) throw error;
      setInvitations(data || []);
    } catch (error) {
      console.error('Error loading invitations:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInvitations();
  }, [filters]);

  const resendInvitation = async (id: string) => {
    try {
      // TODO: Implement email resend logic
      console.log('Resending invitation:', id);
      alert('초대 이메일을 재발송했습니다.');
    } catch (error) {
      console.error('Error resending invitation:', error);
    }
  };

  const cancelInvitation = async (id: string) => {
    if (!confirm('정말로 이 초대를 취소하시겠습니까?')) return;

    try {
      const { error } = await supabase
        .from('invitations')
        .update({ status: 'cancelled' })
        .eq('id', id);

      if (error) throw error;
      await loadInvitations();
    } catch (error) {
      console.error('Error cancelling invitation:', error);
    }
  };

  const copyInviteLink = (token: string) => {
    const link = `${window.location.origin}/accept-invitation?token=${token}`;
    navigator.clipboard.writeText(link);
    alert('초대 링크가 복사되었습니다.');
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      pending: { icon: Clock, text: '대기중', color: 'bg-yellow-100 text-yellow-800' },
      accepted: { icon: CheckCircle, text: '수락됨', color: 'bg-green-100 text-green-800' },
      expired: { icon: AlertCircle, text: '만료됨', color: 'bg-gray-100 text-gray-800' },
      cancelled: { icon: XCircle, text: '취소됨', color: 'bg-red-100 text-red-800' }
    };

    const badge = badges[status as keyof typeof badges];
    const Icon = badge.icon;

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${badge.color}`}>
        <Icon className="w-3 h-3" />
        {badge.text}
      </span>
    );
  };

  const getRoleBadge = (role: string) => {
    const colors = {
      owner: 'bg-purple-100 text-purple-800',
      admin: 'bg-blue-100 text-blue-800',
      member: 'bg-green-100 text-green-800',
      viewer: 'bg-gray-100 text-gray-800'
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[role as keyof typeof colors]}`}>
        {role}
      </span>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Filters */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <input
              type="text"
              placeholder="이메일 검색..."
              className="px-3 py-2 border border-gray-300 rounded-md"
              value={filters.searchTerm}
              onChange={(e) => setFilters({ ...filters, searchTerm: e.target.value })}
            />
            <select
              className="px-3 py-2 border border-gray-300 rounded-md"
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value as any })}
            >
              <option value="">모든 상태</option>
              <option value="pending">대기중</option>
              <option value="accepted">수락됨</option>
              <option value="expired">만료됨</option>
              <option value="cancelled">취소됨</option>
            </select>
          </div>
          <button
            onClick={loadInvitations}
            className="p-2 hover:bg-gray-100 rounded-md"
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">이메일</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">역할</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">조직</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">초대자</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">초대일</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">상태</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">작업</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {invitations.map((invitation) => (
              <tr key={invitation.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <span className="text-sm font-medium">{invitation.email}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  {getRoleBadge(invitation.role)}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {invitation.organizational_unit?.name || '-'}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {invitation.inviter?.full_name || invitation.inviter?.email || '-'}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {format(new Date(invitation.created_at), 'yyyy-MM-dd HH:mm')}
                </td>
                <td className="px-4 py-3">
                  {getStatusBadge(invitation.status)}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    {invitation.status === 'pending' && (
                      <>
                        <button
                          onClick={() => copyInviteLink(invitation.token)}
                          className="p-1 hover:bg-gray-100 rounded"
                          title="링크 복사"
                        >
                          <Copy className="w-4 h-4 text-gray-600" />
                        </button>
                        <button
                          onClick={() => resendInvitation(invitation.id)}
                          className="p-1 hover:bg-gray-100 rounded"
                          title="재발송"
                        >
                          <Send className="w-4 h-4 text-blue-600" />
                        </button>
                        <button
                          onClick={() => cancelInvitation(invitation.id)}
                          className="p-1 hover:bg-gray-100 rounded"
                          title="취소"
                        >
                          <XCircle className="w-4 h-4 text-red-600" />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {invitations.length === 0 && !loading && (
          <div className="text-center py-8 text-gray-500">
            초대 내역이 없습니다.
          </div>
        )}
      </div>
    </div>
  );
};