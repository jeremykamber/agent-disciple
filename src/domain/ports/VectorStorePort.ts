import type { MistakeDocument, MistakeMetadata } from '../models/Document.ts';

/**
 * Query options for searching the vector store
 */
export interface QueryOptions {
  /**
   * Number of results to return
   */
  k?: number;

  /**
   * Filter to apply to the search (e.g., by taskType)
   */
  filter?: Record<string, unknown>;

  /**
   * Minimum similarity score threshold (0-1)
   */
  scoreThreshold?: number;
}

/**
 * Result from a vector store query
 */
export interface QueryResult {
  /**
   * The matching document
   */
  document: MistakeDocument;

  /**
   * Similarity score (0-1, higher is more similar)
   */
  score: number;
}

/**
 * Port interface for vector store adapters
 * This interface is designed to be compatible with LangChain's VectorStore abstraction
 * and can be adapted to work with Pinecone, ChromaDB, or any other vector store
 */
export interface VectorStorePort {
  /**
   * Add documents to the vector store
   * @param documents - Documents to add
   * @returns Promise resolving to the IDs of added documents
   */
  addDocuments(documents: MistakeDocument[]): Promise<string[]>;

  /**
   * Search for similar documents based on a query
   * @param query - Text query to search for
   * @param options - Query options including filters
   * @returns Promise resolving to matching documents with scores
   */
  similaritySearch(query: string, options?: QueryOptions): Promise<QueryResult[]>;

  /**
   * Search for similar documents based on an embedding vector
   * @param embedding - Embedding vector to search with
   * @param options - Query options including filters
   * @returns Promise resolving to matching documents with scores
   */
  similaritySearchByVector(
    embedding: number[],
    options?: QueryOptions
  ): Promise<QueryResult[]>;

  /**
   * Update an existing document
   * @param id - Document ID to update
   * @param document - Updated document data
   * @returns Promise resolving when update is complete
   */
  updateDocument(id: string, document: Partial<MistakeDocument>): Promise<void>;

  /**
   * Delete a document by ID
   * @param id - Document ID to delete
   * @returns Promise resolving when deletion is complete
   */
  deleteDocument(id: string): Promise<void>;

  /**
   * Get a document by ID
   * @param id - Document ID to retrieve
   * @returns Promise resolving to the document or null if not found
   */
  getDocument(id: string): Promise<MistakeDocument | null>;
}
