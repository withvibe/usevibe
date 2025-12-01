# useVibe for VS Code

<div align="center">

![useVibe Logo](resources/icon.png)

**Organize your project knowledge and supercharge your AI assistants**

[![VS Code Marketplace](https://img.shields.io/visual-studio-marketplace/v/cxthub.useVibe-vscode?style=flat-square&label=VS%20Code%20Marketplace&logo=visual-studio-code)](https://marketplace.visualstudio.com/items?itemName=cxthub.useVibe-vscode)
[![Installs](https://img.shields.io/visual-studio-marketplace/i/cxthub.useVibe-vscode?style=flat-square)](https://marketplace.visualstudio.com/items?itemName=cxthub.useVibe-vscode)
[![Rating](https://img.shields.io/visual-studio-marketplace/r/cxthub.useVibe-vscode?style=flat-square)](https://marketplace.visualstudio.com/items?itemName=cxthub.useVibe-vscode)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)
[![GitHub issues](https://img.shields.io/github/issues/useVibe/useVibe-vscode?style=flat-square)](https://github.com/useVibe/useVibe-vscode/issues)

[Features](#-features) • [Installation](#-installation) • [Quick Start](#-quick-start) • [Documentation](#-documentation) • [Contributing](#-contributing)

</div>

---

## 🎯 What is useVibe?

useVibe is a powerful VS Code extension that helps you organize project-specific knowledge and seamlessly integrate it with AI assistants like **GitHub Copilot**, **Cursor AI**, and other LLM-powered tools.

### The Problem

AI assistants are powerful, but they often:
- 🤷‍♂️ Lack context about your specific project architecture
- 🔄 Forget important patterns and conventions between sessions
- 📚 Can't access your documentation, design decisions, or API specs
- 🎯 Give generic answers instead of project-specific solutions

### The Solution

useVibe creates organized **context projects** that:
- ✅ Keep project knowledge in dedicated folders (`.contexts/`)
- ✅ Feed relevant context to your AI assistants automatically
- ✅ Sync with external repositories (docs, SDKs, examples)
- ✅ Track changes and keep documentation up-to-date
- ✅ Work seamlessly with **GitHub Copilot Chat** via `@projects` participant

---

## ✨ Features

### 📁 **Organized Context Projects**

Create dedicated knowledge spaces for different aspects of your project:
- **Architecture docs** - Design decisions and patterns
- **API documentation** - Endpoint references and examples
- **Code templates** - Reusable boilerplate and snippets
- **External libraries** - Clone repos for reference
- **Onboarding materials** - New developer resources

### 🤖 **AI Assistant Integration**

#### GitHub Copilot Chat Participant
Use the `@projects` chat participant in VS Code:
```
@projects status              # Overview of all projects
@projects tasks               # Show all TODO items
@projects plan                # Get AI work plan for today
@projects news                # Recent changes across projects
@projects sync all            # Update all Git repos
@projects @api-docs [query]   # Query specific project
```

#### Command Palette (Cursor & VS Code)
Access features via Command Palette (`Cmd+Shift+P`):
- **Show Project Status** - Dashboard of all projects
- **Show All TODO Tasks** - Scan projects for pending work
- **Show Recent Changes** - Git commit history
- **Sync All Projects** - Pull latest updates

### 🔄 **Git Integration**

- **Clone repositories** as context projects
- **Track changes** automatically with visual indicators
- **Auto-sync** with configurable intervals
- **Change analysis** with commit summaries
- **Update notifications** when new commits are available

### 📝 **Rich File Support**

Import and manage various file types:
- ✅ Markdown (`.md`)
- ✅ Code files (`.ts`, `.js`, `.py`, `.java`, etc.)
- ✅ PDF documents
- ✅ Word documents (`.docx`)
- ✅ Text files (`.txt`)

### 🎨 **Professional UI**

- **Sidebar view** with tree structure
- **Enable/disable projects** with one click
- **Visual indicators** for Git changes
- **Quick actions** via context menus
- **Status bar** integration for auto-sync

---

## 📦 Installation

### From VS Code Marketplace

1. Open VS Code
2. Go to Extensions (`Cmd+Shift+X` / `Ctrl+Shift+X`)
3. Search for "useVibe"
4. Click **Install**

### From VSIX File

```bash
# Download the latest release
# Then install:
code --install-extension useVibe-vscode-1.0.0.vsix

# For Cursor IDE:
cursor --install-extension useVibe-vscode-1.0.0.vsix
```

### From Source

```bash
git clone https://github.com/useVibe/useVibe-vscode.git
cd useVibe-vscode
npm install
npm run compile
vsce package
code --install-extension useVibe-vscode-1.0.0.vsix
```

---

## 🚀 Quick Start

### 1. Create Your First Context Project

Open the **useVibe** view in the sidebar (Activity Bar icon) and click **"Create New Project"**.

### 2. Add Files

Right-click on your project:
- **Add Current File** - Add the file you're currently editing
- **Import Files** - Browse and select multiple files
- **Create Note** - Add markdown documentation

### 3. Clone External Repos

Click **"Clone from GitHub"** to add external documentation or libraries as reference:

```
https://github.com/facebook/react
https://github.com/typescript-cheatsheets/react
```

### 4. Use with AI Assistants

#### In VS Code with GitHub Copilot:
```
@projects @api-docs how do I authenticate users?
```

#### In Cursor or via Command Palette:
- Press `Cmd+Shift+P`
- Type "useVibe: Show Project Status"

---

## 📖 Documentation

### Context Projects Structure

```
your-workspace/
├── .contexts/                    # useVibe folder
│   ├── api-docs/                # API documentation project
│   │   ├── endpoints.md
│   │   └── examples.md
│   ├── architecture/             # Architecture decisions
│   │   └── design-patterns.md
│   ├── react-docs/              # Cloned from GitHub
│   │   └── [repo contents]
│   └── .ai-rules                # AI instruction files
├── src/
└── ...
```

### Configuration

Configure useVibe in your VS Code settings:

```json
{
  // Folder name for context projects
  "useVibe.contextsFolderName": ".contexts",
  
  // Show welcome message
  "useVibe.showWelcomeMessage": true,
  
  // Auto-sync settings
  "useVibe.autoSync.enabled": true,
  "useVibe.autoSync.intervalMinutes": 60,
  "useVibe.autoSync.notifyOnChanges": true
}
```

### Available Commands

| Command | Description |
|---------|-------------|
| `useVibe: Create New Project` | Create a new context project |
| `useVibe: Clone from GitHub` | Clone a repository as a context project |
| `useVibe: Show Project Status` | View dashboard of all projects |
| `useVibe: Show All TODO Tasks` | Scan for TODO/FIXME comments |
| `useVibe: Show Recent Changes` | View Git commit history |
| `useVibe: Sync All Projects` | Update all Git repositories |
| `useVibe: Enable/Disable Project` | Toggle project visibility to AI |

### Chat Participant Commands (VS Code + Copilot)

| Command | Description |
|---------|-------------|
| `@projects status` | Show comprehensive project status |
| `@projects tasks` | Display all TODO items |
| `@projects plan` | Get AI-suggested work plan |
| `@projects news` | Show recent changes |
| `@projects sync all` | Update all repos with summaries |
| `@projects @name [query]` | Query specific project |

---

## 🎬 Use Cases

### 1. **Architecture Documentation**

Keep design decisions and patterns organized:
```
.contexts/architecture/
├── design-decisions.md
├── coding-standards.md
└── api-design.md
```

When Copilot suggests code, it references your architecture docs for consistent patterns.

### 2. **API Reference Library**

Clone official documentation:
```
@projects clone https://github.com/openai/openai-python
```

Now ask: `@projects @openai-python how do I stream responses?`

### 3. **Onboarding New Team Members**

Create an onboarding project:
```
.contexts/onboarding/
├── getting-started.md
├── development-setup.md
└── common-pitfalls.md
```

### 4. **Multi-Project Workspace**

Organize contexts for microservices:
```
.contexts/
├── backend-api/
├── frontend-react/
├── mobile-app/
└── shared-types/
```

---

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Quick Contribution Guide

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Make your changes** and add tests
4. **Commit**: `git commit -m 'Add amazing feature'`
5. **Push**: `git push origin feature/amazing-feature`
6. **Open a Pull Request**

### Development Setup

```bash
# Clone the repo
git clone https://github.com/useVibe/useVibe-vscode.git
cd useVibe-vscode

# Install dependencies
npm install

# Compile TypeScript
npm run compile

# Watch mode for development
npm run watch

# Run in debug mode
# Press F5 in VS Code to open Extension Development Host
```

### Running Tests

```bash
npm test
```

---

## 🐛 Bug Reports & Feature Requests

Found a bug or have an idea? [Open an issue](https://github.com/useVibe/useVibe-vscode/issues/new)!

### Before Opening an Issue

- ✅ Search existing issues to avoid duplicates
- ✅ Include VS Code version and OS
- ✅ Provide clear reproduction steps
- ✅ Include relevant screenshots/logs

---

## 📜 License

This project is licensed under the [MIT License](LICENSE) - see the LICENSE file for details.

---

## 🌟 Support the Project

If useVibe helps your development workflow:

- ⭐ **Star this repository** on GitHub
- 📢 **Share** with your team and community
- 🐛 **Report bugs** and suggest features
- 💻 **Contribute** code or documentation
- ☕ **Sponsor** the project (coming soon!)

---

## 🔗 Links

- [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=cxthub.useVibe-vscode)
- [GitHub Repository](https://github.com/useVibe/useVibe-vscode)
- [Issue Tracker](https://github.com/useVibe/useVibe-vscode/issues)
- [Changelog](CHANGELOG.md)
- [Contributing Guide](CONTRIBUTING.md)
- [Code of Conduct](CODE_OF_CONDUCT.md)

---

## 📊 Stats

![GitHub stars](https://img.shields.io/github/stars/useVibe/useVibe-vscode?style=social)
![GitHub forks](https://img.shields.io/github/forks/useVibe/useVibe-vscode?style=social)
![GitHub watchers](https://img.shields.io/github/watchers/useVibe/useVibe-vscode?style=social)

---

<div align="center">

**Made with ❤️ by the useVibe Community**

[⬆ Back to Top](#useVibe-for-vs-code)

</div>
