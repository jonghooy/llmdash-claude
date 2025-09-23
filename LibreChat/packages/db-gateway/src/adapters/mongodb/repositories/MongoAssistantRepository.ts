import { Model } from 'mongoose';
import { MongoBaseRepository } from '../MongoBaseRepository';
import {
  IAssistantRepository,
  IAssistant,
  CreateAssistantDto,
  UpdateAssistantDto,
} from '../../../interfaces/IAssistantRepository';
import { ITransaction } from '../../../interfaces/IDbGateway';

/**
 * MongoDB implementation of Assistant Repository
 */
export class MongoAssistantRepository
  extends MongoBaseRepository<IAssistant>
  implements IAssistantRepository
{
  constructor(model: Model<any>) {
    super(model);
  }

  /**
   * Find assistant by assistant_id and user
   */
  async findByAssistantId(assistant_id: string, user: string): Promise<IAssistant | null> {
    return await this.findOne({ assistant_id, user });
  }

  /**
   * Get all assistants for a user
   */
  async getUserAssistants(user: string): Promise<IAssistant[]> {
    return await this.find({ user }, { sort: { updatedAt: -1 }, lean: true });
  }

  /**
   * Update or create an assistant
   */
  async upsertAssistant(
    searchParams: { assistant_id: string; user: string },
    updateData: UpdateAssistantDto
  ): Promise<IAssistant> {
    const result = await this.model
      .findOneAndUpdate(searchParams, updateData, { new: true, upsert: true, lean: true })
      .exec();

    if (!result) {
      throw new Error('Failed to upsert assistant');
    }

    return result as unknown as IAssistant;
  }

  /**
   * Delete an assistant
   */
  async deleteAssistant(assistant_id: string, user: string): Promise<boolean> {
    const result = await this.model.findOneAndDelete({ assistant_id, user });
    return !!result;
  }

  /**
   * Get assistants by access level
   */
  async getAssistantsByAccessLevel(user: string, access_level: number): Promise<IAssistant[]> {
    return await this.find(
      { user, access_level },
      { sort: { updatedAt: -1 }, lean: true }
    );
  }

  /**
   * Update assistant files
   */
  async updateAssistantFiles(
    assistant_id: string,
    user: string,
    file_ids: string[]
  ): Promise<boolean> {
    const result = await this.model.updateOne(
      { assistant_id, user },
      { file_ids, updatedAt: new Date() }
    );
    return result.modifiedCount > 0;
  }

  /**
   * Update assistant actions
   */
  async updateAssistantActions(
    assistant_id: string,
    user: string,
    actions: string[]
  ): Promise<boolean> {
    const result = await this.model.updateOne(
      { assistant_id, user },
      { actions, updatedAt: new Date() }
    );
    return result.modifiedCount > 0;
  }

  /**
   * Override create to handle assistant_id uniqueness per user
   */
  async create(data: CreateAssistantDto, transaction?: ITransaction): Promise<IAssistant> {
    const session = this.getSession(transaction);

    // Ensure assistant_id is unique per user
    const existing = await this.findOne({ assistant_id: data.assistant_id, user: data.user });
    if (existing) {
      throw new Error(`Assistant with ID ${data.assistant_id} already exists for this user`);
    }

    const doc = new this.model(data);
    await doc.save({ session });
    return doc.toObject() as IAssistant;
  }
}