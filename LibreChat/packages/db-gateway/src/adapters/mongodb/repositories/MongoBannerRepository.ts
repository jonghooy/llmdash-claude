import { Model } from 'mongoose';
import { MongoBaseRepository } from '../MongoBaseRepository';
import {
  IBannerRepository,
  IBanner,
  CreateBannerDto,
  UpdateBannerDto,
} from '../../../interfaces/IBannerRepository';
import { ITransaction } from '../../../interfaces/IDbGateway';

/**
 * MongoDB implementation of Banner Repository
 */
export class MongoBannerRepository
  extends MongoBaseRepository<IBanner>
  implements IBannerRepository
{
  constructor(model: Model<any>) {
    super(model);
  }

  /**
   * Get the current active banner
   */
  async getActiveBanner(user?: string): Promise<IBanner | null> {
    const now = new Date();
    const query: any = {
      displayFrom: { $lte: now },
      $or: [{ displayTo: { $gte: now } }, { displayTo: null }],
      type: 'banner',
    };

    const banner = await this.findOne(query);

    if (!banner) {
      return null;
    }

    // If banner is not public and no user is provided, return null
    if (!banner.isPublic && !user) {
      return null;
    }

    return banner;
  }

  /**
   * Get all active banners
   */
  async getActiveBanners(): Promise<IBanner[]> {
    const now = new Date();
    return await this.find({
      displayFrom: { $lte: now },
      $or: [{ displayTo: { $gte: now } }, { displayTo: null }],
    }, { sort: { displayFrom: -1 }, lean: true });
  }

  /**
   * Get banners by type
   */
  async getBannersByType(type: 'banner' | 'popup'): Promise<IBanner[]> {
    return await this.find({ type }, { sort: { displayFrom: -1 }, lean: true });
  }

  /**
   * Create or update a banner
   */
  async upsertBanner(bannerId: string, bannerData: UpdateBannerDto): Promise<IBanner> {
    const result = await this.model.findOneAndUpdate(
      { bannerId },
      { ...bannerData, bannerId },
      { new: true, upsert: true, lean: true }
    ).exec();

    if (!result) {
      throw new Error('Failed to upsert banner');
    }

    return result as unknown as IBanner;
  }

  /**
   * Delete a banner by bannerId
   */
  async deleteBanner(bannerId: string): Promise<boolean> {
    const result = await this.model.deleteOne({ bannerId }).exec();
    return result.deletedCount > 0;
  }

  /**
   * Get public banners
   */
  async getPublicBanners(): Promise<IBanner[]> {
    const now = new Date();
    return await this.find({
      isPublic: true,
      displayFrom: { $lte: now },
      $or: [{ displayTo: { $gte: now } }, { displayTo: null }],
    }, { sort: { displayFrom: -1 }, lean: true });
  }

  /**
   * Check if banner is currently active
   */
  async isBannerActive(bannerId: string): Promise<boolean> {
    const now = new Date();
    const banner = await this.findOne({
      bannerId,
      displayFrom: { $lte: now },
      $or: [{ displayTo: { $gte: now } }, { displayTo: null }],
    });
    return banner !== null;
  }

  /**
   * Expire a banner (set displayTo to now)
   */
  async expireBanner(bannerId: string): Promise<boolean> {
    const result = await this.model.updateOne(
      { bannerId },
      { displayTo: new Date(), updatedAt: new Date() }
    ).exec();
    return result.modifiedCount > 0;
  }

  /**
   * Get upcoming banners
   */
  async getUpcomingBanners(): Promise<IBanner[]> {
    const now = new Date();
    return await this.find(
      { displayFrom: { $gt: now } },
      { sort: { displayFrom: 1 }, lean: true }
    );
  }

  /**
   * Get expired banners
   */
  async getExpiredBanners(): Promise<IBanner[]> {
    const now = new Date();
    return await this.find(
      {
        displayTo: { $lt: now },
        displayFrom: { $lte: now }
      },
      { sort: { displayTo: -1 }, lean: true }
    );
  }

  /**
   * Override create to ensure required fields
   */
  async create(data: CreateBannerDto, transaction?: ITransaction): Promise<IBanner> {
    const session = this.getSession(transaction);

    // Ensure required fields
    if (!data.bannerId || !data.message) {
      throw new Error('bannerId and message are required');
    }

    // Set default values
    const bannerData = {
      ...data,
      type: data.type || 'banner',
      isPublic: data.isPublic !== undefined ? data.isPublic : false,
      displayFrom: data.displayFrom || new Date(),
      createdAt: new Date(),
    };

    const doc = new this.model(bannerData);
    await doc.save({ session });
    return doc.toObject() as IBanner;
  }
}