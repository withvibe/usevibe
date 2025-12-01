import * as vscode from 'vscode';
import { ContextManager } from './contextManager';
import * as path from 'path';
import * as fs from 'fs';

/**
 * Completion provider for @projects in editor and chat
 */
export class ProjectCompletionProvider implements vscode.CompletionItemProvider {
    private contextManager: ContextManager;

    constructor(contextManager: ContextManager) {
        this.contextManager = contextManager;
    }

    provideCompletionItems(
        document: vscode.TextDocument,
        position: vscode.Position,
        token: vscode.CancellationToken,
        context: vscode.CompletionContext
    ): vscode.ProviderResult<vscode.CompletionItem[] | vscode.CompletionList> {
        
        const linePrefix = document.lineAt(position).text.substring(0, position.character);
        
        // Check if user typed @ or @pro or @projects
        if (!linePrefix.match(/@\w*$/)) {
            return undefined;
        }

        const completions: vscode.CompletionItem[] = [];

        // Add @projects trigger
        if (linePrefix.endsWith('@') || linePrefix.match(/@p\w*$/)) {
            const projectsItem = new vscode.CompletionItem('@projects', vscode.CompletionItemKind.Folder);
            projectsItem.detail = 'Show all context projects';
            projectsItem.documentation = 'List and select from available context projects';
            projectsItem.command = {
                command: 'cursorContexts.showProjectPicker',
                title: 'Show Projects'
            };
            completions.push(projectsItem);
        }

        // Get all enabled projects
        const projects = this.contextManager.getProjects().filter(p => p.enabled);
        
        // Add individual project completions
        projects.forEach(project => {
            const item = new vscode.CompletionItem(
                `@${project.name}`,
                vscode.CompletionItemKind.Folder
            );
            
            item.detail = project.description || 'Context project';
            
            // Build documentation with file list
            const files = this.getProjectFiles(project.folderPath);
            let docs = `**Project:** ${project.name}\n\n`;
            if (project.description) {
                docs += `${project.description}\n\n`;
            }
            docs += `**Files (${files.length}):**\n`;
            files.forEach(file => {
                docs += `- ${file}\n`;
            });
            
            item.documentation = new vscode.MarkdownString(docs);
            item.insertText = `@${project.name}`;
            item.filterText = `@${project.name} @projects`;
            item.sortText = `0_${project.name}`;
            
            completions.push(item);
        });

        return completions;
    }

    private getProjectFiles(folderPath: string): string[] {
        if (!fs.existsSync(folderPath)) {
            return [];
        }

        try {
            return fs.readdirSync(folderPath)
                .filter(file => {
                    const filePath = path.join(folderPath, file);
                    const stat = fs.statSync(filePath);
                    return stat.isFile() && !file.startsWith('.');
                })
                .slice(0, 10); // Limit to first 10 files for display
        } catch (error) {
            return [];
        }
    }
}

/**
 * Hover provider for @project references
 */
export class ProjectHoverProvider implements vscode.HoverProvider {
    private contextManager: ContextManager;

    constructor(contextManager: ContextManager) {
        this.contextManager = contextManager;
    }

    provideHover(
        document: vscode.TextDocument,
        position: vscode.Position,
        token: vscode.CancellationToken
    ): vscode.ProviderResult<vscode.Hover> {
        
        const range = document.getWordRangeAtPosition(position, /@[\w-]+/);
        if (!range) {
            return undefined;
        }

        const word = document.getText(range);
        if (!word.startsWith('@')) {
            return undefined;
        }

        const projectName = word.substring(1);
        const projects = this.contextManager.getProjects();
        const project = projects.find(p => p.name === projectName);

        if (!project) {
            return undefined;
        }

        // Build hover content
        const content = new vscode.MarkdownString();
        content.appendMarkdown(`### Context Project: ${project.name}\n\n`);
        
        if (project.description) {
            content.appendMarkdown(`${project.description}\n\n`);
        }

        content.appendMarkdown(`**Status:** ${project.enabled ? '✅ Enabled' : '🚫 Disabled'}\n\n`);
        content.appendMarkdown(`**Path:** \`${project.folderPath}\`\n\n`);

        // Add file list
        const files = this.getProjectFiles(project.folderPath);
        if (files.length > 0) {
            content.appendMarkdown(`**Files:**\n`);
            files.forEach(file => {
                content.appendMarkdown(`- ${file}\n`);
            });
        }

        return new vscode.Hover(content, range);
    }

    private getProjectFiles(folderPath: string): string[] {
        if (!fs.existsSync(folderPath)) {
            return [];
        }

        try {
            return fs.readdirSync(folderPath)
                .filter(file => {
                    const filePath = path.join(folderPath, file);
                    const stat = fs.statSync(filePath);
                    return stat.isFile() && !file.startsWith('.');
                });
        } catch (error) {
            return [];
        }
    }
}

/**
 * Definition provider for @project references - allows Ctrl+Click navigation
 */
export class ProjectDefinitionProvider implements vscode.DefinitionProvider {
    private contextManager: ContextManager;

    constructor(contextManager: ContextManager) {
        this.contextManager = contextManager;
    }

    provideDefinition(
        document: vscode.TextDocument,
        position: vscode.Position,
        token: vscode.CancellationToken
    ): vscode.ProviderResult<vscode.Definition | vscode.LocationLink[]> {
        
        const range = document.getWordRangeAtPosition(position, /@[\w-]+/);
        if (!range) {
            return undefined;
        }

        const word = document.getText(range);
        if (!word.startsWith('@')) {
            return undefined;
        }

        const projectName = word.substring(1);
        const projects = this.contextManager.getProjects();
        const project = projects.find(p => p.name === projectName);

        if (!project) {
            return undefined;
        }

        // Open the project's README if it exists
        const readmePath = path.join(project.folderPath, 'README.md');
        if (fs.existsSync(readmePath)) {
            return new vscode.Location(
                vscode.Uri.file(readmePath),
                new vscode.Position(0, 0)
            );
        }

        // Otherwise, open the first file in the project
        const files = this.getProjectFiles(project.folderPath);
        if (files.length > 0) {
            const firstFilePath = path.join(project.folderPath, files[0]);
            return new vscode.Location(
                vscode.Uri.file(firstFilePath),
                new vscode.Position(0, 0)
            );
        }

        return undefined;
    }

    private getProjectFiles(folderPath: string): string[] {
        if (!fs.existsSync(folderPath)) {
            return [];
        }

        try {
            return fs.readdirSync(folderPath)
                .filter(file => {
                    const filePath = path.join(folderPath, file);
                    const stat = fs.statSync(filePath);
                    return stat.isFile() && !file.startsWith('.');
                });
        } catch (error) {
            return [];
        }
    }
}
