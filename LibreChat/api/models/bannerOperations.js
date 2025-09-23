const { logger } = require('@librechat/data-schemas');
const { Banner } = require('~/db/models');

/**
 * Check if dbGateway is enabled
 */
function isDbGatewayEnabled() {
  return process.env.USE_DB_GATEWAY === 'true';
}

/**
 * Get the dbGateway lazily to avoid circular dependencies
 */
function getLazyGateway() {
  return require('../server/services/dbGateway');
}

/**
 * Retrieves the current active banner.
 * @param {string} [user] - Optional user ID for non-public banner access
 * @returns {Promise<Object|null>} The active banner object or null if no active banner is found.
 */
async function getBanner(user) {
  try {
    if (isDbGatewayEnabled()) {
      const { getRepository } = getLazyGateway();
      const bannerRepo = await getRepository('Banner');
      return await bannerRepo.getActiveBanner(user);
    }
    // Fallback to Mongoose
    const now = new Date();
    const banner = await Banner.findOne({
      displayFrom: { $lte: now },
      $or: [{ displayTo: { $gte: now } }, { displayTo: null }],
      type: 'banner',
    }).lean();

    if (!banner || banner.isPublic || user) {
      return banner;
    }

    return null;
  } catch (error) {
    logger.error('[getBanner] Error getting banner', error);
    throw new Error('Error getting banner');
  }
}

/**
 * Get all active banners
 * @returns {Promise<Array<Object>>} Array of active banners
 */
async function getActiveBanners() {
  if (isDbGatewayEnabled()) {
    const { getRepository } = getLazyGateway();
    const bannerRepo = await getRepository('Banner');
    return await bannerRepo.getActiveBanners();
  }
  // Fallback to Mongoose
  const now = new Date();
  return await Banner.find({
    displayFrom: { $lte: now },
    $or: [{ displayTo: { $gte: now } }, { displayTo: null }],
  }).sort({ displayFrom: -1 }).lean();
}

/**
 * Get banners by type
 * @param {string} type - Banner type ('banner' or 'popup')
 * @returns {Promise<Array<Object>>} Array of banners
 */
async function getBannersByType(type) {
  if (isDbGatewayEnabled()) {
    const { getRepository } = getLazyGateway();
    const bannerRepo = await getRepository('Banner');
    return await bannerRepo.getBannersByType(type);
  }
  // Fallback to Mongoose
  return await Banner.find({ type }).sort({ displayFrom: -1 }).lean();
}

/**
 * Create or update a banner
 * @param {string} bannerId - Banner ID
 * @param {Object} bannerData - Banner data
 * @returns {Promise<Object>} The updated or created banner
 */
async function upsertBanner(bannerId, bannerData) {
  if (isDbGatewayEnabled()) {
    const { getRepository } = getLazyGateway();
    const bannerRepo = await getRepository('Banner');
    return await bannerRepo.upsertBanner(bannerId, bannerData);
  }
  // Fallback to Mongoose
  return await Banner.findOneAndUpdate(
    { bannerId },
    { ...bannerData, bannerId },
    { new: true, upsert: true }
  ).lean();
}

/**
 * Delete a banner by bannerId
 * @param {string} bannerId - Banner ID
 * @returns {Promise<boolean>} True if deleted successfully
 */
async function deleteBanner(bannerId) {
  if (isDbGatewayEnabled()) {
    const { getRepository } = getLazyGateway();
    const bannerRepo = await getRepository('Banner');
    return await bannerRepo.deleteBanner(bannerId);
  }
  // Fallback to Mongoose
  const result = await Banner.deleteOne({ bannerId });
  return result.deletedCount > 0;
}

/**
 * Get public banners
 * @returns {Promise<Array<Object>>} Array of public banners
 */
async function getPublicBanners() {
  if (isDbGatewayEnabled()) {
    const { getRepository } = getLazyGateway();
    const bannerRepo = await getRepository('Banner');
    return await bannerRepo.getPublicBanners();
  }
  // Fallback to Mongoose
  const now = new Date();
  return await Banner.find({
    isPublic: true,
    displayFrom: { $lte: now },
    $or: [{ displayTo: { $gte: now } }, { displayTo: null }],
  }).sort({ displayFrom: -1 }).lean();
}

