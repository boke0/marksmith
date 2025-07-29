import { Database } from 'duckdb-async';
import * as fs from 'fs';
import path from 'path';

import { Env } from './env.js';

export interface Document {
  id: string;
  content: string;
  metadata?: Record<string, any>;
  embedding?: number[];
}

export class DuckDBVector {
  private db: Database | null = null;
  private dbPath: string;

  constructor(options?: { path?: string }) {
    const storePath = options?.path || path.join(process.cwd(), '.marksmith/store.duckdb')
    fs.mkdirSync(path.dirname(storePath), {
      recursive: true
    })
    this.dbPath = storePath;
  }

  async init(): Promise<void> {
    if(!!this.db) return
    this.db = await Database.create(this.dbPath);

    // Load vss extension
    await this.db.run(`INSTALL vss`);
    await this.db.run(`LOAD vss`);

    // Enable HNSW persistence after loading vss extension
    await this.db.run(`SET hnsw_enable_experimental_persistence = true`);

    // Create single table for documents with embeddings
    await this.db.run(`
      CREATE TABLE IF NOT EXISTS documents (
        id VARCHAR PRIMARY KEY,
        content TEXT NOT NULL,
        embedding FLOAT[1024],
        metadata JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create HNSW index for vector similarity search
    await this.db.run(`
      CREATE INDEX IF NOT EXISTS idx_documents_hnsw ON documents USING HNSW (embedding)
    `);
  }

  async upsert(params: {
    indexName: string;
    id: string;
    values: number[];
    metadata?: Record<string, any>;
    content?: string;
  }): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    // Insert or update document with embedding
    // Convert array to DuckDB list format
    const embeddingList = `[${params.values.join(',')}]`;
    
    await this.db.run(`
      INSERT INTO documents (id, content, embedding, metadata)
      VALUES (?, ?, ${embeddingList}::FLOAT[1024], ?)
      ON CONFLICT (id) DO UPDATE SET
        content = EXCLUDED.content,
        embedding = EXCLUDED.embedding,
        metadata = EXCLUDED.metadata
    `, params.id, params.content || '', JSON.stringify(params.metadata || {}));
  }

  async query(params: {
    indexName: string;
    queryVector: number[];
    topK?: number;
    filter?: Record<string, any>;
  }): Promise<Array<{ id: string; score: number; metadata?: Record<string, any>; content?: string }>> {
    if (!this.db) throw new Error('Database not initialized');

    const topK = params.topK || 10;

    // Calculate cosine similarity using vss extension
    // Convert query vector to DuckDB list format
    const queryList = `[${params.queryVector.join(',')}]`;
    
    const results = await this.db.all(`
      SELECT 
        id,
        content,
        metadata,
        array_cosine_similarity(embedding::FLOAT[1024], ${queryList}::FLOAT[1024]) as score
      FROM documents
      WHERE embedding IS NOT NULL
      ORDER BY score DESC
      LIMIT ?
    `, topK) as Array<{
      id: string;
      score: number;
      metadata: string;
      content: string;
    }>;

    return results.map(row => ({
      id: row.id,
      score: row.score,
      content: row.content,
      metadata: row.metadata ? JSON.parse(row.metadata) : undefined
    }));
  }

  async delete(params: {
    indexName: string;
    ids: string[];
  }): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const placeholders = params.ids.map(() => '?').join(',');
    await this.db.run(
      `DELETE FROM documents WHERE id IN (${placeholders})`,
      ...params.ids
    );
  }

  async listIds(): Promise<string[]> {
    if (!this.db) throw new Error('Database not initialized');

    const results = await this.db.all(`
      SELECT id FROM documents
    `) as Array<{ id: string }>;

    return results.map(row => row.id);
  }

  async close(): Promise<void> {
    if (this.db) {
      await this.db.close();
      this.db = null;
    }
  }
}

export const duckdb = new DuckDBVector();
