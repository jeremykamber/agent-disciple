# agent-disciple

A TypeScript package that lets AI learn from its mistakes using a RAG (Retrieval-Augmented Generation) vector store with task-based metadata.

## Features

- 🧠 **Task-Based Learning**: Organize mistakes by task type for more effective retrieval
- 🔌 **Flexible Vector Store**: Compatible with LangChain's vector store abstraction, Pinecone, ChromaDB, and more
- 🏗️ **Hexagonal Architecture**: Clean, maintainable code structure with clear separation of concerns
- 🎯 **Simple API**: Easy-to-use client interface despite powerful underlying architecture
- 📝 **Rich Metadata**: Track severity, context, solutions, and custom metadata
- 🔍 **Smart Querying**: Find relevant past mistakes based on current task context

## Installation

```bash
bun add agent-disciple
```

Or with npm:

```bash
npm install agent-disciple
```

## Quick Start

```typescript
import { AgentDisciple, InMemoryVectorStoreAdapter } from 'agent-disciple';

// Create a vector store adapter (use your preferred vector store)
const vectorStore = new InMemoryVectorStoreAdapter();

// Initialize AgentDisciple
const disciple = new AgentDisciple({
  vectorStore,
  taskTypeConfig: {
    defaultTaskType: 'code_generation',
    taskTypes: [
      { name: 'code_generation', description: 'Generating code' },
      { name: 'data_analysis', description: 'Analyzing data' },
      { name: 'general', description: 'General-purpose tasks' }
    ]
  }
});

// Add a mistake
const id = await disciple.addMistake('Forgot to validate email format', {
  taskType: 'code_generation',
  severity: 'medium',
  solution: 'Use regex pattern for email validation',
  context: 'User registration form'
});

// Find similar mistakes for a task
const mistakes = await disciple.findMistakes('handling user input', {
  taskType: 'code_generation',
  limit: 5
});

// Edit a mistake
await disciple.editMistake(id, {
  severity: 'low',
  solution: 'Updated: Use built-in email validator library'
});

// Delete a mistake
await disciple.deleteMistake(id);
```

## Architecture

This package uses hexagonal (ports and adapters) architecture:

- **Domain Layer**: Core business logic and interfaces
  - `models/`: Data models (Document, TaskType)
  - `ports/`: Interfaces for external dependencies (VectorStorePort)
- **Application Layer**: Use cases and application logic
- **Infrastructure Layer**: Concrete implementations
  - `adapters/`: Vector store adapter implementations
- **Client Layer**: User-facing API (AgentDisciple class)

## Vector Store Adapters

The package is designed to work with any vector store through the `VectorStorePort` interface. You can use the included `InMemoryVectorStoreAdapter` for testing or implement your own adapter for production vector stores.

### Implementing a Custom Adapter

```typescript
import type { VectorStorePort } from 'agent-disciple';

class MyVectorStoreAdapter implements VectorStorePort {
  async addDocuments(documents) {
    // Your implementation
  }
  
  async similaritySearch(query, options) {
    // Your implementation
  }
  
  // ... implement other methods
}
```

### Compatible Vector Stores

- Pinecone
- ChromaDB
- Weaviate
- Qdrant
- Milvus
- Any LangChain-compatible vector store

## Task Types

Task types help organize mistakes by the type of work being done, making retrieval more relevant and effective.

### Default Configuration

By default, AgentDisciple uses a `"general"` task type if none is specified.

### Custom Task Types

```typescript
const disciple = new AgentDisciple({
  vectorStore,
  taskTypeConfig: {
    defaultTaskType: 'custom_task',
    taskTypes: [
      { name: 'custom_task', description: 'My custom task type' },
      { name: 'another_task', description: 'Another task type' }
    ]
  }
});
```

## API Reference

### AgentDisciple

#### Constructor

```typescript
new AgentDisciple(config: AgentDiscipleConfig)
```

#### Methods

- `findMistakes(query: string, options?: FindMistakesOptions): Promise<MistakeDocument[]>`
  - Find relevant mistakes based on a query
  
- `addMistake(content: string, options?: AddMistakeOptions): Promise<string>`
  - Add a new mistake to the knowledge base
  
- `editMistake(id: string, options: EditMistakeOptions): Promise<void>`
  - Update an existing mistake
  
- `deleteMistake(id: string): Promise<void>`
  - Remove a mistake from the knowledge base

- `getTaskTypeConfig(): TaskTypeConfig`
  - Get the current task type configuration
  
- `getDefaultTaskType(): string`
  - Get the default task type
  
- `getTaskTypes(): TaskType[]`
  - Get all available task types

## Development

```bash
# Install dependencies
bun install

# Run type checking
bun run typecheck

# Build the package
bun run build
```

## License

MIT © Jeremy

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.