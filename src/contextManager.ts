import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { DocumentConverter, BinaryFileHandler } from './documentConverter';

interface ProjectMetadata {
    name: string;
    enabled: boolean;
    description?: string;
    createdAt: string;
    updatedAt: string;
}

interface ProjectInfo {
    name: string;
    folderPath: string;
    enabled: boolean;
    description?: string;
    isGitRepository?: boolean;
    gitUrl?: string;
    gitBranch?: string;
    lastGitUpdate?: Date;
}

export class ContextManager {
    private contextsFolderName: string;
    private contextsPath: string;
    private metadataPath: string;
    private metadata: Map<string, ProjectMetadata> = new Map();
    private _onProjectsChanged: vscode.EventEmitter<void> = new vscode.EventEmitter<void>();
    
    readonly onProjectsChanged: vscode.Event<void> = this._onProjectsChanged.event;

    constructor() {
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (!workspaceFolder) {
            throw new Error('No workspace folder found');
        }

        this.contextsFolderName = vscode.workspace.getConfiguration('cursorContexts').get('contextsFolderName', '.contexts');
        this.contextsPath = path.join(workspaceFolder.uri.fsPath, this.contextsFolderName);
        this.metadataPath = path.join(this.contextsPath, '.metadata.json');

        this.initialize();
    }

    public getContextsPath(): string {
        return this.contextsPath;
    }

    private initialize(): void {
        // Create contexts folder if it doesn't exist
        if (!fs.existsSync(this.contextsPath)) {
            fs.mkdirSync(this.contextsPath, { recursive: true });
            
            // Add .contexts to .gitignore if it exists
            this.updateGitignore();
        }

        // Load metadata
        this.loadMetadata();

        // Ensure metadata exists for all folders
        this.syncMetadata();
    }

    private updateGitignore(): void {
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (!workspaceFolder) return;

        const gitignorePath = path.join(workspaceFolder.uri.fsPath, '.gitignore');
        
        try {
            let gitignoreContent = '';
            if (fs.existsSync(gitignorePath)) {
                gitignoreContent = fs.readFileSync(gitignorePath, 'utf-8');
            }

            // Check if .contexts is already in .gitignore
            const lines = gitignoreContent.split('\n');
            const hasContexts = lines.some(line => 
                line.trim() === this.contextsFolderName || 
                line.trim() === `/${this.contextsFolderName}` ||
                line.trim() === `${this.contextsFolderName}/`
            );

            if (!hasContexts) {
                // Add .contexts to .gitignore
                const newContent = gitignoreContent.trim() + '\n\n# Cursor Contexts\n' + this.contextsFolderName + '/\n';
                fs.writeFileSync(gitignorePath, newContent);
                vscode.window.showInformationMessage(`Added ${this.contextsFolderName} to .gitignore`);
            }
        } catch (error) {
            console.error('Failed to update .gitignore:', error);
        }
    }

    private loadMetadata(): void {
        if (fs.existsSync(this.metadataPath)) {
            try {
                const data = fs.readFileSync(this.metadataPath, 'utf-8');
                const metadata = JSON.parse(data);
                this.metadata = new Map(Object.entries(metadata));
            } catch (error) {
                console.error('Failed to load metadata:', error);
                this.metadata = new Map();
            }
        }
    }

    private saveMetadata(): void {
        try {
            const metadata = Object.fromEntries(this.metadata);
            fs.writeFileSync(this.metadataPath, JSON.stringify(metadata, null, 2));
        } catch (error) {
            console.error('Failed to save metadata:', error);
        }
    }

    private syncMetadata(): void {
        // Get all folders in contexts directory
        if (!fs.existsSync(this.contextsPath)) return;

        const folders = fs.readdirSync(this.contextsPath).filter(item => {
            const itemPath = path.join(this.contextsPath, item);
            return fs.statSync(itemPath).isDirectory() && !item.startsWith('.');
        });

        // Add metadata for new folders
        folders.forEach(folder => {
            if (!this.metadata.has(folder)) {
                this.metadata.set(folder, {
                    name: folder,
                    enabled: true,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                });
            }
        });

        // Remove metadata for deleted folders
        const metadataKeys = Array.from(this.metadata.keys());
        metadataKeys.forEach(key => {
            if (!folders.includes(key)) {
                this.metadata.delete(key);
            }
        });

        this.saveMetadata();
        this.updateFilesExclude();
    }

