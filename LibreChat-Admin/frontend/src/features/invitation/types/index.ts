export interface Invitation {
  id: string;
  organization_id: string;
  email: string;
  role: 'owner' | 'admin' | 'member' | 'viewer';
  organizational_unit_id: string | null;
  invited_by: string;
  token: string;
  expires_at: string;
  created_at: string;
  status: 'pending' | 'accepted' | 'expired' | 'cancelled';
  organizational_unit?: {
    id: string;
    name: string;
  };
  inviter?: {
    id: string;
    email: string;
    full_name: string;
  };
}

export interface InvitationFormData {
  email: string;
  role: 'owner' | 'admin' | 'member' | 'viewer';
  organizational_unit_id?: string;
  message?: string;
}

export interface InvitationFilters {
  status?: 'pending' | 'accepted' | 'expired' | 'cancelled';
  role?: string;
  searchTerm?: string;
}