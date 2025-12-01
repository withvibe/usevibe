#!/bin/bash

# Cursor Contexts Extension - Quick Install Script
# =================================================

echo "🚀 Cursor Contexts Extension Installer"
echo "======================================"
echo ""

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install Node.js first."
    echo "   Visit: https://nodejs.org/"
    exit 1
fi

echo "✅ npm found"

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo "✅ Dependencies installed"

# Compile TypeScript
echo ""
echo "🔨 Compiling TypeScript..."
npm run compile

if [ $? -ne 0 ]; then
    echo "❌ Failed to compile TypeScript"
    exit 1
fi

echo "✅ Compilation complete"

# Install vsce for packaging (optional)
echo ""
read -p "📦 Install vsce for packaging? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Installing vsce globally..."
    npm install -g @vscode/vsce
    echo "✅ vsce installed"
fi

echo ""
echo "🎉 Installation Complete!"
echo ""
echo "Next steps:"
echo "1. Open VS Code/Cursor in this directory"
echo "2. Press F5 to launch the extension"
echo "3. Look for the 'Contexts' icon in the Activity Bar"
echo ""
echo "To package the extension:"
echo "  vsce package"
echo ""
echo "Happy coding! 🚀"