    private updateFilesExclude(): void {
        const config = vscode.workspace.getConfiguration();
        const filesExclude = config.get<Record<string, boolean>>('files.exclude') || {};

        // Remove old exclusions for our contexts
        Object.keys(filesExclude).forEach(pattern => {
            if (pattern.startsWith(`${this.contextsFolderName}/`) || pattern === this.contextsFolderName) {
            //    delete filesExclude[pattern]; //todo: keep hidden
            }
        });

        // Add exclusions for disabled projects
        this.metadata.forEach((meta, name) => {
            if (!meta.enabled) {
                filesExclude[`${this.contextsFolderName}/${name}`] = true;
            }
        });

        // Update workspace configuration
        config.update('files.exclude', filesExclude, vscode.ConfigurationTarget.Workspace);
    }

    public getProjects(): ProjectInfo[] {
        const projects: ProjectInfo[] = [];

        this.metadata.forEach((meta, name) => {
            const folderPath = path.join(this.contextsPath, name);
            if (fs.existsSync(folderPath)) {
                projects.push({
                    name: meta.name,
                    folderPath,
                    enabled: meta.enabled,
                    description: meta.description
                });
            }
        });

        return projects;
    }

    public projectExists(name: string): boolean {
        return this.metadata.has(name);
    }

    public async createProject(name: string, description?: string): Promise<void> {
        const projectPath = path.join(this.contextsPath, name);

        if (fs.existsSync(projectPath)) {
            throw new Error(`Project ${name} already exists`);
        }

        // Create project folder
        fs.mkdirSync(projectPath, { recursive: true });

        // Create README file
        const readmePath = path.join(projectPath, 'README.md');
        const readmeContent = `# ${name}\n\n${description || 'Project context and documentation'}\n\n## Files\n\nAdd your context files here.\n\n---\n*Created: ${new Date().toISOString()}*`;
        fs.writeFileSync(readmePath, readmeContent);

        // Add metadata
        this.metadata.set(name, {
            name,
            enabled: true,
            description,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        });

        this.saveMetadata();
        this.updateFilesExclude();
        this._onProjectsChanged.fire();
    }

    public async createGitProject(
        name: string, 
        gitUrl: string, 
        description?: string,
        projectPath?: string
    ): Promise<void> {
        const finalPath = projectPath || path.join(this.contextsPath, name);

        // Add metadata for Git project
        this.metadata.set(name, {
            name,
            enabled: true,
            description: description || `Cloned from ${gitUrl}`,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        });

        this.saveMetadata();
        this.updateFilesExclude();
        this._onProjectsChanged.fire();
    }

    public async updateGitProject(name: string): Promise<void> {
        if (!this.metadata.has(name)) {
            throw new Error(`Project ${name} does not exist`);
        }

        const metadata = this.metadata.get(name)!;
        metadata.updatedAt = new Date().toISOString();
        
        this.metadata.set(name, metadata);
        this.saveMetadata();
        this._onProjectsChanged.fire();
    }

    public async deleteProject(name: string): Promise<void> {
        const projectPath = path.join(this.contextsPath, name);

        if (!fs.existsSync(projectPath)) {
            throw new Error(`Project ${name} does not exist`);
        }

        // Delete folder and all contents
        fs.rmSync(projectPath, { recursive: true, force: true });

        // Remove metadata
        this.metadata.delete(name);

        this.saveMetadata();
        this.updateFilesExclude();
        this._onProjectsChanged.fire();
    }

    public async toggleProject(name: string): Promise<void> {
        const meta = this.metadata.get(name);
        if (!meta) {
            throw new Error(`Project ${name} not found`);
        }

        meta.enabled = !meta.enabled;
        meta.updatedAt = new Date().toISOString();

        this.saveMetadata();
        this.updateFilesExclude();
        this._onProjectsChanged.fire();
    }

