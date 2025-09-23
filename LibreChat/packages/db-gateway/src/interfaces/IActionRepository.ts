import { IRepository } from './IDbGateway';
import { ITransaction } from './IDbGateway';

/**
 * Action document interface
 */
export interface IAction {
  _id?: string;
  user: string;
  action_id: string;
  type?: string;
  settings?: any;
  agent_id?: string;
  assistant_id?: string;
  metadata?: {
    api_key?: string;
    auth?: {
      authorization_type?: string;
      custom_auth_header?: string;
      type?: 'service_http' | 'oauth' | 'none';
      authorization_content_type?: string;
      authorization_url?: string;
      client_url?: string;
      scope?: string;
      token_exchange_method?: 'default_post' | 'basic_auth_header' | null;
    };
    domain: string;
    privacy_policy_url?: string;
    raw_spec?: string;
    oauth_client_id?: string;
    oauth_client_secret?: string;
  };
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Action Create DTO
 */
export interface CreateActionDto extends Omit<IAction, '_id' | 'createdAt' | 'updatedAt'> {}

/**
 * Action Update DTO
 */
export interface UpdateActionDto extends Partial<CreateActionDto> {}

/**
 * Action Repository Interface
 */
export interface IActionRepository extends IRepository<IAction> {
  /**
   * Update or create an action
   */
  updateAction(searchParams: { action_id: string; user: string }, updateData: UpdateActionDto): Promise<IAction>;

  /**
   * Get actions with optional sensitive data filtering
   */
  getActions(searchParams: any, includeSensitive?: boolean): Promise<IAction[]>;

  /**
   * Delete an action
   */
  deleteAction(searchParams: { action_id: string; user: string }): Promise<IAction | null>;

  /**
   * Delete multiple actions
   */
  deleteActions(searchParams: any): Promise<number>;

  /**
   * Find action by action_id and user
   */
  findByActionIdAndUser(action_id: string, user: string): Promise<IAction | null>;

  /**
   * Get user's actions
   */
  getUserActions(user: string): Promise<IAction[]>;

  /**
   * Update action metadata
   */
  updateActionMetadata(action_id: string, user: string, metadata: Partial<IAction['metadata']>): Promise<boolean>;

  /**
   * Sanitize sensitive fields
   */
  sanitizeSensitiveData(actions: IAction[]): IAction[];
}