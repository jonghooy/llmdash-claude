import { Model } from 'mongoose';
import { MongoBaseRepository } from '../MongoBaseRepository';
import {
  IRoleRepository,
  IRole,
  CreateRoleDto,
  UpdateRoleDto,
  RolePermissions,
} from '../../../interfaces/IRoleRepository';
import { ITransaction } from '../../../interfaces/IDbGateway';

/**
 * MongoDB implementation of Role Repository
 */
export class MongoRoleRepository
  extends MongoBaseRepository<IRole>
  implements IRoleRepository
{
  constructor(model: Model<any>) {
    super(model);
  }

  /**
   * Get role by name
   */
  async getRoleByName(roleName: string, fieldsToSelect?: string | string[]): Promise<IRole | null> {
    let query = this.model.findOne({ name: roleName });

    if (fieldsToSelect) {
      query = query.select(fieldsToSelect);
    }

    return await query.lean().exec() as IRole | null;
  }

  /**
   * Update role by name
   */
  async updateRoleByName(roleName: string, updates: UpdateRoleDto): Promise<IRole | null> {
    const result = await this.model.findOneAndUpdate(
      { name: roleName },
      { $set: updates },
      { new: true, lean: true }
    )
      .select('-__v')
      .lean()
      .exec();

    return result as IRole | null;
  }

  /**
   * Create system role if doesn't exist
   */
  async createSystemRole(roleName: string, roleData: CreateRoleDto): Promise<IRole> {
    const existingRole = await this.getRoleByName(roleName);
    if (existingRole) {
      return existingRole;
    }

    const role = new this.model(roleData);
    await role.save();
    return role.toObject() as IRole;
  }

  /**
   * Update access permissions for a role
   */
  async updateAccessPermissions(
    roleName: string,
    permissionsUpdate: RolePermissions,
    roleData?: IRole
  ): Promise<void> {
    const role = roleData || await this.getRoleByName(roleName);
    if (!role) {
      throw new Error(`Role ${roleName} not found`);
    }

    const currentPermissions = role.permissions || {};
    const updatedPermissions = { ...currentPermissions };
    let hasChanges = false;

    // Check for old schema fields that need migration
    const unsetFields: any = {};
    const permissionTypes = Object.keys(permissionsUpdate);

    for (const permType of permissionTypes) {
      // Check if permission type exists at top level (old schema)
      if ((role as any)[permType] && typeof (role as any)[permType] === 'object') {
        updatedPermissions[permType] = {
          ...updatedPermissions[permType],
          ...(role as any)[permType],
        };
        unsetFields[permType] = 1;
        hasChanges = true;
      }
    }

    // Apply permission updates
    for (const [permissionType, permissions] of Object.entries(permissionsUpdate)) {
      const currentTypePermissions = currentPermissions[permissionType] || {};
      updatedPermissions[permissionType] = { ...currentTypePermissions };

      for (const [permission, value] of Object.entries(permissions)) {
        if (currentTypePermissions[permission] !== value) {
          updatedPermissions[permissionType][permission] = value;
          hasChanges = true;
        }
      }
    }

    if (hasChanges) {
      const updateObj = { permissions: updatedPermissions };

      if (Object.keys(unsetFields).length > 0) {
        // Migration update with unset
        await this.model.updateOne(
          { name: roleName },
          {
            $set: updateObj,
            $unset: unsetFields,
          }
        );
      } else {
        // Standard update
        await this.updateRoleByName(roleName, updateObj);
      }
    }
  }

  /**
   * Check if role has specific permission
   */
  async hasPermission(
    roleName: string,
    permissionType: string,
    permission: string
  ): Promise<boolean> {
    const role = await this.getRoleByName(roleName);
    if (!role || !role.permissions) {
      return false;
    }

    const typePermissions = role.permissions[permissionType];
    if (!typePermissions) {
      return false;
    }

    return typePermissions[permission] === true;
  }

  /**
   * Get all roles
   */
  async getAllRoles(): Promise<IRole[]> {
    return await this.find({}, { lean: true });
  }

  /**
   * Delete role by name
   */
  async deleteRoleByName(roleName: string): Promise<boolean> {
    const result = await this.model.deleteOne({ name: roleName }).exec();
    return result.deletedCount > 0;
  }

  /**
   * Migrate role schema from old to new structure
   */
  async migrateRoleSchema(roleName?: string): Promise<number> {
    let roles: any[];

    if (roleName) {
      const role = await this.model.findOne({ name: roleName }).exec();
      roles = role ? [role] : [];
    } else {
      roles = await this.model.find({}).exec();
    }

    let migratedCount = 0;

    for (const role of roles) {
      const unsetFields: any = {};
      let hasOldSchema = false;

      // Check for old schema fields (permissions at top level)
      const permissionTypes = ['bookmarks', 'prompts', 'memories', 'agents', 'multiConvo',
                               'temporaryChat', 'runCode', 'webSearch', 'peoplePicker',
                               'marketplace', 'fileSearch', 'fileCitations'];

      for (const permType of permissionTypes) {
        if (role[permType] && typeof role[permType] === 'object') {
          hasOldSchema = true;

          // Ensure permissions object exists
          role.permissions = role.permissions || {};

          // Migrate permissions from old location to new
          role.permissions[permType] = {
            ...role.permissions[permType],
            ...role[permType],
          };

          // Mark field for removal
          unsetFields[permType] = 1;
        }
      }

      if (hasOldSchema) {
        await this.model.updateOne(
          { _id: role._id },
          {
            $set: { permissions: role.permissions },
            $unset: unsetFields,
          }
        );

        migratedCount++;
      }
    }

    return migratedCount;
  }

  /**
   * Get roles by permission
   */
  async getRolesByPermission(permissionType: string, permission: string): Promise<IRole[]> {
    const query = {
      [`permissions.${permissionType}.${permission}`]: true
    };
    return await this.find(query, { lean: true });
  }

  /**
   * Bulk update permissions for multiple roles
   */
  async bulkUpdatePermissions(
    updates: Array<{ roleName: string; permissions: RolePermissions }>
  ): Promise<number> {
    let updatedCount = 0;

    for (const { roleName, permissions } of updates) {
      try {
        await this.updateAccessPermissions(roleName, permissions);
        updatedCount++;
      } catch (error) {
        console.error(`Failed to update permissions for role ${roleName}:`, error);
      }
    }

    return updatedCount;
  }

  /**
   * Override create to ensure unique role name
   */
  async create(data: CreateRoleDto, transaction?: ITransaction): Promise<IRole> {
    const session = this.getSession(transaction);

    // Check if role already exists
    const existing = await this.getRoleByName(data.name);
    if (existing) {
      throw new Error(`Role with name ${data.name} already exists`);
    }

    const doc = new this.model(data);
    await doc.save({ session });
    return doc.toObject() as IRole;
  }
}