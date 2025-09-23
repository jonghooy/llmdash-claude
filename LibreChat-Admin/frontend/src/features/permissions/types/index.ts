export type Permission = 'view' | 'edit' | 'comment' | 'delete' | 'admin';

export interface ACL {
  id: string;
  resource_type: 'memory' | 'file' | 'folder' | 'project';
  resource_id: string;
  grantor_id: string;
  grantee_type: 'user' | 'team' | 'organization';
  grantee_id: string;
  permission: Permission;
  created_at: string;
  expires_at: string | null;
  resource?: {
    id: string;
    name: string;
    type: string;
  };
  grantee?: {
    id: string;
    name: string;
    email?: string;
    avatar?: string;
  };
}

export interface ShareSettings {
  isPublic: boolean;
  linkSharing: boolean;
  shareLink?: string;
  linkExpiry?: string;
  linkPermission?: Permission;
  defaultPermission: Permission;
}

export interface ACLFormData {
  emails: string[];
  permission: Permission;
  message?: string;
  notify: boolean;
  expiresAt?: string;
}