/**
 * Check if banner is currently active
 * @param {string} bannerId - Banner ID
 * @returns {Promise<boolean>} True if banner is active
 */
async function isBannerActive(bannerId) {
  if (isDbGatewayEnabled()) {
    const { getRepository } = getLazyGateway();
    const bannerRepo = await getRepository('Banner');
    return await bannerRepo.isBannerActive(bannerId);
  }
  // Fallback to Mongoose
  const now = new Date();
  const banner = await Banner.findOne({
    bannerId,
    displayFrom: { $lte: now },
    $or: [{ displayTo: { $gte: now } }, { displayTo: null }],
  });
  return banner !== null;
}

/**
 * Expire a banner (set displayTo to now)
 * @param {string} bannerId - Banner ID
 * @returns {Promise<boolean>} True if expired successfully
 */
async function expireBanner(bannerId) {
  if (isDbGatewayEnabled()) {
    const { getRepository } = getLazyGateway();
    const bannerRepo = await getRepository('Banner');
    return await bannerRepo.expireBanner(bannerId);
  }
  // Fallback to Mongoose
  const result = await Banner.updateOne(
    { bannerId },
    { displayTo: new Date(), updatedAt: new Date() }
  );
  return result.modifiedCount > 0;
}

/**
 * Get upcoming banners
 * @returns {Promise<Array<Object>>} Array of upcoming banners
 */
async function getUpcomingBanners() {
  if (isDbGatewayEnabled()) {
    const { getRepository } = getLazyGateway();
    const bannerRepo = await getRepository('Banner');
    return await bannerRepo.getUpcomingBanners();
  }
  // Fallback to Mongoose
  const now = new Date();
  return await Banner.find({
    displayFrom: { $gt: now }
  }).sort({ displayFrom: 1 }).lean();
}

/**
 * Get expired banners
 * @returns {Promise<Array<Object>>} Array of expired banners
 */
async function getExpiredBanners() {
  if (isDbGatewayEnabled()) {
    const { getRepository } = getLazyGateway();
    const bannerRepo = await getRepository('Banner');
    return await bannerRepo.getExpiredBanners();
  }
  // Fallback to Mongoose
  const now = new Date();
  return await Banner.find({
    displayTo: { $lt: now },
    displayFrom: { $lte: now }
  }).sort({ displayTo: -1 }).lean();
}

/**
 * Create a new banner
 * @param {Object} bannerData - Banner data
 * @returns {Promise<Object>} The created banner
 */
async function createBanner(bannerData) {
  if (isDbGatewayEnabled()) {
    const { getRepository } = getLazyGateway();
    const bannerRepo = await getRepository('Banner');
    return await bannerRepo.create(bannerData);
  }
  // Fallback to Mongoose
  const banner = new Banner(bannerData);
  return await banner.save();
}

/**
 * Find banners matching criteria
 * @param {Object} criteria - Search criteria
 * @param {Object} options - Query options
 * @returns {Promise<Array<Object>>} Array of banners
 */
async function findBanners(criteria, options = {}) {
  if (isDbGatewayEnabled()) {
    const { getRepository } = getLazyGateway();
    const bannerRepo = await getRepository('Banner');
    return await bannerRepo.find(criteria, options);
  }
  // Fallback to Mongoose
  let query = Banner.find(criteria);

  if (options.sort) {
    query = query.sort(options.sort);
  }
  if (options.limit) {
    query = query.limit(options.limit);
  }
  if (options.skip) {
    query = query.skip(options.skip);
  }

  return await query.lean();
}

module.exports = {
  getBanner,
  getActiveBanners,
  getBannersByType,
  upsertBanner,
  deleteBanner,
  getPublicBanners,
  isBannerActive,
  expireBanner,
  getUpcomingBanners,
  getExpiredBanners,
  createBanner,
  findBanners,
};