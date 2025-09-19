import React, { useState } from 'react';
import {
  X,
  Link2,
  Users,
  Globe,
  Copy,
  Check,
  Lock,
  Calendar,
  Mail
} from 'lucide-react';
import { PermissionSelector } from './PermissionSelector';
import { ACLFormData, Permission, ShareSettings } from '../types';

interface ShareDialogProps {
  isOpen: boolean;
  onClose: () => void;
  resourceName: string;
  resourceType: string;
  shareSettings: ShareSettings;
  onShare: (data: ACLFormData) => Promise<void>;
  onUpdateSettings: (settings: Partial<ShareSettings>) => Promise<void>;
}

export const ShareDialog: React.FC<ShareDialogProps> = ({
  isOpen,
  onClose,
  resourceName,
  resourceType,
  shareSettings,
  onShare,
  onUpdateSettings
}) => {
  const [emails, setEmails] = useState('');
  const [permission, setPermission] = useState<Permission>('view');
  const [message, setMessage] = useState('');
  const [notify, setNotify] = useState(true);
  const [expiresIn, setExpiresIn] = useState('never');
  const [linkCopied, setLinkCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleShare = async () => {
    const emailList = emails
      .split(/[,;\s]+/)
      .map(e => e.trim())
      .filter(e => e.includes('@'));

    if (emailList.length === 0) return;

    setLoading(true);
    try {
      let expiresAt: string | undefined;
      if (expiresIn !== 'never') {
        const date = new Date();
        if (expiresIn === '7days') date.setDate(date.getDate() + 7);
        if (expiresIn === '30days') date.setDate(date.getDate() + 30);
        if (expiresIn === '90days') date.setDate(date.getDate() + 90);
        expiresAt = date.toISOString();
      }

      await onShare({
        emails: emailList,
        permission,
        message,
        notify,
        expiresAt
      });

      // Reset form
      setEmails('');
      setMessage('');
    } catch (error) {
      console.error('Error sharing:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleLinkSharing = async () => {
    await onUpdateSettings({
      linkSharing: !shareSettings.linkSharing,
      shareLink: !shareSettings.linkSharing ? crypto.randomUUID() : undefined
    });
  };

  const copyLink = () => {
    if (shareSettings.shareLink) {
      const link = `${window.location.origin}/shared/${shareSettings.shareLink}`;
      navigator.clipboard.writeText(link);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h2 className="text-lg font-semibold">Share "{resourceName}"</h2>
            <p className="text-sm text-gray-500">{resourceType}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-md"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 140px)' }}>
          {/* Share with people */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
              <Users className="w-4 h-4" />
              Share with people
            </h3>

            <div className="space-y-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter email addresses (comma separated)"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={emails}
                  onChange={(e) => setEmails(e.target.value)}
                />
                <PermissionSelector
                  value={permission}
                  onChange={setPermission}
                />
              </div>

              <textarea
                placeholder="Add a message (optional)"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={2}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={notify}
                      onChange={(e) => setNotify(e.target.checked)}
                      className="rounded text-blue-600"
                    />
                    <span className="text-sm text-gray-700">
                      <Mail className="w-4 h-4 inline mr-1" />
                      Notify via email
                    </span>
                  </label>

                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <select
                      className="text-sm border border-gray-300 rounded px-2 py-1"
                      value={expiresIn}
                      onChange={(e) => setExpiresIn(e.target.value)}
                    >
                      <option value="never">Never expires</option>
                      <option value="7days">Expires in 7 days</option>
                      <option value="30days">Expires in 30 days</option>
                      <option value="90days">Expires in 90 days</option>
                    </select>
                  </div>
                </div>

                <button
                  onClick={handleShare}
                  disabled={!emails.trim() || loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Sharing...' : 'Share'}
                </button>
              </div>
            </div>
          </div>

          {/* Link sharing */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
              <Link2 className="w-4 h-4" />
              Get link
            </h3>

            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  {shareSettings.linkSharing ? (
                    <Globe className="w-5 h-5 text-green-600" />
                  ) : (
                    <Lock className="w-5 h-5 text-gray-400" />
                  )}
                  <span className="text-sm font-medium">
                    {shareSettings.linkSharing ? 'Anyone with the link can access' : 'Link sharing is off'}
                  </span>
                </div>
                <button
                  onClick={toggleLinkSharing}
                  className={`px-3 py-1 rounded-md text-sm font-medium ${
                    shareSettings.linkSharing
                      ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {shareSettings.linkSharing ? 'Turn off' : 'Turn on'}
                </button>
              </div>

              {shareSettings.linkSharing && shareSettings.shareLink && (
                <>
                  <div className="flex gap-2 mb-3">
                    <input
                      type="text"
                      readOnly
                      value={`${window.location.origin}/shared/${shareSettings.shareLink}`}
                      className="flex-1 px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-sm"
                    />
                    <button
                      onClick={copyLink}
                      className="px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                    >
                      {linkCopied ? (
                        <Check className="w-4 h-4 text-green-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">Link permission:</span>
                    <PermissionSelector
                      value={shareSettings.linkPermission || 'view'}
                      onChange={(p) => onUpdateSettings({ linkPermission: p })}
                    />
                  </div>
                </>
              )}
            </div>
          </div>

          {/* General access */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3">General access</h3>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                {shareSettings.isPublic ? (
                  <Globe className="w-5 h-5 text-blue-600" />
                ) : (
                  <Lock className="w-5 h-5 text-gray-600" />
                )}
                <div>
                  <div className="text-sm font-medium">
                    {shareSettings.isPublic ? 'Public' : 'Restricted'}
                  </div>
                  <div className="text-xs text-gray-500">
                    {shareSettings.isPublic
                      ? 'Anyone in the organization can access'
                      : 'Only specific people can access'}
                  </div>
                </div>
              </div>
              <button
                onClick={() => onUpdateSettings({ isPublic: !shareSettings.isPublic })}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Change
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};