import { IRepository } from './IDbGateway';
import { ITransaction } from './IDbGateway';

/**
 * Banner document interface
 */
export interface IBanner {
  _id?: string;
  bannerId: string;
  message: string;
  displayFrom: Date;
  displayTo?: Date;
  type: 'banner' | 'popup';
  isPublic: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Banner Create DTO
 */
export interface CreateBannerDto extends Omit<IBanner, '_id' | 'createdAt' | 'updatedAt'> {}

/**
 * Banner Update DTO
 */
export interface UpdateBannerDto extends Partial<CreateBannerDto> {}

/**
 * Banner Repository Interface
 */
export interface IBannerRepository extends IRepository<IBanner> {
  /**
   * Get the current active banner
   */
  getActiveBanner(user?: string): Promise<IBanner | null>;

  /**
   * Get all active banners
   */
  getActiveBanners(): Promise<IBanner[]>;

  /**
   * Get banners by type
   */
  getBannersByType(type: 'banner' | 'popup'): Promise<IBanner[]>;

  /**
   * Create or update a banner
   */
  upsertBanner(bannerId: string, bannerData: UpdateBannerDto): Promise<IBanner>;

  /**
   * Delete a banner by bannerId
   */
  deleteBanner(bannerId: string): Promise<boolean>;

  /**
   * Get public banners
   */
  getPublicBanners(): Promise<IBanner[]>;

  /**
   * Check if banner is currently active
   */
  isBannerActive(bannerId: string): Promise<boolean>;

  /**
   * Expire a banner (set displayTo to now)
   */
  expireBanner(bannerId: string): Promise<boolean>;

  /**
   * Get upcoming banners
   */
  getUpcomingBanners(): Promise<IBanner[]>;

  /**
   * Get expired banners
   */
  getExpiredBanners(): Promise<IBanner[]>;
}