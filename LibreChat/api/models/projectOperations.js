const { GLOBAL_PROJECT_NAME } = require('librechat-data-provider').Constants;
const { Project } = require('~/db/models');

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
 * Retrieve a project by ID and convert the found project document to a plain object.
 *
 * @param {string} projectId - The ID of the project to find and return as a plain object.
 * @param {string|string[]} [fieldsToSelect] - The fields to include or exclude in the returned document.
 * @returns {Promise<IMongoProject>} A plain object representing the project document, or `null` if no project is found.
 */
async function getProjectById(projectId, fieldsToSelect = null) {
  if (isDbGatewayEnabled()) {
    const { getRepository } = getLazyGateway();
    const projectRepo = await getRepository('Project');
    return await projectRepo.getProjectById(projectId, fieldsToSelect);
  }
  // Fallback to Mongoose
  const query = Project.findById(projectId);

  if (fieldsToSelect) {
    query.select(fieldsToSelect);
  }

  return await query.lean();
}

/**
 * Retrieve a project by name and convert the found project document to a plain object.
 * If the project with the given name doesn't exist and the name is "instance", create it and return the lean version.
 *
 * @param {string} projectName - The name of the project to find or create.
 * @param {string|string[]} [fieldsToSelect] - The fields to include or exclude in the returned document.
 * @returns {Promise<IMongoProject>} A plain object representing the project document.
 */
async function getProjectByName(projectName, fieldsToSelect = null) {
  if (isDbGatewayEnabled()) {
    const { getRepository } = getLazyGateway();
    const projectRepo = await getRepository('Project');

    // First try to get the project
    let project = await projectRepo.getProjectByName(projectName, fieldsToSelect);

    // If not found and it's the global project, upsert it
    if (!project && projectName === GLOBAL_PROJECT_NAME) {
      project = await projectRepo.upsertProjectByName(projectName, true);
    }

    return project;
  }
  // Fallback to Mongoose
  const query = { name: projectName };
  const update = { $setOnInsert: { name: projectName } };
  const options = {
    new: true,
    upsert: projectName === GLOBAL_PROJECT_NAME,
    lean: true,
    select: fieldsToSelect,
  };

  return await Project.findOneAndUpdate(query, update, options);
}

/**
 * Add an array of prompt group IDs to a project's promptGroupIds array, ensuring uniqueness.
 *
 * @param {string} projectId - The ID of the project to update.
 * @param {string[]} promptGroupIds - The array of prompt group IDs to add to the project.
 * @returns {Promise<IMongoProject>} The updated project document.
 */
async function addGroupIdsToProject(projectId, promptGroupIds) {
  if (isDbGatewayEnabled()) {
    const { getRepository } = getLazyGateway();
    const projectRepo = await getRepository('Project');
    return await projectRepo.addGroupIdsToProject(projectId, promptGroupIds);
  }
  // Fallback to Mongoose
  return await Project.findByIdAndUpdate(
    projectId,
    { $addToSet: { promptGroupIds: { $each: promptGroupIds } } },
    { new: true },
  );
}

/**
 * Remove an array of prompt group IDs from a project's promptGroupIds array.
 *
 * @param {string} projectId - The ID of the project to update.
 * @param {string[]} promptGroupIds - The array of prompt group IDs to remove from the project.
 * @returns {Promise<IMongoProject>} The updated project document.
 */
async function removeGroupIdsFromProject(projectId, promptGroupIds) {
  if (isDbGatewayEnabled()) {
    const { getRepository } = getLazyGateway();
    const projectRepo = await getRepository('Project');
    return await projectRepo.removeGroupIdsFromProject(projectId, promptGroupIds);
  }
  // Fallback to Mongoose
  return await Project.findByIdAndUpdate(
    projectId,
    { $pull: { promptGroupIds: { $in: promptGroupIds } } },
    { new: true },
  );
}

/**
 * Remove a prompt group ID from all projects.
 *
 * @param {string} promptGroupId - The ID of the prompt group to remove from projects.
 * @returns {Promise<void>}
 */
async function removeGroupFromAllProjects(promptGroupId) {
  if (isDbGatewayEnabled()) {
    const { getRepository } = getLazyGateway();
    const projectRepo = await getRepository('Project');
    await projectRepo.removeGroupFromAllProjects(promptGroupId);
    return;
  }
  // Fallback to Mongoose
  await Project.updateMany({}, { $pull: { promptGroupIds: promptGroupId } });
}

/**
 * Add an array of agent IDs to a project's agentIds array, ensuring uniqueness.
 *
 * @param {string} projectId - The ID of the project to update.
 * @param {string[]} agentIds - The array of agent IDs to add to the project.
 * @returns {Promise<IMongoProject>} The updated project document.
 */
