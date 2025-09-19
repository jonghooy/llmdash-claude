import React, { useState } from 'react';
import { Users, Plus, List } from 'lucide-react';
import { InvitationForm } from './InvitationForm';
import { InvitationList } from './InvitationList';

export const InvitationPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'list' | 'new'>('list');
  const [refreshKey, setRefreshKey] = useState(0);

  const handleInvitationSuccess = () => {
    setActiveTab('list');
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Users className="w-6 h-6" />
          초대 관리
        </h1>
        <p className="text-gray-600 mt-1">
          새로운 멤버를 초대하고 초대 상태를 관리합니다.
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex gap-6">
          <button
            onClick={() => setActiveTab('list')}
            className={`
              py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2
              ${activeTab === 'list'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }
            `}
          >
            <List className="w-4 h-4" />
            초대 목록
          </button>
          <button
            onClick={() => setActiveTab('new')}
            className={`
              py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2
              ${activeTab === 'new'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }
            `}
          >
            <Plus className="w-4 h-4" />
            새 초대
          </button>
        </nav>
      </div>

      {/* Content */}
      <div>
        {activeTab === 'list' ? (
          <InvitationList key={refreshKey} />
        ) : (
          <div className="max-w-2xl">
            <InvitationForm onSuccess={handleInvitationSuccess} />
          </div>
        )}
      </div>
    </div>
  );
};