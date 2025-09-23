import { Model } from 'mongoose';
import { MongoBaseRepository } from '../MongoBaseRepository';
import {
  IPromptRepository,
  IPrompt,
  CreatePromptDto,
  UpdatePromptDto,
  PromptFilter,
} from '../../../interfaces/IPromptRepository';
import { ITransaction } from '../../../interfaces/IDbGateway';

/**
 * MongoDB implementation of Prompt Repository
 */
export class MongoPromptRepository
  extends MongoBaseRepository<IPrompt>
  implements IPromptRepository
{
  constructor(model: Model<any>) {
    super(model);
  }

  /**
   * Find prompt by title and author
   */
  async findByTitleAndAuthor(title: string, author: string): Promise<IPrompt | null> {
    return await this.findOne({ title, author });
  }

  /**
   * Get prompts by author
   */
  async getPromptsByAuthor(
    author: string,
    includePrivate: boolean = false
  ): Promise<IPrompt[]> {
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
   * Get public prompts
   */
  async getPublicPrompts(
    limit: number = 100,
    offset: number = 0
  ): Promise<IPrompt[]> {
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
   * Search prompts
   */
  async searchPrompts(
    filter: PromptFilter,
    limit: number = 50,
    offset: number = 0
  ): Promise<IPrompt[]> {
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

    if (filter.tags && filter.tags.length > 0) {
      query.tags = { $in: filter.tags };
    }

    if (filter.searchQuery) {
      const searchRegex = new RegExp(filter.searchQuery, 'i');
      query.$or = [
        { title: searchRegex },
        { description: searchRegex },
        { prompt: searchRegex },
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
   * Get prompts by category
   */
  async getPromptsByCategory(
    category: string,
    isPublic: boolean = true
  ): Promise<IPrompt[]> {
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
   * Get prompts by tag
   */
  async getPromptsByTag(
    tag: string,
    isPublic: boolean = true
  ): Promise<IPrompt[]> {
    const query: any = { tags: tag };

    if (isPublic !== undefined) {
      query.isPublic = isPublic;
    }

    return await this.find(query, {
      sort: { updatedAt: -1 },
      lean: true,
    });
  }

  /**
   * Add tags to prompt
   */
  async addTags(
    promptId: string,
    tags: string[],
    session?: ITransaction
  ): Promise<boolean> {
    const result = await this.model.updateOne(
      { _id: promptId },
      {
        $addToSet: { tags: { $each: tags } },
        updatedAt: new Date(),
      },
      { session: this.getSession(session) }
    );
    return result.modifiedCount > 0;
  }

  /**
   * Remove tags from prompt
   */
  async removeTags(
    promptId: string,
    tags: string[],
    session?: ITransaction
  ): Promise<boolean> {
    const result = await this.model.updateOne(
      { _id: promptId },
      {
        $pull: { tags: { $in: tags } },
        updatedAt: new Date(),
      },
      { session: this.getSession(session) }
    );
    return result.modifiedCount > 0;
  }

  /**
   * Toggle prompt visibility
   */
  async togglePublic(
    promptId: string,
    isPublic: boolean,
    session?: ITransaction
  ): Promise<boolean> {
    const result = await this.model.updateOne(
      { _id: promptId },
      {
        isPublic,
        updatedAt: new Date(),
      },
      { session: this.getSession(session) }
    );
    return result.modifiedCount > 0;
  }

  /**
   * Clone prompt
   */
  async clonePrompt(
    promptId: string,
    newAuthor: string,
    newTitle?: string,
    session?: ITransaction
  ): Promise<IPrompt> {
    const original = await this.findById(promptId);
    if (!original) {
      throw new Error('Prompt not found');
    }

    const cloned = {
      ...original,
      _id: undefined,
      author: newAuthor,
      title: newTitle || `${original.title} (Copy)`,
      isPublic: false, // Clones start as private
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    delete (cloned as any)._id;
    return await this.create(cloned, session);
  }

  /**
   * Get popular prompts (placeholder implementation)
   */
  async getPopularPrompts(limit: number = 10): Promise<IPrompt[]> {
    // TODO: Implement with actual usage metrics
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
   * Get prompts with specific variable
   */
  async getPromptsWithVariable(variable: string): Promise<IPrompt[]> {
    return await this.find(
      { variables: variable },
      {
        sort: { updatedAt: -1 },
        lean: true,
      }
    );
  }

  /**
   * Update prompt usage count
   */
  async incrementUsageCount(
    promptId: string,
    session?: ITransaction
  ): Promise<boolean> {
    const result = await this.model.updateOne(
      { _id: promptId },
      {
        $inc: { usageCount: 1 },
        updatedAt: new Date(),
      },
      { session: this.getSession(session) }
    );
    return result.modifiedCount > 0;
  }

  /**
   * Bulk create prompts
   */
  async bulkCreatePrompts(
    prompts: CreatePromptDto[],
    session?: ITransaction
  ): Promise<IPrompt[]> {
    return await this.createMany(prompts as Partial<IPrompt>[], session);
  }

  /**
   * Get recent prompts
   */
  async getRecentPrompts(
    days: number = 7,
    isPublic: boolean = true
  ): Promise<IPrompt[]> {
    const dateThreshold = new Date();
    dateThreshold.setDate(dateThreshold.getDate() - days);

    const query: any = {
      createdAt: { $gte: dateThreshold },
    };

    if (isPublic !== undefined) {
      query.isPublic = isPublic;
    }

    return await this.find(query, {
      sort: { createdAt: -1 },
      lean: true,
    });
  }
}