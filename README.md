# ForensicAnalyzerPro

AI-powered digital forensics platform with multi-LLM analysis capabilities. Upload digital artifacts and get comprehensive forensic analysis reports powered by multiple AI models through OpenRouter.

## 🌟 Features

- **Multi-LLM Analysis**: Leverages multiple AI models (Gemini, GPT-4, Claude, DeepSeek) for comprehensive analysis
- **LCARS Star Trek UI**: Futuristic interface with cyan, pink, purple, and yellow color scheme
- **Progress Updates**: Live progress via polling (SSE currently disabled)
- **File Upload & Processing**: Support for various digital artifact formats (JSON, XML, CSV, LOG, TXT, EVTX)
- **Tiered Analysis**: Free tier (1 model) and Pro tier (5 models) options
- **RESTful API**: Fastify-based backend for scalable processing
- **Forensic Reports**: Detailed reports with consensus findings and model-specific artifacts

## 🏗️ Architecture

This is a modern web application with:

- **Frontend**: SvelteKit + TypeScript + Tailwind CSS (LCARS theme)
- **Backend**: Fastify + TypeScript + Bun
- **AI Integration**: OpenRouter API for multi-model access
- **Database**: SQLite (via Bun's native module)
- **Package Manager**: Bun (fast JavaScript runtime & package manager)

## 🚀 Quick Start

### Prerequisites

- [Bun](https://bun.sh/) >= 1.0.0
- OpenRouter API key

### Installation

```bash
# Clone the repository
git clone https://github.com/jayanthkumarak/ForensicAnalyzerPro.git
cd ForensicAnalyzerPro

# Install dependencies
bun install
```

### Configuration

Create a `.env` file in the project root:

```env
# OpenRouter API Configuration
OPENROUTER_API_KEY=your_openrouter_api_key_here
SITE_URL=http://localhost:5173
ANALYSIS_TIER=pro  # or 'free' for single model

# Optional
PORT=4000
ENCRYPTION_KEY=64_hex_chars_32_bytes_for_aes_256_gcm
```

### Development

```bash
# Start both API and frontend servers
bun run dev

# Or start individually:
bun run dev:api   # API server on http://localhost:4000
bun run dev:web   # Frontend on http://localhost:5173
```

### Production Build

```bash
# Build both applications
bun run build

# Start production servers
bun run start
```

## 📁 Project Structure

```
ForensicAnalyzerPro/
├── api/                    # Backend API
│   ├── lib/
│   │   ├── routes/        # API routes
│   │   │   └── +page.svelte  # Main forensic analysis UI
│   │   ├── services/      # Business logic
│   │   │   ├── openrouter-analysis-service.ts  # Multi-LLM orchestration
│   │   │   ├── file-parser-service.ts         # File parsing
│   │   │   └── ...
│   │   └── storage/       # Data persistence
│   ├── data/              # SQLite database & artifacts
│   ├── index.ts           # API entry point
│   └── package.json
├── frontend/              # SvelteKit frontend
│   ├── src/
│   │   ├── routes/        # Pages
│   │   │   └── +page.svelte  # Main forensic analysis UI
│   │   ├── app.css        # LCARS theme styles
│   │   └── app.html       # HTML template
│   ├── static/            # Static assets
│   └── package.json
├── .github/               # CI/CD workflows
├── package.json           # Root package.json (monorepo)
├── .env                   # Environment variables
└── README.md
```

## 🔧 API Endpoints

### Analysis Endpoints

- `POST /analyze` - Start forensic analysis with file uploads
- `GET /analysis/:id/status` - Check analysis status
// SSE endpoint currently disabled (use polling)
// - `GET /analysis/:id/stream` - SSE stream for live updates
- `GET /analysis/:id/results` - Get analysis results
- `GET /analysis/:id/report` - Download report (markdown/json)

### Artifact Management

- `GET /artifacts` - List all artifacts
- `GET /artifacts/:id` - Get artifact metadata
- `GET /artifacts/:id/download` - Download artifact
- `DELETE /artifacts/:id` - Delete artifact

## 🤖 Multi-LLM Analysis Pipeline

The system uses OpenRouter to access multiple AI models:

### Free Tier (1 model)
- **Gemini 2.5 Flash**: Rapid analysis and triage

### Pro Tier (5 models)
- **Gemini 2.5 Flash**: Rapid triage and initial assessment
- **Gemini 2.5 Pro**: Deep technical analysis and pattern recognition
- **GPT-4.1**: Comprehensive analysis with high accuracy
- **Claude Sonnet 4**: Enterprise-grade reliability and detailed reasoning
- **DeepSeek Chat**: Cost-effective analysis with good performance

Each model analyzes the evidence independently, then results are synthesized to provide:
- Consensus findings across models
- Confidence scoring
- Conflicting interpretations highlighted
- Comprehensive forensic report

## 📊 Usage

1. Open your browser to `http://localhost:5173`
2. Navigate to the "Analysis" tab
3. Upload digital evidence files (logs, audit trails, etc.)
4. Optionally provide analysis context
5. Select analysis tier (Free/Pro)
6. Click "Start Analysis" to begin
7. Watch real-time streaming from the first model
8. View comprehensive results with consensus findings
9. Download reports in Markdown or JSON format

## 🎨 LCARS UI Theme

The interface features a Star Trek LCARS-inspired design with:
- Rounded "pill" elements in accent colors
- Card-based layouts with colored headers
- Live stardate display (YYYY.DDD • HH:MM:SS)
- Responsive design for desktop and mobile
- Typography: Inter (body) & Exo 2 (headings)

## 🔒 Security Features

- Encrypted artifact storage
- Secure file handling with validation
- API key protection
- Comprehensive audit logging
- Chain of custody tracking

## 🧪 Testing

```bash
# Run tests
bun test

# Run linting
bun run lint
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Jayanth Kumar**
- GitHub: [@jayanthkumarak](https://github.com/jayanthkumarak)
- Email: jayanthkumarak@gmail.com

## 🙏 Acknowledgments

- Powered by [OpenRouter](https://openrouter.ai/) for multi-model AI access
- UI inspired by Star Trek LCARS design system
- Built with [SvelteKit](https://kit.svelte.dev/) and [Fastify](https://www.fastify.io/)
- Fast runtime provided by [Bun](https://bun.sh/)

## 📸 Screenshots

### Analysis Interface
The main forensic analysis interface with file upload, context input, and tier selection.

### Live Streaming
Real-time analysis progress showing model output as it's generated.

### Results View
Comprehensive results with consensus findings and individual model artifacts.

---

Live long and prosper! 🖖