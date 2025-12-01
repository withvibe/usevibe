# 🚀 Quick Start Guide - Cursor Contexts Extension

## Prerequisites

- [Node.js](https://nodejs.org/) (v16 or higher)
- [VS Code](https://code.visualstudio.com/) or [Cursor](https://cursor.sh/)
- [npm](https://www.npmjs.com/) (comes with Node.js)

## Step 1: Setup

1. **Clone or download this repository:**
```bash
git clone <your-repo-url>
cd cursor-contexts
```

2. **Install dependencies:**
```bash
npm install
```

3. **Compile the TypeScript code:**
```bash
npm run compile
```

## Step 2: Run in Development Mode

### Option A: Using VS Code/Cursor UI

1. Open the project in VS Code/Cursor
2. Press `F5` to start debugging
3. A new VS Code/Cursor window will open with the extension loaded
4. Look for the "Contexts" icon in the Activity Bar (left sidebar)

### Option B: Using Command Line

1. Compile the extension:
```bash
npm run compile
```

2. Open VS Code with the extension:
```bash
code --extensionDevelopmentPath=.
```

## Step 3: Test the Extension

1. In the new VS Code window:
   - Click the "Contexts" icon in the Activity Bar
   - Click "Create Your First Project"
   - Enter a name like "test-project"
   - Right-click the project to see available actions

2. Try these features:
   - **Create Note** - Creates a markdown file
   - **Add Current File** - Copies current editor file to context
   - **Toggle Enable/Disable** - Changes AI visibility
   - **Open Folder** - Opens the context folder

## Step 4: Package for Installation

To create a `.vsix` file for distribution:

1. **Install vsce (Visual Studio Code Extension manager):**
```bash
npm install -g @vscode/vsce
```

2. **Package the extension:**
```bash
vsce package
```

This creates a `cursor-contexts-1.0.0.vsix` file.

3. **Install the packaged extension:**
   - Open VS Code/Cursor
   - Go to Extensions view (`Ctrl+Shift+X`)
   - Click "..." menu → "Install from VSIX..."
   - Select your `.vsix` file

## Step 5: Publish to Marketplace (Optional)

1. **Create a publisher account:**
   - Go to https://marketplace.visualstudio.com/manage
   - Create a new publisher

2. **Update package.json:**
   - Set your `publisher` field to your publisher ID

3. **Publish:**
```bash
vsce publish
```

## Development Workflow

### Watch Mode
For automatic compilation on file changes:
```bash
npm run watch
```

### Project Structure
```
cursor-contexts/
├── src/
│   ├── extension.ts         # Main extension entry
│   ├── contextsProvider.ts  # Tree view provider
│   └── contextManager.ts    # File system operations
├── resources/
│   └── contexts-icon.svg    # Extension icon
├── out/                     # Compiled JavaScript (generated)
├── package.json             # Extension manifest
└── tsconfig.json            # TypeScript configuration
```

### Debugging Tips

1. **View logs:** Open "Output" panel → Select "Extension Host" from dropdown
2. **Set breakpoints:** Click in the gutter in any `.ts` file
3. **Reload extension:** `Ctrl+R` in the debug window
4. **Debug console:** Use for evaluating expressions while debugging

## Common Issues

### Extension not appearing?
- Ensure you ran `npm install` and `npm run compile`
- Check the Output panel for errors
- Try reloading the window (`Ctrl+R`)

### TypeScript errors?
- Run `npm run compile` to see detailed errors
- Ensure all imports are correct
- Check `tsconfig.json` settings

### Can't create projects?
- Ensure you have a workspace folder open
- Check file system permissions
- Look for errors in the console

## Next Steps

- Customize the extension icon in `resources/`
- Add more features in `src/extension.ts`
- Modify the tree view in `src/contextsProvider.ts`
- Update context management logic in `src/contextManager.ts`

## Useful Commands

```bash
# Install dependencies
npm install

# Compile TypeScript
npm run compile

# Watch mode (auto-compile)
npm run watch

# Package extension
vsce package

# Publish to marketplace
vsce publish
```

## Resources

- [VS Code Extension API](https://code.visualstudio.com/api)
- [Extension Guidelines](https://code.visualstudio.com/api/references/extension-guidelines)
- [Publishing Extensions](https://code.visualstudio.com/api/working-with-extensions/publishing-extension)

---

Happy coding! 🎉 If you encounter any issues, check the logs in the Output panel or file an issue on GitHub.
