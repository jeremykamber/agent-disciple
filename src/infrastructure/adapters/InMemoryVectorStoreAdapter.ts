import type {
  VectorStorePort,
  QueryOptions,
  QueryResult
} from '../../domain/ports/index.ts';
import type { MistakeDocument } from '../../domain/models/index.ts';
import { HierarchicalNSW } from 'hnswlib-node';

/**
 * In-memory implementation of VectorStorePort using HNSW for efficient similarity search
 * 
 * This adapter uses the Hierarchical Navigable Small World (HNSW) algorithm for
 * approximate nearest neighbor search with vector embeddings.
 */
export class InMemoryVectorStoreAdapter implements VectorStorePort {
  private documents: Map<string, MistakeDocument> = new Map();
  private index: HierarchicalNSW | null = null;
  private idToLabel: Map<string, number> = new Map();
  private labelToId: Map<number, string> = new Map();
  private nextLabel = 0;
  private dimension = 384; // Embedding dimension
  private maxElements = 10000;
  private vocabulary: Set<string> = new Set();
  private idf: Map<string, number> = new Map();

  /**
   * Initialize the HNSW index
   */
  private initializeIndex(): void {
    if (!this.index) {
      this.index = new HierarchicalNSW('cosine', this.dimension);
      this.index.initIndex(this.maxElements);
    }
  }

