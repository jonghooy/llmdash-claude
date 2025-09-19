import React, { useState, useEffect } from 'react';
import {
  UserPlus,
  Mail,
  Shield,
  Building2,
  Send,
  AlertCircle
} from 'lucide-react';
import { supabase } from '../../../lib/supabase/client';
import { useAuthStore } from '../../../stores/authStore';
import { InvitationFormData } from '../types';

interface OrganizationalUnit {
  id: string;
  name: string;
  level: number;
}

export const InvitationForm: React.FC<{ onSuccess?: () => void }> = ({ onSuccess }) => {
  const { user } = useAuthStore();
  const [formData, setFormData] = useState<InvitationFormData>({
    email: '',
    role: 'member',
    organizational_unit_id: undefined,
    message: ''
  });
  const [units, setUnits] = useState<OrganizationalUnit[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadOrganizationalUnits();
  }, []);

  const loadOrganizationalUnits = async () => {
    try {
      const { data, error } = await supabase
        .from('organizational_units')
        .select('id, name, level')
        .order('level', { ascending: true })
        .order('name', { ascending: true });

      if (error) throw error;
      setUnits(data || []);
    } catch (error) {
      console.error('Error loading organizational units:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Check if user is authenticated
      if (!user) {
        throw new Error('User not authenticated. Please log in again.');
      }

      // Generate invitation token
      const token = crypto.randomUUID();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

      // Create invitation
      const { error } = await supabase
        .from('invitations')
        .insert({
          email: formData.email,
          role: formData.role,
          organizational_unit_id: formData.organizational_unit_id || null,
          invited_by: user.id || 'admin',
          token,
          expires_at: expiresAt.toISOString(),
          status: 'pending'
        });

      if (error) throw error;

      // TODO: Send invitation email
      console.log('Invitation created. Email would be sent to:', formData.email);

      // Reset form
      setFormData({
        email: '',
        role: 'member',
        organizational_unit_id: undefined,
        message: ''
      });

      alert('초대가 성공적으로 발송되었습니다!');
      onSuccess?.();
    } catch (error: any) {
      setError(error.message || '초대 발송 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <UserPlus className="w-5 h-5" />
          새 멤버 초대
        </h2>
        <p className="text-sm text-gray-600 mt-1">
          조직에 새로운 멤버를 초대합니다. 초대 링크는 7일 후 만료됩니다.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <Mail className="w-4 h-4 inline mr-1" />
            이메일 주소
          </label>
          <input
            type="email"
            required
            placeholder="user@example.com"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />
        </div>

        {/* Role */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <Shield className="w-4 h-4 inline mr-1" />
            역할
          </label>
          <select
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={formData.role}
            onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
          >
            <option value="viewer">Viewer - 읽기 전용</option>
            <option value="member">Member - 일반 멤버</option>
            <option value="admin">Admin - 관리자</option>
            <option value="owner">Owner - 소유자</option>
          </select>
          <div className="mt-1 text-xs text-gray-500">
            {formData.role === 'viewer' && '리소스를 조회만 할 수 있습니다.'}
            {formData.role === 'member' && '리소스를 조회하고 생성할 수 있습니다.'}
            {formData.role === 'admin' && '조직 설정과 멤버를 관리할 수 있습니다.'}
            {formData.role === 'owner' && '모든 권한을 가지며 조직을 삭제할 수 있습니다.'}
          </div>
        </div>

        {/* Organizational Unit */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <Building2 className="w-4 h-4 inline mr-1" />
            소속 조직 (선택)
          </label>
          <select
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={formData.organizational_unit_id || ''}
            onChange={(e) => setFormData({
              ...formData,
              organizational_unit_id: e.target.value || undefined
            })}
          >
            <option value="">조직 선택...</option>
            {units.map((unit) => (
              <option key={unit.id} value={unit.id}>
                {'　'.repeat(unit.level)}{unit.name}
              </option>
            ))}
          </select>
        </div>

        {/* Message */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            초대 메시지 (선택)
          </label>
          <textarea
            rows={3}
            placeholder="초대받는 사용자에게 전달할 메시지를 입력하세요..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={formData.message}
            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
          />
        </div>

        {/* Error message */}
        {error && (
          <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <span className="text-sm text-red-700">{error}</span>
          </div>
        )}

        {/* Submit button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
              초대 발송 중...
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              초대 발송
            </>
          )}
        </button>
      </form>
    </div>
  );
};