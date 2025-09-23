import { IRepository } from './IDbGateway';
import { ITransaction } from './IDbGateway';

/**
 * Project document interface
 */
export interface IProject {
  _id?: string;
  name: string;
  promptGroupIds?: string[];
  agentIds?: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Project Create DTO
 */
export interface CreateProjectDto extends Omit<IProject, '_id' | 'createdAt' | 'updatedAt'> {}

/**
 * Project Update DTO
 */
export interface UpdateProjectDto extends Partial<CreateProjectDto> {}

/**
 * Project Repository Interface
 */
export interface IProjectRepository extends IRepository<IProject> {
  /**
   * Get project by ID
   */
  getProjectById(projectId: string, fieldsToSelect?: string | string[]): Promise<IProject | null>;

  /**
   * Get project by name
   */
  getProjectByName(projectName: string, fieldsToSelect?: string | string[]): Promise<IProject | null>;

  /**
   * Create or get project by name (upsert for global project)
   */
  upsertProjectByName(projectName: string, isGlobal?: boolean): Promise<IProject>;

  /**
   * Add prompt group IDs to a project
   */
  addGroupIdsToProject(projectId: string, promptGroupIds: string[]): Promise<IProject | null>;

  /**
   * Remove prompt group IDs from a project
   */
  removeGroupIdsFromProject(projectId: string, promptGroupIds: string[]): Promise<IProject | null>;

  /**
   * Remove a prompt group ID from all projects
   */
  removeGroupFromAllProjects(promptGroupId: string): Promise<number>;

  /**
   * Add agent IDs to a project
   */
  addAgentIdsToProject(projectId: string, agentIds: string[]): Promise<IProject | null>;

  /**
   * Remove agent IDs from a project
   */
  removeAgentIdsFromProject(projectId: string, agentIds: string[]): Promise<IProject | null>;

  /**
   * Remove an agent ID from all projects
   */
  removeAgentFromAllProjects(agentId: string): Promise<number>;

  /**
   * Get all projects
   */
  getAllProjects(): Promise<IProject[]>;

  /**
   * Get projects containing specific prompt group
   */
  getProjectsByPromptGroup(promptGroupId: string): Promise<IProject[]>;

  /**
   * Get projects containing specific agent
   */
  getProjectsByAgent(agentId: string): Promise<IProject[]>;

  /**
   * Delete project by ID
   */
  deleteProject(projectId: string): Promise<boolean>;
}