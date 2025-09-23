import { MongoMemoryServer } from 'mongodb-memory-server';
import { DbGatewayFactory } from '../src/DbGatewayFactory';
import { IDbGateway } from '../src/interfaces/IDbGateway';

let mongoServer: MongoMemoryServer;
let dbGateway: IDbGateway;

/**
 * Setup test database
 */
export async function setupTestDb(): Promise<IDbGateway> {
  // Start in-memory MongoDB instance
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();

  // Create and connect dbGateway
  dbGateway = DbGatewayFactory.create('mongodb');
  await dbGateway.connect({ uri: mongoUri });

  return dbGateway;
}

/**
 * Teardown test database
 */
export async function teardownTestDb(): Promise<void> {
  if (dbGateway) {
    await dbGateway.disconnect();
  }

  if (mongoServer) {
    await mongoServer.stop();
  }
}

/**
 * Clear all collections
 */
export async function clearDatabase(): Promise<void> {
  if (!dbGateway || !dbGateway.isConnected()) {
    throw new Error('Database not connected');
  }

  // Clear all repositories
  const repositories = [
    'User',
    'Message',
    'Conversation',
    'File',
    'Transaction',
    'Agent',
    'Prompt',
  ];

  for (const repoName of repositories) {
    try {
      const repo = dbGateway.getRepository(repoName);
      await repo.deleteMany({});
    } catch (error) {
      // Repository might not exist, skip
    }
  }
}

/**
 * Get test database gateway
 */
export function getTestDbGateway(): IDbGateway {
  if (!dbGateway) {
    throw new Error('Test database not initialized');
  }
  return dbGateway;
}