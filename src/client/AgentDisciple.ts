import type { VectorStorePort, QueryOptions } from '../domain/ports/index.ts';
import type { MistakeDocument, TaskType, TaskTypeConfig } from '../domain/models/index.ts';

/**
 * Configuration options for AgentDisciple
 */
export interface AgentDiscipleConfig {
  /**
   * The vector store to use for storing and retrieving mistakes
   */
  vectorStore: VectorStorePort;

  /**
   * Task type configuration
   */
  taskTypeConfig?: Partial<TaskTypeConfig>;
}

/**
 * Options for finding mistakes
 */
export interface FindMistakesOptions {
  /**
   * Task type to filter by (defaults to the default task type)
   */
  taskType?: string;

  /**
   * Number of mistakes to return
   */
  limit?: number;

  /**
   * Additional query options
   */
  queryOptions?: QueryOptions;
}

/**
 * Options for adding a mistake
 */
export interface AddMistakeOptions {
  /**
   * Task type for this mistake (defaults to the default task type)
   */
  taskType?: string;

  /**
   * Severity of the mistake
   */
  severity?: 'low' | 'medium' | 'high' | 'critical';

  /**
   * Tags for categorization
   */
  tags?: string[];

  /**
   * Additional context
   */
  context?: string;

  /**
   * Solution or correction
   */
  solution?: string;
}

/**
 * Options for editing a mistake
 */
export interface EditMistakeOptions {
  /**
   * Updated content
   */
  content?: string;

  /**
   * Updated task type
   */
  taskType?: string;

  /**
   * Updated severity
   */
  severity?: 'low' | 'medium' | 'high' | 'critical';

  /**
   * Updated tags
   */
  tags?: string[];

  /**
   * Updated context
   */
  context?: string;

  /**
   * Updated solution
   */
  solution?: string;
}

/**
 * AgentDisciple - Main client class for learning from AI mistakes
 * 
 * This class provides an easy-to-use abstraction over a RAG vector store
 * for tracking and learning from mistakes made during AI task execution.
 * 
 * @example
 * ```typescript
 * const disciple = new AgentDisciple({
 *   vectorStore: myVectorStore,
 *   taskTypeConfig: {
 *     defaultTaskType: 'code_generation',
 *     taskTypes: [
 *       { name: 'code_generation', description: 'Generating code' },
 *       { name: 'data_analysis', description: 'Analyzing data' }
 *     ]
 *   }
 * });
 * 
 * // Find past mistakes for a specific task type
 * const mistakes = await disciple.findMistakes('code_generation', { limit: 5 });
 * 
 * // Add a new mistake
 * await disciple.addMistake('Failed to handle edge case', {
 *   taskType: 'code_generation',
 *   severity: 'high',
 *   solution: 'Add null check before accessing property'
 * });
 * ```
 */
export class AgentDisciple {
  private vectorStore: VectorStorePort;
  private taskTypeConfig: TaskTypeConfig;

  /**
   * Creates a new AgentDisciple instance
   * @param config - Configuration options
   */
  constructor(config: AgentDiscipleConfig) {
    this.vectorStore = config.vectorStore;

    // Initialize task type configuration with defaults
    const defaultTaskTypes: TaskType[] = [
      { name: 'general', description: 'General-purpose tasks' }
    ];

    this.taskTypeConfig = {
      defaultTaskType: config.taskTypeConfig?.defaultTaskType ?? 'general',
      taskTypes: config.taskTypeConfig?.taskTypes ?? defaultTaskTypes
    };

    // Ensure default task type exists in the task types list
    const hasDefaultType = this.taskTypeConfig.taskTypes.some(
      t => t.name === this.taskTypeConfig.defaultTaskType
    );

    if (!hasDefaultType) {
      this.taskTypeConfig.taskTypes.push({
        name: this.taskTypeConfig.defaultTaskType,
        description: 'Default task type'
      });
    }
  }

  /**
   * Gets the current task type configuration
   * @returns The task type configuration
   */
  public getTaskTypeConfig(): TaskTypeConfig {
    return { ...this.taskTypeConfig };
  }

  /**
   * Gets the default task type
   * @returns The default task type name
   */
  public getDefaultTaskType(): string {
    return this.taskTypeConfig.defaultTaskType;
  }

  /**
   * Gets all available task types
   * @returns Array of task types
   */
  public getTaskTypes(): TaskType[] {
    return [...this.taskTypeConfig.taskTypes];
  }

  /**
   * Finds mistakes relevant to a query, optionally filtered by task type
   * 
   * This method searches the vector store for similar past mistakes that
   * can help inform current task execution.
   * 
   * @param query - Text query describing the current task or context
   * @param options - Options for filtering and limiting results
   * @returns Promise resolving to an array of relevant mistake documents
   * 
   * @example
   * ```typescript
   * const mistakes = await disciple.findMistakes('handling user input', {
   *   taskType: 'code_generation',
   *   limit: 3
   * });
   * ```
   */
  public async findMistakes(
    query: string,
    options?: FindMistakesOptions
  ): Promise<MistakeDocument[]> {
    // TODO: Implement findMistakes
    // This will use the vector store to perform similarity search
    // with filters based on task type
    console.log('findMistakes stub called', { query, options });
    return [];
  }

  /**
   * Adds a new mistake to the knowledge base
   * 
   * @param content - Description of the mistake
   * @param options - Additional options and metadata
   * @returns Promise resolving to the ID of the added mistake document
   * 
   * @example
   * ```typescript
   * const id = await disciple.addMistake('Forgot to validate email format', {
   *   taskType: 'input_validation',
   *   severity: 'medium',
   *   solution: 'Use regex pattern for email validation'
   * });
   * ```
   */
  public async addMistake(
    content: string,
    options?: AddMistakeOptions
  ): Promise<string> {
    // TODO: Implement addMistake
    // This will create a new document with metadata and add it to the vector store
    console.log('addMistake stub called', { content, options });
    return 'stub-id-' + Date.now();
  }

  /**
   * Edits an existing mistake document
   * 
   * @param id - ID of the mistake document to edit
   * @param options - Fields to update
   * @returns Promise resolving when the update is complete
   * 
   * @example
   * ```typescript
   * await disciple.editMistake('mistake-123', {
   *   solution: 'Updated solution with better approach',
   *   severity: 'low'
   * });
   * ```
   */
  public async editMistake(
    id: string,
    options: EditMistakeOptions
  ): Promise<void> {
    // TODO: Implement editMistake
    // This will update the document in the vector store
    console.log('editMistake stub called', { id, options });
  }

  /**
   * Deletes a mistake document from the knowledge base
   * 
   * @param id - ID of the mistake document to delete
   * @returns Promise resolving when the deletion is complete
   * 
   * @example
   * ```typescript
   * await disciple.deleteMistake('mistake-123');
   * ```
   */
  public async deleteMistake(id: string): Promise<void> {
    // TODO: Implement deleteMistake
    // This will remove the document from the vector store
    console.log('deleteMistake stub called', { id });
  }
}
