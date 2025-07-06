# Changelog

All notable changes to ForensicAnalyzerPro will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0] - 2025-01-05

### Added
- Multi-LLM forensic analysis using OpenRouter API
- Support for 5 AI models in Pro tier (Gemini 2.5 Flash/Pro, GPT-4.1, Claude Sonnet 4, DeepSeek)
- Free tier with single model (Gemini 2.5 Flash)
- Real-time streaming analysis with Server-Sent Events (SSE)
- LCARS Star Trek themed UI with cyan, pink, purple, and yellow color scheme
- Live stardate display (YYYY.DDD • HH:MM:SS format)
- File parsing support for JSON, XML, CSV, LOG, TXT, and EVTX formats
- Hex dump visualization for binary files
- Consensus analysis across multiple AI models
- Confidence scoring for findings
- Markdown and JSON report export
- Encrypted artifact storage with AES-256-GCM
- SQLite database using Bun's native module
- Comprehensive API documentation

### Changed
- Complete frontend rewrite from React to SvelteKit
- Replaced single Claude AI analysis with multi-model approach
- Migrated from better-sqlite3 to Bun's native SQLite module
- Updated UI from modern minimal to LCARS Star Trek theme
- Enhanced file processing to handle various forensic file formats
- Improved error handling and validation

### Technical Stack
- Frontend: SvelteKit + TypeScript + Tailwind CSS
- Backend: Fastify + TypeScript + Bun
- AI Integration: OpenRouter API
- Database: SQLite (Bun native)
- Runtime: Bun

### Security
- File upload validation and size limits (100MB)
- Encrypted artifact storage
- Secure API key handling
- Input sanitization

## [1.0.0] - 2024-12-15

### Initial Release
- Basic forensic analysis using Claude AI
- React frontend with minimal UI
- File upload and analysis
- Markdown report generation
- Fastify backend 