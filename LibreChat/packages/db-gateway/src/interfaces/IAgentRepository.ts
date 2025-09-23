import { IRepository, ITransaction } from './IDbGateway';

/**
 * Agent-specific repository interface
 */

export interface IAgent {
  _id: string;
  id?: string;
  author: string;
  name: string;
  description?: string;
  avatar?: any;
  model?: string;
  provider?: string;
  tools?: string[];
  actions?: string[];
  capabilities?: any;
  instructions?: string;
  category?: string;
  isPublic?: boolean;
  version?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateAgentDto {
  author: string;
  name: string;
  description?: string;
  avatar?: any;
  model?: string;
  provider?: string;
  tools?: string[];
  actions?: string[];
  capabilities?: any;
  instructions?: string;
  category?: string;
  isPublic?: boolean;
  version?: number;
}

export interface UpdateAgentDto {
  name?: string;
  description?: string;
  avatar?: any;
  model?: string;
  provider?: string;
  tools?: string[];
  actions?: string[];
  capabilities?: any;
  instructions?: string;
  category?: string;
  isPublic?: boolean;
  version?: number;
}

export interface AgentFilter {
  author?: string;
  category?: string;
  isPublic?: boolean;
  tools?: string[];
  provider?: string;
  searchQuery?: string;
}

export interface IAgentRepository extends IRepository<IAgent> {
  /**
   * Find agent by author and name
   */
  findByAuthorAndName(author: string, name: string): Promise<IAgent | null>;

  /**
   * Get agents by author
   */
  getAgentsByAuthor(
    author: string,
    includePrivate?: boolean
  ): Promise<IAgent[]>;

  /**
   * Get public agents
   */
  getPublicAgents(
    limit?: number,
    offset?: number
  ): Promise<IAgent[]>;

  /**
   * Search agents
   */
  searchAgents(
    filter: AgentFilter,
    limit?: number,
    offset?: number
  ): Promise<IAgent[]>;

  /**
   * Get agents by category
   */
  getAgentsByCategory(
    category: string,
    isPublic?: boolean
  ): Promise<IAgent[]>;

  /**
   * Get agents with specific tool
   */
  getAgentsWithTool(tool: string): Promise<IAgent[]>;

  /**
   * Get agents with specific action
   */
  getAgentsWithAction(action: string): Promise<IAgent[]>;

  /**
   * Increment agent version
   */
  incrementVersion(
    agentId: string,
    session?: ITransaction
  ): Promise<boolean>;

  /**
   * Toggle agent visibility
   */
  togglePublic(
    agentId: string,
    isPublic: boolean,
    session?: ITransaction
  ): Promise<boolean>;

  /**
   * Clone agent
   */
  cloneAgent(
    agentId: string,
    newAuthor: string,
    newName?: string,
    session?: ITransaction
  ): Promise<IAgent>;

  /**
   * Get popular agents
   */
  getPopularAgents(limit?: number): Promise<IAgent[]>;

  /**
   * Add tool to agent
   */
  addTool(
    agentId: string,
    tool: string,
    session?: ITransaction
  ): Promise<boolean>;

  /**
   * Remove tool from agent
   */
  removeTool(
    agentId: string,
    tool: string,
    session?: ITransaction
  ): Promise<boolean>;

  /**
   * Add action to agent
   */
  addAction(
    agentId: string,
    action: string,
    session?: ITransaction
  ): Promise<boolean>;

  /**
   * Remove action from agent
   */
  removeAction(
    agentId: string,
    action: string,
    session?: ITransaction
  ): Promise<boolean>;

  /**
   * Bulk update agents
   */
  bulkUpdateAgents(
    agentIds: string[],
    update: UpdateAgentDto,
    session?: ITransaction
  ): Promise<number>;
}