# Changelog

All notable changes to the "useVibe" extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.0.0] - 2025-11-27

### 🎉 Initial Release

The first public release of useVibe (formerly cursor-contexts)!

### ✨ Added

#### Core Features
- **Context Project Management**: Create and organize project-specific knowledge bases
- **Sidebar View**: Intuitive tree view for managing context projects
- **Enable/Disable Projects**: Control which projects are visible to AI assistants
- **File Management**: Add files, import multiple files, create notes

#### Git Integration
- **Clone from GitHub**: Add external repositories as context projects
- **Auto-sync**: Configurable automatic updates for Git projects
- **Change Tracking**: Visual indicators for projects with updates
- **Git Change Analysis**: View commit history and modified files
- **Update Notifications**: Get notified when Git projects have new changes

#### AI Assistant Integration
- **@projects Chat Participant**: GitHub Copilot chat integration (VS Code)
  - `@projects status` - Project overview
  - `@projects tasks` - TODO scanning
  - `@projects plan` - AI work planning
  - `@projects news` - Recent changes
  - `@projects sync all` - Update all repos
  - `@projects @name [query]` - Query specific project
- **Command Palette Commands**: Works in both Cursor and VS Code
  - Show Project Status
  - Show All TODO Tasks
  - Show Recent Changes & News
  - Sync All Projects
  - Create Work Plan

#### Document Support
- **Markdown Files**: Native support
- **Code Files**: TypeScript, JavaScript, Python, Java, C/C++, etc.
- **PDF Documents**: Automatic text extraction
- **Word Documents**: DOCX support with text extraction
- **Text Files**: Plain text support

#### Configuration
- **Customizable Folder Name**: Default `.contexts`, configurable
- **Auto-sync Settings**: Interval, notifications, enable/disable
- **Welcome Message**: Optional first-time setup guide

#### Developer Experience
- **Status Bar Integration**: Auto-sync status visibility
- **Context Menus**: Quick actions on projects
- **Keyboard Shortcuts**: Efficient workflow
- **Progress Indicators**: Visual feedback for operations

### 🛠️ Technical

- **TypeScript**: Fully typed codebase
- **VS Code API**: Modern extension architecture
- **simple-git**: Git operations
- **pdf-parse**: PDF text extraction
- **mammoth**: DOCX text extraction
- **Node.js 16+**: Modern JavaScript features

### 📚 Documentation

- Comprehensive README with examples
- Quick Start guide
- Features documentation
- Configuration reference
- Contributing guidelines
- Code of Conduct

### 🏗️ Infrastructure

- MIT License
- GitHub repository structure
- Issue templates
- Pull request template
- Automated packaging with vsce

---

## Release Notes

### 1.0.0 - The Foundation

This initial release establishes useVibe as a powerful tool for organizing project knowledge and integrating with AI assistants. Key highlights:

- **For Developers**: Keep architecture docs, API references, and code templates organized
- **For Teams**: Share knowledge and onboard new members efficiently  
- **For AI Users**: Give GitHub Copilot and Cursor AI better context for smarter suggestions

**What's Working Great:**
- ✅ Context project creation and management
- ✅ Git repository cloning and syncing
- ✅ GitHub Copilot chat participant (@projects)
- ✅ Command Palette commands for Cursor compatibility
- ✅ Auto-sync with configurable intervals
- ✅ Rich file format support

**Known Limitations:**
- 📋 No automated tests yet (contributions welcome!)
- 🔍 TODO scanning limited to common comment formats
- 📊 Git history limited to recent commits
- 🎨 Basic UI (improvements planned)

---

## Upgrade Guide

### From cursor-contexts (pre-release)

If you were using the pre-release version:

1. **Uninstall old extension**: Remove "cursor-contexts"
2. **Install useVibe**: From marketplace or VSIX
3. **Update settings**: Rename configuration keys:
   - `cursorContexts.*` → `useVibe.*`
4. **No data migration needed**: Your `.contexts` folder remains unchanged

---

## Coming Soon

Planned features for future releases:

- [ ] **Testing**: Comprehensive test suite
- [ ] **Performance**: Optimization for large projects
- [ ] **UI Improvements**: Better icons, themes, customization
- [ ] **Search**: Full-text search across context projects
- [ ] **Export/Import**: Share context projects between workspaces
- [ ] **AI Provider Agnostic**: Better support for various AI tools
- [ ] **Webhooks**: Trigger updates on Git events
- [ ] **Analytics**: Usage insights and statistics

---

## Support

- 🐛 **Bug Reports**: [GitHub Issues](https://github.com/withvibe/usevibe/issues)
- 💡 **Feature Requests**: [GitHub Issues](https://github.com/withvibe/usevibe/issues)
- 💬 **Discussions**: [GitHub Discussions](https://github.com/withvibe/usevibe/discussions)
- 📖 **Documentation**: [README](https://github.com/withvibe/usevibe-vscode#readme)

---

[Unreleased]: https://github.com/withvibe/usevibe/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/withvibe/usevibe/releases/tag/v1.0.0
