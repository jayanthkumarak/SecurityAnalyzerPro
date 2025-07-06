# ForensicAnalyzerPro Setup Guide

This guide will help you set up ForensicAnalyzerPro on your local machine.

## Prerequisites

1. **Bun Runtime** (v1.0.0 or higher)
   ```bash
   # Install Bun (macOS, Linux, WSL)
   curl -fsSL https://bun.sh/install | bash
   
   # Verify installation
   bun --version
   ```

2. **OpenRouter API Key**
   - Sign up at [OpenRouter](https://openrouter.ai/)
   - Go to [API Keys](https://openrouter.ai/keys)
   - Create a new API key
   - Add credits to your account (Pro tier models require credits)

## Installation Steps

### 1. Clone the Repository
```bash
git clone https://github.com/jayanthkumarak/ForensicAnalyzerPro.git
cd ForensicAnalyzerPro
```

### 2. Install Dependencies
```bash
bun install
```

### 3. Configure Environment
Create a `.env` file in the project root:

```env
# Required
OPENROUTER_API_KEY=your_openrouter_api_key_here

# Optional (these have defaults)
SITE_URL=http://localhost:5173
ANALYSIS_TIER=pro  # or 'free' for single model
PORT=4000
```

### 4. Start Development Servers
```bash
# Start both API and frontend
bun run dev

# Or start separately:
bun run dev:api   # API on http://localhost:4000
bun run dev:web   # Frontend on http://localhost:5173
```

### 5. Access the Application
Open your browser to http://localhost:5173

## First Analysis

1. Click on the "Analysis" tab in the navigation
2. Upload one or more evidence files:
   - Supported formats: JSON, XML, CSV, LOG, TXT, EVTX
   - Maximum file size: 100MB per file
3. (Optional) Add analysis context in the text area
4. Select your tier:
   - **Free**: Uses only Gemini 2.5 Flash
   - **Pro**: Uses all 5 models for comprehensive analysis
5. Click "Start Analysis"
6. Watch the live stream from the first model
7. Wait for all models to complete (Pro tier)
8. Review the consensus findings and download reports

## Troubleshooting

### Common Issues

1. **"ENOENT reading fastify/node_modules/secure-json-parse"**
   ```bash
   # Clean and reinstall
   bun run clean
   bun install
   ```

2. **"Cannot find module 'bun:sqlite'"**
   - Ensure you're running with Bun, not Node.js
   - Check Bun version: `bun --version`

3. **"Invalid API Key" from OpenRouter**
   - Verify your API key in .env file
   - Check you have credits in your OpenRouter account
   - Ensure no extra spaces in the API key

4. **Port already in use**
   ```bash
   # Kill existing processes
   lsof -ti:4000 | xargs kill -9
   lsof -ti:5173 | xargs kill -9
   ```

### Development Tips

1. **Hot Reload**: The API server supports hot reload with `--hot` flag
2. **Database Location**: SQLite database is at `api/data/artifacts.db`
3. **Encrypted Files**: Stored in `api/data/artifacts/`
4. **Logs**: Check terminal output for detailed error messages

## Production Deployment

### Using PM2
```bash
# Install PM2
bun install -g pm2

# Start services
pm2 start ecosystem.config.js

# View logs
pm2 logs
```

### Using Docker
```bash
# Build image
docker build -t forensicanalyzerpro .

# Run container
docker run -p 4000:4000 -p 5173:5173 \
  -e OPENROUTER_API_KEY=your_key \
  forensicanalyzerpro
```

### Environment Variables for Production
```env
NODE_ENV=production
OPENROUTER_API_KEY=your_key
SITE_URL=https://your-domain.com
ANALYSIS_TIER=pro
PORT=4000
ENCRYPTION_KEY=generate_32_byte_hex_key
```

## Security Considerations

1. **API Keys**: Never commit `.env` file to version control
2. **HTTPS**: Use HTTPS in production for secure data transmission
3. **File Uploads**: Configure reverse proxy limits for large files
4. **Database**: Regular backups of SQLite database
5. **Encryption**: Use a strong, persistent ENCRYPTION_KEY in production

## Support

- GitHub Issues: [Report bugs or request features](https://github.com/jayanthkumarak/ForensicAnalyzerPro/issues)
- Documentation: Check the README.md and API documentation
- OpenRouter Support: [OpenRouter Discord](https://discord.gg/openrouter)

Happy analyzing! 🖖 