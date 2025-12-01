import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { ContextManager } from './contextManager';

export class ContextProject {
    public readonly name: string;
    public readonly folderPath: string;
    public readonly enabled: boolean;
    public readonly projectDescription?: string;
    public readonly fileCount: number;
    
    // TreeItem properties
    public readonly label: string;
    public readonly collapsibleState: vscode.TreeItemCollapsibleState;
    public readonly contextValue: string;
    public readonly tooltip: string;
    public readonly iconPath: vscode.ThemeIcon;
    
    constructor(
        name: string,
        folderPath: string,
        enabled: boolean,
        description?: string,
        fileCount: number = 0
    ) {
        this.name = name;
        this.folderPath = folderPath;
        this.enabled = enabled;
        this.projectDescription = description;
        this.fileCount = fileCount;
        
        // Set TreeItem properties
        this.label = name;
        this.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
        this.contextValue = 'project';
        this.tooltip = this.getTooltip();
        this.iconPath = this.getIcon();
    }

    private getTooltip(): string {
        const status = this.enabled ? '✅ Enabled' : '🚫 Disabled';
        const files = `${this.fileCount} file${this.fileCount !== 1 ? 's' : ''}`;
        return `${this.name}\n${status}\n${files}${this.projectDescription ? `\n${this.projectDescription}` : ''}`;
    }

    private getIcon(): vscode.ThemeIcon {
        if (this.enabled) {
            return new vscode.ThemeIcon('folder', new vscode.ThemeColor('charts.green'));
        } else {
            return new vscode.ThemeIcon('folder', new vscode.ThemeColor('charts.red'));
        }
    }

    private getStatusDescription(): string {
        const status = this.enabled ? '✅' : '🚫';
        const files = this.fileCount > 0 ? ` • ${this.fileCount} files` : '';
        return `${status}${files}`;
    }
}

export class ContextFile extends vscode.TreeItem {
    constructor(
        public readonly fileName: string,
        public readonly filePath: string,
        public readonly projectName: string
    ) {
        super(fileName, vscode.TreeItemCollapsibleState.None);
        
        this.contextValue = 'file';
        this.tooltip = `${fileName}\nClick to open`;
        this.command = {
            command: 'vscode.open',
            title: 'Open File',
            arguments: [vscode.Uri.file(filePath)]
        };
        
        this.iconPath = this.getFileIcon();
    }

    private getFileIcon(): vscode.ThemeIcon {
        const ext = path.extname(this.fileName).toLowerCase();
        
        const iconMap: Record<string, string> = {
            '.md': 'markdown',
            '.json': 'json',
            '.js': 'javascript',
            '.ts': 'typescript',
            '.jsx': 'react',
            '.tsx': 'react',
            '.py': 'python',
            '.java': 'java',
            '.cpp': 'cpp',
            '.cs': 'csharp',
            '.html': 'html',
            '.css': 'css',
            '.txt': 'text',
            '.yaml': 'yaml',
            '.yml': 'yaml',
            '.xml': 'xml',
            '.sh': 'terminal',
            '.env': 'gear'
        };

        const icon = iconMap[ext] || 'file';
        return new vscode.ThemeIcon(icon === 'file' ? 'file' : `file-type-${icon}`);
    }
}

export class ContextsProvider implements vscode.TreeDataProvider<ContextProject | ContextFile> {
    private _onDidChangeTreeData: vscode.EventEmitter<ContextProject | ContextFile | undefined | null | void> = new vscode.EventEmitter<ContextProject | ContextFile | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<ContextProject | ContextFile | undefined | null | void> = this._onDidChangeTreeData.event;

    constructor(private contextManager: ContextManager) {
        // Listen to context manager changes
        contextManager.onProjectsChanged(() => this.refresh());
    }

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: ContextProject | ContextFile): vscode.TreeItem {
        if (element instanceof ContextProject) {
            const treeItem = new vscode.TreeItem(element.label, element.collapsibleState);
            treeItem.contextValue = element.contextValue;
            treeItem.tooltip = element.tooltip;
            treeItem.iconPath = element.iconPath;
            return treeItem;
        }
        return element;
    }

    getChildren(element?: ContextProject | ContextFile): Thenable<(ContextProject | ContextFile)[]> {
        if (!vscode.workspace.workspaceFolders) {
            return Promise.resolve([]);
        }

        if (element instanceof ContextProject) {
            // Return files in the project
            return Promise.resolve(this.getProjectFiles(element));
        } else if (!element) {
            // Return all projects
            return Promise.resolve(this.getProjects());
        }

        return Promise.resolve([]);
    }

    private getProjects(): ContextProject[] {
        const projects = this.contextManager.getProjects();
        
        return projects.map(project => {
            const fileCount = this.getFileCount(project.folderPath);
            return new ContextProject(
                project.name,
                project.folderPath,
                project.enabled,
                project.description,
                fileCount
            );
        }).sort((a, b) => {
            // Sort enabled projects first, then by name
            if (a.enabled !== b.enabled) {
                return a.enabled ? -1 : 1;
            }
            return a.name.localeCompare(b.name);
        });
    }

    private getProjectFiles(project: ContextProject): ContextFile[] {
        if (!fs.existsSync(project.folderPath)) {
            return [];
        }

        try {
            const files = fs.readdirSync(project.folderPath);
            
            return files
                .filter(file => {
                    const filePath = path.join(project.folderPath, file);
                    const stat = fs.statSync(filePath);
                    return stat.isFile() && !file.startsWith('.');
                })
                .map(file => {
                    const filePath = path.join(project.folderPath, file);
                    return new ContextFile(file, filePath, project.name);
                })
                .sort((a, b) => {
                    // Sort by extension, then by name
                    const extA = path.extname(a.fileName);
                    const extB = path.extname(b.fileName);
                    if (extA !== extB) {
                        return extA.localeCompare(extB);
                    }
                    return a.fileName.localeCompare(b.fileName);
                });
        } catch (error) {
            console.error(`Error reading project files for ${project.name}:`, error);
            return [];
        }
    }

    private getFileCount(folderPath: string): number {
        if (!fs.existsSync(folderPath)) {
            return 0;
        }

        try {
            const files = fs.readdirSync(folderPath);
            return files.filter(file => {
                const filePath = path.join(folderPath, file);
                const stat = fs.statSync(filePath);
                return stat.isFile() && !file.startsWith('.');
            }).length;
        } catch (error) {
            return 0;
        }
    }

    getParent(element: ContextProject | ContextFile): ContextProject | null {
        if (element instanceof ContextFile) {
            const projects = this.getProjects();
            return projects.find(p => p.name === element.projectName) || null;
        }
        return null;
    }
}
