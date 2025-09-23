import { Model } from 'mongoose';
import { MongoBaseRepository } from '../MongoBaseRepository';
import {
  IPresetRepository,
  IPreset,
  CreatePresetDto,
  UpdatePresetDto,
} from '../../../interfaces/IPresetRepository';
import { ITransaction } from '../../../interfaces/IDbGateway';

/**
 * MongoDB implementation of Preset Repository
 */
export class MongoPresetRepository
  extends MongoBaseRepository<IPreset>
  implements IPresetRepository
{
  constructor(model: Model<any>) {
    super(model);
  }

  /**
   * Find preset by presetId and user
   */
  async findByPresetId(presetId: string, user: string): Promise<IPreset | null> {
    return await this.findOne({ presetId, user });
  }

  /**
   * Get all presets for a user
   */
  async getUserPresets(user: string, filter?: any): Promise<IPreset[]> {
    const query = { ...filter, user };
    const presets = await this.find(query, {
      sort: { order: 1, updatedAt: -1 },
      lean: true,
    });

    // Custom sorting logic as per original implementation
    const defaultValue = 10000;
    presets.sort((a, b) => {
      let orderA = a.order !== undefined ? a.order : defaultValue;
      let orderB = b.order !== undefined ? b.order : defaultValue;

      if (orderA !== orderB) {
        return orderA - orderB;
      }

      // Compare dates
      const dateA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
      const dateB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
      return dateB - dateA;
    });

    return presets;
  }

  /**
   * Get the default preset for a user
   */
  async getDefaultPreset(user: string): Promise<IPreset | null> {
    return await this.findOne({ user, defaultPreset: true });
  }

  /**
   * Set a preset as default for a user
   */
  async setDefaultPreset(presetId: string, user: string): Promise<boolean> {
    // First unset any existing default
    await this.model.updateMany(
      { user, defaultPreset: true, presetId: { $ne: presetId } },
      { $unset: { defaultPreset: '', order: '' } }
    );

    // Set the new default
    const result = await this.model.updateOne(
      { presetId, user },
      { $set: { defaultPreset: true, order: 0 } }
    );

    return result.modifiedCount > 0;
  }

  /**
   * Unset default preset for a user
   */
  async unsetDefaultPreset(user: string): Promise<boolean> {
    const result = await this.model.updateMany(
      { user, defaultPreset: true },
      { $unset: { defaultPreset: '', order: '' } }
    );

    return result.modifiedCount > 0;
  }

  /**
   * Delete presets by user and filter
   */
  async deleteUserPresets(user: string, filter?: any): Promise<number> {
    const query = { ...filter, user };
    return await this.deleteMany(query);
  }

  /**
   * Archive a preset
   */
  async archivePreset(presetId: string, user: string): Promise<boolean> {
    const result = await this.model.updateOne(
      { presetId, user },
      { $set: { isArchived: true } }
    );

    return result.modifiedCount > 0;
  }

  /**
   * Upsert a preset (create or update)
   */
  async upsertPreset(
    presetId: string,
    user: string,
    data: UpdatePresetDto
  ): Promise<IPreset> {
    const result = await this.model
      .findOneAndUpdate(
        { presetId, user },
        { $set: { ...data, presetId, user } },
        { new: true, upsert: true, lean: true }
      )
      .exec();

    if (!result) {
      throw new Error('Failed to upsert preset');
    }

    return result as unknown as IPreset;
  }

  /**
   * Override create to handle presetId uniqueness
   */
  async create(data: CreatePresetDto, transaction?: ITransaction): Promise<IPreset> {
    const session = this.getSession(transaction);

    // Ensure presetId is unique per user
    const existing = await this.findOne({ presetId: data.presetId, user: data.user });
    if (existing) {
      throw new Error(`Preset with ID ${data.presetId} already exists for this user`);
    }

    const doc = new this.model(data);
    await doc.save({ session });
    return doc.toObject() as IPreset;
  }

  /**
   * Override update to use presetId instead of _id for user context
   */
  async update(
    id: string,
    data: Partial<IPreset>,
    transaction?: ITransaction
  ): Promise<IPreset | null> {
    const session = this.getSession(transaction);

    // If updating tools, process them
    if (data.tools && Array.isArray(data.tools)) {
      data.tools = data.tools
        .map((tool: any) => tool?.pluginKey ?? tool)
        .filter((toolName) => typeof toolName === 'string') ?? [];
    }

    const result = await this.model
      .findByIdAndUpdate(id, data, { new: true, session })
      .lean()
      .exec();

    return result as IPreset | null;
  }
}