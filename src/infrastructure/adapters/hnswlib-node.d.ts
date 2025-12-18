/**
 * Type declarations for hnswlib-node
 */
declare module 'hnswlib-node' {
  export interface SearchResult {
    distances: number[];
    neighbors: number[];
  }

  export class HierarchicalNSW {
    constructor(space: 'l2' | 'ip' | 'cosine', dimension: number);
    
    initIndex(maxElements: number, m?: number, efConstruction?: number, randomSeed?: number): void;
    
    addPoint(point: number[], label: number, replaceDeleted?: boolean): void;
    
    searchKnn(query: number[], k: number, filter?: (label: number) => boolean): SearchResult;
    
    getMaxElements(): number;
    
    getCurrentCount(): number;
    
    getEfSearch(): number;
    
    setEfSearch(ef: number): void;
    
    saveIndex(path: string): void;
    
    loadIndex(path: string, maxElements: number): void;
    
    markDeleted(label: number): void;
    
    unmarkDeleted(label: number): void;
    
    resizeIndex(newSize: number): void;
  }
}
