/**
 * Database Gateway Interface
 * Main entry point for all database operations
 */

export interface DbConfig {
  uri?: string;
  host?: string;
  port?: number;
  database?: string;
  username?: string;
  password?: string;
  options?: Record<string, any>;
}

export interface ITransaction {
  id: string;
  commit(): Promise<void>;
  rollback(): Promise<void>;
  isActive(): boolean;
}

export interface QueryOptions {
  limit?: number;
  skip?: number;
  sort?: Record<string, 1 | -1>;
  select?: string | string[];
  populate?: string | PopulateOptions | (string | PopulateOptions)[];
  lean?: boolean;
}

export interface PopulateOptions {
  path: string;
  select?: string;
  model?: string;
  populate?: PopulateOptions | PopulateOptions[];
}

export interface PaginationOptions {
  page: number;
  limit: number;
  sort?: Record<string, 1 | -1>;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export type QueryFilter = Record<string, any>;

export interface IDbGateway {
  /**
   * Connect to the database
   */
  connect(config: DbConfig): Promise<void>;

  /**
   * Disconnect from the database
   */
  disconnect(): Promise<void>;

  /**
   * Get a repository for a specific entity
   */
  getRepository<T>(entityName: string): IRepository<T>;

  /**
   * Execute operations within a transaction
   */
  transaction<T>(
    callback: (session: ITransaction) => Promise<T>
  ): Promise<T>;

  /**
   * Check database health
   */
  healthCheck(): Promise<boolean>;

  /**
   * Get connection status
   */
  isConnected(): boolean;

  /**
   * Get database type
   */
  getType(): string;
}

export interface IRepository<T> {
  /**
   * Find a document by ID
   */
  findById(id: string, options?: QueryOptions): Promise<T | null>;

  /**
   * Find one document matching the query
   */
  findOne(query: QueryFilter, options?: QueryOptions): Promise<T | null>;

  /**
   * Find all documents matching the query
   */
  find(query: QueryFilter, options?: QueryOptions): Promise<T[]>;

  /**
   * Find documents with pagination
   */
  findWithPagination(
    query: QueryFilter,
    options: PaginationOptions
  ): Promise<PaginatedResult<T>>;

  /**
   * Create a new document
   */
  create(data: Partial<T>, session?: ITransaction): Promise<T>;

  /**
   * Create multiple documents
   */
  createMany(data: Partial<T>[], session?: ITransaction): Promise<T[]>;

  /**
   * Update a document by ID
   */
  update(
    id: string,
    data: Partial<T>,
    session?: ITransaction
  ): Promise<T | null>;

  /**
   * Update multiple documents
   */
  updateMany(
    query: QueryFilter,
    data: Partial<T>,
    session?: ITransaction
  ): Promise<number>;

  /**
   * Delete a document by ID
   */
  delete(id: string, session?: ITransaction): Promise<boolean>;

  /**
   * Delete multiple documents
   */
  deleteMany(query: QueryFilter, session?: ITransaction): Promise<number>;

  /**
   * Count documents matching the query
   */
  count(query: QueryFilter): Promise<number>;

  /**
   * Check if a document exists
   */
  exists(query: QueryFilter): Promise<boolean>;

  /**
   * Perform aggregation
   */
  aggregate(pipeline: any[]): Promise<any[]>;
}