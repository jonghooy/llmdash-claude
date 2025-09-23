const {
  CacheKeys,
  SystemRoles,
  roleDefaults,
  permissionsSchema,
  removeNullishValues,
} = require('librechat-data-provider');
const { logger } = require('@librechat/data-schemas');
const getLogStores = require('~/cache/getLogStores');
const { Role } = require('~/db/models');

/**
 * Check if dbGateway is enabled
 */
function isDbGatewayEnabled() {
  return process.env.USE_DB_GATEWAY === 'true';
}

/**
 * Get the dbGateway lazily to avoid circular dependencies
 */
function getLazyGateway() {
  return require('../server/services/dbGateway');
}

/**
 * Retrieve a role by name and convert the found role document to a plain object.
 * If the role with the given name doesn't exist and the name is a system defined role,
 * create it and return the lean version.
 *
 * @param {string} roleName - The name of the role to find or create.
 * @param {string|string[]} [fieldsToSelect] - The fields to include or exclude in the returned document.
 * @returns {Promise<IRole>} Role document.
 */
async function getRoleByName(roleName, fieldsToSelect = null) {
  const cache = getLogStores(CacheKeys.ROLES);
  try {
    const cachedRole = await cache.get(roleName);
    if (cachedRole) {
      return cachedRole;
    }

    let role;
    if (isDbGatewayEnabled()) {
      const { getRepository } = getLazyGateway();
      const roleRepo = await getRepository('Role');
      role = await roleRepo.getRoleByName(roleName, fieldsToSelect);

      // Create system role if it doesn't exist
      if (!role && SystemRoles[roleName]) {
        role = await roleRepo.createSystemRole(roleName, roleDefaults[roleName]);
      }
    } else {
      // Fallback to Mongoose
      let query = Role.findOne({ name: roleName });
      if (fieldsToSelect) {
        query = query.select(fieldsToSelect);
      }
      role = await query.lean().exec();

      if (!role && SystemRoles[roleName]) {
        const newRole = await new Role(roleDefaults[roleName]).save();
        role = newRole.toObject();
      }
    }

    if (role) {
      await cache.set(roleName, role);
    }
    return role;
  } catch (error) {
    throw new Error(`Failed to retrieve or create role: ${error.message}`);
  }
}

/**
 * Update role values by name.
 *
 * @param {string} roleName - The name of the role to update.
 * @param {Partial<TRole>} updates - The fields to update.
 * @returns {Promise<TRole>} Updated role document.
 */
async function updateRoleByName(roleName, updates) {
  const cache = getLogStores(CacheKeys.ROLES);
  try {
    let role;
    if (isDbGatewayEnabled()) {
      const { getRepository } = getLazyGateway();
      const roleRepo = await getRepository('Role');
      role = await roleRepo.updateRoleByName(roleName, updates);
    } else {
      // Fallback to Mongoose
      role = await Role.findOneAndUpdate(
        { name: roleName },
        { $set: updates },
        { new: true, lean: true },
      )
        .select('-__v')
        .lean()
        .exec();
    }

    if (role) {
      await cache.set(roleName, role);
    }
    return role;
  } catch (error) {
    throw new Error(`Failed to update role: ${error.message}`);
  }
}

/**
 * Updates access permissions for a specific role and multiple permission types.
 * @param {string} roleName - The role to update.
 * @param {Object.<PermissionTypes, Object.<Permissions, boolean>>} permissionsUpdate - Permissions to update and their values.
 * @param {IRole} [roleData] - Optional role data to use instead of fetching from the database.
 */
async function updateAccessPermissions(roleName, permissionsUpdate, roleData) {
  // Filter and clean the permission updates based on our schema definition.
  const updates = {};
  for (const [permissionType, permissions] of Object.entries(permissionsUpdate)) {
    if (permissionsSchema.shape && permissionsSchema.shape[permissionType]) {
      updates[permissionType] = removeNullishValues(permissions);
    }
  }
  if (!Object.keys(updates).length) {
    return;
  }

  try {
    if (isDbGatewayEnabled()) {
      const { getRepository } = getLazyGateway();
      const roleRepo = await getRepository('Role');
      await roleRepo.updateAccessPermissions(roleName, updates, roleData);

      // Update cache
      const cache = getLogStores(CacheKeys.ROLES);
      const updatedRole = await roleRepo.getRoleByName(roleName);
      if (updatedRole) {
        await cache.set(roleName, updatedRole);
      }
    } else {
      // Fallback to Mongoose implementation (existing code)
      const role = roleData ?? (await getRoleByName(roleName));
      if (!role) {
        return;
      }

      const currentPermissions = role.permissions || {};
      const updatedPermissions = { ...currentPermissions };
      let hasChanges = false;

      const unsetFields = {};
      const permissionTypes = Object.keys(permissionsSchema.shape || {});
      for (const permType of permissionTypes) {
        if (role[permType] && typeof role[permType] === 'object') {
          logger.info(
            `Migrating '${roleName}' role from old schema: found '${permType}' at top level`,
          );

          updatedPermissions[permType] = {
            ...updatedPermissions[permType],
            ...role[permType],
          };

          unsetFields[permType] = 1;
          hasChanges = true;
        }
      }

      for (const [permissionType, permissions] of Object.entries(updates)) {
        const currentTypePermissions = currentPermissions[permissionType] || {};
        updatedPermissions[permissionType] = { ...currentTypePermissions };

        for (const [permission, value] of Object.entries(permissions)) {
          if (currentTypePermissions[permission] !== value) {
            updatedPermissions[permissionType][permission] = value;
            hasChanges = true;
            logger.info(
              `Updating '${roleName}' role permission '${permissionType}' '${permission}' from ${currentTypePermissions[permission]} to: ${value}`,
            );
          }
        }
      }

      if (hasChanges) {
        const updateObj = { permissions: updatedPermissions };

        if (Object.keys(unsetFields).length > 0) {
          logger.info(
            `Unsetting old schema fields for '${roleName}' role: ${Object.keys(unsetFields).join(', ')}`,
          );

          await Role.updateOne(
            { name: roleName },
            {
              $set: updateObj,
              $unset: unsetFields,
            },
          );

          const cache = getLogStores(CacheKeys.ROLES);
          const updatedRole = await Role.findOne({ name: roleName }).select('-__v').lean().exec();
          await cache.set(roleName, updatedRole);

          logger.info(`Updated role '${roleName}' and removed old schema fields`);
        } else {
          await updateRoleByName(roleName, updateObj);
        }

        logger.info(`Updated '${roleName}' role permissions`);
      } else {
        logger.info(`No changes needed for '${roleName}' role permissions`);
      }
    }
  } catch (error) {
    logger.error(`Failed to update ${roleName} role permissions:`, error);
  }
}

