import { withConnection, listIds, deleteDocuments, upsert } from "./duckdb.js"
import { CliConfig, loadConfig } from "./config.js";
import * as fs from 'fs';
import { ollama } from "./ollama.js";
import { Env } from "./env.js";
import untildify from "untildify";

interface Result {
  upsertCount: number;
  deleteCount: number;
}

export const indexing = async (): Promise<Result> => {
  let cliConfig: CliConfig;
  try {
    cliConfig = loadConfig()
  } catch {
    throw new Error('Failed to load repocks.config.ts.')
  }
  const files = cliConfig.targets.flatMap(target => fs.globSync(untildify(target)))

  const pwd = process.cwd();

  // Use withConnection to batch all operations
  const result = await withConnection(async (conn) => {
    // Get all existing document IDs from the database
    const existingIds = await listIds(conn);

    // Find files that have been deleted (exist in DB but not in file system)
    const currentFileSet = new Set(files);
    const deletedFiles = existingIds.filter(id => !currentFileSet.has(id));

    // Delete removed files from the database
    if (deletedFiles.length > 0) {
      await deleteDocuments(conn, {
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

    // Upsert all documents in batch
    for (let i = 0; i < files.length; i++) {
      await upsert(conn, {
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
      deleteCount: deletedFiles.length,
      upsertCount: files.length
    }
  });

  return result;
}
