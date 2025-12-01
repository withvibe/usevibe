import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { ContextManager } from './contextManager';
import { GitHubIntegrationService } from './githubIntegration';

export class ProjectsChatParticipant {
    private contextManager: ContextManager;
    private participant: vscode.ChatParticipant;
    private githubService: GitHubIntegrationService;

    constructor(contextManager: ContextManager, context: vscode.ExtensionContext) {
        this.contextManager = contextManager;
        this.githubService = new GitHubIntegrationService();
        
        // Create the chat participant
        this.participant = vscode.chat.createChatParticipant(
            'cursor-contexts.projects',
            this.handleRequest.bind(this)
        );

        // Set icon for the participant
        this.participant.iconPath = new vscode.ThemeIcon('folder');

        // Set up followup provider for better autocomplete
        this.participant.followupProvider = {
            provideFollowups: this.provideFollowups.bind(this)
        };

        // Add to subscriptions
        context.subscriptions.push(this.participant);
    }

    private async handleRequest(
        request: vscode.ChatRequest,
        context: vscode.ChatContext,
        stream: vscode.ChatResponseStream,
        token: vscode.CancellationToken
    ): Promise<void> {
        try {
            const prompt = request.prompt.trim();
            const promptLower = prompt.toLowerCase();
            
            // Act like a secretary - always greet and be proactive
            const greetings = ['hi', 'hello', 'hey', 'good morning', 'good afternoon', 'good evening'];
            if (greetings.some(g => promptLower === g || promptLower.startsWith(g + ' '))) {
                await this.greetAndBrief(request, stream, token);
                return;
            }

            // Handle special commands
            if (promptLower === 'list' || promptLower === '') {
                await this.listProjects(stream);
                return;
            }

            // Project Assistant Commands
            if (promptLower.includes('status') || promptLower.includes('overview') || promptLower.includes('dashboard')) {
                await this.showProjectStatus(request, stream, token);
                return;
            }

            if (promptLower.includes('todo') || promptLower.includes('tasks') || promptLower.includes('pending')) {
                await this.showTasks(request, stream, token);
                return;
            }

            if (promptLower.includes('plan') || promptLower.includes('what should i work on') || promptLower.includes('next')) {
                await this.suggestWorkPlan(request, stream, token);
                return;
            }

            if (promptLower.includes('news') || promptLower.includes('what\'s new') || promptLower.includes('updates') || promptLower.includes('changes')) {
                await this.showRecentChanges(request, stream, token);
                return;
            }

            if (promptLower.includes('sync all') || promptLower.includes('update all') || promptLower.includes('refresh all')) {
                await this.syncAllProjects(request, stream, token);
                return;
            }

            // Handle Git update requests (auto-execute git pull)
            if (promptLower.includes('update') || promptLower.includes('pull') || promptLower.includes('latest') || promptLower.includes('sync')) {
                await this.handleGitUpdate(request, stream, token);
                return;
            }

            // Handle Git-specific queries (information only)
            if (prompt.includes('changes') || prompt.includes('updated') || prompt.includes('new') || prompt.includes('git')) {
                await this.handleGitQuery(request, stream, token);
                return;
            }
            
            // Parse the command to extract project name (support @projectName or just projectName)
            let projectMatch = prompt.match(/^@(\w+[\w-]*)\s*(.*)?$/);  // Match @projectName
            if (!projectMatch) {
                projectMatch = prompt.match(/^(\w+[\w-]*)\s*(.*)?$/);   // Match projectName
            }
            
            if (!projectMatch) {
                stream.markdown('Please specify a project name. Usage: `@projects @myproject what is new?` or `@projects myproject what is new?`');
                await this.showProjectSuggestions(stream);
                return;
            }

            const projectName = projectMatch[1];
            const userQuery = projectMatch[2] || 'Provide an overview of this project';

            // Find the project (with fuzzy matching)
            const projects = this.contextManager.getProjects();
            let project = projects.find(p => 
                p.name.toLowerCase() === projectName.toLowerCase() && p.enabled
            );

            // If not found, try fuzzy matching
            if (!project) {
                project = projects.find(p => 
                    p.enabled && (
                        p.name.toLowerCase().includes(projectName.toLowerCase()) ||
                        projectName.toLowerCase().includes(p.name.toLowerCase())
                    )
                );
            }

            if (!project) {
                const availableProjects = projects
                    .filter(p => p.enabled)
                    .map(p => `\`${p.name}\``)
                    .join(', ');
                
                stream.markdown(`❌ Project "${projectName}" not found or not enabled.\n\n`);
                if (availableProjects) {
                    stream.markdown(`**Available projects:** ${availableProjects}\n\n`);
                    stream.markdown(`💡 Try: \`@projects list\` to see all projects`);
                } else {
                    stream.markdown(`No enabled projects found. Create some projects first using the Contexts view.`);
                }
                return;
            }

            // Get project context
            const projectContext = await this.getProjectContext(project);
            
            // Add project reference
            stream.reference(vscode.Uri.file(project.folderPath));
            
            // Create enhanced prompt with project context
            const enhancedPrompt = this.createEnhancedPrompt(project, projectContext, userQuery);

            // Use the same model that Copilot Chat is using
            try {
                if (request.model) {
                    const messages = [
                        vscode.LanguageModelChatMessage.User(enhancedPrompt)
                    ];

                    const chatResponse = await request.model.sendRequest(messages, {}, token);

                    // Stream the response from Copilot
                    for await (const fragment of chatResponse.text) {
                        stream.markdown(fragment);
                    }
                } else {
                    // Fallback if no model available
                    await this.provideFallbackResponse(stream, project, projectContext, userQuery);
                }
            } catch (error) {
                // Fallback if language model fails
                console.log('Language model error:', error);
                await this.provideFallbackResponse(stream, project, projectContext, userQuery);
            }

        } catch (error) {
            stream.markdown(`❌ Error processing request: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    private async getProjectContext(project: any): Promise<{
        content: string;
        files: Array<{ name: string; size: number; path: string }>;
        fileCount: number;
    }> {
        const projectPath = project.folderPath;
        let content = '';
        const files: Array<{ name: string; size: number; path: string }> = [];

        if (!fs.existsSync(projectPath)) {
            return { content: '', files: [], fileCount: 0 };
        }

        try {
            const allFiles = this.getAllFiles(projectPath);
            
            for (const filePath of allFiles.slice(0, 10)) { // Limit to first 10 files
                try {
                    const relativePath = path.relative(projectPath, filePath);
                    const stat = fs.statSync(filePath);
                    
                    files.push({
                        name: relativePath,
                        size: stat.size,
                        path: filePath
                    });

                    // Read text files for context
                    if (this.isTextFile(filePath) && stat.size < 100000) { // Max 100KB per file
                        const fileContent = fs.readFileSync(filePath, 'utf-8');
                        content += `\n\n--- ${relativePath} ---\n${fileContent}`;
                    }
                } catch (fileError) {
                    // Skip files we can't read
                    continue;
                }
            }

            return {
                content: content.substring(0, 50000), // Limit total content to 50KB
                files,
                fileCount: allFiles.length
            };
        } catch (error) {
            return { content: '', files: [], fileCount: 0 };
        }
    }

    private getAllFiles(dir: string): string[] {
        const files: string[] = [];
        
        try {
            const entries = fs.readdirSync(dir, { withFileTypes: true });
            
            for (const entry of entries) {
                if (entry.name.startsWith('.')) continue; // Skip hidden files
                
                const fullPath = path.join(dir, entry.name);
                
                if (entry.isDirectory()) {
                    files.push(...this.getAllFiles(fullPath));
                } else {
                    files.push(fullPath);
                }
            }
        } catch (error) {
            // Skip directories we can't read
        }
        
        return files;
    }

    private isTextFile(filePath: string): boolean {
        const textExtensions = [
            '.txt', '.md', '.js', '.ts', '.json', '.html', '.css', '.scss',
            '.py', '.java', '.c', '.cpp', '.h', '.hpp', '.cs', '.php',
            '.rb', '.go', '.rs', '.swift', '.kt', '.scala', '.clj',
            '.yaml', '.yml', '.xml', '.csv', '.sql', '.sh', '.bat',
            '.dockerfile', '.gitignore', '.env'
        ];
        
        const ext = path.extname(filePath).toLowerCase();
        return textExtensions.includes(ext);
    }

    private formatFileSize(bytes: number): string {
        if (bytes === 0) return '0 B';
        
        const k = 1024;
        const sizes = ['B', 'KB', 'MB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    }

    private async provideFallbackResponse(
        stream: vscode.ChatResponseStream,
        project: any,
        projectContext: any,
        userQuery: string
    ): Promise<void> {
        // Provide basic project information if language model isn't available
        stream.markdown(`🎯 **Project: ${project.name}**\n\n`);
        
        if (project.projectDescription) {
            stream.markdown(`📝 **Description:** ${project.projectDescription}\n\n`);
        }

        stream.markdown(`📁 **Location:** \`${project.folderPath}\`\n\n`);
        stream.markdown(`📊 **Files in context:** ${projectContext.fileCount}\n\n`);

        if (projectContext.files.length > 0) {
            stream.markdown(`**Recent files:**\n`);
            projectContext.files.slice(0, 5).forEach((file: any) => {
                stream.markdown(`- \`${file.name}\` (${this.formatFileSize(file.size)})\n`);
            });
            
            if (projectContext.files.length > 5) {
                stream.markdown(`- ... and ${projectContext.files.length - 5} more files\n`);
            }
            stream.markdown('\n');
        }

        // Show a sample of the content
        if (projectContext.content.length > 0) {
            stream.markdown(`**Project content preview:**\n\n`);
            const sampleContent = projectContext.content.substring(0, 1000);
            stream.markdown('```\n' + sampleContent + (projectContext.content.length > 1000 ? '\n...(truncated)' : '') + '\n```\n\n');
        }

        stream.markdown(`💡 **Your question:** "${userQuery}"\n\n`);
        stream.markdown(`ℹ️ *Copilot language model not available. Showing project overview instead.*`);
    }

    private createEnhancedPrompt(project: any, context: any, userQuery: string): string {
        return `You are analyzing a project called "${project.name}".

Project Details:
- Name: ${project.name}
- Description: ${project.description || 'No description provided'}
- Location: ${project.folderPath}
- Files: ${context.fileCount} total files

Project Content:
${context.content}

User's Question: ${userQuery}

Please provide a helpful and detailed response about this project based on the content above. Focus on answering the user's specific question while providing relevant context from the project files.`;
    }

    private async listProjects(stream: vscode.ChatResponseStream): Promise<void> {
        const projects = this.contextManager.getProjects();
        const enabledProjects = projects.filter(p => p.enabled);

        if (enabledProjects.length === 0) {
            stream.markdown('📂 No enabled projects found. Create and enable some projects first!');
            return;
        }

        stream.markdown('📂 **Available Projects:**\n\n');
        
        enabledProjects.forEach(project => {
            const description = project.description ? ` - ${project.description}` : '';
            stream.markdown(`• \`@${project.name}\`${description}\n`);
        });

        stream.markdown('\n💡 **Usage:** `@projects @<project-name> <your question>` or `@projects <project-name> <your question>`\n');
        stream.markdown('**Examples:**\n');
        stream.markdown('- `@projects @myapi what are the main endpoints?`\n');
        stream.markdown('- `@projects myapi what changed recently?`');
    }

    private async showProjectSuggestions(stream: vscode.ChatResponseStream): Promise<void> {
        const projects = this.contextManager.getProjects();
        const enabledProjects = projects.filter(p => p.enabled);

        if (enabledProjects.length === 0) {
            stream.markdown('📂 No enabled projects found. Create some projects first using the Contexts view in the sidebar.');
            return;
        }

        stream.markdown('📂 **Available projects:**\n\n');
        enabledProjects.slice(0, 5).forEach(project => {
            stream.markdown(`• \`@projects @${project.name}\` - ${project.description || 'No description'}\n`);
        });

        if (enabledProjects.length > 5) {
            stream.markdown(`\n... and ${enabledProjects.length - 5} more. Type \`@projects list\` to see all.`);
        }
    }

    private async provideFollowups(
        result: vscode.ChatResult,
        context: vscode.ChatContext,
        token: vscode.CancellationToken
    ): Promise<vscode.ChatFollowup[]> {
        const projects = this.contextManager.getProjects().filter(p => p.enabled);
        
        const followups: vscode.ChatFollowup[] = [
            {
                prompt: '@projects list',
                label: '📋 List all projects'
            }
        ];

        // Add quick access to projects with @ syntax for better autocomplete
        projects.slice(0, 5).forEach(project => {
            followups.push({
                prompt: `@projects @${project.name} `,
                label: `🔍 @${project.name} - ${project.description || 'Ask about this project'}`
            });
        });

        // Add common question templates
        if (projects.length > 0) {
            const sampleProject = projects[0];
            const gitProjects = projects.filter(p => this.githubService.isGitRepository(p.folderPath));
            
            followups.push(
                {
                    prompt: `@projects @${sampleProject.name} what's new?`,
                    label: '💡 What\'s new in project?'
                },
                {
                    prompt: `@projects @${sampleProject.name} what files changed recently?`,
                    label: '📁 What files changed?'
                },
                {
                    prompt: `@projects @${sampleProject.name} explain the architecture`,
                    label: '🏗️ Explain architecture'
                }
            );

            // Add Git-specific actions for Git repositories
            if (gitProjects.length > 0) {
                const gitProject = gitProjects[0];
                followups.push(
                    {
                        prompt: `@projects @${gitProject.name} update`,
                        label: '🔄 Update project (Git pull)'
                    },
                    {
                        prompt: `@projects @${gitProject.name} sync latest`,
                        label: '📥 Sync to latest version'
                    }
                );
            }
        }

        return followups;
    }

    private async handleGitQuery(
        request: vscode.ChatRequest,
        stream: vscode.ChatResponseStream,
        token: vscode.CancellationToken
    ): Promise<void> {
        const prompt = request.prompt.trim();
        
        // Parse project name from git query (support @projectName or just projectName)
        let projectMatch = prompt.match(/^@(\w+[\w-]*)\s*(.*)?$/);  // Match @projectName
        if (!projectMatch) {
            projectMatch = prompt.match(/^(\w+[\w-]*)\s*(.*)?$/);   // Match projectName
        }
        
        if (!projectMatch) {
            stream.markdown('Please specify a project name. Usage: `@projects @myproject what changed?` or `@projects myproject what changed?`');
            await this.showProjectSuggestions(stream);
            return;
        }

        const projectName = projectMatch[1];
        const userQuery = projectMatch[2] || 'what has changed recently?';

        // Find the project
        const projects = this.contextManager.getProjects();
        let project = projects.find(p => 
            p.name.toLowerCase() === projectName.toLowerCase() && p.enabled
        );

        if (!project) {
            project = projects.find(p => 
                p.enabled && (
                    p.name.toLowerCase().includes(projectName.toLowerCase()) ||
                    projectName.toLowerCase().includes(p.name.toLowerCase())
                )
            );
        }

        if (!project) {
            stream.markdown(`❌ Project "${projectName}" not found or not enabled.`);
            await this.showProjectSuggestions(stream);
            return;
        }

        // Check if it's a Git repository
        if (!this.githubService.isGitRepository(project.folderPath)) {
            stream.markdown(`📂 **${project.name}** is not a Git repository.\n\nTo track changes, clone from GitHub using the "Clone from GitHub" command.`);
            return;
        }

        try {
            // Get Git changes
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            
            const changes = await this.githubService.getChangesSummary(project.folderPath, sevenDaysAgo);
            const repoInfo = await this.githubService.getRepositoryInfo(project.folderPath);

            // Add project reference
            stream.reference(vscode.Uri.file(project.folderPath));

            // Create Git-aware prompt
            const gitPrompt = this.createGitAwarePrompt(project, changes, repoInfo, userQuery);

            // Use the same model that Copilot Chat is using
            try {
                if (request.model) {
                    const messages = [
                        vscode.LanguageModelChatMessage.User(gitPrompt)
                    ];

                    const chatResponse = await request.model.sendRequest(messages, {}, token);

                    for await (const fragment of chatResponse.text) {
                        stream.markdown(fragment);
                    }
                } else {
                    await this.provideGitFallbackResponse(stream, project, changes, repoInfo, userQuery);
                }
            } catch (error) {
                await this.provideGitFallbackResponse(stream, project, changes, repoInfo, userQuery);
            }

        } catch (error) {
            stream.markdown(`❌ Failed to analyze Git changes: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    private createGitAwarePrompt(project: any, changes: any, repoInfo: any, userQuery: string): string {
        let prompt = `You are analyzing a Git project called "${project.name}".

Project Details:
- Name: ${project.name}
- Description: ${project.description || 'No description provided'}
- Location: ${project.folderPath}

Git Repository Information:`;

        if (repoInfo) {
            prompt += `
- Current Branch: ${repoInfo.currentBranch}
- Remote URL: ${repoInfo.remoteUrl}
- Last Commit: ${repoInfo.lastCommit.message} by ${repoInfo.lastCommit.author}
- Last Commit Date: ${repoInfo.lastCommit.date.toLocaleString()}`;

            if (repoInfo.status.ahead > 0) {
                prompt += `
- Commits Ahead: ${repoInfo.status.ahead}`;
            }
            if (repoInfo.status.behind > 0) {
                prompt += `
- Commits Behind: ${repoInfo.status.behind}`;
            }
        }

        prompt += `

Recent Changes (Last 7 Days):
- Total Commits: ${changes.totalCommits}
- Changed Files: ${changes.changedFiles.length}`;

        if (changes.commits.length > 0) {
            prompt += `

Recent Commits:`;
            changes.commits.slice(0, 5).forEach((commit: any) => {
                prompt += `
- ${commit.hash.substring(0, 7)}: ${commit.message} (${commit.author}, ${commit.date.toLocaleDateString()})`;
                if (commit.files.length > 0) {
                    prompt += `
  Files: ${commit.files.join(', ')}`;
                }
            });
        }

        if (changes.changedFiles.length > 0) {
            prompt += `

Files Changed Recently:
${changes.changedFiles.slice(0, 10).map((file: string) => `- ${file}`).join('\n')}`;
            
            if (changes.changedFiles.length > 10) {
                prompt += `
... and ${changes.changedFiles.length - 10} more files.`;
            }
        }

        prompt += `

User's Question: ${userQuery}

Please provide a helpful analysis of the Git repository and recent changes, focusing on answering the user's specific question.`;

        return prompt;
    }

    private async provideGitFallbackResponse(
        stream: vscode.ChatResponseStream,
        project: any,
        changes: any,
        repoInfo: any,
        userQuery: string
    ): Promise<void> {
        stream.markdown(`🎯 **Git Analysis: ${project.name}**\n\n`);
        
        if (repoInfo) {
            stream.markdown(`**Repository Info:**\n`);
            stream.markdown(`- Branch: \`${repoInfo.currentBranch}\`\n`);
            stream.markdown(`- Last Commit: ${repoInfo.lastCommit.message}\n`);
            stream.markdown(`- Author: ${repoInfo.lastCommit.author}\n`);
            stream.markdown(`- Date: ${repoInfo.lastCommit.date.toLocaleString()}\n\n`);
        }

        stream.markdown(`**Recent Activity (Last 7 Days):**\n`);
        stream.markdown(`- 📊 **${changes.totalCommits}** commits\n`);
        stream.markdown(`- 📁 **${changes.changedFiles.length}** files changed\n\n`);

        if (changes.commits.length > 0) {
            stream.markdown(`**Recent Commits:**\n`);
            changes.commits.slice(0, 3).forEach((commit: any) => {
                stream.markdown(`- \`${commit.hash.substring(0, 7)}\` ${commit.message}\n`);
            });
            stream.markdown('\n');
        }

        if (changes.changedFiles.length > 0) {
            stream.markdown(`**Changed Files:**\n`);
            changes.changedFiles.slice(0, 5).forEach((file: string) => {
                stream.markdown(`- \`${file}\`\n`);
            });
            
            if (changes.changedFiles.length > 5) {
                stream.markdown(`- ... and ${changes.changedFiles.length - 5} more files\n`);
            }
            stream.markdown('\n');
        }

        stream.markdown(`💡 **Your question:** "${userQuery}"\n\n`);
        stream.markdown(`ℹ️ *Copilot language model not available. Showing Git analysis instead.*`);
    }

    private async handleGitUpdate(
        request: vscode.ChatRequest,
        stream: vscode.ChatResponseStream,
        token: vscode.CancellationToken
    ): Promise<void> {
        const prompt = request.prompt.trim();
        
        // Parse project name from update request
        let projectMatch = prompt.match(/^@(\w+[\w-]*)\s*(.*)?$/);  // Match @projectName
        if (!projectMatch) {
            projectMatch = prompt.match(/^(\w+[\w-]*)\s*(.*)?$/);   // Match projectName
        }
        
        if (!projectMatch) {
            stream.markdown('Please specify a project name. Usage: `@projects @myproject update` or `@projects myproject get latest`');
            await this.showProjectSuggestions(stream);
            return;
        }

        const projectName = projectMatch[1];
        const userQuery = projectMatch[2] || 'update to latest version';

        // Find the project
        const projects = this.contextManager.getProjects();
        let project = projects.find(p => 
            p.name.toLowerCase() === projectName.toLowerCase() && p.enabled
        );

        if (!project) {
            project = projects.find(p => 
                p.enabled && (
                    p.name.toLowerCase().includes(projectName.toLowerCase()) ||
                    projectName.toLowerCase().includes(p.name.toLowerCase())
                )
            );
        }

        if (!project) {
            stream.markdown(`❌ Project "${projectName}" not found or not enabled.`);
            await this.showProjectSuggestions(stream);
            return;
        }

        // Check if it's a Git repository
        if (!this.githubService.isGitRepository(project.folderPath)) {
            stream.markdown(`📂 **${project.name}** is not a Git repository.\n\nTo track changes, clone from GitHub using the "Clone from GitHub" command.`);
            return;
        }

        try {
            stream.markdown(`🔄 **Updating ${project.name}...**\n\n`);
            
            // Show progress
            stream.markdown(`📥 Fetching latest changes from remote...\n`);
            
            // Actually perform the Git update
            const result = await this.githubService.updateProject(
                project.folderPath,
                (message) => {
                    stream.markdown(`${message}\n`);
                }
            );

            if (result.hasChanges) {
                // Update project metadata
                await this.contextManager.updateGitProject(project.name);
                
                stream.markdown(`\n✅ **Successfully updated ${project.name}!**\n\n`);
                stream.markdown(`📊 **Changes summary:**\n`);
                stream.markdown(`- **Files changed:** ${result.changeCount}\n`);
                
                if (result.changedFiles.length > 0) {
                    stream.markdown(`- **Updated files:** ${result.changedFiles.slice(0, 5).join(', ')}`);
                    if (result.changedFiles.length > 5) {
                        stream.markdown(` and ${result.changedFiles.length - 5} more`);
                    }
                    stream.markdown('\n');
                }

                // Get updated project context after pull
                const updatedContext = await this.getProjectContext(project);
                
                // Create an enhanced prompt to analyze what changed
                const analysisPrompt = `You have just updated the project "${project.name}" from Git. Here are the details:

Project: ${project.name}
Files changed: ${result.changeCount}
Changed files: ${result.changedFiles.join(', ')}

Updated project content:
${updatedContext.content}

The user asked: "${userQuery}"

Please analyze what has changed in this project update and provide a summary of the new features, bug fixes, or improvements that were pulled from the repository. Focus on what's new or different since the last version.`;

                // Use Copilot to analyze the changes
                try {
                    if (request.model) {
                        stream.markdown(`\n🤖 **Analyzing changes with Copilot...**\n\n`);
                        
                        const messages = [
                            vscode.LanguageModelChatMessage.User(analysisPrompt)
                        ];

                        const chatResponse = await request.model.sendRequest(messages, {}, token);

                        for await (const fragment of chatResponse.text) {
                            stream.markdown(fragment);
                        }
                    } else {
                        stream.markdown(`\n💡 Project updated successfully. You now have the latest version with ${result.changeCount} file changes.`);
                    }
                } catch (error) {
                    stream.markdown(`\n💡 Project updated successfully. You now have the latest version with ${result.changeCount} file changes.`);
                }

            } else {
                stream.markdown(`\n✅ **${project.name} is already up to date!**\n\n`);
                stream.markdown(`📊 No new changes were found in the remote repository.`);
                
                // Still provide project info
                if (request.model) {
                    const currentPrompt = `The project "${project.name}" is already up to date. The user asked: "${userQuery}"

Please provide information about the current state of the project and what they can do with it.`;

                    try {
                        const messages = [
                            vscode.LanguageModelChatMessage.User(currentPrompt)
                        ];

                        const chatResponse = await request.model.sendRequest(messages, {}, token);

                        stream.markdown('\n');
                        for await (const fragment of chatResponse.text) {
                            stream.markdown(fragment);
                        }
                    } catch (error) {
                        stream.markdown(`\n💡 The project is current and ready to use.`);
                    }
                }
            }

        } catch (error) {
            stream.markdown(`\n❌ **Failed to update ${project.name}:**\n`);
            stream.markdown(`${error instanceof Error ? error.message : 'Unknown error'}\n\n`);
            
            if (error instanceof Error && error.message.includes('not a git repository')) {
                stream.markdown(`This project is not a Git repository. To track changes, you can:\n`);
                stream.markdown(`1. Clone it from GitHub using the "Clone from GitHub" command\n`);
                stream.markdown(`2. Initialize it as a Git repository manually\n`);
            } else {
                stream.markdown(`💡 You can try:\n`);
                stream.markdown(`1. Check your internet connection\n`);
                stream.markdown(`2. Ensure you have access to the remote repository\n`);
                stream.markdown(`3. Manually run \`git pull\` in the project directory\n`);
            }
        }
    }

    /**
     * Greet the user and provide a brief status update (like a secretary)
     */
    private async greetAndBrief(
        request: vscode.ChatRequest,
        stream: vscode.ChatResponseStream,
        token: vscode.CancellationToken
    ): Promise<void> {
        const hour = new Date().getHours();
        let greeting = 'Hello';
        if (hour < 12) greeting = 'Good morning';
        else if (hour < 18) greeting = 'Good afternoon';
        else greeting = 'Good evening';

        stream.markdown(`${greeting}! Let me get you up to speed on your projects.\n\n`);
        stream.progress('Checking for updates...');

        // First, sync all Git projects silently
        const projects = this.contextManager.getProjects().filter(p => p.enabled);
        const gitProjects = projects.filter(p => fs.existsSync(path.join(p.folderPath, '.git')));

        let totalUpdates = 0;
        const updatedProjects: string[] = [];

        for (const project of gitProjects) {
            try {
                const result = await this.githubService.updateProject(project.folderPath);
                if (result.hasChanges) {
                    totalUpdates += result.changeCount;
                    updatedProjects.push(`${project.name} (${result.changeCount} changes)`);
                }
            } catch (error) {
                // Skip projects with errors
            }
        }

        // Brief status
        if (totalUpdates > 0) {
            stream.markdown(`📬 **You have ${totalUpdates} new change(s)** across ${updatedProjects.length} project(s):\n`);
            updatedProjects.forEach(p => stream.markdown(`  - ${p}\n`));
            stream.markdown('\n');
        } else {
            stream.markdown(`✅ All ${gitProjects.length} project(s) are up to date.\n\n`);
        }

        // Count tasks
        const taskCount = await this.countTasks(projects);
        if (taskCount > 0) {
            stream.markdown(`📋 You have **${taskCount} pending task(s)** in your code.\n\n`);
        }

        // AI-powered brief with project-focused questions
        if (request.model) {
            const projectList = projects.map(p => p.name).join(', ');
            const briefPrompt = `You are a personal secretary helping a developer with their projects. Give a warm, brief status update.

Active projects: ${projectList}
${totalUpdates > 0 ? `New changes: ${updatedProjects.join(', ')}` : 'All projects up to date'}
${taskCount > 0 ? `Pending tasks: ${taskCount}` : 'No pending tasks'}

Give a 1-2 sentence status summary, then offer 2-3 specific, project-related action options. Be direct and project-focused. Examples:
- "Would you like me to check if there's anything new in your projects?"
- "Need help implementing any of the pending tasks?"
- "What would you like to work on in [project name] today?"
- "Should I pull the latest changes and show you what's new?"
- "Want me to create a work plan based on your tasks?"

DON'T use generic phrases like "How can I assist you?" or "What can I help with?" - be specific to their projects and tasks.`;

            try {
                const messages = [vscode.LanguageModelChatMessage.User(briefPrompt)];
                const chatResponse = await request.model.sendRequest(messages, {}, token);

                for await (const fragment of chatResponse.text) {
                    stream.markdown(fragment);
                }
            } catch (error) {
                // Fallback with project-focused questions
                if (totalUpdates > 0) {
                    stream.markdown(`\n📌 **What would you like to do?**\n`);
                    stream.markdown(`- Review the ${totalUpdates} new change(s) across your projects?\n`);
                    stream.markdown(`- See a detailed breakdown of what changed?\n`);
                    stream.markdown(`- Get a work plan based on recent updates?\n`);
                } else if (taskCount > 0) {
                    stream.markdown(`\n📌 **What would you like to work on?**\n`);
                    stream.markdown(`- Review your ${taskCount} pending task(s)?\n`);
                    stream.markdown(`- Get an organized work plan for today?\n`);
                    stream.markdown(`- Start with a specific project?\n`);
                } else {
                    stream.markdown(`\n📌 **Ready to start?**\n`);
                    stream.markdown(`- Want me to check for any updates in your projects?\n`);
                    stream.markdown(`- Should I scan your code for any TODO items?\n`);
                    stream.markdown(`- Which project would you like to focus on today?\n`);
                }
            }
        } else {
            // No AI model available - provide project-focused options
            if (totalUpdates > 0) {
                stream.markdown(`\n📌 Want me to show you what changed? Or create a work plan based on the updates?\n`);
            } else if (taskCount > 0) {
                stream.markdown(`\n📌 Would you like to review your ${taskCount} pending tasks or get a work plan?\n`);
            } else {
                stream.markdown(`\n📌 Should I check for updates in your projects, or scan for any TODO items?\n`);
            }
        }

        stream.markdown('\n💡 *I can help with: "status", "tasks", "plan", "news", or "sync all"*\n');
    }

    /**
     * Count tasks across all projects (helper method)
     */
    private async countTasks(projects: any[]): Promise<number> {
        const taskPatterns = [
            /\/\/\s*(TODO|FIXME|HACK|BUG):?\s*(.+)/gi,
            /#\s*(TODO|FIXME|HACK|BUG):?\s*(.+)/gi
        ];

        let count = 0;
        for (const project of projects) {
            const files = this.getProjectFiles(project.folderPath).slice(0, 100);
            for (const file of files) {
                const filePath = path.join(project.folderPath, file);
                try {
                    const content = fs.readFileSync(filePath, 'utf-8');
                    for (const pattern of taskPatterns) {
                        const matches = content.matchAll(pattern);
                        for (const _ of matches) count++;
                    }
                } catch (error) {
                    // Skip
                }
            }
        }
        return count;
    }

    /**
     * Show comprehensive status of all projects with recent changes
     */
    private async showProjectStatus(
        request: vscode.ChatRequest,
        stream: vscode.ChatResponseStream,
        token: vscode.CancellationToken
    ): Promise<void> {
        stream.markdown('# 📊 Project Status Dashboard\n\n');
        stream.markdown('*Let me check everything for you...*\n\n');
        stream.progress('Ensuring all projects are up to date...');

        // Auto-update all Git projects first (secretary behavior)
        const projects = this.contextManager.getProjects();
        const enabledProjects = projects.filter(p => p.enabled);
        const gitProjects = enabledProjects.filter(p => fs.existsSync(path.join(p.folderPath, '.git')));

        let anyUpdates = false;
        for (const project of gitProjects) {
            try {
                const result = await this.githubService.updateProject(project.folderPath);
                if (result.hasChanges) {
                    anyUpdates = true;
                }
            } catch (error) {
                // Continue silently
            }
        }

        if (anyUpdates) {
            stream.markdown('✅ *I\'ve updated your projects with the latest changes.*\n\n');
        }

        stream.progress('Analyzing all projects...');

        if (enabledProjects.length === 0) {
            stream.markdown('No active projects found. Create your first project to get started!\n');
            return;
        }

        stream.markdown(`**Total Projects:** ${enabledProjects.length}\n\n`);

        // Analyze each project
        for (const project of enabledProjects) {
            const isGit = fs.existsSync(path.join(project.folderPath, '.git'));
            
            stream.markdown(`## ${isGit ? '🔄' : '📁'} ${project.name}\n`);
            
            if (project.description) {
                stream.markdown(`*${project.description}*\n\n`);
            }

            if (isGit) {
                try {
                    stream.progress(`Checking ${project.name}...`);
                    const changes = await this.githubService.getChangesSummary(project.folderPath);
                    
                    if (changes.totalCommits > 0) {
                        stream.markdown(`📈 **${changes.totalCommits}** recent commit(s)\n`);
                        stream.markdown(`📝 **${changes.changedFiles.length}** file(s) changed\n`);
                        
                        if (changes.commits.length > 0) {
                            const latestCommit = changes.commits[0];
                            stream.markdown(`🕐 Latest: *${latestCommit.message}* (${latestCommit.date})\n`);
                        }
                    } else {
                        stream.markdown(`✅ Up to date\n`);
                    }
                } catch (error) {
                    stream.markdown(`ℹ️ Git info unavailable\n`);
                }
            } else {
                const files = this.getProjectFiles(project.folderPath);
                stream.markdown(`📄 **${files.length}** file(s)\n`);
            }
            
            stream.markdown(`📂 Path: \`${project.folderPath}\`\n\n`);
        }

        // Use AI to provide insights
        if (request.model) {
            stream.markdown('---\n\n');
            stream.markdown('## 🤖 AI Insights\n\n');
            
            const projectSummary = enabledProjects.map(p => {
                const isGit = fs.existsSync(path.join(p.folderPath, '.git'));
                return `- ${p.name}: ${p.description || 'No description'} (${isGit ? 'Git repository' : 'Local project'})`;
            }).join('\n');

            const analysisPrompt = `You are a professional secretary providing a status brief to your boss. Based on these active projects:

${projectSummary}

Provide a brief, professional status report:
1. Overview of what they're working on
2. Which projects need attention and why
3. Recommended priorities for today

Be warm and proactive. Start with something like "Here's your project overview:" and end by asking if they'd like to focus on any particular project. Keep it concise and helpful.`;

            try {
                const messages = [vscode.LanguageModelChatMessage.User(analysisPrompt)];
                const chatResponse = await request.model.sendRequest(messages, {}, token);

                for await (const fragment of chatResponse.text) {
                    stream.markdown(fragment);
                }
            } catch (error) {
                stream.markdown('Unable to generate AI insights at this time.\n');
            }
        }
    }

    /**
     * Sync all Git projects and show what's new
     */
    private async syncAllProjects(
        request: vscode.ChatRequest,
        stream: vscode.ChatResponseStream,
        token: vscode.CancellationToken
    ): Promise<void> {
        stream.markdown('# 🔄 Syncing Your Projects\n\n');
        stream.markdown('*Let me make sure everything is up to date...*\n\n');
        
        const projects = this.contextManager.getProjects().filter(p => p.enabled);
        const gitProjects = projects.filter(p => fs.existsSync(path.join(p.folderPath, '.git')));

        if (gitProjects.length === 0) {
            stream.markdown('No Git repositories found to sync.\n');
            return;
        }

        stream.markdown(`Found **${gitProjects.length}** Git repositories to sync...\n\n`);

        const updates: Array<{name: string, changes: number, commits: any[]}> = [];

        for (const project of gitProjects) {
            stream.progress(`Syncing ${project.name}...`);
            stream.markdown(`## ${project.name}\n`);

            try {
                const result = await this.githubService.updateProject(project.folderPath);
                
                if (result.hasChanges) {
                    stream.markdown(`✅ Updated! ${result.changeCount} file(s) changed\n\n`);
                    
                    const changes = await this.githubService.getChangesSummary(project.folderPath);
                    updates.push({
                        name: project.name,
                        changes: result.changeCount,
                        commits: changes.commits
                    });
                } else {
                    stream.markdown(`✓ Already up to date\n\n`);
                }
            } catch (error) {
                stream.markdown(`⚠️ Failed to update: ${error instanceof Error ? error.message : 'Unknown error'}\n\n`);
            }
        }

        // Summarize updates with AI
        if (updates.length > 0 && request.model) {
            stream.markdown('---\n\n## 📰 What\'s New\n\n');
            
            const updatesSummary = updates.map(u => {
                const commitList = u.commits.map(c => `  - ${c.message} (${c.author})`).join('\n');
                return `**${u.name}** (${u.changes} file changes):\n${commitList}`;
            }).join('\n\n');

            const analysisPrompt = `You are a professional secretary. I've just updated these projects for my boss:

${updatesSummary}

Brief them professionally on:
1. The most important changes they should be aware of
2. Any new features, bug fixes, or improvements
3. Action items or follow-ups needed
4. Anything that might require their immediate attention

Be warm, professional, and proactive. Start with something like "I've synced everything - here's what you need to know:" Keep it concise but helpful.`;

            try {
                const messages = [vscode.LanguageModelChatMessage.User(analysisPrompt)];
                const chatResponse = await request.model.sendRequest(messages, {}, token);

                for await (const fragment of chatResponse.text) {
                    stream.markdown(fragment);
                }
            } catch (error) {
                stream.markdown('All projects synced successfully!\n');
            }
        } else if (updates.length === 0) {
            stream.markdown('✨ All projects are already up to date!\n');
        }
    }

    /**
     * Show recent changes across all projects
     */
    private async showRecentChanges(
        request: vscode.ChatRequest,
        stream: vscode.ChatResponseStream,
        token: vscode.CancellationToken
    ): Promise<void> {
        stream.markdown('# 📰 What\'s New in Your Projects\n\n');
        stream.markdown('*Let me brief you on recent developments...*\n\n');
        stream.progress('Pulling latest updates...');

        // Auto-update all Git projects first (secretary behavior)
        const allProjects = this.contextManager.getProjects().filter(p => p.enabled);
        const gitProjects = allProjects.filter(p => fs.existsSync(path.join(p.folderPath, '.git')));

        for (const project of gitProjects) {
            try {
                await this.githubService.updateProject(project.folderPath);
            } catch (error) {
                // Continue
            }
        }

        stream.progress('Analyzing recent activity...');

        if (gitProjects.length === 0) {
            stream.markdown('No Git repositories found to analyze.\n');
            return;
        }

        const allChanges: Array<{project: string, commits: any[]}> = [];

        for (const project of gitProjects) {
            try {
                const changes = await this.githubService.getChangesSummary(project.folderPath);
                
                if (changes.commits.length > 0) {
                    allChanges.push({
                        project: project.name,
                        commits: changes.commits
                    });

                    stream.markdown(`## ${project.name}\n\n`);
                    
                    changes.commits.slice(0, 5).forEach(commit => {
                        stream.markdown(`- **${commit.message}**\n`);
                        stream.markdown(`  *${commit.author} - ${commit.date}*\n\n`);
                    });
                }
            } catch (error) {
                // Skip projects with errors
            }
        }

        if (allChanges.length === 0) {
            stream.markdown('No recent changes found in any projects.\n');
            return;
        }

        // Use AI to analyze and extract tasks
        if (request.model) {
            stream.markdown('---\n\n## 🎯 Extracted Tasks & Insights\n\n');
            
            const changesSummary = allChanges.map(c => {
                const commits = c.commits.slice(0, 5).map(commit => `  - ${commit.message}`).join('\n');
                return `**${c.project}:**\n${commits}`;
            }).join('\n\n');

            const analysisPrompt = `You are a professional secretary briefing your boss on recent developments in their projects. Based on these recent changes:

${changesSummary}

As their secretary, please brief them on:
1. The most important changes they should know about
2. Any new TODO items or action items mentioned in commits
3. Areas that might need their attention or follow-up
4. Notable patterns or trends

Be warm and professional. Start with something like "Here's what's been happening..." and highlight key points. Offer to help with any specific area. Keep it conversational but concise.`;

            try {
                const messages = [vscode.LanguageModelChatMessage.User(analysisPrompt)];
                const chatResponse = await request.model.sendRequest(messages, {}, token);

                for await (const fragment of chatResponse.text) {
                    stream.markdown(fragment);
                }
            } catch (error) {
                stream.markdown('Recent changes listed above.\n');
            }
        }
    }

    /**
     * Show tasks from all projects
     */
    private async showTasks(
        request: vscode.ChatRequest,
        stream: vscode.ChatResponseStream,
        token: vscode.CancellationToken
    ): Promise<void> {
        stream.markdown('# ✅ Your Tasks\n\n');
        stream.markdown('*Let me gather all your TODO items...*\n\n');
        stream.progress('Ensuring projects are current...');

        // Auto-update Git projects first
        const allProjects = this.contextManager.getProjects().filter(p => p.enabled);
        const gitProjects = allProjects.filter(p => fs.existsSync(path.join(p.folderPath, '.git')));

        for (const project of gitProjects) {
            try {
                await this.githubService.updateProject(project.folderPath);
            } catch (error) {
                // Continue
            }
        }

        stream.progress('Scanning projects for tasks...');

        const projects = this.contextManager.getProjects().filter(p => p.enabled);
        const allTasks: Array<{project: string, file: string, line: string, task: string}> = [];

        // Scan for TODO, FIXME, HACK, etc.
        const taskPatterns = [
            /\/\/\s*(TODO|FIXME|HACK|BUG|NOTE|IMPORTANT):?\s*(.+)/gi,
            /#\s*(TODO|FIXME|HACK|BUG|NOTE|IMPORTANT):?\s*(.+)/gi,
            /\/\*\s*(TODO|FIXME|HACK|BUG|NOTE|IMPORTANT):?\s*(.+)\*\//gi
        ];

        for (const project of projects) {
            const files = this.getProjectFiles(project.folderPath);
            
            for (const file of files) {
                const filePath = path.join(project.folderPath, file);
                
                try {
                    const content = fs.readFileSync(filePath, 'utf-8');
                    const lines = content.split('\n');
                    
                    lines.forEach((line, index) => {
                        for (const pattern of taskPatterns) {
                            const match = pattern.exec(line);
                            if (match) {
                                allTasks.push({
                                    project: project.name,
                                    file: file,
                                    line: `${index + 1}`,
                                    task: match[2] ? match[2].trim() : match[0].trim()
                                });
                            }
                            pattern.lastIndex = 0; // Reset regex
                        }
                    });
                } catch (error) {
                    // Skip files that can't be read
                }
            }
        }

        if (allTasks.length === 0) {
            stream.markdown('No TODO items or tasks found in your projects.\n\n');
            stream.markdown('💡 *Add comments like `// TODO: task description` to track tasks in your code.*\n');
            return;
        }

        stream.markdown(`Found **${allTasks.length}** task(s) across your projects:\n\n`);

        // Group by project
        const tasksByProject = allTasks.reduce((acc, task) => {
            if (!acc[task.project]) acc[task.project] = [];
            acc[task.project].push(task);
            return acc;
        }, {} as Record<string, typeof allTasks>);

        for (const [projectName, tasks] of Object.entries(tasksByProject)) {
            stream.markdown(`## ${projectName} (${tasks.length} tasks)\n\n`);
            
            tasks.forEach(task => {
                stream.markdown(`- [ ] **${task.task}**\n`);
                stream.markdown(`  📄 \`${task.file}:${task.line}\`\n\n`);
            });
        }

        // Use AI to prioritize and organize tasks
        if (request.model) {
            stream.markdown('---\n\n## 🎯 AI Task Analysis\n\n');
            
            const tasksSummary = allTasks.slice(0, 20).map(t => 
                `- [${t.project}] ${t.task}`
            ).join('\n');

            const analysisPrompt = `You are a professional secretary helping your boss organize their tasks. Here are the tasks I found in their code:

${tasksSummary}

As their secretary, please:
1. Categorize these tasks (urgent bugs, features, improvements, etc.)
2. Suggest which should be tackled first and why
3. Point out any quick wins
4. Identify potential blockers

Be warm and professional. Start with something like "I've organized your tasks..." and offer to help them start with any specific one. Keep it concise.`;

            try {
                const messages = [vscode.LanguageModelChatMessage.User(analysisPrompt)];
                const chatResponse = await request.model.sendRequest(messages, {}, token);

                for await (const fragment of chatResponse.text) {
                    stream.markdown(fragment);
                }
            } catch (error) {
                stream.markdown('Tasks listed above. Consider prioritizing based on project needs.\n');
            }
        }
    }

    /**
     * Suggest a work plan based on projects, tasks, and recent changes
     */
    private async suggestWorkPlan(
        request: vscode.ChatRequest,
        stream: vscode.ChatResponseStream,
        token: vscode.CancellationToken
    ): Promise<void> {
        stream.markdown('# 🗓️ Your Work Plan\n\n');
        stream.markdown('*Let me organize your day for you...*\n\n');
        stream.progress('Checking for latest updates first...');

        // Auto-update all Git projects first (secretary always ensures latest info)
        const allProjects = this.contextManager.getProjects().filter(p => p.enabled);
        const gitProjects = allProjects.filter(p => fs.existsSync(path.join(p.folderPath, '.git')));

        let updatesFound = false;
        for (const project of gitProjects) {
            try {
                const result = await this.githubService.updateProject(project.folderPath);
                if (result.hasChanges) {
                    updatesFound = true;
                }
            } catch (error) {
                // Continue
            }
        }

        if (updatesFound) {
            stream.markdown('✅ *I\'ve synced your projects with the latest changes before planning.*\n\n');
        }

        stream.progress('Analyzing your projects and tasks...');

        if (!request.model) {
            stream.markdown('AI model required for work plan generation.\n');
            return;
        }

        const projects = this.contextManager.getProjects().filter(p => p.enabled);
        
        // Gather comprehensive context
        const projectsSummary = projects.map(p => {
            const isGit = fs.existsSync(path.join(p.folderPath, '.git'));
            return `- ${p.name}: ${p.description || 'No description'} (${isGit ? 'Git repo' : 'Local'})`;
        }).join('\n');

        // Scan for tasks
        const taskPatterns = [
            /\/\/\s*(TODO|FIXME|HACK|BUG):?\s*(.+)/gi,
            /#\s*(TODO|FIXME|HACK|BUG):?\s*(.+)/gi
        ];

        const allTasks: string[] = [];
        for (const project of projects) {
            const files = this.getProjectFiles(project.folderPath).slice(0, 50); // Limit files
            
            for (const file of files) {
                const filePath = path.join(project.folderPath, file);
                try {
                    const content = fs.readFileSync(filePath, 'utf-8');
                    for (const pattern of taskPatterns) {
                        const matches = content.matchAll(pattern);
                        for (const match of matches) {
                            allTasks.push(`[${project.name}] ${match[2] || match[0]}`);
                        }
                    }
                } catch (error) {
                    // Skip
                }
            }
        }

        // Get recent Git activity
        const recentActivity: string[] = [];
        for (const project of projects) {
            if (fs.existsSync(path.join(project.folderPath, '.git'))) {
                try {
                    const changes = await this.githubService.getChangesSummary(project.folderPath);
                    if (changes.commits.length > 0) {
                        recentActivity.push(`${project.name}: ${changes.commits[0].message}`);
                    }
                } catch (error) {
                    // Skip
                }
            }
        }

        const planPrompt = `You are a professional, helpful personal secretary for a developer. I've already ensured all projects are up to date. Now help them plan their workday.

Here's the context:

**Active Projects:**
${projectsSummary}

**Pending Tasks (${allTasks.length} total):**
${allTasks.slice(0, 15).join('\n')}
${allTasks.length > 15 ? `\n... and ${allTasks.length - 15} more` : ''}

**Recent Activity:**
${recentActivity.length > 0 ? recentActivity.join('\n') : 'No recent commits'}

**Their Request:** ${request.prompt}

As their secretary, create a structured work plan that:
1. Prioritizes tasks based on urgency and importance
2. Suggests realistic time estimates  
3. Groups related tasks for efficiency
4. Identifies any blockers they should know about
5. Recommends a practical sequence for today

Be warm, professional, and encouraging. Start with something like "Here's what I suggest for today:" and end by offering to help with anything specific. Keep it concise and actionable.`;

        try {
            const messages = [vscode.LanguageModelChatMessage.User(planPrompt)];
            const chatResponse = await request.model.sendRequest(messages, {}, token);

            for await (const fragment of chatResponse.text) {
                stream.markdown(fragment);
            }

            stream.markdown('\n\n---\n\n💡 *Use `@projects tasks` to see all TODO items, or `@projects news` to check for updates.*\n');
        } catch (error) {
            stream.markdown('Unable to generate work plan at this time.\n');
        }
    }

    /**
     * Get files from a project directory
     */
    private getProjectFiles(folderPath: string): string[] {
        const files: string[] = [];
        
        const scanDir = (dir: string, baseDir: string = folderPath) => {
            try {
                const entries = fs.readdirSync(dir, { withFileTypes: true });
                
                for (const entry of entries) {
                    const fullPath = path.join(dir, entry.name);
                    const relativePath = path.relative(baseDir, fullPath);
                    
                    // Skip common ignore patterns
                    if (entry.name.startsWith('.') || 
                        entry.name === 'node_modules' || 
                        entry.name === 'dist' ||
                        entry.name === 'build' ||
                        entry.name === '__pycache__') {
                        continue;
                    }
                    
                    if (entry.isDirectory()) {
                        scanDir(fullPath, baseDir);
                    } else {
                        files.push(relativePath);
                    }
                }
            } catch (error) {
                // Skip directories we can't read
            }
        };
        
        scanDir(folderPath);
        return files;
    }
}