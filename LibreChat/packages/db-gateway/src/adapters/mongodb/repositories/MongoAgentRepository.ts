import { Model } from 'mongoose';
import { MongoBaseRepository } from '../MongoBaseRepository';
import {
  IAgentRepository,
  IAgent,
  CreateAgentDto,
  UpdateAgentDto,
  AgentFilter,
} from '../../../interfaces/IAgentRepository';
import { ITransaction } from '../../../interfaces/IDbGateway';

/**
 * MongoDB implementation of Agent Repository
 */
export class MongoAgentRepository
  extends MongoBaseRepository<IAgent>
  implements IAgentRepository
{
  constructor(model: Model<any>) {
    super(model);
  }

  /**
   * Find agent by author and name
   */
  async findByAuthorAndName(author: string, name: string): Promise<IAgent | null> {
    return await this.findOne({ author, name });
  }

  /**
   * Get agents by author
   */
  async getAgentsByAuthor(
    author: string,
    includePrivate: boolean = false
  ): Promise<IAgent[]> {
    const query: any = { author };

    if (!includePrivate) {
      query.isPublic = true;
    }

    return await this.find(query, {
      sort: { updatedAt: -1 },
      lean: true,
    });
  }

  /**
   * Get public agents
   */
  async getPublicAgents(
    limit: number = 100,
    offset: number = 0
  ): Promise<IAgent[]> {
    return await this.find(
      { isPublic: true },
      {
        sort: { updatedAt: -1 },
        skip: offset,
        limit,
        lean: true,
      }
    );
  }

  /**
   * Search agents
   */
  async searchAgents(
    filter: AgentFilter,
    limit: number = 50,
    offset: number = 0
  ): Promise<IAgent[]> {
    const query: any = {};

    if (filter.author) {
      query.author = filter.author;
    }

    if (filter.category) {
      query.category = filter.category;
    }

    if (filter.isPublic !== undefined) {
      query.isPublic = filter.isPublic;
    }

    if (filter.tools && filter.tools.length > 0) {
      query.tools = { $in: filter.tools };
    }

    if (filter.provider) {
      query.provider = filter.provider;
    }

    if (filter.searchQuery) {
      const searchRegex = new RegExp(filter.searchQuery, 'i');
      query.$or = [
        { name: searchRegex },
        { description: searchRegex },
        { instructions: searchRegex },
      ];
    }

    return await this.find(query, {
      sort: { updatedAt: -1 },
      skip: offset,
      limit,
      lean: true,
    });
  }

  /**
   * Get agents by category
   */
  async getAgentsByCategory(
    category: string,
    isPublic: boolean = true
  ): Promise<IAgent[]> {
    const query: any = { category };

    if (isPublic !== undefined) {
      query.isPublic = isPublic;
    }

    return await this.find(query, {
      sort: { updatedAt: -1 },
      lean: true,
    });
  }

  /**
   * Get agents with specific tool
   */
  async getAgentsWithTool(tool: string): Promise<IAgent[]> {
    return await this.find(
      { tools: tool },
      {
        sort: { updatedAt: -1 },
        lean: true,
      }
    );
  }

  /**
   * Get agents with specific action
   */
  async getAgentsWithAction(action: string): Promise<IAgent[]> {
    return await this.find(
      { actions: action },
      {
        sort: { updatedAt: -1 },
        lean: true,
      }
    );
  }

  /**
   * Increment agent version
   */
  async incrementVersion(
    agentId: string,
    session?: ITransaction
  ): Promise<boolean> {
    const result = await this.model.updateOne(
      { _id: agentId },
      {
        $inc: { version: 1 },
        updatedAt: new Date(),
      },
      { session: this.getSession(session) }
    );
    return result.modifiedCount > 0;
  }

  /**
   * Toggle agent visibility
   */
  async togglePublic(
    agentId: string,
    isPublic: boolean,
    session?: ITransaction
  ): Promise<boolean> {
    const result = await this.model.updateOne(
      { _id: agentId },
      {
        isPublic,
        updatedAt: new Date(),
      },
      { session: this.getSession(session) }
    );
    return result.modifiedCount > 0;
  }

  /**
   * Clone agent
   */
  async cloneAgent(
    agentId: string,
    newAuthor: string,
    newName?: string,
    session?: ITransaction
  ): Promise<IAgent> {
    const original = await this.findById(agentId);
    if (!original) {
      throw new Error('Agent not found');
    }

    const cloned = {
      ...original,
      _id: undefined,
      author: newAuthor,
      name: newName || `${original.name} (Copy)`,
      isPublic: false, // Clones start as private
      version: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    delete (cloned as any)._id;
    return await this.create(cloned, session);
  }

  /**
   * Get popular agents (based on some metric, placeholder implementation)
   */
  async getPopularAgents(limit: number = 10): Promise<IAgent[]> {
    // TODO: Implement popularity metrics (usage count, ratings, etc.)
    // For now, just return the most recently updated public agents
    return await this.find(
      { isPublic: true },
      {
        sort: { updatedAt: -1 },
        limit,
        lean: true,
      }
    );
  }

  /**
   * Add tool to agent
   */
  async addTool(
    agentId: string,
    tool: string,
    session?: ITransaction
  ): Promise<boolean> {
    const result = await this.model.updateOne(
      { _id: agentId },
      {
        $addToSet: { tools: tool },
        updatedAt: new Date(),
      },
      { session: this.getSession(session) }
    );
    return result.modifiedCount > 0;
  }

  /**
   * Remove tool from agent
   */
  async removeTool(
    agentId: string,
    tool: string,
    session?: ITransaction
  ): Promise<boolean> {
    const result = await this.model.updateOne(
      { _id: agentId },
      {
        $pull: { tools: tool },
        updatedAt: new Date(),
      },
      { session: this.getSession(session) }
    );
    return result.modifiedCount > 0;
  }

  /**
   * Add action to agent
   */
  async addAction(
    agentId: string,
    action: string,
    session?: ITransaction
  ): Promise<boolean> {
    const result = await this.model.updateOne(
      { _id: agentId },
      {
        $addToSet: { actions: action },
        updatedAt: new Date(),
      },
      { session: this.getSession(session) }
    );
    return result.modifiedCount > 0;
  }

  /**
   * Remove action from agent
   */
  async removeAction(
    agentId: string,
    action: string,
    session?: ITransaction
  ): Promise<boolean> {
    const result = await this.model.updateOne(
      { _id: agentId },
      {
        $pull: { actions: action },
        updatedAt: new Date(),
      },
      { session: this.getSession(session) }
    );
    return result.modifiedCount > 0;
  }

  /**
   * Bulk update agents
   */
  async bulkUpdateAgents(
    agentIds: string[],
    update: UpdateAgentDto,
    session?: ITransaction
  ): Promise<number> {
    const updateData = {
      ...update,
      updatedAt: new Date(),
    };

    const result = await this.model.updateMany(
      { _id: { $in: agentIds } },
      updateData,
      { session: this.getSession(session) }
    );

    return result.modifiedCount || 0;
  }
}