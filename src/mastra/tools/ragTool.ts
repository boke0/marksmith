import { ChromaVector } from '@mastra/chroma'
import { createTool } from '@mastra/core'
import z from 'zod'
import { embed } from 'ai';
import { ollama } from '../../ollama';
import { chroma } from '../../chroma';
import { Env } from '../../env';

export const ragTool = createTool({
  id: 'Rag',
  inputSchema: z.object({
    query: z.string()
  }),
  description: '',
  execute: async ({ context }) => {
    const { embedding } = await embed({
      model: ollama.embedding(Env.ollamaEmbeddingModel),
      value: context.query,
    })
    const results = await chroma.query({
      indexName: '',
      queryVector: embedding,
    })
    return {
      contents: results ? results : 'No faq found.'
    }
  }
})
