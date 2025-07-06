# ForensicAnalyzerPro API

Backend API for the ForensicAnalyzerPro multi-LLM forensic analysis platform.

## Overview

This API provides endpoints for:
- Multi-model forensic analysis via OpenRouter
- File parsing and processing
- Real-time streaming updates
- Artifact storage and management
- Report generation

## Architecture

```
api/
├── lib/
│   ├── routes/
│   │   └── analysis.ts         # Analysis endpoints
│   ├── services/
│   │   ├── openrouter-analysis-service.ts  # Multi-LLM orchestration
│   │   ├── file-parser-service.ts         # File parsing (JSON, XML, CSV, etc.)
│   │   ├── file-processing-service.ts     # Security analysis
│   │   └── report-generation-service.ts   # Report rendering
│   ├── storage/
│   │   └── storage-manager.ts   # Encrypted artifact storage
│   ├── database/                # Database management
│   └── security/                # Security utilities
├── data/                        # SQLite DB & artifacts
├── index.ts                     # Fastify server
└── package.json
```

## Key Services

### OpenRouter Analysis Service

Manages multi-model analysis with these models:

**Free Tier:**
- `google/gemini-2.5-flash` - Rapid triage

**Pro Tier (includes free tier plus):**
- `google/gemini-2.5-pro` - Deep analysis
- `openai/gpt-4.1` - Comprehensive analysis
- `anthropic/claude-sonnet-4` - Enterprise reliability
- `deepseek/deepseek-chat` - Cost-effective analysis

### File Parser Service

Supports parsing of:
- JSON (structured logs)
- XML (configuration files)
- CSV (audit trails)
- LOG/TXT (plain text logs)
- EVTX (Windows Event Logs)
- Binary files (hex dump)

### Storage Manager

- Encrypted artifact storage using AES-256-GCM
- SQLite database for metadata
- File system storage for encrypted blobs
- Automatic cleanup and retention

## API Endpoints

### Analysis Endpoints

#### POST /analyze
Start a new forensic analysis.

**Request:**
- Multipart form data
- Files: Multiple file uploads
- Context: Optional text file with analysis context

**Response:**
```json
{
  "analysisId": "uuid",
  "status": "processing",
  "message": "Analysis started"
}
```

#### GET /analysis/:id/status
Check analysis status.

**Response:**
```json
{
  "analysisId": "uuid",
  "status": "processing|completed|failed",
  "progress": 0.5,
  "currentModel": "google/gemini-2.5-flash"
}
```

#### GET /analysis/:id/stream
Server-Sent Events stream for live updates.

**Event Format:**
```
data: {"token": "Analysis", "model": "google/gemini-2.5-flash"}
```

#### GET /analysis/:id/results
Get complete analysis results.

**Response:**
```json
{
  "analysisId": "uuid",
  "artifacts": [...],
  "synthesis": {
    "consensusFindings": [...],
    "conflictingFindings": [...],
    "confidenceScore": 85.5,
    "summary": "..."
  }
}
```

#### GET /analysis/:id/report
Download analysis report.

**Query Parameters:**
- `format`: "markdown" or "json"

### Artifact Endpoints

#### GET /artifacts
List all stored artifacts.

#### GET /artifacts/:id
Get artifact metadata.

#### GET /artifacts/:id/download
Download original artifact file.

#### DELETE /artifacts/:id
Delete an artifact.

## Environment Variables

```env
# Required
OPENROUTER_API_KEY=your_api_key_here

# Optional
PORT=4000
SITE_URL=http://localhost:5173
ANALYSIS_TIER=pro  # or 'free'
ENCRYPTION_KEY=auto_generated_if_not_set
```

## Development

```bash
# Install dependencies
bun install

# Run development server with hot reload
bun run dev

# Run production server
bun run start

# Run tests
bun test
```

## Security Features

1. **File Validation**
   - MIME type checking
   - File size limits (100MB)
   - Content sanitization

2. **Encryption**
   - AES-256-GCM for artifact storage
   - Secure key management
   - Encrypted database fields

3. **API Security**
   - CORS configuration
   - Rate limiting ready
   - Input validation

## Error Handling

The API uses standard HTTP status codes:
- 200: Success
- 400: Bad Request
- 404: Not Found
- 500: Internal Server Error

Error responses include:
```json
{
  "error": "Description of the error"
}
```

## Performance Considerations

- Parallel model execution for faster analysis
- Streaming responses for real-time updates
- Efficient file parsing with size limits
- Database indexing for quick lookups

## Testing

```bash
# Run all tests
bun test

# Run specific test file
bun test storage-manager.test.ts
```

## Deployment

The API is designed to run on Bun runtime for optimal performance:

```bash
# Build for production
bun build index.ts --target=bun

# Run production server
bun run start
```

For containerization, use the Bun Docker image:
```dockerfile
FROM oven/bun:1
WORKDIR /app
COPY . .
RUN bun install
EXPOSE 4000
CMD ["bun", "run", "start"]
```
