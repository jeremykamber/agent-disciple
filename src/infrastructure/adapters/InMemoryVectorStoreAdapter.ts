import type {
  VectorStorePort,
  QueryOptions,
  QueryResult
} from '../../domain/ports/index.ts';
import type { MistakeDocument } from '../../domain/models/index.ts';

/**
 * Simple in-memory implementation of VectorStorePort for testing and examples
 * 
 * This adapter stores documents in memory and performs basic similarity matching.
 * In production, you would use a real vector store like Pinecone, ChromaDB, etc.
 */
export class InMemoryVectorStoreAdapter implements VectorStorePort {
  private documents: Map<string, MistakeDocument> = new Map();

  async addDocuments(documents: MistakeDocument[]): Promise<string[]> {
    const ids: string[] = [];
    for (const doc of documents) {
      this.documents.set(doc.id, doc);
      ids.push(doc.id);
    }
    return ids;
  }

  async similaritySearch(
    query: string,
    options?: QueryOptions
  ): Promise<QueryResult[]> {
    // NOTE: This is a simplified implementation for testing/examples.
    // In production, use actual vector embeddings with cosine similarity.
    const results: QueryResult[] = [];
    const k = options?.k ?? 10;

    for (const [id, doc] of this.documents) {
      // Apply filters if provided
      if (options?.filter) {
        const matchesFilter = Object.entries(options.filter).every(
          ([key, value]) => {
            if (key.startsWith('metadata.')) {
              const metadataKey = key.replace('metadata.', '');
              return doc.metadata[metadataKey] === value;
            }
            // Access document properties with type safety
            if (key in doc) {
              return doc[key as keyof MistakeDocument] === value;
            }
            return false;
          }
        );
        if (!matchesFilter) continue;
      }

      // Simplified keyword matching (not a true similarity measure)
      // Real implementations should use vector embeddings and cosine similarity
      const queryLower = query.toLowerCase();
      const contentLower = doc.content.toLowerCase();
      
      if (contentLower.includes(queryLower)) {
        // Simple scoring: higher score for better matches
        // This is intentionally simplified - use proper vector similarity in production
        const score = Math.min(1.0, queryLower.length / Math.max(queryLower.length, 10));
        
        if (!options?.scoreThreshold || score >= options.scoreThreshold) {
          results.push({ document: doc, score });
        }
      }
    }

    // Sort by score descending and limit results
    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, k);
  }

  async similaritySearchByVector(
    embedding: number[],
    options?: QueryOptions
  ): Promise<QueryResult[]> {
    // In a real implementation, this would use vector similarity (cosine, euclidean, etc.)
    // For now, just return empty results
    return [];
  }

  async updateDocument(
    id: string,
    update: Partial<MistakeDocument>
  ): Promise<void> {
    const doc = this.documents.get(id);
    if (!doc) {
      throw new Error(`Document with id ${id} not found`);
    }

    const updated: MistakeDocument = {
      ...doc,
      ...update,
      metadata: {
        ...doc.metadata,
        ...(update.metadata ?? {})
      }
    };

    this.documents.set(id, updated);
  }

  async deleteDocument(id: string): Promise<void> {
    if (!this.documents.has(id)) {
      throw new Error(`Document with id ${id} not found`);
    }
    this.documents.delete(id);
  }

  async getDocument(id: string): Promise<MistakeDocument | null> {
    return this.documents.get(id) ?? null;
  }
}
