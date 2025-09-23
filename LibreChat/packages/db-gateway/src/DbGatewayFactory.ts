import { IDbGateway, DbConfig } from './interfaces/IDbGateway';
import { MongoDbAdapter } from './adapters/mongodb/MongoDbAdapter';

/**
 * Factory for creating database gateway instances
 */
export class DbGatewayFactory {
  private static instances: Map<string, IDbGateway> = new Map();

  /**
   * Create a new database gateway instance
   */
  static create(type: 'mongodb' | 'postgresql' | 'mysql', config?: DbConfig): IDbGateway {
    switch (type) {
      case 'mongodb':
        return new MongoDbAdapter();

      case 'postgresql':
        // Future: PostgreSQL adapter
        throw new Error('PostgreSQL adapter not yet implemented');

      case 'mysql':
        // Future: MySQL adapter
        throw new Error('MySQL adapter not yet implemented');

      default:
        throw new Error(`Unsupported database type: ${type}`);
    }
  }

  /**
   * Get or create a singleton instance
   */
  static async getInstance(
    type: 'mongodb' | 'postgresql' | 'mysql' = 'mongodb',
    config?: DbConfig
  ): Promise<IDbGateway> {
    const key = `${type}:${config?.uri || 'default'}`;

    if (!this.instances.has(key)) {
      const gateway = this.create(type, config);
      if (config) {
        await gateway.connect(config);
      }
      this.instances.set(key, gateway);
    }

    return this.instances.get(key)!;
  }

  /**
   * Clear all instances (useful for testing)
   */
  static async clearInstances(): Promise<void> {
    for (const gateway of this.instances.values()) {
      if (gateway.isConnected()) {
        await gateway.disconnect();
      }
    }
    this.instances.clear();
  }

  /**
   * Get all active instances
   */
  static getInstances(): Map<string, IDbGateway> {
    return new Map(this.instances);
  }
}