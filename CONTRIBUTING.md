# Contributing to SENTINEL

Thank you for your interest in contributing to SENTINEL! This document provides guidelines for contributing to this project.

## 🚀 Getting Started

1. **Fork** the repository
2. **Clone** your fork locally
3. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
4. **Commit** your changes (`git commit -m 'feat: add amazing feature'`)
5. **Push** to the branch (`git push origin feature/amazing-feature`)
6. **Open** a Pull Request

## 📋 Development Setup

### Prerequisites

- Node.js 18+
- Python 3.9+
- Ollama (optional — the system works without it via fallback)

### Environment Variables

1. Copy `.env.example` to `frontend/.env`
2. Fill in your Firebase project credentials
3. **Never** commit `.env` files with real credentials

### Running Locally

```bash
# Backend
cd backend
pip install -r requirements.txt
python main.py

# Frontend (separate terminal)
cd frontend
npm install
npm run dev
```

## 📝 Commit Convention

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

- `feat:` — New feature
- `fix:` — Bug fix
- `docs:` — Documentation changes
- `style:` — Code style (formatting, etc.)
- `refactor:` — Code refactoring
- `test:` — Adding tests
- `chore:` — Maintenance tasks

## 🔒 Security

- **Never** commit API keys, tokens, or credentials
- Use environment variables for all secrets
- Report security vulnerabilities privately (see [SECURITY.md](SECURITY.md))

## 📜 License

By contributing, you agree that your contributions will be licensed under the MIT License.