  /**
   * Simple text tokenizer
   */
  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(token => token.length > 0);
  }

  /**
   * Generate TF-IDF based embedding for text
   * This creates a fixed-dimension vector representation
   */
  private generateEmbedding(text: string): number[] {
    const tokens = this.tokenize(text);
    const termFreq = new Map<string, number>();
    
    // Calculate term frequency
    for (const token of tokens) {
      termFreq.set(token, (termFreq.get(token) || 0) + 1);
      this.vocabulary.add(token);
    }

    // Create a fixed-size embedding using hashing trick
    const embedding = new Array(this.dimension).fill(0);
    
    for (const [term, freq] of termFreq) {
      // Use simple hash function to map term to dimension
      const hash = this.simpleHash(term) % this.dimension;
      const tf = freq / tokens.length;
      const idfValue = this.idf.get(term) || 1;
      embedding[hash] += tf * idfValue;
    }

    // Normalize the embedding
    const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    if (magnitude > 0) {
      for (let i = 0; i < embedding.length; i++) {
        embedding[i] /= magnitude;
      }
    }

    return embedding;
  }

  /**
   * Simple hash function for mapping terms to dimensions
   */
  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Update IDF values for all documents
   * Note: This recalculates IDF for all documents (O(n) complexity).
   * For large-scale production use with frequent updates, consider incremental IDF updates.
   */
  private updateIDF(): void {
    const docCount = this.documents.size;
    if (docCount === 0) return;

    const docFreq = new Map<string, number>();
    
    // Count document frequency for each term
    for (const doc of this.documents.values()) {
      const tokens = new Set(this.tokenize(doc.content));
      for (const token of tokens) {
        docFreq.set(token, (docFreq.get(token) || 0) + 1);
      }
    }

    // Calculate IDF
    for (const [term, freq] of docFreq) {
      this.idf.set(term, Math.log(docCount / freq));
    }
  }

  async addDocuments(documents: MistakeDocument[]): Promise<string[]> {
    this.initializeIndex();
    const ids: string[] = [];
    
    for (const doc of documents) {
      this.documents.set(doc.id, doc);
      ids.push(doc.id);

      // Generate or use existing embedding
      const embedding = doc.embedding || this.generateEmbedding(doc.content);
      
      // Add to HNSW index
      const label = this.nextLabel++;
      this.idToLabel.set(doc.id, label);
      this.labelToId.set(label, doc.id);
      
      this.index!.addPoint(embedding, label);
    }

    // Update IDF values after adding documents
    this.updateIDF();
    
    return ids;
  }

  async similaritySearch(
    query: string,
    options?: QueryOptions
  ): Promise<QueryResult[]> {
    if (!this.index || this.documents.size === 0) {
      return [];
    }

    const k = options?.k ?? 10;
    const queryEmbedding = this.generateEmbedding(query);
    
    // Search using HNSW
    const result = this.index.searchKnn(queryEmbedding, Math.min(k * 2, this.documents.size));
    
    const results: QueryResult[] = [];
    
    for (let i = 0; i < result.neighbors.length; i++) {
      const item = result.neighbors[i];
      if (item === undefined) continue;
      
      const docId = this.labelToId.get(item);
      if (!docId) continue;
      
      const doc = this.documents.get(docId);
      if (!doc) continue;

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

      const distance = result.distances[i];
      if (distance === undefined) continue;
      
      // Convert distance to similarity score
      // Cosine distance ranges from 0 (identical) to 2 (opposite)
      // Convert to similarity score: 1 - (distance / 2) gives us 0-1 range
      const score = 1 - (distance / 2);
      
      if (!options?.scoreThreshold || score >= options.scoreThreshold) {
        results.push({ document: doc, score });
      }

      if (results.length >= k) break;
    }

    return results;
  }

  async similaritySearchByVector(
    embedding: number[],
    options?: QueryOptions
  ): Promise<QueryResult[]> {
    if (!this.index || this.documents.size === 0) {
      return [];
    }

    if (embedding.length !== this.dimension) {
      throw new Error(`Embedding dimension mismatch. Expected ${this.dimension}, got ${embedding.length}`);
    }

    const k = options?.k ?? 10;
    
    // Search using HNSW
    const result = this.index.searchKnn(embedding, Math.min(k * 2, this.documents.size));
    
    const results: QueryResult[] = [];
    
    for (let i = 0; i < result.neighbors.length; i++) {
      const item = result.neighbors[i];
      if (item === undefined) continue;
      
      const docId = this.labelToId.get(item);
      if (!docId) continue;
      
      const doc = this.documents.get(docId);
      if (!doc) continue;

      // Apply filters if provided
      if (options?.filter) {
        const matchesFilter = Object.entries(options.filter).every(
          ([key, value]) => {
            if (key.startsWith('metadata.')) {
              const metadataKey = key.replace('metadata.', '');
              return doc.metadata[metadataKey] === value;
            }
            if (key in doc) {
              return doc[key as keyof MistakeDocument] === value;
            }
            return false;
          }
        );
        if (!matchesFilter) continue;
      }

      const distance = result.distances[i];
      if (distance === undefined) continue;
      
      // Convert cosine distance (0-2) to similarity score (0-1)
      const score = 1 - (distance / 2);
      
      if (!options?.scoreThreshold || score >= options.scoreThreshold) {
        results.push({ document: doc, score });
      }

      if (results.length >= k) break;
    }

    return results;
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

    // If content changed, rebuild the index to update embeddings
    // Note: For production use with frequent updates, consider using a vector store
    // that supports in-place updates (e.g., Pinecone, Qdrant)
    if (update.content !== undefined && this.index) {
      await this.rebuildIndex();
    }
  }

  /**
   * Rebuild the HNSW index from scratch with current documents
   * This is used when documents are updated or deleted
   */
  private async rebuildIndex(): Promise<void> {
    // Reset index and mappings
    this.index = null;
    this.idToLabel.clear();
    this.labelToId.clear();
    this.nextLabel = 0;

    // Update IDF values
    this.updateIDF();

    // Re-initialize and rebuild
    this.initializeIndex();

    for (const [id, doc] of this.documents) {
      const embedding = doc.embedding || this.generateEmbedding(doc.content);
      const label = this.nextLabel++;
      this.idToLabel.set(id, label);
      this.labelToId.set(label, id);
      this.index!.addPoint(embedding, label);
    }
  }

  async deleteDocument(id: string): Promise<void> {
    if (!this.documents.has(id)) {
      throw new Error(`Document with id ${id} not found`);
    }
    
    // Remove from documents map
    this.documents.delete(id);
    
    // Rebuild index to remove deleted document
    // Note: For production use with frequent deletions, consider using a vector store
    // that supports efficient deletions (e.g., Pinecone, Qdrant)
    if (this.index) {
      await this.rebuildIndex();
    }
  }

  async getDocument(id: string): Promise<MistakeDocument | null> {
    return this.documents.get(id) ?? null;
  }
}
