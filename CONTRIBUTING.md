# Contributing to ForensicAnalyzerPro

Thank you for your interest in contributing to ForensicAnalyzerPro! This document provides guidelines and instructions for contributing.

## Code of Conduct

By participating in this project, you agree to abide by our code of conduct:
- Be respectful and inclusive
- Welcome newcomers and help them get started
- Focus on constructive criticism
- Respect differing viewpoints and experiences

## How to Contribute

### Reporting Bugs

1. Check existing issues to avoid duplicates
2. Use the bug report template
3. Include:
   - Clear description of the issue
   - Steps to reproduce
   - Expected vs actual behavior
   - System information (OS, Bun version, etc.)
   - Error messages and logs

### Suggesting Features

1. Check existing feature requests
2. Use the feature request template
3. Explain:
   - The problem you're trying to solve
   - Your proposed solution
   - Alternative solutions considered
   - Potential impact on existing features

### Pull Requests

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Make your changes
4. Write or update tests
5. Update documentation
6. Commit with clear messages
7. Push to your fork
8. Create a pull request

## Development Setup

### Prerequisites
- Bun v1.0.0 or higher
- Git
- OpenRouter API key (for testing)

### Local Development
```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/ForensicAnalyzerPro.git
cd ForensicAnalyzerPro

# Install dependencies
bun install

# Create .env file
cp .env.example .env
# Edit .env with your OpenRouter API key

# Start development servers
bun run dev
```

## Coding Standards

### TypeScript/JavaScript
- Use TypeScript for new code
- Follow existing code style
- Use meaningful variable names
- Add JSDoc comments for functions
- Prefer async/await over callbacks

### File Organization
```
api/
├── lib/
│   ├── routes/      # API endpoints
│   ├── services/    # Business logic
│   └── storage/     # Data persistence
frontend/
├── src/
│   ├── routes/      # SvelteKit pages
│   ├── lib/         # Shared components
│   └── app.css      # Global styles
```

### Commit Messages
Follow conventional commits:
- `feat:` New features
- `fix:` Bug fixes
- `docs:` Documentation changes
- `style:` Code style changes
- `refactor:` Code refactoring
- `test:` Test additions/changes
- `chore:` Build/tooling changes

Example: `feat: add PDF file parsing support`

## Testing

### Running Tests
```bash
# Run all tests
bun test

# Run specific test file
bun test file-parser.test.ts

# Run with coverage
bun test --coverage
```

### Writing Tests
- Place test files next to source files
- Name test files: `*.test.ts`
- Test edge cases and error conditions
- Mock external dependencies

Example test:
```typescript
import { describe, it, expect } from 'bun:test';
import { parseJSON } from './file-parser-service';

describe('parseJSON', () => {
  it('should parse valid JSON', () => {
    const result = parseJSON(Buffer.from('{"test": true}'));
    expect(result).toContain('"test": true');
  });
});
```

## API Development

### Adding New Endpoints
1. Create route in `api/lib/routes/`
2. Add service logic in `api/lib/services/`
3. Update API documentation
4. Add tests
5. Test with frontend

### Model Integration
When adding new AI models:
1. Update `ALL_MODELS` in `openrouter-analysis-service.ts`
2. Add model-specific prompts
3. Update tier logic
4. Test response parsing
5. Update documentation

## Frontend Development

### LCARS Theme
- Maintain Star Trek LCARS aesthetic
- Use defined color variables
- Keep rounded pill shapes
- Ensure responsive design

### Adding Features
1. Create/update Svelte components
2. Follow reactive patterns
3. Handle loading/error states
4. Test on multiple screen sizes

## Documentation

### What to Document
- New features and APIs
- Configuration options
- Breaking changes
- Complex algorithms
- Security considerations

### Where to Document
- Code: Inline comments and JSDoc
- API: Update api/README.md
- User guide: Update README.md
- Setup: Update SETUP.md

## Review Process

### Before Submitting
- [ ] Code follows style guidelines
- [ ] Tests pass locally
- [ ] Documentation updated
- [ ] No console.log statements
- [ ] No hardcoded values
- [ ] Security implications considered

### Review Criteria
- Code quality and clarity
- Test coverage
- Documentation completeness
- Performance impact
- Security considerations
- UI/UX consistency

## Release Process

1. Version bump in package.json files
2. Update CHANGELOG.md
3. Create release PR
4. After merge, tag release
5. GitHub Actions builds release

## Getting Help

- Discord: Join our community
- Issues: Ask questions with "question" label
- Discussions: For broader topics

## Recognition

Contributors will be:
- Listed in CONTRIBUTORS.md
- Mentioned in release notes
- Given credit in commits

Thank you for contributing to ForensicAnalyzerPro! 🖖 