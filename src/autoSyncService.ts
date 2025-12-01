import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { ContextManager } from './contextManager';

interface AutoSyncConfig {
    enabled: boolean;
    intervalMinutes: number;
    autoMerge: boolean;
    notifyOnUpdates: boolean;
    runOnStartup: boolean; 
}

export class AutoSyncService {
    private intervalId?: NodeJS.Timeout;
    private statusBarItem: vscode.StatusBarItem;
    private lastCheckTime?: Date;
    private projectsWithUpdates: Set<string> = new Set();

    constructor(
        private contextManager: any,
        private context: vscode.ExtensionContext
    ) {
        // Create status bar item
        this.statusBarItem = vscode.window.createStatusBarItem(
            vscode.StatusBarAlignment.Right,
            99
        );
        this.statusBarItem.command = 'cursorContexts.showAutoSyncStatus';
        this.context.subscriptions.push(this.statusBarItem);
    }

    /**
     * Start auto-sync service
     */
    async start(): Promise<void> {
        const config = this.getConfig();
        
        if (!config.enabled) {
            console.log('Auto-sync is disabled');
            this.statusBarItem.hide();
            return;
        }

        console.log(`Starting auto-sync service (interval: ${config.intervalMinutes} minutes)`);
        
        // Run on startup if configured
        if (config.runOnStartup) {
            await this.checkForUpdates();
        }

        // Set up periodic checking
        const intervalMs = config.intervalMinutes * 60 * 1000;
        this.intervalId = setInterval(() => {
            this.checkForUpdates();
        }, intervalMs);

        this.updateStatusBar();
        console.log('Auto-sync service started');
    }

