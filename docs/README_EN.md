# miniQuestion

A lightweight AI chat floating widget for quick questions. Bring your own API key.

> **Important**: This extension does not provide AI services. You need to bring your own API key. All AI capabilities come from the third-party API you configure.

## Core Features

| Feature | Description |
|---------|-------------|
| **Lightweight** | Pure native implementation, no framework dependencies, under 50KB |
| **Compatible** | Supports OpenAI-compatible format and Anthropic native API |
| **Portable** | No registration required, configure and use, data stored locally |
| **Secure** | API key stored locally only, requests sent directly to your API |
| **Open Source** | MIT license, fully auditable code |

## Why This Extension

Existing AI floating widgets/sidebar extensions (Monica, Sider, MaxAI, etc.) have these issues:

- **API Restrictions**: Can only use official or partner APIs, cannot use your own Coding Plan
- **Feature Bloat**: Piled with unused features, high learning curve
- **Privacy Risks**: Data goes through third-party servers
- **Account System**: Forced registration/login

miniQuestion is designed as a **supplement to your main tools**, not a replacement. Perfect for:

| Scenario | Description |
|----------|-------------|
| Quick Translation | Select text to translate, no page switching |
| Simple Questions | Temporary questions, use and go |
| Code Snippet Help | Right-click to send, quick understanding |
| API Testing | Verify custom API connectivity |

## Features

- **Open API Configuration** - Custom BaseURL / API Key / Model
- **Multi-API Format** - Supports OpenAI-compatible and Anthropic native API
- **Floating Ball UI** - Draggable, click to expand chat panel
- **Selection Translation** - Auto-translate selected text (EN→CN)
- **Right-click Send** - Send selected page text to chat
- **Theme Customization** - 6 preset colors + custom icons
- **Multi-Model Support** - Add multiple models per API, easy switching
- **Cross-Browser** - Chrome / Edge / Firefox

## Installation

**Chrome / Edge**
1. Open `chrome://extensions/` (or `edge://extensions/`)
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select this project folder

**Firefox**
1. Open `about:debugging#/runtime/this-firefox`
2. Click "Load Temporary Add-on"
3. Select `manifest.json` file

## Configuration

First-time setup requires your own API:

| Field | Description | Example |
|-------|-------------|---------|
| API Type | OpenAI Compatible or Anthropic | OpenAI Compatible |
| Base URL | API service address | `https://api.openai.com/v1` |
| API Key | Your key | `sk-...` |

**Add Models:**

After configuring API, add at least one model:
- **Display Name**: Name shown in UI (e.g., "GPT-4o")
- **Model ID**: Actual model name for API (e.g., "gpt-4o")

**Supported API Services:**

| Service | API Type | Base URL |
|---------|----------|----------|
| OpenAI | OpenAI Compatible | `https://api.openai.com/v1` |
| Anthropic Claude | Anthropic | `https://api.anthropic.com` |
| DeepSeek | OpenAI Compatible | `https://api.deepseek.com/v1` |
| OpenRouter | OpenAI Compatible | `https://openrouter.ai/api/v1` |
| Ollama (Local) | OpenAI Compatible | `http://localhost:11434/v1` |
| LM Studio (Local) | OpenAI Compatible | `http://localhost:1234/v1` |

## Usage

- **Open Chat**: Click the floating ball at bottom-right corner
- **Drag Position**: Hold and drag the floating ball
- **Send Message**: Press Enter after typing
- **Switch Model**: Use the dropdown in the header
- **Selection Translation**: Select text → Click translate button
- **Right-click Send**: Select text → Right-click → Send to miniQuestion

## Security

- API Key stored in browser local storage, never uploaded to any server
- Requests sent directly to user-configured API, no middleman
- Open source code, self-auditable

## License

MIT