# useVibe Architecture

## Overview

useVibe is a VS Code extension designed to organize project-specific knowledge and integrate it seamlessly with AI assistants. This document describes the architecture, design decisions, and key components.

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     VS Code Extension                    │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  ┌──────────────┐    ┌──────────────┐    ┌───────────┐ │
│  │   Extension  │───>│   Context    │───>│  Tree     │ │
│  │  Activation  │    │   Manager    │    │  Provider │ │
│  └──────────────┘    └──────────────┘    └───────────┘ │
│         │                    │                   │       │
│         v                    v                   v       │
│  ┌──────────────┐    ┌──────────────┐    ┌───────────┐ │
│  │   Command    │    │    GitHub    │    │    Chat   │ │
│  │ Registration │    │ Integration  │    │Participant│ │
│  └──────────────┘    └──────────────┘    └───────────┘ │
│         │                    │                   │       │
│         v                    v                   v       │
│  ┌──────────────┐    ┌──────────────┐    ┌───────────┐ │
│  │   Document   │    │  Auto-Sync   │    │Completion │ │
│  │  Converter   │    │   Service    │    │ Provider  │ │
│  └──────────────┘    └──────────────┘    └───────────┘ │
│                                                           │
└─────────────────────────────────────────────────────────┘
                          │
                          v
              ┌───────────────────────┐
              │   File System         │
              │   .contexts/ folder   │
              └───────────────────────┘
```

## Core Components

### 1. Extension Entry Point (`extension.ts`)

**Purpose**: Main activation and command registration

**Responsibilities**:
- Initialize extension when VS Code starts
- Register all commands (20+ commands)
- Set up providers (tree view, chat, completion)
- Initialize services (auto-sync, GitHub integration)
- Handle configuration changes
- Manage extension lifecycle

**Key Functions**:
- `activate()` - Extension entry point
- `deactivate()` - Cleanup on extension unload

### 2. Context Manager (`contextManager.ts`)

**Purpose**: Core business logic for managing context projects

**Responsibilities**:
- Create/delete/rename context projects
- Track enabled/disabled state
- Manage project metadata
- Handle file operations
- Provide project queries

**Data Structure**:
```typescript
interface ContextProject {
    name: string;
    folderPath: string;
    enabled: boolean;
    description?: string;
    isGit?: boolean;
    lastUpdated?: Date;
}
```

**Storage**: Projects stored in `.contexts/` folder in workspace root

### 3. Tree View Provider (`contextsProvider.ts`)

**Purpose**: VS Code sidebar UI

**Responsibilities**:
- Render tree structure of context projects
- Show Git status indicators (🔄, 📁)
- Handle user interactions (clicks, context menus)
- Update UI on changes
- Provide quick actions

**UI Elements**:
- Project folders (expandable)
- File items (clickable to open)
- Status icons for Git projects
- Context menu actions

### 4. GitHub Integration (`githubIntegration.ts`)

**Purpose**: Git operations and repository management

**Responsibilities**:
- Clone repositories
- Check for updates (git fetch)
- Pull latest changes
- Analyze commit history
- Extract change summaries

**Dependencies**: `simple-git` library

**Key Features**:
- Non-blocking async operations
- Error handling for network issues
- Commit metadata extraction
- File change tracking

### 5. Chat Participant (`chatParticipant.ts`)

**Purpose**: GitHub Copilot Chat integration

**Responsibilities**:
- Register `@projects` participant
- Handle chat requests
- Provide project context
- Execute commands (status, tasks, plan, etc.)
- Format responses for chat UI

**Commands**:
- `@projects status` - Project overview
- `@projects tasks` - TODO scanning
- `@projects plan` - Work planning
- `@projects news` - Recent changes
- `@projects sync all` - Update repos
- `@projects @name [query]` - Project-specific queries

**Note**: Only works in VS Code with GitHub Copilot. Command Palette alternatives provided for Cursor.

### 6. Auto-Sync Service (`autoSyncService.ts`)

**Purpose**: Automatic Git repository updates

**Responsibilities**:
- Periodic checks for updates (configurable interval)
- Background synchronization
- User notifications for changes
- Status bar integration
- Conflict detection

**Configuration**:
```json
{
  "useVibe.autoSync.enabled": true,
  "useVibe.autoSync.intervalMinutes": 60,
  "useVibe.autoSync.notifyOnChanges": true
}
```

### 7. Document Converter (`documentConverter.ts`)

**Purpose**: Extract text from various file formats

**Responsibilities**:
- PDF text extraction
- DOCX text extraction
- Handle encoding issues
- Error recovery

**Supported Formats**:
- PDF (via `pdf-parse`)
- DOCX (via `mammoth`)
- Markdown (native)
- Code files (native)
- Plain text (native)

### 8. Completion Provider (`completionProvider.ts`)

**Purpose**: IntelliSense suggestions for `@` mentions

**Responsibilities**:
- Trigger on `@` character
- Suggest available projects
- Provide quick insertion
- Execute project picker command

## Data Flow

### Creating a Context Project

```
User Action
    │
    v
Command: createProject
    │
    v
Context Manager
    │
    ├──> Create folder (.contexts/project-name/)
    │
    ├──> Save metadata
    │
    └──> Refresh tree view
         │
         v
    UI Updates (sidebar shows new project)
```

### Cloning from GitHub

```
User Input (GitHub URL)
    │
    v
