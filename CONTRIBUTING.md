# Contributing to useVibe

Thank you for your interest in contributing to useVibe! 🎉

We welcome contributions from the community and are grateful for any help you can provide.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How Can I Contribute?](#how-can-i-contribute)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Coding Guidelines](#coding-guidelines)
- [Commit Messages](#commit-messages)
- [Pull Request Process](#pull-request-process)
- [Testing](#testing)
- [Documentation](#documentation)

---

## Code of Conduct

This project and everyone participating in it is governed by the [useVibe Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code. Please report unacceptable behavior to the project maintainers.

---

## How Can I Contribute?

### 🐛 Reporting Bugs

Before creating bug reports, please check the [issue tracker](https://github.com/useVibe/useVibe-vscode/issues) to avoid duplicates.

When creating a bug report, include:
- **Clear title and description**
- **Steps to reproduce** the behavior
- **Expected vs actual behavior**
- **Screenshots** if applicable
- **Environment details** (VS Code version, OS, extension version)
- **Relevant logs** from the Developer Console

### 💡 Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion:

- **Use a clear descriptive title**
- **Provide detailed description** of the proposed functionality
- **Explain why this enhancement would be useful**
- **Include mockups or examples** if applicable

### 🔧 Code Contributions

#### Good First Issues

Look for issues labeled [`good first issue`](https://github.com/useVibe/useVibe-vscode/labels/good%20first%20issue) - these are great for newcomers!

#### What to Work On

- Check [open issues](https://github.com/useVibe/useVibe-vscode/issues)
- Look for issues labeled `help wanted`
- Propose new features via issue discussion first

---

## Development Setup

### Prerequisites

- **Node.js** (v16 or higher)
- **npm** (v8 or higher)
- **VS Code** (latest version recommended)
- **Git**

### Setup Steps

1. **Fork the repository**
   ```bash
   # Click "Fork" button on GitHub
   ```

2. **Clone your fork**
   ```bash
   git clone https://github.com/YOUR_USERNAME/useVibe-vscode.git
   cd useVibe-vscode
   ```

3. **Add upstream remote**
   ```bash
   git remote add upstream https://github.com/useVibe/useVibe-vscode.git
   ```

4. **Install dependencies**
   ```bash
   npm install
   ```

5. **Compile TypeScript**
   ```bash
   npm run compile
   ```

6. **Open in VS Code**
   ```bash
   code .
   ```

7. **Run extension in debug mode**
   - Press `F5` to open Extension Development Host
   - Or use the "Run and Debug" panel

### Watch Mode (Development)

For continuous compilation during development:

```bash
npm run watch
```

This will automatically recompile TypeScript files as you edit them.

---

## Project Structure

```
useVibe-vscode/
├── src/                          # Source code
│   ├── extension.ts             # Extension entry point
│   ├── contextManager.ts        # Core context management logic
│   ├── contextsProvider.ts      # Tree view provider
│   ├── chatParticipant.ts       # @usevibe chat participant
│   ├── githubIntegration.ts     # Git operations
│   ├── autoSyncService.ts       # Auto-sync functionality
│   ├── documentConverter.ts     # PDF/DOCX converters
│   └── completionProvider.ts    # @ completion suggestions
├── resources/                    # Icons and assets
├── out/                          # Compiled JavaScript (generated)
├── node_modules/                # Dependencies (generated)
├── .github/                      # GitHub templates
├── package.json                 # Extension manifest
├── tsconfig.json                # TypeScript configuration
└── README.md                    # Documentation
```

### Key Files

- **`package.json`** - Extension manifest, commands, configuration
- **`src/extension.ts`** - Main activation and command registration
- **`src/contextManager.ts`** - Core logic for managing context projects
- **`src/contextsProvider.ts`** - Tree view UI implementation
- **`src/chatParticipant.ts`** - GitHub Copilot chat integration

---

## Coding Guidelines

### TypeScript Style

- Use **TypeScript** for all new code
- Follow **async/await** patterns (avoid callbacks)
- Use **strict mode** (`strict: true` in tsconfig)
- Prefer **const** over let where possible
- Use **meaningful variable names**

### Code Formatting

We use standard TypeScript conventions:

```typescript
// ✅ Good
async function updateProject(project: ContextProject): Promise<void> {
    const result = await githubService.updateProject(project.folderPath);
    if (result.hasChanges) {
        vscode.window.showInformationMessage(`Updated ${project.name}`);
    }
}

// ❌ Avoid
function updateProject(project) {
    githubService.updateProject(project.folderPath).then(result => {
        if (result.hasChanges) {
            vscode.window.showInformationMessage(`Updated ${project.name}`);
        }
    });
}
```

### Best Practices

- **Error Handling**: Always use try/catch for async operations
- **User Feedback**: Provide clear messages for success/failure
- **Performance**: Avoid blocking operations on the main thread
- **Logging**: Use console.log for development, remove before PR
- **Comments**: Explain "why", not "what"

### VS Code API Usage

- Follow [VS Code API Guidelines](https://code.visualstudio.com/api/references/vscode-api)
- Use proper disposal patterns for resources
- Register disposables in the extension context

```typescript
// ✅ Good - Proper disposal
const disposable = vscode.workspace.onDidChangeConfiguration(handler);
context.subscriptions.push(disposable);

// ❌ Bad - Memory leak
vscode.workspace.onDidChangeConfiguration(handler);
```

---

## Commit Messages

Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

### Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- **feat**: New feature
- **fix**: Bug fix
- **docs**: Documentation changes
- **style**: Formatting, missing semicolons, etc.
- **refactor**: Code restructuring without behavior change
- **perf**: Performance improvements
- **test**: Adding or updating tests
- **chore**: Build process, dependencies, etc.

### Examples

```bash
feat(chat): add @usevibe plan command

Implements AI-suggested work plan based on TODO items
and recent changes across all context projects.

Closes #123
```

```bash
fix(git): handle spaces in repository URLs

Git clone was failing for URLs containing encoded spaces.
Now properly encodes/decodes URLs before git operations.

Fixes #456
```

---

## Pull Request Process

### Before Submitting

1. **Sync with upstream**
   ```bash
   git fetch upstream
   git rebase upstream/main
   ```

2. **Test your changes**
   ```bash
   npm run compile
   npm test
   ```

3. **Update documentation** if needed

4. **Check for linting errors**
   ```bash
   npm run lint
   ```

### PR Checklist

- [ ] Code compiles without errors
- [ ] Tests pass (if applicable)
- [ ] Documentation updated
- [ ] Commit messages follow convention
- [ ] Branch is up-to-date with main
- [ ] No unnecessary files included

### PR Template

When opening a PR, include:

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
How did you test this?

## Screenshots (if applicable)

## Related Issues
Closes #123
```

### Review Process

1. Maintainers will review your PR
2. Address any requested changes
3. Once approved, a maintainer will merge

---

## Testing

### Manual Testing

1. **Install development extension**
   ```bash
   npm run compile
   code --install-extension useVibe-vscode-1.0.0.vsix --force
   ```

2. **Test in Extension Development Host**
   - Press `F5` in VS Code
   - Test your changes in the new window

3. **Test specific features**
   - Create context projects
   - Clone from GitHub
   - Use chat participant
   - Test Git operations

### Automated Tests (Coming Soon)

We're working on adding automated tests. Contributions welcome!

---

## Documentation

### Code Documentation

- **JSDoc comments** for public APIs
- **Inline comments** for complex logic
- **README updates** for user-facing changes

### Example

```typescript
/**
 * Updates a Git-based context project with latest changes.
 * 
 * @param projectPath - Absolute path to the project folder
 * @returns Summary of changes including commits and modified files
 * @throws Error if Git operations fail
 */
async function updateProject(projectPath: string): Promise<GitChangeSummary> {
    // Implementation
}
```

---

## Getting Help

- 💬 **GitHub Discussions**: For questions and discussions
- 🐛 **Issues**: For bugs and feature requests
- 📧 **Email**: For private concerns

---

## Recognition

Contributors will be recognized in:
- **README.md** contributors section
- **CHANGELOG.md** for specific contributions
- GitHub's contributor graph

---

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](LICENSE).

---

Thank you for contributing to useVibe! 🚀

Every contribution, no matter how small, makes a difference.
