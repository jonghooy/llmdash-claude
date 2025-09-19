// Organization Tree Component
import React, { useState, useEffect } from 'react';
import { ChevronRight, ChevronDown, Plus, Edit2, Trash2, Users, Building } from 'lucide-react';
import { db } from '../../lib/supabase';
import { toast } from 'react-hot-toast';

interface OrgUnit {
  id: string;
  name: string;
  description?: string;
  parent_id?: string;
  level: number;
  children?: OrgUnit[];
  member_count?: number;
}

interface OrganizationTreeProps {
  organizationId: string;
  onSelectUnit: (unit: OrgUnit) => void;
  selectedUnitId?: string;
}

export const OrganizationTree: React.FC<OrganizationTreeProps> = ({
  organizationId,
  onSelectUnit,
  selectedUnitId,
}) => {
  const [units, setUnits] = useState<OrgUnit[]>([]);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newUnitParentId, setNewUnitParentId] = useState<string | null>(null);
  const [newUnitName, setNewUnitName] = useState('');
  const [newUnitDescription, setNewUnitDescription] = useState('');

  useEffect(() => {
    loadOrganizationUnits();
  }, [organizationId]);

  const loadOrganizationUnits = async () => {
    setLoading(true);
    try {
      const { data, error } = await db.organizationalUnits.getByOrganization(organizationId);

      if (error) throw error;

      // Build tree structure
      const tree = buildTree(data || []);
      setUnits(tree);
    } catch (error: any) {
      toast.error(`Failed to load organization units: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const buildTree = (flatData: any[]): OrgUnit[] => {
    const map = new Map<string, OrgUnit>();
    const roots: OrgUnit[] = [];

    // First pass: create all nodes
    flatData.forEach((item) => {
      map.set(item.id, {
        ...item,
        children: [],
      });
    });

    // Second pass: build tree
    flatData.forEach((item) => {
      const node = map.get(item.id)!;
      if (item.parent_id) {
        const parent = map.get(item.parent_id);
        if (parent) {
          parent.children!.push(node);
        }
      } else {
        roots.push(node);
      }
    });

    // Sort children at each level
    const sortNodes = (nodes: OrgUnit[]): OrgUnit[] => {
      return nodes.sort((a, b) => a.name.localeCompare(b.name)).map(node => ({
        ...node,
        children: node.children ? sortNodes(node.children) : [],
      }));
    };

    return sortNodes(roots);
  };

  const toggleExpand = (unitId: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(unitId)) {
      newExpanded.delete(unitId);
    } else {
      newExpanded.add(unitId);
    }
    setExpandedNodes(newExpanded);
  };

  const handleAddUnit = (parentId: string | null) => {
    setNewUnitParentId(parentId);
    setNewUnitName('');
    setNewUnitDescription('');
    setShowAddModal(true);
  };

  const handleSaveNewUnit = async () => {
    if (!newUnitName.trim()) {
      toast.error('Unit name is required');
      return;
    }

    try {
      const { error } = await db.organizationalUnits.create({
        organization_id: organizationId,
        parent_id: newUnitParentId,
        name: newUnitName,
        description: newUnitDescription,
      });

      if (error) throw error;

      toast.success('Unit created successfully');
      setShowAddModal(false);
      loadOrganizationUnits();
    } catch (error: any) {
      toast.error(`Failed to create unit: ${error.message}`);
    }
  };

  const handleEditUnit = (unit: OrgUnit) => {
    setEditingId(unit.id);
    setEditName(unit.name);
  };

  const handleSaveEdit = async () => {
    if (!editName.trim()) {
      toast.error('Unit name is required');
      return;
    }

    try {
      const { error } = await db.organizationalUnits.update(editingId!, {
        name: editName,
      });

      if (error) throw error;

      toast.success('Unit updated successfully');
      setEditingId(null);
      loadOrganizationUnits();
    } catch (error: any) {
      toast.error(`Failed to update unit: ${error.message}`);
    }
  };

  const handleDeleteUnit = async (unitId: string) => {
    if (!confirm('Are you sure you want to delete this unit? All sub-units will also be deleted.')) {
      return;
    }

    try {
      const { error } = await db.organizationalUnits.delete(unitId);

      if (error) throw error;

      toast.success('Unit deleted successfully');
      loadOrganizationUnits();
    } catch (error: any) {
      toast.error(`Failed to delete unit: ${error.message}`);
    }
  };

  const renderUnit = (unit: OrgUnit, depth: number = 0) => {
    const isExpanded = expandedNodes.has(unit.id);
    const hasChildren = unit.children && unit.children.length > 0;
    const isSelected = selectedUnitId === unit.id;
    const isEditing = editingId === unit.id;

    return (
      <div key={unit.id}>
        <div
          className={`flex items-center px-2 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer rounded-md ${
            isSelected ? 'bg-blue-50 dark:bg-blue-900' : ''
          }`}
          style={{ paddingLeft: `${depth * 20 + 8}px` }}
        >
          <button
            onClick={() => toggleExpand(unit.id)}
            className="mr-1 p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
          >
            {hasChildren ? (
              isExpanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )
            ) : (
              <div className="w-4 h-4" />
            )}
          </button>

          {unit.level === 0 ? (
            <Building className="w-4 h-4 mr-2 text-blue-600" />
          ) : (
            <Users className="w-4 h-4 mr-2 text-gray-600" />
          )}

          {isEditing ? (
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onBlur={handleSaveEdit}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveEdit();
                if (e.key === 'Escape') setEditingId(null);
              }}
              className="flex-1 px-2 py-1 border border-blue-500 rounded"
              autoFocus
            />
          ) : (
            <span
              className="flex-1"
              onClick={() => onSelectUnit(unit)}
            >
              {unit.name}
              {unit.member_count !== undefined && (
                <span className="ml-2 text-sm text-gray-500">
                  ({unit.member_count} members)
                </span>
              )}
            </span>
          )}

          <div className="flex items-center space-x-1 opacity-0 hover:opacity-100 transition-opacity">
            <button
              onClick={() => handleAddUnit(unit.id)}
              className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
              title="Add sub-unit"
            >
              <Plus className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleEditUnit(unit)}
              className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
              title="Edit unit"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleDeleteUnit(unit.id)}
              className="p-1 hover:bg-red-100 dark:hover:bg-red-900 rounded text-red-600"
              title="Delete unit"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {hasChildren && isExpanded && (
          <div>
            {unit.children!.map((child) => renderUnit(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
          Organization Structure
        </h3>
        <button
          onClick={() => handleAddUnit(null)}
          className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
        >
          <Plus className="w-4 h-4 mr-1" />
          Add Department
        </button>
      </div>

      <div className="space-y-1">
        {units.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No organizational units yet. Click "Add Department" to create one.
          </div>
        ) : (
          units.map((unit) => renderUnit(unit))
        )}
      </div>

      {/* Add Unit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-96">
            <h3 className="text-lg font-semibold mb-4">
              Add {newUnitParentId ? 'Sub-unit' : 'Department'}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name *</label>
                <input
                  type="text"
                  value={newUnitName}
                  onChange={(e) => setNewUnitName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500"
                  placeholder="e.g., Engineering, Marketing"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  value={newUnitDescription}
                  onChange={(e) => setNewUnitDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500"
                  rows={3}
                  placeholder="Optional description"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveNewUnit}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};