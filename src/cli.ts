#!/usr/bin/env node
import { Command } from 'commander';
import { server } from './mastra/index.js';
import { CliConfig, loadConfig } from './config.js';
import { indexing } from './indexing.js';

const program = new Command('repocks')
  .description('A tool to turn project documents into a RAG & MCP server');

program
  .command('index')
  .description('Index markdown files for semantic search by creating embeddings')
  .action(async () => {
    try {
      const {
        upsertCount,
        deleteCount,
      } = await indexing()

      console.log(`Deleted ${deleteCount} files successfully.`)
      console.log(`Indexed ${upsertCount} files successfully.`)
    }catch(e){
      if(e instanceof Error){
        console.error(e.message)
      }
    }
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
