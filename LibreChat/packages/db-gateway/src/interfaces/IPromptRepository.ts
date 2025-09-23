import { IRepository, ITransaction } from './IDbGateway';

/**
 * Prompt-specific repository interface
 */

export interface IPrompt {
  _id: string;
  title: string;
  prompt: string;
  category?: string;
  author?: string;
  description?: string;
  variables?: string[];
  isPublic?: boolean;
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CreatePromptDto {
  title: string;
  prompt: string;
  category?: string;
  author?: string;
  description?: string;
  variables?: string[];
  isPublic?: boolean;
  tags?: string[];
}

export interface UpdatePromptDto {
  title?: string;
  prompt?: string;
  category?: string;
  description?: string;
  variables?: string[];
  isPublic?: boolean;
  tags?: string[];
}

export interface PromptFilter {
  author?: string;
  category?: string;
  isPublic?: boolean;
  tags?: string[];
  searchQuery?: string;
}

export interface IPromptRepository extends IRepository<IPrompt> {
  /**
   * Find prompt by title and author
   */
  findByTitleAndAuthor(title: string, author: string): Promise<IPrompt | null>;

  /**
   * Get prompts by author
   */
  getPromptsByAuthor(
    author: string,
    includePrivate?: boolean
  ): Promise<IPrompt[]>;

  /**
   * Get public prompts
   */
  getPublicPrompts(
    limit?: number,
    offset?: number
  ): Promise<IPrompt[]>;

  /**
   * Search prompts
   */
  searchPrompts(
    filter: PromptFilter,
    limit?: number,
    offset?: number
  ): Promise<IPrompt[]>;

  /**
   * Get prompts by category
   */
  getPromptsByCategory(
    category: string,
    isPublic?: boolean
  ): Promise<IPrompt[]>;

  /**
   * Get prompts by tag
   */
  getPromptsByTag(
    tag: string,
    isPublic?: boolean
  ): Promise<IPrompt[]>;

  /**
   * Add tags to prompt
   */
  addTags(
    promptId: string,
    tags: string[],
    session?: ITransaction
  ): Promise<boolean>;

  /**
   * Remove tags from prompt
   */
  removeTags(
    promptId: string,
    tags: string[],
    session?: ITransaction
  ): Promise<boolean>;

  /**
   * Toggle prompt visibility
   */
  togglePublic(
    promptId: string,
    isPublic: boolean,
    session?: ITransaction
  ): Promise<boolean>;

  /**
   * Clone prompt
   */
  clonePrompt(
    promptId: string,
    newAuthor: string,
    newTitle?: string,
    session?: ITransaction
  ): Promise<IPrompt>;

  /**
   * Get popular prompts
   */
  getPopularPrompts(limit?: number): Promise<IPrompt[]>;

  /**
   * Get prompts with specific variable
   */
  getPromptsWithVariable(variable: string): Promise<IPrompt[]>;

  /**
   * Update prompt usage count (for popularity tracking)
   */
  incrementUsageCount(
    promptId: string,
    session?: ITransaction
  ): Promise<boolean>;

  /**
   * Bulk create prompts
   */
  bulkCreatePrompts(
    prompts: CreatePromptDto[],
    session?: ITransaction
  ): Promise<IPrompt[]>;

  /**
   * Get recent prompts
   */
  getRecentPrompts(
    days?: number,
    isPublic?: boolean
  ): Promise<IPrompt[]>;
}