    /**
     * Stop auto-sync service
     */
    stop(): void {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = undefined;
        }
        this.statusBarItem.hide();
        console.log('Auto-sync service stopped');
    }

    /**
     * Check all Git projects for updates
     */
    async checkForUpdates(): Promise<void> {
        const config = this.getConfig();
        this.lastCheckTime = new Date();
        this.projectsWithUpdates.clear();

        const projects = this.contextManager.getProjects();
        const gitProjects = projects.filter((p: any) => 
            p.enabled && fs.existsSync(path.join(p.folderPath, '.git'))
        );

        if (gitProjects.length === 0) {
            console.log('No Git projects to check');
            this.updateStatusBar();
            return;
        }

        console.log(`Checking ${gitProjects.length} Git projects for updates...`);

        let updatesFound = 0;
        const updatePromises = gitProjects.map(async (project: any) => {
            try {
                const hasUpdates = await this.checkProjectForUpdates(project.folderPath);
                if (hasUpdates) {
                    this.projectsWithUpdates.add(project.name);
                    updatesFound++;
                    
                    // Auto-merge if configured
                    if (config.autoMerge) {
                        await this.pullProject(project.folderPath, project.name);
                    }
                }
            } catch (error) {
                console.error(`Failed to check ${project.name}:`, error);
            }
        });

        await Promise.all(updatePromises);

        // Notify user if updates found
        if (updatesFound > 0 && config.notifyOnUpdates) {
            this.notifyUpdatesAvailable(updatesFound, config.autoMerge);
        }

        this.updateStatusBar();
    }

    /**
     * Check if a specific project has updates available
     */
    private async checkProjectForUpdates(projectPath: string): Promise<boolean> {
        try {
            // Fetch latest changes
            await this.executeGit(['fetch', 'origin'], projectPath);

            // Check if local is behind remote
            const result = await this.executeGit(
                ['rev-list', 'HEAD..origin/HEAD', '--count'],
                projectPath
            );

            const commitsBehind = parseInt(result.trim(), 10);
            return commitsBehind > 0;
        } catch (error) {
            console.error(`Error checking for updates: ${error}`);
            return false;
        }
    }

    /**
     * Pull updates for a project
     */
    private async pullProject(projectPath: string, projectName: string): Promise<void> {
        try {
            console.log(`Auto-pulling updates for ${projectName}`);
            await this.executeGit(['pull', 'origin'], projectPath);
            
            // Update context manager
            await this.contextManager.updateGitProject(projectName);
            
            vscode.window.showInformationMessage(
                `✅ Auto-synced: ${projectName}`,
                'Show Changes'
            ).then(choice => {
                if (choice === 'Show Changes') {
                    vscode.commands.executeCommand('cursorContexts.showGitChanges', projectName);
                }
            });
        } catch (error) {
            console.error(`Failed to pull ${projectName}:`, error);
            vscode.window.showErrorMessage(
                `Failed to auto-sync ${projectName}: ${error instanceof Error ? error.message : 'Unknown error'}`
            );
        }
    }

    /**
     * Execute git command
     */
    private async executeGit(args: string[], cwd: string): Promise<string> {
        const { execFile } = require('child_process');
        const { promisify } = require('util');
        const execFileAsync = promisify(execFile);

        const result = await execFileAsync('git', args, { cwd });
        return result.stdout;
    }

    /**
     * Update status bar display
     */
    private updateStatusBar(): void {
        const config = this.getConfig();
        
        if (!config.enabled) {
            this.statusBarItem.hide();
            return;
        }

        if (this.projectsWithUpdates.size > 0) {
            this.statusBarItem.text = `$(sync) ${this.projectsWithUpdates.size} updates`;
            this.statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.warningBackground');
            this.statusBarItem.tooltip = `${this.projectsWithUpdates.size} project(s) have updates available:\n${Array.from(this.projectsWithUpdates).join(', ')}`;
        } else {
            this.statusBarItem.text = '$(check) Synced';
            this.statusBarItem.backgroundColor = undefined;
            this.statusBarItem.tooltip = this.lastCheckTime 
                ? `Last checked: ${this.lastCheckTime.toLocaleString()}\nNext check in ${config.intervalMinutes} minutes`
                : 'Auto-sync enabled';
        }

        this.statusBarItem.show();
    }

    /**
     * Show notification about available updates
     */
    private notifyUpdatesAvailable(count: number, autoMerged: boolean): void {
        const projectsList = Array.from(this.projectsWithUpdates).join(', ');
        const message = autoMerged
            ? `✅ Auto-synced ${count} project(s): ${projectsList}`
            : `📥 ${count} project(s) have updates: ${projectsList}`;

        const actions = autoMerged 
            ? ['Show Changes']
            : ['Sync Now', 'Show Changes', 'Dismiss'];

        vscode.window.showInformationMessage(message, ...actions).then(choice => {
            if (choice === 'Sync Now') {
                vscode.commands.executeCommand('cursorContexts.syncProjectsWithUpdates');
            } else if (choice === 'Show Changes') {
                vscode.commands.executeCommand('cursorContexts.showAutoSyncStatus');
            }
        });
    }

    /**
     * Get auto-sync configuration
     */
    private getConfig(): AutoSyncConfig {
        const config = vscode.workspace.getConfiguration('cursorContexts.autoSync');
        return {
            enabled: config.get('enabled', false),
            intervalMinutes: config.get('intervalMinutes', 30),
            autoMerge: config.get('autoMerge', false),
            notifyOnUpdates: config.get('notifyOnUpdates', true),
            runOnStartup: config.get('runOnStartup', true)
        };
    }

    /**
     * Get projects with pending updates
     */
    getProjectsWithUpdates(): string[] {
        return Array.from(this.projectsWithUpdates);
    }

    /**
     * Manually trigger update check
     */
    async manualCheck(): Promise<void> {
        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: 'Checking for updates...',
            cancellable: false
        }, async (progress) => {
            progress.report({ increment: 0 });
            await this.checkForUpdates();
            progress.report({ increment: 100 });
        });

        const count = this.projectsWithUpdates.size;
        if (count === 0) {
            vscode.window.showInformationMessage('✅ All projects are up to date!');
        }
    }
}

// Export for use in extension.ts
export default AutoSyncService;