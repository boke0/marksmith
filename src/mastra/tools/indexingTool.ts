import { createTool } from "@mastra/core";
import { indexing } from "../../indexing.js";
import z from "zod";

export const indexingTool = createTool({
  id: 'IndexTool',
  inputSchema: z.object({}),
  description: 'Re-index documents to reflect updates in the knowledge base. Use this when documents have been added, modified, or deleted to ensure search results are up-to-date.',
  execute: async (_) => {
    try {
      const {
        upsertCount,
        deleteCount,
      } = await indexing()
      return {
        success: true,
        upsertCount,
        deleteCount,
      }
    }catch(e){
      return {
        success: false,
        error: e instanceof Error ? e.message : '',
      }
    }
  }
})
