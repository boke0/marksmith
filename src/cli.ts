import { Command } from 'commander';
import * as fs from 'fs';
import { globSync } from 'glob';
import http from 'http';
import { server } from './mastra';
import { chroma } from './chroma';
import { ollama } from './ollama';
import { Env } from './env';
import { CliConfig, loadConfig } from './config';

const program = new Command();

program
  .command('index')
  .action(async () => {
    let cliConfig: CliConfig;
    try {
      cliConfig = loadConfig()
    } catch {
      console.error('Failed to load marksmith.config.ts.')
      return
    }
    const files = cliConfig.targets.flatMap(target => globSync(target))
    const pwd = process.cwd();
    try {
      await chroma.createIndex({
        indexName: pwd,
        dimension: 1024,
      })
    } catch { }

    const embeddingModel = ollama.embedding(Env.ollamaEmbeddingModel)
    await chroma.upsert({
      indexName: pwd,
      vectors: await embeddingModel.doEmbed({
        values: files.map(file => fs.readFileSync(file, 'utf-8'))
      }).then(res => res.embeddings),
      ids: files
    })
  })

program
  .command('start')
  .action(() => {
    let cliConfig: CliConfig;
    try {
      cliConfig = loadConfig()
    } catch {
      console.error('Failed to load marksmith.config.ts.')
      return
    }
    const httpServer = http.createServer(async (req, res) => {
      await server.startHTTP({
        url: new URL(`http://localhost:${cliConfig.port}`),
        httpPath: "/mcp",
        req,
        res
      })
    })
    httpServer.listen(cliConfig.port)
  })

program.parse()