async function addAgentIdsToProject(projectId, agentIds) {
  if (isDbGatewayEnabled()) {
    const { getRepository } = getLazyGateway();
    const projectRepo = await getRepository('Project');
    return await projectRepo.addAgentIdsToProject(projectId, agentIds);
  }
  // Fallback to Mongoose
  return await Project.findByIdAndUpdate(
    projectId,
    { $addToSet: { agentIds: { $each: agentIds } } },
    { new: true },
  );
}

/**
 * Remove an array of agent IDs from a project's agentIds array.
 *
 * @param {string} projectId - The ID of the project to update.
 * @param {string[]} agentIds - The array of agent IDs to remove from the project.
 * @returns {Promise<IMongoProject>} The updated project document.
 */
async function removeAgentIdsFromProject(projectId, agentIds) {
  if (isDbGatewayEnabled()) {
    const { getRepository } = getLazyGateway();
    const projectRepo = await getRepository('Project');
    return await projectRepo.removeAgentIdsFromProject(projectId, agentIds);
  }
  // Fallback to Mongoose
  return await Project.findByIdAndUpdate(
    projectId,
    { $pull: { agentIds: { $in: agentIds } } },
    { new: true },
  );
}

/**
 * Remove an agent ID from all projects.
 *
 * @param {string} agentId - The ID of the agent to remove from projects.
 * @returns {Promise<void>}
 */
async function removeAgentFromAllProjects(agentId) {
  if (isDbGatewayEnabled()) {
    const { getRepository } = getLazyGateway();
    const projectRepo = await getRepository('Project');
    await projectRepo.removeAgentFromAllProjects(agentId);
    return;
  }
  // Fallback to Mongoose
  await Project.updateMany({}, { $pull: { agentIds: agentId } });
}

/**
 * Get all projects
 * @returns {Promise<Array<IMongoProject>>} Array of project documents
 */
async function getAllProjects() {
  if (isDbGatewayEnabled()) {
    const { getRepository } = getLazyGateway();
    const projectRepo = await getRepository('Project');
    return await projectRepo.getAllProjects();
  }
  // Fallback to Mongoose
  return await Project.find({}).lean();
}

/**
 * Get projects containing specific prompt group
 * @param {string} promptGroupId - The prompt group ID
 * @returns {Promise<Array<IMongoProject>>} Array of project documents
 */
async function getProjectsByPromptGroup(promptGroupId) {
  if (isDbGatewayEnabled()) {
    const { getRepository } = getLazyGateway();
    const projectRepo = await getRepository('Project');
    return await projectRepo.getProjectsByPromptGroup(promptGroupId);
  }
  // Fallback to Mongoose
  return await Project.find({ promptGroupIds: promptGroupId }).lean();
}

/**
 * Get projects containing specific agent
 * @param {string} agentId - The agent ID
 * @returns {Promise<Array<IMongoProject>>} Array of project documents
 */
async function getProjectsByAgent(agentId) {
  if (isDbGatewayEnabled()) {
    const { getRepository } = getLazyGateway();
    const projectRepo = await getRepository('Project');
    return await projectRepo.getProjectsByAgent(agentId);
  }
  // Fallback to Mongoose
  return await Project.find({ agentIds: agentId }).lean();
}

/**
 * Delete project by ID
 * @param {string} projectId - The project ID
 * @returns {Promise<boolean>} True if deleted successfully
 */
async function deleteProject(projectId) {
  if (isDbGatewayEnabled()) {
    const { getRepository } = getLazyGateway();
    const projectRepo = await getRepository('Project');
    return await projectRepo.deleteProject(projectId);
  }
  // Fallback to Mongoose
  const result = await Project.deleteOne({ _id: projectId });
  return result.deletedCount > 0;
}

/**
 * Create a new project
 * @param {Object} projectData - Project data
 * @returns {Promise<IMongoProject>} The created project
 */
async function createProject(projectData) {
  if (isDbGatewayEnabled()) {
    const { getRepository } = getLazyGateway();
    const projectRepo = await getRepository('Project');
    return await projectRepo.create(projectData);
  }
  // Fallback to Mongoose
  const project = new Project(projectData);
  return await project.save();
}

module.exports = {
  getProjectById,
  getProjectByName,
  /* prompts */
  addGroupIdsToProject,
  removeGroupIdsFromProject,
  removeGroupFromAllProjects,
  /* agents */
  addAgentIdsToProject,
  removeAgentIdsFromProject,
  removeAgentFromAllProjects,
  /* additional */
  getAllProjects,
  getProjectsByPromptGroup,
  getProjectsByAgent,
  deleteProject,
  createProject,
};