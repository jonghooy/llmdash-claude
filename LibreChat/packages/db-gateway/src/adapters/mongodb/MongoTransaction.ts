import { ClientSession } from 'mongoose';
import { ITransaction } from '../../interfaces/IDbGateway';

/**
 * MongoDB transaction wrapper
 */
export class MongoTransaction implements ITransaction {
  public readonly id: string;
  private session: ClientSession;
  private committed: boolean = false;
  private rolledBack: boolean = false;

  constructor(session: ClientSession) {
    this.session = session;
    this.id = session.id ? session.id.toString() : 'session-' + Date.now();
  }

  /**
   * Commit the transaction
   */
  async commit(): Promise<void> {
    if (this.committed || this.rolledBack) {
      throw new Error('Transaction already finalized');
    }

    await this.session.commitTransaction();
    this.committed = true;
  }

  /**
   * Rollback the transaction
   */
  async rollback(): Promise<void> {
    if (this.committed || this.rolledBack) {
      throw new Error('Transaction already finalized');
    }

    await this.session.abortTransaction();
    this.rolledBack = true;
  }

  /**
   * Check if transaction is active
   */
  isActive(): boolean {
    return !this.committed && !this.rolledBack && this.session.inTransaction();
  }

  /**
   * Get the underlying MongoDB session
   * Used internally by repositories
   */
  getSession(): ClientSession {
    return this.session;
  }
}