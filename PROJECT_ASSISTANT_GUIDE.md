# 🤖 Project Assistant Guide

The `@usevibe` chat participant is now your comprehensive project management assistant!

## 🎯 What It Does

The project assistant helps you:
- **Track all your projects** and their status
- **Find TODO items** across all codebases
- **Monitor Git changes** and recent commits
- **Analyze updates** to identify new tasks
- **Suggest work plans** based on your pending tasks
- **Organize your day** with AI-powered insights

## 📋 Commands

### `@usevibe status` or `@usevibe dashboard`
Shows comprehensive overview of all your projects:
- Total project count
- Recent Git activity
- File counts
- AI-powered insights about priorities

**Example:**
```
@usevibe status
```

### `@usevibe tasks` or `@usevibe todo`
Scans all your projects for TODO, FIXME, HACK, BUG comments:
- Lists all pending tasks
- Groups by project
- AI categorizes and prioritizes them
- Suggests which to tackle first

**Example:**
```
@usevibe tasks
```

### `@usevibe news` or `@usevibe what's new`
Shows recent changes across all Git projects:
- Recent commits from all projects
- Extracts potential tasks from commit messages
- Identifies areas needing attention
- Analyzes development patterns

**Example:**
```
@usevibe news
@usevibe what's new in the last week?
```

### `@usevibe plan` or `@usevibe what should i work on`
Creates an AI-suggested work plan for today:
- Analyzes all projects, tasks, and recent activity
- Prioritizes based on importance and dependencies
- Suggests time estimates
- Provides actionable sequence

**Example:**
```
@usevibe plan
@usevibe what should i work on today?
@usevibe suggest a plan for this afternoon
```

### `@usevibe sync all` or `@usevibe update all`
Updates all Git repositories and analyzes changes:
- Runs `git pull` on all Git projects
- Shows what changed in each
- AI analyzes commit messages
- Identifies new tasks or action items

**Example:**
```
@usevibe sync all
@usevibe refresh all projects
```

### `@usevibe list`
Simple list of all available projects (unchanged)

**Example:**
```
@usevibe list
```

### `@usevibe @projectname [query]`
Query a specific project (unchanged):

**Example:**
```
@usevibe @myapi what endpoints are available?
@usevibe @frontend update
```

## 🎬 Typical Workflows

### Morning Start
```
Developer: @usevibe sync all
Assistant: *Syncs all Git repos, shows what's new*

Developer: @usevibe plan
Assistant: *Creates work plan based on updates and tasks*
```

### Mid-Day Check
```
Developer: @usevibe status
Assistant: *Shows project overview and priorities*

Developer: @usevibe tasks
Assistant: *Lists all TODO items with priorities*
```

### End of Day
```
Developer: @usevibe news
Assistant: *Shows what changed today across projects*
```

## 💡 Tips

1. **Task Tracking**: Add `// TODO:`, `// FIXME:`, or `// BUG:` comments in your code - the assistant will find and organize them!

2. **Daily Routine**: Start each day with `@usevibe sync all` followed by `@usevibe plan` for a productivity boost

3. **Context Aware**: The assistant reads your project descriptions and Git history to give relevant suggestions

4. **Natural Language**: You can ask questions naturally:
   - "What should I focus on today?"
   - "Show me what's changed recently"
   - "What are my pending tasks?"

5. **Project-Specific**: Combine with project names for targeted help:
   - `@usevibe @backend what needs testing?`
   - `@usevibe @frontend update and tell me what changed`

## 🔧 Behind the Scenes

The assistant:
- ✅ Scans your `.contexts` folder for all projects
- ✅ Reads Git commit history from repositories
- ✅ Parses source code for TODO/FIXME comments
- ✅ Uses AI to analyze patterns and priorities
- ✅ Provides actionable, context-aware suggestions

## 🚀 Advanced Usage

### Combine Commands
```
Developer: @usevibe sync all, then show me tasks, and create a plan
Assistant: *Performs all three operations in sequence*
```

### Specific Timeframes
```
Developer: @usevibe what changed this week?
Developer: @usevibe show recent updates
```

### Focus Areas
```
Developer: @usevibe what bugs need fixing?
Developer: @usevibe any urgent tasks?
Developer: @usevibe what features are in progress?
```

## 📝 Task Format Examples

The assistant recognizes these comment patterns:

```javascript
// TODO: Add input validation
// FIXME: Memory leak in loop
// HACK: Temporary workaround
// BUG: Login fails on mobile
// NOTE: Remember to update docs
// IMPORTANT: Security review needed
```

```python
# TODO: Implement caching
# FIXME: Handle edge case
# BUG: Division by zero possible
```

```java
/* TODO: Optimize query performance */
/* FIXME: Race condition in thread pool */
```

---

**Remember**: The project assistant is designed to help you stay organized, prioritize effectively, and never miss important updates or tasks across your projects! 🎯