/**
 * Migrates roles from old schema to new schema structure.
 * This can be called directly to fix existing roles.
 *
 * @param {string} [roleName] - Optional specific role to migrate. If not provided, migrates all roles.
 * @returns {Promise<number>} Number of roles migrated.
 */
async function migrateRoleSchema(roleName) {
  try {
    let migratedCount;

    if (isDbGatewayEnabled()) {
      const { getRepository } = getLazyGateway();
      const roleRepo = await getRepository('Role');
      migratedCount = await roleRepo.migrateRoleSchema(roleName);
    } else {
      // Fallback to Mongoose implementation
      let roles;
      if (roleName) {
        const role = await Role.findOne({ name: roleName });
        roles = role ? [role] : [];
      } else {
        roles = await Role.find({});
      }

      logger.info(`Migrating ${roles.length} roles to new schema structure`);
      migratedCount = 0;

      for (const role of roles) {
        const permissionTypes = Object.keys(permissionsSchema.shape || {});
        const unsetFields = {};
        let hasOldSchema = false;

        for (const permType of permissionTypes) {
          if (role[permType] && typeof role[permType] === 'object') {
            hasOldSchema = true;
            role.permissions = role.permissions || {};
            role.permissions[permType] = {
              ...role.permissions[permType],
              ...role[permType],
            };
            unsetFields[permType] = 1;
          }
        }

        if (hasOldSchema) {
          try {
            logger.info(`Migrating role '${role.name}' from old schema structure`);

            await Role.updateOne(
              { _id: role._id },
              {
                $set: { permissions: role.permissions },
                $unset: unsetFields,
              },
            );

            const cache = getLogStores(CacheKeys.ROLES);
            const updatedRole = await Role.findById(role._id).lean().exec();
            await cache.set(role.name, updatedRole);

            migratedCount++;
            logger.info(`Migrated role '${role.name}'`);
          } catch (error) {
            logger.error(`Failed to migrate role '${role.name}': ${error.message}`);
          }
        }
      }
    }

    logger.info(`Migration complete: ${migratedCount} roles migrated`);
    return migratedCount;
  } catch (error) {
    logger.error(`Role schema migration failed: ${error.message}`);
    throw error;
  }
}

/**
 * Get all roles
 * @returns {Promise<Array<IRole>>} Array of role documents
 */
async function getAllRoles() {
  if (isDbGatewayEnabled()) {
    const { getRepository } = getLazyGateway();
    const roleRepo = await getRepository('Role');
    return await roleRepo.getAllRoles();
  }
  // Fallback to Mongoose
  return await Role.find({}).lean();
}

/**
 * Delete role by name
 * @param {string} roleName - The name of the role to delete
 * @returns {Promise<boolean>} True if deleted successfully
 */
async function deleteRoleByName(roleName) {
  const cache = getLogStores(CacheKeys.ROLES);

  if (isDbGatewayEnabled()) {
    const { getRepository } = getLazyGateway();
    const roleRepo = await getRepository('Role');
    const result = await roleRepo.deleteRoleByName(roleName);
    if (result) {
      await cache.delete(roleName);
    }
    return result;
  }
  // Fallback to Mongoose
  const result = await Role.deleteOne({ name: roleName });
  if (result.deletedCount > 0) {
    await cache.delete(roleName);
    return true;
  }
  return false;
}

/**
 * Create a new role
 * @param {Object} roleData - Role data
 * @returns {Promise<IRole>} The created role
 */
async function createRole(roleData) {
  if (isDbGatewayEnabled()) {
    const { getRepository } = getLazyGateway();
    const roleRepo = await getRepository('Role');
    return await roleRepo.create(roleData);
  }
  // Fallback to Mongoose
  const role = new Role(roleData);
  return await role.save();
}

/**
 * Check if role has specific permission
 * @param {string} roleName - The role name
 * @param {string} permissionType - The permission type
 * @param {string} permission - The permission
 * @returns {Promise<boolean>} True if role has the permission
 */
async function hasPermission(roleName, permissionType, permission) {
  if (isDbGatewayEnabled()) {
    const { getRepository } = getLazyGateway();
    const roleRepo = await getRepository('Role');
    return await roleRepo.hasPermission(roleName, permissionType, permission);
  }
  // Fallback to Mongoose
  const role = await getRoleByName(roleName);
  if (!role || !role.permissions) {
    return false;
  }
  const typePermissions = role.permissions[permissionType];
  if (!typePermissions) {
    return false;
  }
  return typePermissions[permission] === true;
}

module.exports = {
  getRoleByName,
  updateRoleByName,
  migrateRoleSchema,
  updateAccessPermissions,
  getAllRoles,
  deleteRoleByName,
  createRole,
  hasPermission,
};