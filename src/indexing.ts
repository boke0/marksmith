import { duckdb } from "./duckdb.js"
import { CliConfig, loadConfig } from "./config.js";
import { globSync } from "glob";
import * as fs from 'fs';
import { ollama } from "./ollama.js";
import { Env } from "./env.js";

interface Result {
  upsertCount: number;
  deleteCount: number;
}

export const indexing = async (): Promise<Result> => {
  await duckdb.init()

  let cliConfig: CliConfig;
  try {
    cliConfig = loadConfig()
  } catch {
    throw new Error('Failed to load repocks.config.ts.')
  }
  const files = cliConfig.targets.flatMap(target => globSync(target))

  const pwd = process.cwd();
  // Initialize DuckDB
  await duckdb.init();

  // Get all existing document IDs from the database
  const existingIds = await duckdb.listIds();

  // Find files that have been deleted (exist in DB but not in file system)
  const currentFileSet = new Set(files);
  const deletedFiles = existingIds.filter(id => !currentFileSet.has(id));

  // Delete removed files from the database
  if (deletedFiles.length > 0) {
    await duckdb.delete({
      indexName: pwd,
      ids: deletedFiles
    });
  }

  if (files.length === 0) {
    return {
      deleteCount: deletedFiles.length,
      upsertCount: 0
    }
  }

  const embeddingModel = ollama.embedding(Env.ollamaEmbeddingModel)
  const values = files.map(file => fs.readFileSync(file, 'utf-8'))
  // Process files and embeddings
  const embeddings = await embeddingModel.doEmbed({ values }).then(res => res.embeddings);

  // Upsert each document with its embedding
  for (let i = 0; i < files.length; i++) {
    await duckdb.upsert({
      indexName: pwd,
      id: files[i],
      values: embeddings[i],
      content: values[i],
      metadata: {
        filePath: files[i],
        indexedAt: new Date().toISOString()
      }
    });
  }

  return {
    upsertCount: files.length,
    deleteCount: deletedFiles.length,
  }
}
