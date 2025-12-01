# 🤖 Project Assistant Guide

The `@projects` chat participant is now your comprehensive project management assistant!

## 🎯 What It Does

The project assistant helps you:
- **Track all your projects** and their status
- **Find TODO items** across all codebases
- **Monitor Git changes** and recent commits
- **Analyze updates** to identify new tasks
- **Suggest work plans** based on your pending tasks
- **Organize your day** with AI-powered insights

## 📋 Commands

### `@projects status` or `@projects dashboard`
Shows comprehensive overview of all your projects:
- Total project count
- Recent Git activity
- File counts
- AI-powered insights about priorities

**Example:**
```
@projects status
```

### `@projects tasks` or `@projects todo`
Scans all your projects for TODO, FIXME, HACK, BUG comments:
- Lists all pending tasks
- Groups by project
- AI categorizes and prioritizes them
- Suggests which to tackle first

**Example:**
```
@projects tasks
```

### `@projects news` or `@projects what's new`
Shows recent changes across all Git projects:
- Recent commits from all projects
- Extracts potential tasks from commit messages
- Identifies areas needing attention
- Analyzes development patterns

**Example:**
```
@projects news
@projects what's new in the last week?
```

### `@projects plan` or `@projects what should i work on`
Creates an AI-suggested work plan for today:
- Analyzes all projects, tasks, and recent activity
- Prioritizes based on importance and dependencies
- Suggests time estimates
- Provides actionable sequence

**Example:**
```
@projects plan
@projects what should i work on today?
@projects suggest a plan for this afternoon
```

### `@projects sync all` or `@projects update all`
Updates all Git repositories and analyzes changes:
- Runs `git pull` on all Git projects
- Shows what changed in each
- AI analyzes commit messages
- Identifies new tasks or action items

**Example:**
```
@projects sync all
@projects refresh all projects
```

### `@projects list`
Simple list of all available projects (unchanged)

**Example:**
```
@projects list
```

### `@projects @projectname [query]`
Query a specific project (unchanged):

**Example:**
```
@projects @myapi what endpoints are available?
@projects @frontend update
```

## 🎬 Typical Workflows

### Morning Start
```
Developer: @projects sync all
Assistant: *Syncs all Git repos, shows what's new*

Developer: @projects plan
Assistant: *Creates work plan based on updates and tasks*
```

### Mid-Day Check
```
Developer: @projects status
Assistant: *Shows project overview and priorities*

Developer: @projects tasks
Assistant: *Lists all TODO items with priorities*
```

### End of Day
```
Developer: @projects news
Assistant: *Shows what changed today across projects*
```

## 💡 Tips

1. **Task Tracking**: Add `// TODO:`, `// FIXME:`, or `// BUG:` comments in your code - the assistant will find and organize them!

2. **Daily Routine**: Start each day with `@projects sync all` followed by `@projects plan` for a productivity boost

3. **Context Aware**: The assistant reads your project descriptions and Git history to give relevant suggestions

4. **Natural Language**: You can ask questions naturally:
   - "What should I focus on today?"
   - "Show me what's changed recently"
   - "What are my pending tasks?"

5. **Project-Specific**: Combine with project names for targeted help:
   - `@projects @backend what needs testing?`
   - `@projects @frontend update and tell me what changed`

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
Developer: @projects sync all, then show me tasks, and create a plan
Assistant: *Performs all three operations in sequence*
```

### Specific Timeframes
```
Developer: @projects what changed this week?
Developer: @projects show recent updates
```

### Focus Areas
```
Developer: @projects what bugs need fixing?
Developer: @projects any urgent tasks?
Developer: @projects what features are in progress?
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
