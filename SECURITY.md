# Security Policy

## 🔒 Reporting a Vulnerability

If you discover a security vulnerability within SENTINEL, please report it responsibly:

1. **Do NOT** open a public GitHub issue
2. Email the maintainers directly with details of the vulnerability
3. Allow reasonable time for a fix before public disclosure

## 🛡️ Security Best Practices

### Environment Variables

All sensitive configuration (API keys, database URLs, service account credentials) **must** be stored in environment variables:

- **Frontend:** Use `VITE_*` prefixed variables in a `.env` file (see `.env.example`)
- **Backend:** Use standard environment variables or a `.env` file with `python-dotenv`

### What Should NEVER Be Committed

- Firebase API keys or service account JSON files
- `.env` files containing real credentials
- Any authentication tokens or secrets
- Database connection strings with passwords

### Firebase Security

- Restrict your Firebase API key to specific HTTP referrers in the Google Cloud Console
- Use Firebase Security Rules to protect your Realtime Database
- Enable only the authentication providers you need
- Set proper read/write rules (avoid test mode in production)

## ✅ Supported Versions

| Version | Supported |
|---------|-----------|
| 1.x     | ✅        |
