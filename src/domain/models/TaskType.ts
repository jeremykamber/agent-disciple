/**
 * Represents a task type configuration
 */
export interface TaskType {
  /**
   * Unique name/identifier for the task type
   */
  name: string;

  /**
   * Optional description of what this task type represents
   */
  description?: string;
}

/**
 * Configuration for task types in the system
 */
export interface TaskTypeConfig {
  /**
   * The default task type to use when none is specified
   * @default "general"
   */
  defaultTaskType: string;

  /**
   * Available task types in the system
   */
  taskTypes: TaskType[];
}
