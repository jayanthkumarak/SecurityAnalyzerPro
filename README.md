# ForensicAnalyzerPro Web

AI-powered digital forensics platform with a modern web interface. Upload digital artifacts and get comprehensive forensic analysis reports powered by artificial intelligence.

## 🌟 Features

- **AI-Powered Analysis**: Advanced forensic analysis using Claude AI
- **Modern Web Interface**: Clean, responsive React-based UI
- **File Upload & Processing**: Support for various digital artifact formats
- **Markdown Reports**: Detailed forensic reports in markdown format
- **RESTful API**: Fastify-based backend for scalable processing

## 🏗️ Architecture

This is a modern web application with:

- **Frontend**: React + Vite + TypeScript + Tailwind CSS
- **Backend**: Fastify + TypeScript + Node.js
- **Package Manager**: Bun (fast JavaScript runtime & package manager)
- **CI/CD**: GitHub Actions

## 🚀 Quick Start

### Prerequisites

- [Bun](https://bun.sh/) >= 1.0.0
- Node.js >= 18.0.0

### Installation

```bash
# Clone the repository
git clone https://github.com/jayanthkumarak/SecurityAnalyzerPro.git
cd SecurityAnalyzerPro

# Install dependencies
bun install
```

### Development

```bash
# Start both web and API servers
bun run dev

# Or start individually:
bun run dev:web   # Web app on http://localhost:3001
bun run dev:api   # API server on http://localhost:4000
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
├── web/                 # React frontend application
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── vite.config.ts
├── api/                 # Fastify backend API
│   ├── lib/
│   ├── index.ts
│   └── package.json
├── .github/             # CI/CD workflows
├── package.json         # Root package.json (monorepo)
└── README.md
```

## 🛠️ Available Scripts

- `bun run dev` - Start development servers (web + API)
- `bun run build` - Build both applications
- `bun run start` - Start production servers
- `bun run test` - Run tests
- `bun run lint` - Run linting
- `bun run clean` - Clean build artifacts and dependencies

## 🔧 Configuration

### Environment Variables

Create `.env` files in the respective directories:

**api/.env**:
```
ANTHROPIC_API_KEY=your_claude_api_key_here
PORT=4000
```

**web/.env**:
```
VITE_API_URL=http://localhost:4000
```

## 📊 Usage

1. Open your browser to `http://localhost:3001`
2. Click "Choose file" to select a digital artifact
3. Click "Analyze" to process the file
4. View the AI-generated forensic analysis report

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

- Powered by [Claude AI](https://www.anthropic.com/claude) for intelligent analysis
- Built with [React](https://reactjs.org/) and [Fastify](https://www.fastify.io/)
- UI inspired by [Perplexity.ai](https://perplexity.ai/)