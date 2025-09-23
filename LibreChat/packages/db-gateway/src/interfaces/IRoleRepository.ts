import { IRepository } from './IDbGateway';
import { ITransaction } from './IDbGateway';

/**
 * Permission types and permissions
 */
export interface RolePermissions {
  [key: string]: {
    [permission: string]: boolean;
  };
}

/**
 * Role document interface
 */
export interface IRole {
  _id?: string;
  name: string;
  permissions?: RolePermissions;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Role Create DTO
 */
export interface CreateRoleDto extends Omit<IRole, '_id' | 'createdAt' | 'updatedAt'> {}

/**
 * Role Update DTO
 */
export interface UpdateRoleDto extends Partial<CreateRoleDto> {}

/**
 * Role Repository Interface
 */
export interface IRoleRepository extends IRepository<IRole> {
  /**
   * Get role by name
   */
  getRoleByName(roleName: string, fieldsToSelect?: string | string[]): Promise<IRole | null>;

  /**
   * Update role by name
   */
  updateRoleByName(roleName: string, updates: UpdateRoleDto): Promise<IRole | null>;

  /**
   * Create system role if doesn't exist
   */
  createSystemRole(roleName: string, roleData: CreateRoleDto): Promise<IRole>;

  /**
   * Update access permissions for a role
   */
  updateAccessPermissions(
    roleName: string,
    permissionsUpdate: RolePermissions,
    roleData?: IRole
  ): Promise<void>;

  /**
   * Check if role has specific permission
   */
  hasPermission(
    roleName: string,
    permissionType: string,
    permission: string
  ): Promise<boolean>;

  /**
   * Get all roles
   */
  getAllRoles(): Promise<IRole[]>;

  /**
   * Delete role by name
   */
  deleteRoleByName(roleName: string): Promise<boolean>;

  /**
   * Migrate role schema from old to new structure
   */
  migrateRoleSchema(roleName?: string): Promise<number>;

  /**
   * Get roles by permission
   */
  getRolesByPermission(permissionType: string, permission: string): Promise<IRole[]>;

  /**
   * Bulk update permissions for multiple roles
   */
  bulkUpdatePermissions(
    updates: Array<{ roleName: string; permissions: RolePermissions }>
  ): Promise<number>;
}