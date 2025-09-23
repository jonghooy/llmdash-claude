import mongoose, { Connection, ClientSession } from 'mongoose';
import {
  IDbGateway,
  DbConfig,
  ITransaction,
  IRepository,
} from '../../interfaces/IDbGateway';
import { MongoTransaction } from './MongoTransaction';
import { MongoUserRepository } from './repositories/MongoUserRepository';
import { MongoMessageRepository } from './repositories/MongoMessageRepository';
import { MongoConversationRepository } from './repositories/MongoConversationRepository';
import { MongoFileRepository } from './repositories/MongoFileRepository';
import { MongoTransactionRepository } from './repositories/MongoTransactionRepository';
import { MongoAgentRepository } from './repositories/MongoAgentRepository';
import { MongoPromptRepository } from './repositories/MongoPromptRepository';
import { createModels } from '@librechat/data-schemas';

/**
 * MongoDB implementation of the Database Gateway
 */
export class MongoDbAdapter implements IDbGateway {
  private connection: Connection | null = null;
  private repositories: Map<string, IRepository<any>> = new Map();
  private models: any = {};
  private config: DbConfig | null = null;

  constructor() {}

  /**
   * Connect to MongoDB
   */
  async connect(config: DbConfig): Promise<void> {
    this.config = config;

    if (!config.uri) {
      throw new Error('MongoDB URI is required');
    }

    try {
      // Set mongoose options
      mongoose.set('strictQuery', true);

      const options = {
        bufferCommands: false,
        ...config.options,
      };

      // Connect to MongoDB
      await mongoose.connect(config.uri, options);
      this.connection = mongoose.connection;

      // Create models from data-schemas
      this.models = createModels(mongoose);

      // Initialize repositories
      this.initializeRepositories();

      console.log('Connected to MongoDB successfully');
    } catch (error) {
      console.error('Failed to connect to MongoDB:', error);
      throw error;
    }
  }

  /**
   * Disconnect from MongoDB
   */
  async disconnect(): Promise<void> {
    if (this.connection) {
      await mongoose.disconnect();
      this.connection = null;
      this.repositories.clear();
      console.log('Disconnected from MongoDB');
    }
  }

  /**
   * Get repository for an entity
   */
  getRepository<T>(entityName: string): IRepository<T> {
    const repository = this.repositories.get(entityName);

    if (!repository) {
      throw new Error(`Repository for entity "${entityName}" not found`);
    }

    return repository as IRepository<T>;
  }

  /**
   * Execute operations within a transaction
   */
  async transaction<T>(
    callback: (session: ITransaction) => Promise<T>
  ): Promise<T> {
    if (!this.connection) {
      throw new Error('Database not connected');
    }

    const session = await this.connection.startSession();
    const transaction = new MongoTransaction(session);

    try {
      const result = await session.withTransaction(async () => {
        return await callback(transaction);
      });

      return result as T;
    } catch (error) {
      throw error;
    } finally {
      await session.endSession();
    }
  }

  /**
   * Check database health
   */
  async healthCheck(): Promise<boolean> {
    if (!this.connection || !this.connection.db) {
      return false;
    }

    try {
      const adminDb = this.connection.db.admin();
      const result = await adminDb.ping();
      return result.ok === 1;
    } catch (error) {
      console.error('Health check failed:', error);
      return false;
    }
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.connection?.readyState === 1;
  }

  /**
   * Get database type
   */
  getType(): string {
    return 'mongodb';
  }

  /**
   * Initialize repositories with models
   */
  private initializeRepositories(): void {
    if (!this.models) {
      throw new Error('Models not initialized');
    }

    // User repository
    if (this.models.User) {
      this.repositories.set('User', new MongoUserRepository(this.models.User));
    }

    // Message repository
    if (this.models.Message) {
      this.repositories.set('Message', new MongoMessageRepository(this.models.Message));
    }

    // Conversation repository
    if (this.models.Conversation) {
      this.repositories.set('Conversation', new MongoConversationRepository(this.models.Conversation));
    }

    // File repository
    if (this.models.File) {
      this.repositories.set('File', new MongoFileRepository(this.models.File));
    }

    // Transaction repository
    if (this.models.Transaction) {
      this.repositories.set('Transaction', new MongoTransactionRepository(this.models.Transaction));
    }

    // Agent repository
    if (this.models.Agent) {
      this.repositories.set('Agent', new MongoAgentRepository(this.models.Agent));
    }

    // Prompt repository
    if (this.models.Prompt) {
      this.repositories.set('Prompt', new MongoPromptRepository(this.models.Prompt));
    }

    console.log(`Initialized ${this.repositories.size} repositories`);
  }
}