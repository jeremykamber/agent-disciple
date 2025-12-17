// Main client class
export { AgentDisciple } from './client/AgentDisciple.ts';

// Types and interfaces
export type {
  AgentDiscipleConfig,
  FindMistakesOptions,
  AddMistakeOptions,
  EditMistakeOptions
} from './client/AgentDisciple.ts';

// Domain models
export type {
  MistakeDocument,
  MistakeMetadata,
  TaskType,
  TaskTypeConfig
} from './domain/models/index.ts';

// Domain ports (for implementing adapters)
export type {
  VectorStorePort,
  QueryOptions,
  QueryResult
} from './domain/ports/index.ts';

// Example adapter (for reference/testing)
export { InMemoryVectorStoreAdapter } from './infrastructure/adapters/index.ts';
