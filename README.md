# Read-Only Typesense MCP Server

A Model Context Protocol (MCP) server providing read-only access to Typesense Cloud. Built with the official `@modelcontextprotocol/sdk` and `typesense` packages.

## Features

- 🔍 **Search Operations**: Full-text search with filters, facets, sorting, and multi-search
- 📚 **Collections**: List and inspect collection schemas
- 📄 **Documents**: Retrieve, search, and export documents
- 🎯 **Curations**: Access search overrides
- 🔤 **Synonyms**: View synonym configurations
- 🏷️ **Aliases**: Manage collection aliases
- 📊 **Analytics**: Access analytics rules
- ⚕️ **Cluster Info**: Health checks, metrics, and statistics
- 🔒 **Read-Only**: Safe for production use with search-only API keys

## Installation

```bash
npm install
npm run build
```

## Configuration

Create `config/typesense.json`:

```json
{
  "nodes": [
    {
      "host": "xxx.a1.typesense.net",
      "port": 443,
      "protocol": "https"
    }
  ],
  "nearestNode": {
    "host": "xxx.a1.typesense.net",
    "port": 443,
    "protocol": "https"
  },
  "apiKey": "your-search-only-api-key",
  "connectionTimeoutSeconds": 10
}
```

### Environment Variables

- `TYPESENSE_CONFIG_PATH`: Path to config file (default: `config/typesense.json`)
- `TYPESENSE_API_KEY`: Override API key from config file

## Available Tools (18)

### Collections
- `typesense_list_collections` - List all collections with schemas
- `typesense_get_collection` - Get specific collection schema

### Documents
- `typesense_search` - Full-text search with filters, facets, sorting
- `typesense_get_document` - Get document by ID
- `typesense_export_documents` - Export documents as JSONL
- `typesense_multi_search` - Federated search across collections

### Curations/Overrides
- `typesense_list_overrides` - List overrides for collection
- `typesense_get_override` - Get specific override

### Synonyms
- `typesense_list_synonyms` - List synonyms for collection
- `typesense_get_synonym` - Get specific synonym

### Aliases
- `typesense_list_aliases` - List all aliases
- `typesense_get_alias` - Get specific alias

### Analytics
- `typesense_list_analytics_rules` - List analytics rules
- `typesense_get_analytics_rule` - Get specific rule

### Cluster
- `typesense_health` - Node health status
- `typesense_metrics` - RAM/CPU/disk metrics
- `typesense_stats` - API request stats
- `typesense_debug` - Version and state info

## MCP Resources

- `typesense://collections/{name}/schema` - Collection schema
- `typesense://cluster/health` - Cluster health status

## Testing

Test with the MCP Inspector:

```bash
npm run inspect
```

## Claude Desktop Integration

Add to your Claude Desktop config (`~/Library/Application Support/Claude/claude_desktop_config.json` on macOS):

```json
{
  "mcpServers": {
    "typesense": {
      "command": "node",
      "args": ["/path/to/readonly-typesense-mcp/build/index.js"],
      "env": {
        "TYPESENSE_CONFIG_PATH": "/path/to/config/typesense.json"
      }
    }
  }
}
```

## Example Usage

Once integrated with Claude Desktop, you can ask questions like:

- "What collections are available in Typesense?"
- "Search for products with price greater than 100"
- "Show me the schema for the users collection"
- "What's the health status of the Typesense cluster?"
- "Export all documents from the products collection"

## Development

```bash
# Watch mode for development
npm run watch

# Build
npm run build

# Test with inspector
npm run inspect
```

## License

MIT