    public async renameProject(oldName: string, newName: string): Promise<void> {
        const oldPath = path.join(this.contextsPath, oldName);
        const newPath = path.join(this.contextsPath, newName);

        if (!fs.existsSync(oldPath)) {
            throw new Error(`Project ${oldName} does not exist`);
        }

        if (fs.existsSync(newPath)) {
            throw new Error(`Project ${newName} already exists`);
        }

        // Rename folder
        fs.renameSync(oldPath, newPath);

        // Update metadata
        const meta = this.metadata.get(oldName);
        if (meta) {
            meta.name = newName;
            meta.updatedAt = new Date().toISOString();
            this.metadata.delete(oldName);
            this.metadata.set(newName, meta);
        }

        this.saveMetadata();
        this.updateFilesExclude();
        this._onProjectsChanged.fire();
    }

    public async addFileToProject(projectName: string, content: string, fileName: string): Promise<void> {
        const projectPath = path.join(this.contextsPath, projectName);

        if (!fs.existsSync(projectPath)) {
            throw new Error(`Project ${projectName} does not exist`);
        }

        const filePath = path.join(projectPath, fileName);
        
        // Check if file already exists
        if (fs.existsSync(filePath)) {
            const answer = await vscode.window.showWarningMessage(
                `File ${fileName} already exists. Overwrite?`,
                'Overwrite', 'Cancel'
            );
            
            if (answer !== 'Overwrite') {
                return;
            }
        }

        // Write file
        fs.writeFileSync(filePath, content);

        // Update metadata timestamp
        const meta = this.metadata.get(projectName);
        if (meta) {
            meta.updatedAt = new Date().toISOString();
            this.saveMetadata();
        }

        this._onProjectsChanged.fire();
    }

    /**
     * Import a file to project with automatic conversion for PDFs and Word docs
     */
    public async importFileToProject(projectName: string, sourceFilePath: string): Promise<void> {
        const projectPath = path.join(this.contextsPath, projectName);

        if (!fs.existsSync(projectPath)) {
            throw new Error(`Project ${projectName} does not exist`);
        }

        let fileName = path.basename(sourceFilePath);
        let content: string;
        let isConverted = false;

        // Check if it's a document that needs conversion
        if (DocumentConverter.isSupportedDocument(sourceFilePath)) {
            try {
                vscode.window.showInformationMessage(
                    `📄 Converting ${DocumentConverter.getFileType(sourceFilePath)}...`
                );
                
                const result = await DocumentConverter.convertFile(sourceFilePath);
                content = result.content;
                fileName = result.fileName;
                isConverted = result.isConverted;

                // Save original binary file
                if (isConverted) {
                    await BinaryFileHandler.saveBinaryFile(projectPath, sourceFilePath, fileName);
                    vscode.window.showInformationMessage(
                        `✅ Converted ${path.basename(sourceFilePath)} to ${fileName}`
                    );
                }
            } catch (error) {
                // If conversion fails, ask user what to do
                const answer = await vscode.window.showWarningMessage(
                    `Failed to convert ${fileName}. Save original file anyway?`,
                    'Save Original', 'Skip'
                );
                
                if (answer !== 'Save Original') {
                    return;
                }
                
                // Copy binary file as-is
                const destPath = path.join(projectPath, fileName);
                fs.copyFileSync(sourceFilePath, destPath);
                
                // Update metadata
                const meta = this.metadata.get(projectName);
                if (meta) {
                    meta.updatedAt = new Date().toISOString();
                    this.saveMetadata();
                }
                
                this._onProjectsChanged.fire();
                return;
            }
        } else {
            // Regular text file - just read it
            content = fs.readFileSync(sourceFilePath, 'utf-8');
        }

        // Check if file already exists
        const filePath = path.join(projectPath, fileName);
        if (fs.existsSync(filePath)) {
            const answer = await vscode.window.showWarningMessage(
                `File ${fileName} already exists. Overwrite?`,
                'Overwrite', 'Cancel'
            );
            
            if (answer !== 'Overwrite') {
                return;
            }
        }

        // Write the file
        fs.writeFileSync(filePath, content);

        // Update metadata timestamp
        const meta = this.metadata.get(projectName);
        if (meta) {
            meta.updatedAt = new Date().toISOString();
            this.saveMetadata();
        }

        this._onProjectsChanged.fire();
    }
}