GitHub Integration
    │
    ├──> Validate URL
    │
    ├──> Execute git clone
    │
    ├──> Extract repo info
    │
    └──> Create context project
         │
         v
    Context Manager
         │
         ├──> Register project
         │
         └──> Mark as Git project
              │
              v
         Auto-Sync Service (if enabled)
              │
              └──> Schedule periodic updates
```

### Chat Participant Query

```
User: "@projects @api-docs how do I auth?"
    │
    v
Chat Participant
    │
    ├──> Parse command and project name
    │
    ├──> Find project in Context Manager
    │
    ├──> Read project files
    │
    ├──> Build context string
    │
    └──> Return formatted response
         │
         v
    GitHub Copilot processes with context
```

## Design Decisions

### 1. File-Based Storage

**Decision**: Store context projects as folders in `.contexts/`

**Rationale**:
- ✅ Simple and transparent
- ✅ Works with Git for version control
- ✅ Easy to backup and share
- ✅ No database dependency
- ✅ Portable across machines

**Trade-offs**:
- ❌ No advanced querying
- ❌ Potential file system limits
- ❌ Manual synchronization needed

### 2. Chat Participant vs Commands

**Decision**: Provide both `@projects` chat participant AND Command Palette commands

**Rationale**:
- VS Code + Copilot → Use chat participant (conversational)
- Cursor IDE → Use commands (chat API differs)
- Broader compatibility

### 3. Auto-Sync Optional

**Decision**: Make auto-sync opt-in with configurable intervals

**Rationale**:
- ✅ Avoid unwanted network traffic
- ✅ User controls update frequency
- ✅ Battery/performance considerations
- ✅ Works for offline scenarios

### 4. Git Integration via simple-git

**Decision**: Use `simple-git` library instead of spawning git commands

**Rationale**:
- ✅ Cross-platform compatibility
- ✅ Promise-based API
- ✅ Error handling built-in
- ✅ Better parsing of git output

### 5. Document Conversion

**Decision**: Convert PDF/DOCX to plain text instead of storing originals in chat context

**Rationale**:
- ✅ Reduces context size for AI
- ✅ Makes content searchable
- ✅ Works with text-based AI models
- ✅ Faster processing

## Extension Points

### Adding New File Types

Extend `documentConverter.ts`:

```typescript
export async function convertDocument(
    filePath: string
): Promise<string | null> {
    const ext = path.extname(filePath).toLowerCase();
    
    // Add new format here
    if (ext === '.your-format') {
        return convertYourFormat(filePath);
    }
    
    // ... existing formats
}
```

### Adding New Commands

1. Register in `package.json`:
```json
{
    "command": "useVibe.yourCommand",
    "title": "Your Command",
    "category": "useVibe"
}
```

2. Implement in `extension.ts`:
```typescript
vscode.commands.registerCommand(
    'useVibe.yourCommand',
    async () => {
        // Implementation
    }
)
```

### Adding Chat Participant Commands

Extend `chatParticipant.ts`:

```typescript
const commands = {
    // ... existing commands
    'yourcommand': handleYourCommand,
};
```

## Performance Considerations

### File System Operations

- **Async Operations**: All file I/O is non-blocking
- **Caching**: Project list cached in memory
- **Lazy Loading**: Files loaded only when accessed

### Git Operations

- **Background Processing**: Git operations don't block UI
- **Rate Limiting**: Auto-sync prevents too-frequent updates
- **Shallow Clones**: Option to reduce clone size (future)

### AI Context Size

- **Selective Loading**: Only requested projects included
- **Size Limits**: Large files truncated
- **Smart Filtering**: Ignore node_modules, .git, etc.

## Security

### Git Operations

- **HTTPS Only**: No SSH for broader compatibility
- **Credential Storage**: Relies on system Git credentials
- **Input Validation**: URLs sanitized before git clone

### File Access

- **Workspace Scope**: Limited to workspace folders
- **Path Validation**: Prevent directory traversal
- **Permission Checks**: Respect file system permissions

## Error Handling

### Strategy

```typescript
try {
    // Operation
} catch (error) {
    console.error('Context:', error);
    vscode.window.showErrorMessage('User-friendly message');
    // Graceful degradation
}
```

### User Notifications

- **Errors**: Red notification with actionable message
- **Warnings**: Yellow notification for non-critical issues
- **Success**: Green confirmation for completed actions
- **Progress**: Progress bars for long-running operations

## Testing

### Manual Testing

- Install extension in debug mode (`F5`)
- Test each command individually
- Verify Git operations
- Test chat participant (requires Copilot)

### Future: Automated Tests

- Unit tests for core logic
- Integration tests for Git operations
- UI tests for tree view
- E2E tests for workflows

## Future Enhancements

### Planned Features

1. **Full-Text Search**: Search across all context projects
2. **Export/Import**: Share contexts between workspaces
3. **Webhooks**: Auto-sync on Git push events
4. **Analytics**: Track usage patterns
5. **Themes**: Customizable UI appearance
6. **Templates**: Project templates for common scenarios
7. **Collaboration**: Share contexts via cloud sync

### Architecture Changes

- **Plugin System**: Allow third-party extensions
- **Database Option**: SQLite for advanced querying
- **Cloud Sync**: Optional backend for team sharing
- **AI Provider Abstraction**: Support multiple AI services

---

## Contributing

When contributing to the architecture:

1. **Maintain Separation**: Keep components loosely coupled
2. **Follow Patterns**: Use existing patterns for consistency
3. **Document Changes**: Update this doc for significant changes
4. **Consider Performance**: Profile before/after changes
5. **Test Thoroughly**: Verify across VS Code and Cursor

---

**Last Updated**: November 27, 2025  
**Version**: 1.0.0
