# Development Guide

Complete guide for developers working on useVibe.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Environment Setup](#environment-setup)
- [Development Workflow](#development-workflow)
- [Project Structure](#project-structure)
- [Building and Testing](#building-and-testing)
- [Debugging](#debugging)
- [Common Tasks](#common-tasks)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software

| Software | Minimum Version | Recommended |
|----------|----------------|-------------|
| Node.js | 16.0.0 | 18.0.0+ |
| npm | 8.0.0 | 9.0.0+ |
| VS Code | 1.85.0 | Latest |
| Git | 2.30.0 | Latest |
| TypeScript | 5.0.0 | 5.3.0+ |

### VS Code Extensions (Recommended)

Install these for better development experience:

```bash
code --install-extension dbaeumer.vscode-eslint
code --install-extension ms-vscode.vscode-typescript-next
code --install-extension eamodio.gitlens
```

---

## Environment Setup

### 1. Clone Repository

```bash
git clone https://github.com/useVibe/useVibe-vscode.git
cd useVibe-vscode
```

### 2. Install Dependencies

```bash
npm install
```

This installs:
- TypeScript compiler
- VS Code extension API types
- simple-git (Git operations)
- pdf-parse (PDF support)
- mammoth (DOCX support)
- Development tools (vsce, etc.)

### 3. Compile TypeScript

```bash
npm run compile
```

Output goes to `out/` directory.

### 4. Open in VS Code

```bash
code .
```

---

## Development Workflow

### Watch Mode

For continuous development:

```bash
npm run watch
```

This watches `src/**/*.ts` files and recompiles automatically.

### Debug Mode

1. Open project in VS Code
2. Press `F5` or click "Run Extension" in Debug panel
3. New VS Code window opens with extension loaded
4. Test your changes in the Extension Development Host

### Making Changes

```bash
# 1. Create feature branch
git checkout -b feature/your-feature

# 2. Make changes to src/ files

# 3. Compile and test
npm run compile
# Press F5 to test

# 4. Commit with conventional commit message
git commit -m "feat: add amazing feature"

# 5. Push and create PR
git push origin feature/your-feature
```

---

## Project Structure

```
useVibe-vscode/
├── src/                          # Source code (TypeScript)
│   ├── extension.ts             # Entry point & command registration
│   ├── contextManager.ts        # Core project management
│   ├── contextsProvider.ts      # Tree view UI
│   ├── chatParticipant.ts       # @usevibe chat integration
│   ├── githubIntegration.ts     # Git operations
│   ├── autoSyncService.ts       # Auto-sync functionality
│   ├── documentConverter.ts     # PDF/DOCX conversion
│   └── completionProvider.ts    # @ mention completions
│
├── out/                          # Compiled JavaScript (gitignored)
│
├── resources/                    # Assets
│   ├── icon.png                 # Extension icon
│   └── icons/                   # Tree view icons
│
├── .github/                      # GitHub templates
│   ├── ISSUE_TEMPLATE/
│   ├── pull_request_template.md
│   └── FUNDING.yml
│
├── docs/                         # Documentation
│   ├── ARCHITECTURE.md          # Architecture overview
│   └── DEVELOPMENT.md           # This file
│
├── package.json                 # Extension manifest
├── tsconfig.json                # TypeScript config
├── .vscodeignore                # Files excluded from VSIX
└── README.md                    # User documentation
```

### Key Files Explained

#### `package.json`

Extension manifest defining:
- **name**: Extension identifier
- **contributes**: Commands, views, config
- **activationEvents**: When extension loads
- **dependencies**: Runtime dependencies

#### `tsconfig.json`

TypeScript compiler configuration:
- **target**: ES2022 (modern JS)
- **module**: CommonJS (Node.js)
- **strict**: true (strict type checking)
- **outDir**: ./out (compiled output)

#### `.vscodeignore`

Files NOT included in VSIX package:
- Source files (src/)
- Development files (.git, etc.)
- Tests
- Documentation

---

## Building and Testing

### Compile TypeScript

```bash
npm run compile
```

Watch mode:
```bash
npm run watch
```

### Package Extension

Create `.vsix` file for distribution:

```bash
# Without dependencies (faster, for local testing)
vsce package

# With dependencies (for distribution)
vsce package --dependencies
```

Output: `useVibe-vscode-1.0.0.vsix`

### Install Locally

```bash
# In VS Code
code --install-extension useVibe-vscode-1.0.0.vsix --force

# In Cursor
cursor --install-extension useVibe-vscode-1.0.0.vsix --force
```

### Run Tests (Coming Soon)

```bash
npm test
```

---

## Debugging

### Debug Extension

1. **Set Breakpoints**: Click left margin in VS Code editor
2. **Press F5**: Launches Extension Development Host
3. **Trigger Code**: Use commands/features in new window
4. **Debug Panel**: View variables, call stack, etc.

### Debug Configuration

See `.vscode/launch.json`:

```json
{
    "name": "Run Extension",
    "type": "extensionHost",
    "request": "launch",
    "args": ["--extensionDevelopmentPath=${workspaceFolder}"],
    "outFiles": ["${workspaceFolder}/out/**/*.js"]
}
```

### Console Logging

```typescript
console.log('Debug info:', data);
console.error('Error occurred:', error);
```

View in **Debug Console** panel.

### Developer Tools

In Extension Development Host:
- **Help > Toggle Developer Tools**
- Console shows extension logs
- Network tab for Git operations
- Inspect elements for UI debugging

---

## Common Tasks

### Add New Command

1. **Define in package.json**:
```json
{
    "command": "useVibe.myCommand",
    "title": "My Command",
    "category": "useVibe",
    "icon": "$(rocket)"
}
```

2. **Register in extension.ts**:
```typescript
vscode.commands.registerCommand(
    'useVibe.myCommand',
    async () => {
        vscode.window.showInformationMessage('Hello!');
    }
)
```

3. **Add to context menu** (if needed):
```json
"menus": {
    "view/item/context": [
        {
            "command": "useVibe.myCommand",
            "when": "view == cursor-contexts",
            "group": "inline"
        }
    ]
}
```

### Add Configuration Option

1. **Define in package.json**:
```json
"contributes": {
    "configuration": {
        "properties": {
            "useVibe.mySetting": {
                "type": "string",
                "default": "value",
                "description": "My setting description"
            }
        }
    }
}
```

2. **Read in code**:
```typescript
const config = vscode.workspace.getConfiguration('useVibe');
const value = config.get('mySetting', 'defaultValue');
```

3. **Listen for changes**:
```typescript
vscode.workspace.onDidChangeConfiguration(e => {
    if (e.affectsConfiguration('useVibe.mySetting')) {
        // Handle change
    }
});
```

### Add Tree View Icon

1. **Add icon** to `resources/icons/`
2. **Reference in TreeItem**:
```typescript
item.iconPath = new vscode.ThemeIcon('symbol-file');
// or
item.iconPath = {
    light: vscode.Uri.file(path.join(__dirname, '..', 'resources', 'icon-light.svg')),
    dark: vscode.Uri.file(path.join(__dirname, '..', 'resources', 'icon-dark.svg'))
};
```

### Add Chat Participant Command

In `chatParticipant.ts`:

```typescript
const commands = {
    // ... existing
    'mycommand': async (request, stream, token, project) => {
        stream.markdown('Processing...\n\n');
        // Implementation
    }
};
```

Usage: `@usevibe mycommand`

---

## Troubleshooting

### Extension Won't Activate

**Symptom**: Extension shows "Activating..." forever

**Solutions**:
1. Check Developer Console for errors (Help > Toggle Developer Tools)
2. Verify `activationEvents` in package.json
3. Check for missing dependencies: `npm install`
4. Rebuild: `npm run compile`

### Cannot Find Module Error

**Symptom**: `Error: Cannot find module 'simple-git'`

**Solutions**:
1. Install dependencies: `npm install`
2. Package with deps: `vsce package --dependencies`
3. Check `.vscodeignore` doesn't exclude node_modules

### TypeScript Compilation Errors

**Symptom**: Red squiggly lines, compile failures

**Solutions**:
1. Update TypeScript: `npm install -D typescript@latest`
2. Clear build cache: `rm -rf out/ && npm run compile`
3. Restart TS server: Cmd+Shift+P → "TypeScript: Restart TS Server"

### Git Operations Fail

**Symptom**: Clone/update commands fail

**Solutions**:
1. Check network connection
2. Verify Git installed: `git --version`
3. Test Git credentials: `git ls-remote <url>`
4. Check firewall/proxy settings

### Chat Participant Not Showing

**Symptom**: `@usevibe` doesn't appear in Copilot Chat

**Solutions**:
1. Verify GitHub Copilot extension installed
2. Check in VS Code (not Cursor - Cursor uses different chat)
3. Restart VS Code
4. Check activation events include chat participant

### Commands Not Working in Cursor

**Symptom**: Commands don't appear in Command Palette

**Solutions**:
1. Use full command name: "useVibe: ..."
2. Check extension installed: `cursor --list-extensions`
3. Reinstall: `cursor --install-extension ... --force`

### VSIX Too Large

**Symptom**: Package > 10MB

**Solutions**:
1. Check `.vscodeignore` properly excludes files
2. Don't include unnecessary dependencies
3. Use `--no-dependencies` for local testing
4. Audit with: `vsce ls --tree`

---

## Performance Tips

### Optimize Async Operations

```typescript
// ✅ Good - Parallel
const [projects, changes] = await Promise.all([
    getProjects(),
    getChanges()
]);

// ❌ Bad - Sequential
const projects = await getProjects();
const changes = await getChanges();
```

### Cache Expensive Operations

```typescript
let cachedProjects: ContextProject[] | null = null;

function getProjects(): ContextProject[] {
    if (!cachedProjects) {
        cachedProjects = loadProjectsFromDisk();
    }
    return cachedProjects;
}
```

### Dispose Resources

```typescript
const disposable = vscode.workspace.onDidChangeConfiguration(handler);
context.subscriptions.push(disposable); // Auto-disposed
```

---

## Code Style Guidelines

### Naming Conventions

- **Functions**: `camelCase` - `getProjects()`, `handleCommand()`
- **Classes**: `PascalCase` - `ContextManager`, `GitHubService`
- **Constants**: `UPPER_SNAKE_CASE` - `MAX_FILE_SIZE`
- **Interfaces**: `PascalCase` - `ContextProject`, `GitChangeSummary`
- **Private members**: `_camelCase` - `_cache`, `_initialized`

### File Organization

```typescript
// 1. Imports
import * as vscode from 'vscode';
import * as fs from 'fs';

// 2. Types/Interfaces
interface MyData {
    // ...
}

// 3. Constants
const DEFAULT_VALUE = 'value';

// 4. Main logic
export class MyClass {
    // ...
}

// 5. Helper functions
function helperFunction() {
    // ...
}
```

### Error Handling

```typescript
try {
    const result = await riskyOperation();
    return result;
} catch (error) {
    console.error('Operation failed:', error);
    vscode.window.showErrorMessage('User-friendly error message');
    return null; // Graceful fallback
}
```

---

## Release Process

1. **Update CHANGELOG.md** with new features/fixes
2. **Bump version** in package.json
3. **Commit changes**: `git commit -m "chore: release v1.1.0"`
4. **Create tag**: `git tag v1.1.0`
5. **Push**: `git push && git push --tags`
6. **Package**: `vsce package --dependencies`
7. **Publish**: `vsce publish` (requires publisher account)
8. **GitHub Release**: Create release with VSIX attached

---

## Resources

- **VS Code API Docs**: https://code.visualstudio.com/api
- **Extension Guides**: https://code.visualstudio.com/api/extension-guides/overview
- **simple-git Docs**: https://github.com/steveukx/git-js
- **TypeScript Handbook**: https://www.typescriptlang.org/docs/

---

## Getting Help

- **GitHub Issues**: Bug reports and questions
- **GitHub Discussions**: General discussions
- **VS Code Discord**: `#extensions` channel

---

**Happy Coding!** 🚀

Questions? Open an issue or discussion on GitHub.
