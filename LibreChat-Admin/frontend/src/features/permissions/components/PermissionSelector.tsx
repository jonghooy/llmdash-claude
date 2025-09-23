import React from 'react';
import { ChevronDown, Eye, Edit, MessageSquare, Trash2, Shield } from 'lucide-react';
import { Permission } from '../types';

interface PermissionSelectorProps {
  value: Permission;
  onChange: (permission: Permission) => void;
  disabled?: boolean;
}

export const PermissionSelector: React.FC<PermissionSelectorProps> = ({
  value,
  onChange,
  disabled = false
}) => {
  const [isOpen, setIsOpen] = React.useState(false);

  const permissions: { value: Permission; label: string; icon: React.ReactNode; description: string }[] = [
    {
      value: 'view',
      label: 'Viewer',
      icon: <Eye className="w-4 h-4" />,
      description: 'Can view'
    },
    {
      value: 'comment',
      label: 'Commenter',
      icon: <MessageSquare className="w-4 h-4" />,
      description: 'Can view and comment'
    },
    {
      value: 'edit',
      label: 'Editor',
      icon: <Edit className="w-4 h-4" />,
      description: 'Can edit'
    },
    {
      value: 'delete',
      label: 'Delete',
      icon: <Trash2 className="w-4 h-4" />,
      description: 'Can delete'
    },
    {
      value: 'admin',
      label: 'Admin',
      icon: <Shield className="w-4 h-4" />,
      description: 'Full access'
    }
  ];

  const currentPermission = permissions.find(p => p.value === value);

  return (
    <div className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {currentPermission?.icon}
        <span className="text-sm font-medium">{currentPermission?.label}</span>
        <ChevronDown className="w-4 h-4 ml-1" />
      </button>

      {isOpen && !disabled && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg border border-gray-200 z-20">
            {permissions.map((perm) => (
              <button
                key={perm.value}
                type="button"
                onClick={() => {
                  onChange(perm.value);
                  setIsOpen(false);
                }}
                className={`w-full px-4 py-3 flex items-start gap-3 hover:bg-gray-50 transition-colors ${
                  perm.value === value ? 'bg-blue-50' : ''
                }`}
              >
                <div className={`mt-0.5 ${perm.value === value ? 'text-blue-600' : 'text-gray-600'}`}>
                  {perm.icon}
                </div>
                <div className="flex-1 text-left">
                  <div className={`text-sm font-medium ${perm.value === value ? 'text-blue-600' : 'text-gray-900'}`}>
                    {perm.label}
                  </div>
                  <div className="text-xs text-gray-500">
                    {perm.description}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};