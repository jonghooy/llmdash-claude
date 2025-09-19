/**
 * OrganizationTree Component
 * Displays hierarchical organization structure with tree view
 * Similar to file explorer interface
 */

import React, { useState, useEffect } from 'react';
import {
  ChevronRight,
  ChevronDown,
  Building2,
  Users,
  Plus,
  MoreVertical,
  Edit2,
  Trash2,
  UserPlus
} from 'lucide-react';
import { db } from '../../../lib/supabase/client';
import type { Database } from '../../../lib/supabase/types/database';

type OrganizationalUnit = Database['public']['Tables']['organizational_units']['Row'];
type Profile = Database['public']['Tables']['profiles']['Row'];

interface TreeNode extends OrganizationalUnit {
  children?: TreeNode[];
  members?: Profile[];
}

interface OrganizationTreeProps {
  organizationId: string;
  onSelectUnit?: (unit: OrganizationalUnit) => void;
  selectedUnitId?: string;
}

export const OrganizationTree: React.FC<OrganizationTreeProps> = ({
  organizationId,
  onSelectUnit,
  selectedUnitId
}) => {
  const [treeData, setTreeData] = useState<TreeNode[]>([]);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [contextMenu, setContextMenu] = useState<{
    unitId: string;
    x: number;
    y: number;
  } | null>(null);

  useEffect(() => {
    loadOrganizationStructure();
  }, [organizationId]);

  const loadOrganizationStructure = async () => {
    try {
      setLoading(true);

      // Fetch all organizational units
      const { data: units, error: unitsError } = await db.organizational_units()
        .select('*')
        .eq('organization_id', organizationId)
        .order('name');

      if (unitsError) throw unitsError;

      // Fetch all profiles
      const { data: profiles, error: profilesError } = await db.profiles()
        .select('*')
        .eq('organization_id', organizationId);

      if (profilesError) throw profilesError;

      // Build tree structure
      const tree = buildTree(units || [], profiles || []);
      setTreeData(tree);
    } catch (error) {
      console.error('Error loading organization structure:', error);
    } finally {
      setLoading(false);
    }
  };

  const buildTree = (units: OrganizationalUnit[], profiles: Profile[]): TreeNode[] => {
    const unitMap = new Map<string, TreeNode>();
    const rootUnits: TreeNode[] = [];

    // Initialize all units
    units.forEach(unit => {
      unitMap.set(unit.id, { ...unit, children: [], members: [] });
    });

    // Assign members to units
    profiles.forEach(profile => {
      if (profile.organizational_unit_id) {
        const unit = unitMap.get(profile.organizational_unit_id);
        if (unit) {
          unit.members?.push(profile);
        }
      }
    });

    // Build hierarchy
    units.forEach(unit => {
      const node = unitMap.get(unit.id)!;
      if (unit.parent_id) {
        const parent = unitMap.get(unit.parent_id);
        if (parent) {
          parent.children?.push(node);
        }
      } else {
        rootUnits.push(node);
      }
    });

    return rootUnits;
  };

  const toggleNode = (nodeId: string) => {
    setExpandedNodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId);
      } else {
        newSet.add(nodeId);
      }
      return newSet;
    });
  };

  const handleContextMenu = (e: React.MouseEvent, unitId: string) => {
    e.preventDefault();
    setContextMenu({ unitId, x: e.clientX, y: e.clientY });
  };

  const handleAddSubUnit = async (parentId: string | null) => {
    const name = prompt('Enter new department name:');
    if (!name) return;

    try {
      const { error } = await db.organizational_units()
        .insert({
          organization_id: organizationId,
          parent_id: parentId || null,
          name,
          metadata: {}
        });

      if (error) throw error;
      await loadOrganizationStructure();
    } catch (error) {
      console.error('Error creating unit:', error);
      alert('Failed to create department. Please try again.');
    }
  };

  const handleRenameUnit = async (unitId: string, currentName: string) => {
    const newName = prompt('Enter new name:', currentName);
    if (!newName || newName === currentName) return;

    try {
      const { error } = await db.organizational_units()
        .update({ name: newName })
        .eq('id', unitId);

      if (error) throw error;
      await loadOrganizationStructure();
    } catch (error) {
      console.error('Error renaming unit:', error);
    }
  };

  const handleDeleteUnit = async (unitId: string) => {
    if (!confirm('Are you sure you want to delete this unit?')) return;

    try {
      const { error } = await db.organizational_units()
        .delete()
        .eq('id', unitId);

      if (error) throw error;
      await loadOrganizationStructure();
    } catch (error) {
      console.error('Error deleting unit:', error);
    }
  };

  const renderTreeNode = (node: TreeNode, level = 0): React.ReactNode => {
    const isExpanded = expandedNodes.has(node.id);
    const isSelected = selectedUnitId === node.id;
    const hasChildren = node.children && node.children.length > 0;
    const memberCount = node.members?.length || 0;

    return (
      <div key={node.id}>
        <div
          className={`
            flex items-center gap-2 py-2 px-3 hover:bg-gray-100 cursor-pointer
            ${isSelected ? 'bg-blue-50 border-l-4 border-blue-500' : ''}
          `}
          style={{ paddingLeft: `${level * 20 + 12}px` }}
          onClick={() => {
            onSelectUnit?.(node);
            if (hasChildren) toggleNode(node.id);
          }}
          onContextMenu={(e) => handleContextMenu(e, node.id)}
        >
          {hasChildren ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleNode(node.id);
              }}
              className="p-0.5"
            >
              {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </button>
          ) : (
            <div className="w-5" />
          )}

          <Building2 size={18} className="text-gray-600" />

          <span className="flex-1 font-medium">{node.name}</span>

          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Users size={14} />
            <span>{memberCount}</span>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              handleContextMenu(e, node.id);
            }}
            className="p-1 hover:bg-gray-200 rounded"
          >
            <MoreVertical size={16} />
          </button>
        </div>

        {isExpanded && hasChildren && (
          <div>
            {node.children?.map(child => renderTreeNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="text-lg font-semibold">Organization Structure</h3>
        <button
          onClick={() => handleAddSubUnit(null)}
          className="flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          <Plus size={16} />
          Add Department
        </button>
      </div>

      {/* Tree View */}
      <div className="min-h-[400px] overflow-auto">
        {treeData.length > 0 ? (
          treeData.map(node => renderTreeNode(node))
        ) : (
          <div className="p-8 text-center text-gray-500">
            <Building2 size={48} className="mx-auto mb-4 text-gray-300" />
            <p>No organizational units found</p>
            <p className="text-sm mt-2">Create your first department to get started</p>
          </div>
        )}
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setContextMenu(null)}
          />
          <div
            className="fixed z-50 bg-white rounded-lg shadow-lg border py-2 min-w-[160px]"
            style={{
              left: `${contextMenu.x}px`,
              top: `${contextMenu.y}px`
            }}
          >
            <button
              onClick={() => {
                handleAddSubUnit(contextMenu.unitId);
                setContextMenu(null);
              }}
              className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 w-full text-left"
            >
              <Plus size={16} />
              Add Sub-unit
            </button>
            <button
              onClick={() => {
                const unit = treeData.find(u => u.id === contextMenu.unitId);
                if (unit) handleRenameUnit(contextMenu.unitId, unit.name);
                setContextMenu(null);
              }}
              className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 w-full text-left"
            >
              <Edit2 size={16} />
              Rename
            </button>
            <button
              onClick={() => {
                handleDeleteUnit(contextMenu.unitId);
                setContextMenu(null);
              }}
              className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 w-full text-left text-red-600"
            >
              <Trash2 size={16} />
              Delete
            </button>
          </div>
        </>
      )}
    </div>
  );
};