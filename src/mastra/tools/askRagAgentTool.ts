import { createTool } from '@mastra/core'
import z from 'zod'
import { ragAgent } from '../agents/ragAgent.js';

export const askRagAgentTool = createTool({
  id: 'askRagAgentTool',
  inputSchema: z.object({
    question: z.string()
  }),
  description: 'Recommended: Smart knowledge assistant that automatically searches and analyzes multiple relevant documents to provide comprehensive answers. Unlike basic document search, this agent intelligently combines information from various sources, identifies connections between documents, and delivers well-structured insights with proper citations. Ideal for complex queries requiring deep understanding of your knowledge base.',
  execute: async ({ context }) => {
    const results = await ragAgent.generate(context.question)
    return {
      contents: results.text ? results.text : 'No faq found.'
    }
  }
})
