/**
 * Database Gateway Package
 * Main entry point for the database abstraction layer
 */

// Core interfaces
export * from './interfaces/IDbGateway';
export * from './interfaces/IUserRepository';
export * from './interfaces/IMessageRepository';
export * from './interfaces/IConversationRepository';
export * from './interfaces/IFileRepository';
export * from './interfaces/ITransactionRepository';
export * from './interfaces/IAgentRepository';
export * from './interfaces/IPromptRepository';

// Factory
export { DbGatewayFactory } from './DbGatewayFactory';

// MongoDB adapter (for advanced usage)
export { MongoDbAdapter } from './adapters/mongodb/MongoDbAdapter';
export { MongoTransaction } from './adapters/mongodb/MongoTransaction';
export { MongoBaseRepository } from './adapters/mongodb/MongoBaseRepository';