import { IRepository } from './IDbGateway';
import { ITransaction } from './IDbGateway';

/**
 * Assistant document interface
 */
export interface IAssistant {
  _id?: string;
  user: string;
  assistant_id: string;
  avatar?: any;
  conversation_starters?: string[];
  access_level?: number;
  file_ids?: string[];
  actions?: string[];
  append_current_datetime?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Assistant Create DTO
 */
export interface CreateAssistantDto extends Omit<IAssistant, '_id' | 'createdAt' | 'updatedAt'> {}

/**
 * Assistant Update DTO
 */
export interface UpdateAssistantDto extends Partial<CreateAssistantDto> {}

/**
 * Assistant Repository Interface
 */
export interface IAssistantRepository extends IRepository<IAssistant> {
  /**
   * Find assistant by assistant_id and user
   */
  findByAssistantId(assistant_id: string, user: string): Promise<IAssistant | null>;

  /**
   * Get all assistants for a user
   */
  getUserAssistants(user: string): Promise<IAssistant[]>;

  /**
   * Update or create an assistant
   */
  upsertAssistant(
    searchParams: { assistant_id: string; user: string },
    updateData: UpdateAssistantDto
  ): Promise<IAssistant>;

  /**
   * Delete an assistant
   */
  deleteAssistant(assistant_id: string, user: string): Promise<boolean>;

  /**
   * Get assistants by access level
   */
  getAssistantsByAccessLevel(user: string, access_level: number): Promise<IAssistant[]>;

  /**
   * Update assistant files
   */
  updateAssistantFiles(assistant_id: string, user: string, file_ids: string[]): Promise<boolean>;

  /**
   * Update assistant actions
   */
  updateAssistantActions(assistant_id: string, user: string, actions: string[]): Promise<boolean>;
}