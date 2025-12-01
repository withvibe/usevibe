import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import simpleGit, { SimpleGit } from 'simple-git';

export interface GitProject {
    name: string;
    description?: string;
    gitUrl: string;
    localPath: string;
    lastUpdated: Date;
    branch: string;
}

export class GitHubIntegrationService {
    private git: SimpleGit;

    constructor() {
        this.git = simpleGit();
    }

    /**
     * Parse GitHub URL and extract repository information
     */
    public parseGitHubUrl(url: string): { owner: string; repo: string; fullName: string } | null {
        // Support various GitHub URL formats
        const patterns = [
            /^https:\/\/github\.com\/([^\/]+)\/([^\/\.]+)(\.git)?$/,
            /^git@github\.com:([^\/]+)\/([^\/\.]+)(\.git)?$/,
            /^https:\/\/www\.github\.com\/([^\/]+)\/([^\/\.]+)(\.git)?$/
        ];

        for (const pattern of patterns) {
            const match = url.match(pattern);
            if (match) {
                const owner = match[1];
                const repo = match[2];
                return {
                    owner,
                    repo,
                    fullName: `${owner}/${repo}`
                };
            }
        }

        return null;
    }

    /**
     * Clone a GitHub repository
     */
    public async cloneRepository(
        gitUrl: string, 
        projectName: string, 
        contextsPath: string,
        onProgress?: (message: string) => void
    ): Promise<string> {
        const projectPath = path.join(contextsPath, projectName);

        // Check if directory already exists
        if (fs.existsSync(projectPath)) {
            throw new Error(`Project directory already exists: ${projectName}`);
        }

        try {
            onProgress?.('🔄 Cloning repository...');
            
            // Clone the repository
            await this.git.clone(gitUrl, projectPath, {
                '--depth': 1, // Shallow clone for faster download
                '--single-branch': null
            });

            onProgress?.('✅ Repository cloned successfully!');

            // Get basic info about the repo
            const repoGit = simpleGit(projectPath);
            const remotes = await repoGit.getRemotes(true);
            const status = await repoGit.status();

            onProgress?.(`📊 Current branch: ${status.current}`);

            return projectPath;
        } catch (error) {
            // Clean up on error
            if (fs.existsSync(projectPath)) {
                fs.rmSync(projectPath, { recursive: true, force: true });
            }
            throw new Error(`Failed to clone repository: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Update an existing Git project
     */
    public async updateProject(
        projectPath: string,
        onProgress?: (message: string) => void
    ): Promise<{ hasChanges: boolean; changeCount: number; changedFiles: string[] }> {
        if (!this.isGitRepository(projectPath)) {
            throw new Error('Project is not a Git repository');
        }

        try {
            const repoGit = simpleGit(projectPath);
            
            onProgress?.('🔄 Fetching latest changes...');
            
            // Fetch latest changes
            await repoGit.fetch();
            
            // Get status before pull
            const statusBefore = await repoGit.status();
            
            onProgress?.('📥 Pulling changes...');
            
            // Pull latest changes
            const pullResult = await repoGit.pull();
            
            // Get status after pull
            const statusAfter = await repoGit.status();
            
            // Get list of changed files from the pull
            const changedFiles: string[] = [];
            if (pullResult.summary.changes > 0) {
                const log = await repoGit.log(['HEAD~' + pullResult.summary.changes + '..HEAD', '--name-only']);
                log.all.forEach(commit => {
                    commit.diff?.files?.forEach(file => {
                        if (!changedFiles.includes(file.file)) {
                            changedFiles.push(file.file);
                        }
                    });
                });
            }

            const hasChanges = pullResult.summary.changes > 0;
            
            if (hasChanges) {
                onProgress?.(`✅ Updated ${pullResult.summary.changes} files`);
            } else {
                onProgress?.('✅ Already up to date');
            }

            return {
                hasChanges,
                changeCount: pullResult.summary.changes,
                changedFiles
            };
        } catch (error) {
            throw new Error(`Failed to update project: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Get Git changes summary for a project
     */
    public async getChangesSummary(projectPath: string, since?: Date): Promise<{
        commits: Array<{
            hash: string;
            date: Date;
            message: string;
            author: string;
            files: string[];
        }>;
        changedFiles: string[];
        totalCommits: number;
    }> {
        if (!this.isGitRepository(projectPath)) {
            throw new Error('Project is not a Git repository');
        }

        try {
            const repoGit = simpleGit(projectPath);
            
            // Build log options
            const logOptions: any = ['--name-only'];
            if (since) {
                logOptions.push(`--since=${since.toISOString()}`);
            } else {
                // Default to last 30 days if no date provided
                const thirtyDaysAgo = new Date();
                thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                logOptions.push(`--since=${thirtyDaysAgo.toISOString()}`);
            }

            const log = await repoGit.log(logOptions);
            
            const commits = log.all.map(commit => ({
                hash: commit.hash,
                date: new Date(commit.date),
                message: commit.message,
                author: commit.author_name,
                files: commit.diff?.files?.map(f => f.file) || []
            }));

            const changedFiles = Array.from(
                new Set(commits.flatMap(c => c.files))
            ).sort();

            return {
                commits,
                changedFiles,
                totalCommits: commits.length
            };
        } catch (error) {
            throw new Error(`Failed to get changes: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Check if a directory is a Git repository
     */
    public isGitRepository(projectPath: string): boolean {
        return fs.existsSync(path.join(projectPath, '.git'));
    }

    /**
     * Get repository information
     */
    public async getRepositoryInfo(projectPath: string): Promise<{
        currentBranch: string;
        remoteUrl: string;
        lastCommit: {
            hash: string;
            message: string;
            author: string;
            date: Date;
        };
        status: {
            ahead: number;
            behind: number;
            modified: string[];
            staged: string[];
        };
    } | null> {
        if (!this.isGitRepository(projectPath)) {
            return null;
        }

        try {
            const repoGit = simpleGit(projectPath);
            
            const [status, log, remotes] = await Promise.all([
                repoGit.status(),
                repoGit.log(['-1']),
                repoGit.getRemotes(true)
            ]);

            const lastCommit = log.latest;
            const origin = remotes.find(r => r.name === 'origin');

            return {
                currentBranch: status.current || 'unknown',
                remoteUrl: origin?.refs?.fetch || 'unknown',
                lastCommit: {
                    hash: lastCommit?.hash || '',
                    message: lastCommit?.message || '',
                    author: lastCommit?.author_name || '',
                    date: lastCommit ? new Date(lastCommit.date) : new Date()
                },
                status: {
                    ahead: status.ahead,
                    behind: status.behind,
                    modified: status.modified,
                    staged: status.staged
                }
            };
        } catch (error) {
            console.error('Failed to get repository info:', error);
            return null;
        }
    }

    /**
     * Get file changes between commits or dates
     */
    public async getFileChanges(
        projectPath: string,
        filePath: string,
        since?: Date
    ): Promise<{
        additions: number;
        deletions: number;
        commits: Array<{
            hash: string;
            date: Date;
            message: string;
            author: string;
        }>;
    }> {
        if (!this.isGitRepository(projectPath)) {
            throw new Error('Project is not a Git repository');
        }

        try {
            const repoGit = simpleGit(projectPath);
            
            const logOptions = ['--', filePath];
            if (since) {
                logOptions.unshift(`--since=${since.toISOString()}`);
            }

            const log = await repoGit.log(logOptions);
            
            // Get diff stats for the file
            let additions = 0;
            let deletions = 0;
            
            if (log.all.length > 0) {
                try {
                    const diffStat = await repoGit.diffSummary([`${log.all[log.all.length - 1].hash}..HEAD`, '--', filePath]);
                    additions = diffStat.insertions;
                    deletions = diffStat.deletions;
                } catch {
                    // Ignore diff stat errors
                }
            }

            const commits = log.all.map(commit => ({
                hash: commit.hash,
                date: new Date(commit.date),
                message: commit.message,
                author: commit.author_name
            }));

            return {
                additions,
                deletions,
                commits
            };
        } catch (error) {
            throw new Error(`Failed to get file changes: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
}