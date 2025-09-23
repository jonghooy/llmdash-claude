import { Model } from 'mongoose';
import { MongoBaseRepository } from '../MongoBaseRepository';
import {
  IProjectRepository,
  IProject,
  CreateProjectDto,
  UpdateProjectDto,
} from '../../../interfaces/IProjectRepository';
import { ITransaction } from '../../../interfaces/IDbGateway';

/**
 * MongoDB implementation of Project Repository
 */
export class MongoProjectRepository
  extends MongoBaseRepository<IProject>
  implements IProjectRepository
{
  constructor(model: Model<any>) {
    super(model);
  }

  /**
   * Get project by ID
   */
  async getProjectById(projectId: string, fieldsToSelect?: string | string[]): Promise<IProject | null> {
    let query = this.model.findById(projectId);

    if (fieldsToSelect) {
      query = query.select(fieldsToSelect);
    }

    return await query.lean().exec() as IProject | null;
  }

  /**
   * Get project by name
   */
  async getProjectByName(projectName: string, fieldsToSelect?: string | string[]): Promise<IProject | null> {
    let query = this.model.findOne({ name: projectName });

    if (fieldsToSelect) {
      query = query.select(fieldsToSelect);
    }

    return await query.lean().exec() as IProject | null;
  }

  /**
   * Create or get project by name (upsert for global project)
   */
  async upsertProjectByName(projectName: string, isGlobal: boolean = false): Promise<IProject> {
    const query = { name: projectName };
    const update = { $setOnInsert: { name: projectName } };
    const options = {
      new: true,
      upsert: isGlobal,
      lean: true,
    };

    const result = await this.model.findOneAndUpdate(query, update, options).exec();

    if (!result) {
      throw new Error(`Project ${projectName} not found and not created`);
    }

    return result as unknown as IProject;
  }

  /**
   * Add prompt group IDs to a project
   */
  async addGroupIdsToProject(projectId: string, promptGroupIds: string[]): Promise<IProject | null> {
    const result = await this.model.findByIdAndUpdate(
      projectId,
      { $addToSet: { promptGroupIds: { $each: promptGroupIds } } },
      { new: true, lean: true }
    ).exec();

    return result as IProject | null;
  }

  /**
   * Remove prompt group IDs from a project
   */
  async removeGroupIdsFromProject(projectId: string, promptGroupIds: string[]): Promise<IProject | null> {
    const result = await this.model.findByIdAndUpdate(
      projectId,
      { $pull: { promptGroupIds: { $in: promptGroupIds } } },
      { new: true, lean: true }
    ).exec();

    return result as IProject | null;
  }

  /**
   * Remove a prompt group ID from all projects
   */
  async removeGroupFromAllProjects(promptGroupId: string): Promise<number> {
    const result = await this.model.updateMany(
      {},
      { $pull: { promptGroupIds: promptGroupId } }
    ).exec();

    return result.modifiedCount || 0;
  }

  /**
   * Add agent IDs to a project
   */
  async addAgentIdsToProject(projectId: string, agentIds: string[]): Promise<IProject | null> {
    const result = await this.model.findByIdAndUpdate(
      projectId,
      { $addToSet: { agentIds: { $each: agentIds } } },
      { new: true, lean: true }
    ).exec();

    return result as IProject | null;
  }

  /**
   * Remove agent IDs from a project
   */
  async removeAgentIdsFromProject(projectId: string, agentIds: string[]): Promise<IProject | null> {
    const result = await this.model.findByIdAndUpdate(
      projectId,
      { $pull: { agentIds: { $in: agentIds } } },
      { new: true, lean: true }
    ).exec();

    return result as IProject | null;
  }

  /**
   * Remove an agent ID from all projects
   */
  async removeAgentFromAllProjects(agentId: string): Promise<number> {
    const result = await this.model.updateMany(
      {},
      { $pull: { agentIds: agentId } }
    ).exec();

    return result.modifiedCount || 0;
  }

  /**
   * Get all projects
   */
  async getAllProjects(): Promise<IProject[]> {
    return await this.find({}, { lean: true });
  }

  /**
   * Get projects containing specific prompt group
   */
  async getProjectsByPromptGroup(promptGroupId: string): Promise<IProject[]> {
    return await this.find(
      { promptGroupIds: promptGroupId },
      { lean: true }
    );
  }

  /**
   * Get projects containing specific agent
   */
  async getProjectsByAgent(agentId: string): Promise<IProject[]> {
    return await this.find(
      { agentIds: agentId },
      { lean: true }
    );
  }

  /**
   * Delete project by ID
   */
  async deleteProject(projectId: string): Promise<boolean> {
    const result = await this.model.deleteOne({ _id: projectId }).exec();
    return result.deletedCount > 0;
  }

  /**
   * Override create to ensure unique project name
   */
  async create(data: CreateProjectDto, transaction?: ITransaction): Promise<IProject> {
    const session = this.getSession(transaction);

    // Check if project with same name already exists
    const existing = await this.getProjectByName(data.name);
    if (existing) {
      throw new Error(`Project with name ${data.name} already exists`);
    }

    const doc = new this.model({
      ...data,
      promptGroupIds: data.promptGroupIds || [],
      agentIds: data.agentIds || [],
      createdAt: new Date(),
    });

    await doc.save({ session });
    return doc.toObject() as IProject;
  }
}