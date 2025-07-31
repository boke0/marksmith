import { DuckDBConnection, DuckDBInstance } from '@duckdb/node-api';
import * as fs from 'fs';
import path from 'path';
import lockfile from 'proper-lockfile';

import { Env } from './env.js';

export interface Document {
  id: string;
  content: string;
  metadata?: Record<string, any>;
  embedding?: number[];
}

const getDbPath = (): string => {
  const storePath = path.join(process.cwd(), '.repocks/store.duckdb');
  fs.mkdirSync(path.dirname(storePath), {
    recursive: true
  });
  return storePath;
};

export async function withConnection<T>(fn: (conn: DuckDBConnection) => Promise<T>): Promise<T> {
  const dbPath = getDbPath();
  const lockPath = `${dbPath}.lock`;
  
  // Ensure the lock file exists before locking
  if (!fs.existsSync(lockPath)) {
    fs.writeFileSync(lockPath, '');
  }
  
  // Acquire lock on the .lock file instead of the database file
  const release = await lockfile.lock(lockPath, {
    retries: {
      retries: 10,
      minTimeout: 100,
      maxTimeout: 1000,
      randomize: true
    },
    stale: 10000 // Consider lock stale after 10 seconds
  });
  
  let instance: DuckDBInstance | null = null;
  let conn: DuckDBConnection | null = null;
  
  try {
    instance = await DuckDBInstance.create(dbPath);
    conn = await instance.connect();
    
    // Initialize database schema if needed
    await initializeSchema(conn);
    
    return await fn(conn);
  } finally {
    if (conn) {
      conn.closeSync();
    }
    if (instance) {
      instance.closeSync();
    }
    await release();
  }
}

async function initializeSchema(conn: DuckDBConnection): Promise<void> {
  // Load vss extension (idempotent - safe to run multiple times)
  await conn.run(`INSTALL vss`);
  await conn.run(`LOAD vss`);

  // Enable HNSW persistence after loading vss extension
  await conn.run(`SET hnsw_enable_experimental_persistence = true`);

  // Create single table for documents with embeddings
  await conn.run(`
    CREATE TABLE IF NOT EXISTS documents (
      id VARCHAR PRIMARY KEY,
      content TEXT NOT NULL,
      embedding FLOAT[1024],
      metadata JSON,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create HNSW index for vector similarity search
  await conn.run(`
    CREATE INDEX IF NOT EXISTS idx_documents_hnsw ON documents USING HNSW (embedding)
  `);
}

export async function upsert(conn: DuckDBConnection, params: {
  indexName: string;
  id: string;
  values: number[];
  metadata?: Record<string, any>;
  content?: string;
}): Promise<void> {
  // Insert or update document with embedding
  // Convert array to DuckDB list format
  const embeddingList = `[${params.values.join(',')}]`;
  
  await conn.run(`
    INSERT INTO documents (id, content, embedding, metadata)
    VALUES ($1, $2, ${embeddingList}::FLOAT[1024], $3)
    ON CONFLICT (id) DO UPDATE SET
      content = EXCLUDED.content,
      embedding = EXCLUDED.embedding,
      metadata = EXCLUDED.metadata
  `, [params.id, params.content || '', JSON.stringify(params.metadata || {})]);
}

export async function query(conn: DuckDBConnection, params: {
  indexName: string;
  queryVector: number[];
  topK?: number;
  filter?: Record<string, any>;
}): Promise<Array<{ id: string; score: number; metadata?: Record<string, any>; content?: string }>> {
  const topK = params.topK || 10;

  // Calculate cosine similarity using vss extension
  // Convert query vector to DuckDB list format
  const queryList = `[${params.queryVector.join(',')}]`;
  
  const reader = await conn.runAndReadAll(`
    SELECT 
      id,
      content,
      metadata,
      array_cosine_similarity(embedding::FLOAT[1024], ${queryList}::FLOAT[1024]) as score
    FROM documents
    WHERE embedding IS NOT NULL
    ORDER BY score DESC
    LIMIT ${topK}
  `);
  
  const results = reader.getRowObjects() as Array<{
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

export async function deleteDocuments(conn: DuckDBConnection, params: {
  indexName: string;
  ids: string[];
}): Promise<void> {
  const placeholders = params.ids.map((_, i) => `$${i + 1}`).join(',');
  await conn.run(
    `DELETE FROM documents WHERE id IN (${placeholders})`,
    params.ids
  );
}

export async function listIds(conn: DuckDBConnection): Promise<string[]> {
  const reader = await conn.runAndReadAll(`
    SELECT id FROM documents
  `);
  
  const results = reader.getRowObjects() as Array<{ id: string }>;
  return results.map(row => row.id);
}
