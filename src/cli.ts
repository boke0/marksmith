#!/usr/bin/env node
import { Command } from 'commander';
import * as fs from 'fs';
import { globSync } from 'glob';
import http from 'http';
import { server } from './mastra/index.js';
import { duckdb } from './duckdb.js';
import { ollama } from './ollama.js';
import { Env } from './env.js';
import { CliConfig, loadConfig } from './config.js';

const program = new Command('repocks')
  .description('A tool to turn project documents into a RAG & MCP server');

program
  .command('index')
  .description('Index markdown files for semantic search by creating embeddings')
  .action(async () => {
    const logComplete = (n: number) => {
      console.log(`Indexed ${n} files successfully.`)
    }

    let cliConfig: CliConfig;
    try {
      cliConfig = loadConfig()
    } catch {
      console.error('Failed to load repocks.config.ts.')
      return
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
      console.log(`Removed ${deletedFiles.length} deleted files from the database.`);
    }

    if(files.length === 0){
      logComplete(0)
      return
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

    logComplete(files.length)
  })

program
  .command('start')
  .description('Start the MCP server for document search and RAG capabilities')
  .action(() => {
    let cliConfig: CliConfig;
    try {
      cliConfig = loadConfig()
    } catch {
      console.error('Failed to load repocks.config.ts.')
      return
    }
    server.startStdio().catch((error) => {
      console.error("Error running MCP server:", error);
      process.exit(1);
    });
  })

program.parse()
