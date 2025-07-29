# MarkSmith

Transform your Markdown documentation into an intelligent knowledge base. MarkSmith indexes your documents and provides AI-powered search and Q&A capabilities through an MCP server.

## What is MarkSmith?

MarkSmith turns your collection of Markdown files into a searchable knowledge base that AI assistants can query. Whether you have technical documentation, meeting notes, or personal knowledge management files, MarkSmith makes them accessible through natural language queries.

### Key Benefits

- **Smart Search**: Find relevant information using natural language, not just keywords
- **AI-Powered Q&A**: Get comprehensive answers based on your documentation
- **Easy to Update**: Run index command to sync changes in your documents
- **Works with Any MCP Client**: Compatible with Claude Desktop, Cline, and other MCP-supporting AI tools
- **Local & Private**: Your data stays on your machine

## Quick Start

### Prerequisites

- Node.js 20.9.0 or higher
- [Ollama](https://ollama.ai/) running locally
- npm, yarn, pnpm, etc.

### Installation

```bash
# Install MarkSmith
npm install -g marksmith

# Download required AI models
ollama pull qwen3:4b
ollama pull mxbai-embed-large
```

### Basic Usage

1. **Index your documents:**
   ```bash
   marksmith index
   ```
   This scans your Markdown files and creates a searchable index.

2. **Start the MCP server:**
   ```bash
   marksmith start
   ```
   Now your knowledge base is ready to answer questions!

## Configuration

### Specifying Document Locations

By default, MarkSmith indexes:
- `~/.marksmith/**/*.md` (your personal notes)
- `./docs/**/*.md` (project documentation)

To customize, create `marksmith.config.json`:

```json
{
  "targets": [
    "./my-notes/**/*.md",
    "./team-docs/**/*.md",
    "~/Documents/obsidian/**/*.md"
  ]
}
```

### Using Different AI Models

Set environment variables to use different Ollama models:

```bash
# Use a different LLM
export OLLAMA_LLM="llama2:13b"

# Use a different embedding model
export OLLAMA_EMBEDDING_MODEL="nomic-embed-text"

# Use a remote Ollama instance
export OLLAMA_BASE_URL="http://192.168.1.100:11434/api"
```

## Integration with Claude Desktop

Add MarkSmith to your Claude Desktop configuration:

1. Open Claude Desktop settings
2. Go to Developer > Model Context Protocol
3. Add the following configuration:

```json
{
  "mcpServers": {
    "marksmith": {
      "command": "marksmith",
      "args": ["start"]
    }
  }
}
```

Now you can ask Claude questions about your documentation!

## Example Use Cases

### Personal Knowledge Management
- "What did I write about project architecture last month?"
- "Find my notes on Docker best practices"
- "Summarize my meeting notes from Q3"

### Technical Documentation
- "How do I configure the authentication module?"
- "What are the API endpoints for user management?"
- "Show me examples of error handling in our codebase"

### Research & Learning
- "What have I learned about machine learning?"
- "Find all references to distributed systems"
- "Create a summary of my React hooks notes"

## Commands Reference

### `marksmith index`
Scans and indexes all Markdown files in configured paths. Run this:
- After adding new documents
- When you've made significant changes
- To ensure your index is up-to-date

### `marksmith start`
Starts the MCP server. Keep this running while using AI assistants.

## Troubleshooting

### "No documents found"
- Check your `marksmith.config.json` paths
- Ensure `.md` files exist in those locations
- Run `marksmith index` to rebuild the index

### "Cannot connect to Ollama"
- Start Ollama: `ollama serve`
- Check if models are installed: `ollama list`
- Verify the API URL matches your setup

### "Search returns irrelevant results"
- Try more specific queries
- Re-index your documents
- Consider using a more powerful embedding model

## License

MIT
