import { IRepository } from './IDbGateway';
import { ITransaction } from './IDbGateway';

/**
 * Preset document interface
 */
export interface IPreset {
  _id?: string;
  presetId: string;
  title: string;
  user: string | null;
  defaultPreset?: boolean;
  order?: number;
  endpoint?: string;
  endpointType?: string;
  model?: string;
  region?: string;
  chatGptLabel?: string;
  examples?: unknown[];
  modelLabel?: string;
  promptPrefix?: string;
  temperature?: number;
  top_p?: number;
  topP?: number;
  topK?: number;
  maxOutputTokens?: number;
  maxTokens?: number;
  presence_penalty?: number;
  frequency_penalty?: number;
  file_ids?: string[];
  resendImages?: boolean;
  promptCache?: boolean;
  thinking?: boolean;
  thinkingBudget?: number;
  system?: string;
  resendFiles?: boolean;
  imageDetail?: string;
  agent_id?: string;
  assistant_id?: string;
  instructions?: string;
  stop?: string[];
  isArchived?: boolean;
  iconURL?: string;
  greeting?: string;
  spec?: string;
  tags?: string[];
  tools?: string[];
  maxContextTokens?: number;
  max_tokens?: number;
  reasoning_effort?: string;
  reasoning_summary?: string;
  verbosity?: string;
  useResponsesApi?: boolean;
  web_search?: boolean;
  disableStreaming?: boolean;
  fileTokenLimit?: number;
  agentOptions?: unknown;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Preset Create DTO
 */
export interface CreatePresetDto extends Omit<IPreset, '_id' | 'createdAt' | 'updatedAt'> {}

/**
 * Preset Update DTO
 */
export interface UpdatePresetDto extends Partial<CreatePresetDto> {}

/**
 * Preset Repository Interface
 */
export interface IPresetRepository extends IRepository<IPreset> {
  /**
   * Find preset by presetId and user
   */
  findByPresetId(presetId: string, user: string): Promise<IPreset | null>;

  /**
   * Get all presets for a user
   */
  getUserPresets(user: string, filter?: any): Promise<IPreset[]>;

  /**
   * Get the default preset for a user
   */
  getDefaultPreset(user: string): Promise<IPreset | null>;

  /**
   * Set a preset as default for a user
   */
  setDefaultPreset(presetId: string, user: string): Promise<boolean>;

  /**
   * Unset default preset for a user
   */
  unsetDefaultPreset(user: string): Promise<boolean>;

  /**
   * Delete presets by user and filter
   */
  deleteUserPresets(user: string, filter?: any): Promise<number>;

  /**
   * Archive a preset
   */
  archivePreset(presetId: string, user: string): Promise<boolean>;

  /**
   * Upsert a preset (create or update)
   */
  upsertPreset(presetId: string, user: string, data: UpdatePresetDto): Promise<IPreset>;
}