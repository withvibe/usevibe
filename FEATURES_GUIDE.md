# 🚀 New Features Guide - Cursor Contexts v2.0

## 📄 PDF & Word Document Support

### Overview
The extension now automatically converts PDF and Word documents to readable markdown text when importing them into your contexts. This allows Cursor's AI to understand and reference content from these binary formats.

### Supported Formats
- **PDF files** (`.pdf`) - Extracts text content and metadata
- **Word documents** (`.docx`, `.doc`) - Converts to clean markdown
- **Text files** - All standard text formats continue to work as before

### How It Works

1. **Import a PDF or Word file:**
   - Right-click a project → "Import Files"
   - Select PDF or Word documents
   - The extension automatically:
     - Extracts text content
     - Creates a markdown version (`.md`)
     - Preserves the original in `.originals` folder
     - Shows conversion status

2. **Converted File Structure:**
   ```markdown
   # Document Title
   
   > **Original file:** report.pdf
   > **Type:** PDF Document
   > **Pages:** 15
   > **Converted:** 2025-01-15T10:30:00Z
   
   ---
   
   ## Content
   
   [Extracted text content here...]
   ```

3. **Original Files:**
   - Stored in `.originals` folder within the project
   - Includes metadata about the conversion
   - Can be accessed if needed

### Example Use Cases

#### Research Papers
```
contexts/
└── ai-research/
    ├── paper1.md         # Converted from paper1.pdf
    ├── paper2.md         # Converted from paper2.pdf
    └── .originals/       # Original PDFs preserved
        ├── paper1.pdf
        └── paper2.pdf
```

#### Documentation
```
contexts/
└── api-docs/
    ├── api-spec.md       # Converted from api-spec.docx
    ├── requirements.md   # Converted from requirements.pdf
    └── .originals/
        ├── api-spec.docx
        └── requirements.pdf
```

---

## 💬 @projects Chat Integration

### Overview
Type `@` in any editor or Cursor's chat to quickly reference and insert context projects. This feature provides intelligent autocomplete, hover information, and navigation.

### Features

#### 1. **Autocomplete Suggestions**
- Type `@` to see available projects
- Type `@pro` to filter to projects
- Shows project descriptions and file counts
- Works in:
  - Regular code editors
  - Markdown files
  - Cursor chat interface

#### 2. **Project Quick Picker**
- Type `@projects` and press Enter
- Opens a searchable list of all enabled projects
- Select to insert reference

#### 3. **Hover Information**
Hover over any `@project-name` reference to see:
- Project description
- Enable/disable status
- File list
- Full path

#### 4. **Click Navigation**
- `Ctrl+Click` (or `Cmd+Click` on Mac) on `@project-name`
- Opens the project's README or first file
- Quick way to explore referenced contexts

### Usage Examples

#### In Cursor Chat
```
"Can you help me implement the authentication based on @auth-requirements?"

"Review the @api-documentation and suggest improvements"

"Compare @old-implementation with @new-proposal"
```

#### In Code Comments
```javascript
// TODO: Implement based on @payment-integration specs
// See @security-guidelines for best practices

/**
 * This module follows patterns from @architecture-decisions
 * Reference: @api-contracts for endpoint details
 */
```

#### In Markdown Documentation
```markdown
## Implementation Notes

This feature is based on the requirements in @user-stories
and follows the patterns established in @coding-standards.

For API details, see @backend-api-specs.
```

### Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Trigger suggestions | `@` |
| Accept suggestion | `Tab` or `Enter` |
| Show all projects | Type `@projects` |
| Navigate to project | `Ctrl+Click` on reference |
| Show hover info | Hover over reference |

### Best Practices

1. **Use Descriptive Names:**
   ```
   Good: @auth-oauth-implementation
   Bad: @proj1
   ```

2. **Reference in Context:**
   ```
   "Implement the login flow from @auth-requirements using @oauth-library"
   ```

3. **Multiple References:**
   ```
   "Merge @feature-branch-1 and @feature-branch-2 according to @merge-strategy"
   ```

---

## 🔧 Installation & Setup

### Installing Dependencies

After extracting the extension, install the new dependencies:

```bash
cd cursor-contexts
npm install
```

This will install:
- `pdf-parse` - For PDF text extraction
- `mammoth` - For Word document conversion

### Configuration

No additional configuration needed! The features work automatically.

### Troubleshooting

#### PDF/Word Conversion Issues

**Problem:** "Failed to convert document"
- **Solution:** Ensure the file isn't corrupted or password-protected
- **Fallback:** The original file is still saved, just not converted

**Problem:** "Text looks garbled after conversion"
- **Solution:** Some PDFs with complex layouts may not convert perfectly
- **Tip:** Consider copying important sections manually

#### @projects Not Working

**Problem:** "@" doesn't show suggestions
- **Solution:** Ensure you have at least one enabled project
- **Check:** Projects must be enabled (green icon) to appear

**Problem:** "Ctrl+Click doesn't navigate"
- **Solution:** Ensure the project exists and has files
- **Check:** The project name must match exactly

---

## 🎯 Tips & Tricks

### Organizing Converted Documents

Create projects for different document types:
```
contexts/
├── research-papers/     # PDFs from research
├── requirements/        # Word docs from clients  
├── api-docs/           # Mixed documentation
└── meeting-notes/      # Converted meeting docs
```

### Quick Context Building

1. Collect all relevant PDFs/Word docs
2. Create a new context project
3. Import all files at once
4. AI can now reference all content

### Combining Features

Use both features together:
1. Import PDF specifications
2. Reference them with `@project-name` in chat
3. AI has full context of your documents

Example:
```
"Based on @api-specification (imported PDF), create the implementation"
```

---

## 📊 Performance Notes

- **Large PDFs:** May take a few seconds to convert
- **Batch Import:** Progress shown for multiple files
- **Storage:** Original files preserved but hidden
- **Memory:** Conversion happens file-by-file

---

## 🆘 Support

If you encounter issues:
1. Check the Output panel (View → Output → Extension Host)
2. Try refreshing the contexts view
3. Restart VS Code/Cursor if needed
4. Report issues with error messages

---

*Happy coding with enhanced context management! 🎉*
