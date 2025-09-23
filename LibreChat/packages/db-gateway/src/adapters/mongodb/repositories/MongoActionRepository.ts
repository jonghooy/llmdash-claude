import { Model } from 'mongoose';
import { MongoBaseRepository } from '../MongoBaseRepository';
import {
  IActionRepository,
  IAction,
  CreateActionDto,
  UpdateActionDto,
} from '../../../interfaces/IActionRepository';
import { ITransaction } from '../../../interfaces/IDbGateway';

/**
 * MongoDB implementation of Action Repository
 */
export class MongoActionRepository
  extends MongoBaseRepository<IAction>
  implements IActionRepository
{
  constructor(model: Model<any>) {
    super(model);
  }

  /**
   * Update or create an action
   */
  async updateAction(searchParams: { action_id: string; user: string }, updateData: UpdateActionDto): Promise<IAction> {
    const result = await this.model.findOneAndUpdate(
      searchParams,
      updateData,
      { new: true, upsert: true, lean: true }
    ).exec();

    if (!result) {
      throw new Error('Failed to update or create action');
    }

    return result as unknown as IAction;
  }

  /**
   * Get actions with optional sensitive data filtering
   */
  async getActions(searchParams: any, includeSensitive: boolean = false): Promise<IAction[]> {
    const actions = await this.find(searchParams, { lean: true });

    if (!includeSensitive) {
      return this.sanitizeSensitiveData(actions);
    }

    return actions;
  }

  /**
   * Delete an action
   */
  async deleteAction(searchParams: { action_id: string; user: string }): Promise<IAction | null> {
    const result = await this.model.findOneAndDelete(searchParams).lean().exec();
    return result as IAction | null;
  }

  /**
   * Delete multiple actions
   */
  async deleteActions(searchParams: any): Promise<number> {
    const result = await this.model.deleteMany(searchParams).exec();
    return result.deletedCount || 0;
  }

  /**
   * Find action by action_id and user
   */
  async findByActionIdAndUser(action_id: string, user: string): Promise<IAction | null> {
    return await this.findOne({ action_id, user });
  }

  /**
   * Get user's actions
   */
  async getUserActions(user: string): Promise<IAction[]> {
    return await this.find({ user }, { lean: true });
  }

  /**
   * Update action metadata
   */
  async updateActionMetadata(
    action_id: string,
    user: string,
    metadata: Partial<IAction['metadata']>
  ): Promise<boolean> {
    const result = await this.model.updateOne(
      { action_id, user },
      {
        $set: {
          metadata,
          updatedAt: new Date()
        }
      }
    ).exec();

    return result.modifiedCount > 0;
  }

  /**
   * Sanitize sensitive fields from actions
   */
  sanitizeSensitiveData(actions: IAction[]): IAction[] {
    const sanitized = [...actions];
    const sensitiveFields = ['api_key', 'oauth_client_id', 'oauth_client_secret'];

    for (let i = 0; i < sanitized.length; i++) {
      const metadata = sanitized[i].metadata;
      if (!metadata) {
        continue;
      }

      // Create a new metadata object to avoid mutating the original
      sanitized[i] = {
        ...sanitized[i],
        metadata: { ...metadata }
      };

      for (const field of sensitiveFields) {
        if (sanitized[i].metadata && sanitized[i].metadata[field as keyof typeof metadata]) {
          delete sanitized[i].metadata[field as keyof typeof metadata];
        }
      }
    }

    return sanitized;
  }

  /**
   * Override create to ensure required fields
   */
  async create(data: CreateActionDto, transaction?: ITransaction): Promise<IAction> {
    const session = this.getSession(transaction);

    // Ensure required fields
    if (!data.action_id || !data.user) {
      throw new Error('action_id and user are required');
    }

    if (data.metadata && !data.metadata.domain) {
      throw new Error('metadata.domain is required when metadata is provided');
    }

    // Set default type if not provided
    const actionData = {
      ...data,
      type: data.type || 'action_prototype',
      createdAt: new Date(),
    };

    const doc = new this.model(actionData);
    await doc.save({ session });
    return doc.toObject() as IAction;
  }
}