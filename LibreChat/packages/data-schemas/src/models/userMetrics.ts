import userMetricsSchema from '~/schema/userMetrics';
import type { IUserMetrics } from '~/schema/userMetrics';

/**
 * Creates or returns the UserMetrics model using the provided mongoose instance and schema
 */
export function createUserMetricsModel(mongoose: typeof import('mongoose')) {
  return mongoose.models.UserMetrics || mongoose.model<IUserMetrics>('UserMetrics', userMetricsSchema);
}