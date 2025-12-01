import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';

// Type definitions for the libraries
interface PdfData {
    text: string;
    numpages: number;
    info?: {
        Title?: string;
        Author?: string;
        Subject?: string;
    };
}

interface MammothResult {
    value: string;
    messages: Array<{ type: string; message: string }>;
}

export class DocumentConverter {
    private static pdfParse: any = null;
    private static mammoth: any = null;

    /**
     * Initialize the converters (lazy loading)
     */
    private static async initConverters() {
        if (!this.pdfParse) {
            try {
                this.pdfParse = require('pdf-parse');
            } catch (error) {
                console.log('PDF parser not available, will save PDFs as-is');
            }
        }
        
        if (!this.mammoth) {
            try {
                this.mammoth = require('mammoth');
            } catch (error) {
                console.log('Mammoth not available, will save Word docs as-is');
            }
        }
    }

    /**
     * Convert a file to readable text format
     */
    public static async convertFile(filePath: string): Promise<{ 
        content: string; 
        fileName: string; 
        isConverted: boolean 
    }> {
        await this.initConverters();
        
        const ext = path.extname(filePath).toLowerCase();
        const baseName = path.basename(filePath, ext);
        
        try {
            switch (ext) {
                case '.pdf':
                    return await this.convertPdf(filePath, baseName);
                    
                case '.docx':
                case '.doc':
                    return await this.convertWord(filePath, baseName);
                    
                default:
                    // For regular text files, just read as-is
                    const content = fs.readFileSync(filePath, 'utf-8');
                    return {
                        content,
                        fileName: path.basename(filePath),
                        isConverted: false
                    };
            }
        } catch (error) {
            console.error(`Failed to convert ${filePath}:`, error);
            // If conversion fails, try to read as binary and save original
            throw error;
        }
    }

    /**
     * Convert PDF to markdown text
     */
    private static async convertPdf(filePath: string, baseName: string): Promise<{ 
        content: string; 
        fileName: string; 
        isConverted: boolean 
    }> {
        if (!this.pdfParse) {
            throw new Error('PDF conversion not available. Install pdf-parse package.');
        }

        const dataBuffer = fs.readFileSync(filePath);
        const data: PdfData = await this.pdfParse(dataBuffer);
        
        // Create markdown content with metadata
        let markdown = `# ${baseName}\n\n`;
        markdown += `> **Original file:** ${path.basename(filePath)}\n`;
        markdown += `> **Type:** PDF Document\n`;
        markdown += `> **Pages:** ${data.numpages}\n`;
        
        if (data.info) {
            if (data.info.Title) markdown += `> **Title:** ${data.info.Title}\n`;
            if (data.info.Author) markdown += `> **Author:** ${data.info.Author}\n`;
            if (data.info.Subject) markdown += `> **Subject:** ${data.info.Subject}\n`;
        }
        
        markdown += `> **Converted:** ${new Date().toISOString()}\n\n`;
        markdown += `---\n\n`;
        
        // Add the extracted text
        markdown += `## Content\n\n`;
        markdown += this.cleanupText(data.text);
        
        return {
            content: markdown,
            fileName: `${baseName}.md`,
            isConverted: true
        };
    }

    /**
     * Convert Word document to markdown text
     */
    private static async convertWord(filePath: string, baseName: string): Promise<{ 
        content: string; 
        fileName: string; 
        isConverted: boolean 
    }> {
        if (!this.mammoth) {
            throw new Error('Word conversion not available. Install mammoth package.');
        }

        const result: MammothResult = await this.mammoth.extractRawText({ path: filePath });
        
        // Log any conversion messages
        if (result.messages.length > 0) {
            console.log('Conversion messages:', result.messages);
        }
        
        // Create markdown content
        let markdown = `# ${baseName}\n\n`;
        markdown += `> **Original file:** ${path.basename(filePath)}\n`;
        markdown += `> **Type:** Word Document\n`;
        markdown += `> **Converted:** ${new Date().toISOString()}\n\n`;
        markdown += `---\n\n`;
        markdown += `## Content\n\n`;
        markdown += this.cleanupText(result.value);
        
        return {
            content: markdown,
            fileName: `${baseName}.md`,
            isConverted: true
        };
    }

    /**
     * Clean up extracted text
     */
    private static cleanupText(text: string): string {
        // Remove excessive whitespace
        text = text.replace(/\n{3,}/g, '\n\n');
        text = text.replace(/[ \t]{2,}/g, ' ');
        
        // Split into paragraphs
        const paragraphs = text.split(/\n\n+/);
        
        // Format paragraphs
        const formatted = paragraphs.map(para => {
            para = para.trim();
            if (para.length === 0) return '';
            
            // Check if it looks like a heading (short, no punctuation at end)
            if (para.length < 100 && !para.match(/[.!?]$/)) {
                // Check if it's all caps or starts with a number
                if (para === para.toUpperCase() || para.match(/^\d+\./)) {
                    return `### ${para}\n`;
                }
            }
            
            return para + '\n';
        });
        
        return formatted.join('\n');
    }

    /**
     * Check if a file is a supported document type
     */
    public static isSupportedDocument(filePath: string): boolean {
        const ext = path.extname(filePath).toLowerCase();
        return ['.pdf', '.docx', '.doc'].includes(ext);
    }

    /**
     * Get human-readable file type
     */
    public static getFileType(filePath: string): string {
        const ext = path.extname(filePath).toLowerCase();
        switch (ext) {
            case '.pdf': return 'PDF';
            case '.docx': return 'Word Document';
            case '.doc': return 'Word Document (Legacy)';
            default: return 'Text File';
        }
    }
}

/**
 * Binary file handler for storing original files
 */
export class BinaryFileHandler {
    /**
     * Save binary file with metadata
     */
    public static async saveBinaryFile(
        projectPath: string,
        filePath: string,
        convertedFileName?: string
    ): Promise<void> {
        const fileName = path.basename(filePath);
        const binaryFolder = path.join(projectPath, '.originals');
        
        // Create .originals folder if it doesn't exist
        if (!fs.existsSync(binaryFolder)) {
            fs.mkdirSync(binaryFolder, { recursive: true });
        }
        
        // Copy original file
        const destPath = path.join(binaryFolder, fileName);
        fs.copyFileSync(filePath, destPath);
        
        // Create metadata file
        const metadata = {
            originalName: fileName,
            convertedName: convertedFileName,
            importedAt: new Date().toISOString(),
            size: fs.statSync(filePath).size,
            type: DocumentConverter.getFileType(filePath)
        };
        
        const metadataPath = path.join(binaryFolder, `${fileName}.meta.json`);
        fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
    }
}
