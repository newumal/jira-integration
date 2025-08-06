const fs = require('fs');
const path = require('path');
const axios = require('axios');
const mimeTypes = require('mime-types');
const sizeOf = require('image-size');

/**
 * AttachmentAnalyzer - Processes and analyzes JIRA issue attachments
 * Provides intelligent context extraction for AI-driven development
 */
class AttachmentAnalyzer {
    constructor(jiraClient) {
        this.jira = jiraClient;
        this.attachmentDir = path.join(process.cwd(), '.jira-attachments');
        
        // Load configuration for direct API calls
        this.config = JSON.parse(fs.readFileSync(path.join(__dirname, '../../config.json'), 'utf8'));
        
        this.ensureAttachmentDir();
    }

    /**
     * Ensure the attachment directory exists
     */
    ensureAttachmentDir() {
        if (!fs.existsSync(this.attachmentDir)) {
            fs.mkdirSync(this.attachmentDir, { recursive: true });
            console.log(`📁 Created attachment directory: ${this.attachmentDir}`);
        }
    }

    /**
     * Process all attachments for a given JIRA issue
     * @param {string} issueKey - JIRA issue key (e.g., WAR-123)
     * @returns {Object} Analysis results with attachment insights
     */
    async processIssueAttachments(issueKey) {
        try {
            const issue = await this.jira.findIssue(issueKey, null, null, ['attachment']);
            const attachments = issue.fields.attachment || [];
            
            if (attachments.length === 0) {
                return { 
                    hasAttachments: false, 
                    count: 0,
                    analysis: [],
                    summary: this.generateEmptySummary()
                };
            }

            console.log(`📎 Found ${attachments.length} attachment(s) for ${issueKey}`);
            const analysisResults = [];
            
            for (const attachment of attachments) {
                console.log(`  🔍 Analyzing: ${attachment.filename}`);
                const analysis = await this.analyzeAttachment(attachment, issueKey);
                analysisResults.push(analysis);
            }

            const summary = this.generateAttachmentSummary(analysisResults);

            return {
                hasAttachments: true,
                count: attachments.length,
                analysis: analysisResults,
                summary
            };
        } catch (error) {
            console.error('❌ Error processing attachments:', error.message);
            return { 
                hasAttachments: false, 
                count: 0,
                error: error.message,
                analysis: [],
                summary: this.generateEmptySummary()
            };
        }
    }

    /**
     * Analyze a single attachment
     * @param {Object} attachment - JIRA attachment object
     * @param {string} issueKey - JIRA issue key
     * @returns {Object} Analysis result for the attachment
     */
    async analyzeAttachment(attachment, issueKey) {
        const analysis = {
            id: attachment.id,
            filename: attachment.filename,
            size: attachment.size,
            mimeType: attachment.mimeType,
            created: attachment.created,
            author: attachment.author?.displayName || 'Unknown',
            localPath: null,
            contentAnalysis: null,
            aiInsights: null,
            downloadError: null
        };

        try {
            // Download attachment
            const localPath = await this.downloadAttachment(attachment, issueKey);
            analysis.localPath = localPath;

            // Analyze based on type
            if (this.isImage(attachment.mimeType)) {
                analysis.contentAnalysis = await this.analyzeImage(localPath, attachment);
            } else if (this.isText(attachment.mimeType)) {
                analysis.contentAnalysis = await this.analyzeTextFile(localPath);
            } else if (this.isCode(attachment.filename)) {
                analysis.contentAnalysis = await this.analyzeCodeFile(localPath);
            } else {
                analysis.contentAnalysis = { 
                    type: 'binary',
                    message: 'Binary file - content analysis not available'
                };
            }

            // Generate AI insights
            analysis.aiInsights = await this.generateAIInsights(analysis);

        } catch (error) {
            console.error(`    ❌ Error analyzing ${attachment.filename}:`, error.message);
            analysis.downloadError = error.message;
            
            // Fallback analysis based on filename and metadata even if download fails
            console.log(`    🔄 Performing fallback analysis for ${attachment.filename}`);
            analysis.contentAnalysis = this.performFallbackAnalysis(attachment);
            analysis.aiInsights = await this.generateAIInsights(analysis);
        }

        return analysis;
    }

    /**
     * Download an attachment from JIRA
     * @param {Object} attachment - JIRA attachment object
     * @param {string} issueKey - JIRA issue key
     * @returns {string} Local file path
     */
    async downloadAttachment(attachment, issueKey) {
        const fileName = `${issueKey}_${attachment.id}_${attachment.filename}`;
        const localPath = path.join(this.attachmentDir, fileName);

        // Skip if already downloaded
        if (fs.existsSync(localPath)) {
            console.log(`    ✅ Already cached: ${fileName}`);
            return localPath;
        }

        console.log(`    ⬇️  Downloading: ${fileName}`);
        
        const response = await axios({
            method: 'GET',
            url: attachment.content,
            responseType: 'stream',
            auth: {
                username: this.config.jira.email,    // Use email from config
                password: this.config.jira.apiToken  // Use API token from config
            },
            timeout: 30000
        });

        const writer = fs.createWriteStream(localPath);
        response.data.pipe(writer);

        return new Promise((resolve, reject) => {
            writer.on('finish', () => {
                console.log(`    ✅ Downloaded: ${fileName}`);
                resolve(localPath);
            });
            writer.on('error', reject);
        });
    }

    /**
     * Analyze image attachments
     * @param {string} imagePath - Local path to image
     * @param {Object} attachment - JIRA attachment object
     * @returns {Object} Image analysis result
     */
    async analyzeImage(imagePath, attachment) {
        const analysis = {
            type: 'image',
            isScreenshot: this.isScreenshot(attachment.filename),
            isUIElement: this.isUIElement(attachment.filename),
            isErrorState: this.isErrorState(attachment.filename),
            suggestedContext: [],
            extractedElements: [],
            dimensions: null
        };

        try {
            // Get image dimensions
            const dimensions = sizeOf(imagePath);
            analysis.dimensions = {
                width: dimensions.width,
                height: dimensions.height,
                type: dimensions.type
            };

            // Analyze filename for UI context
            this.extractUIElementsFromFilename(attachment.filename, analysis);
            
            // Generate context suggestions
            this.generateImageContextSuggestions(analysis);

        } catch (error) {
            console.error(`    ⚠️  Image analysis failed for ${attachment.filename}:`, error.message);
        }

        return analysis;
    }

    /**
     * Analyze text file attachments
     * @param {string} filePath - Local path to text file
     * @returns {Object} Text analysis result
     */
    async analyzeTextFile(filePath) {
        try {
            const content = fs.readFileSync(filePath, 'utf-8');
            
            return {
                type: 'text',
                lineCount: content.split('\n').length,
                charCount: content.length,
                hasErrorLogs: this.containsErrorLogs(content),
                hasStackTrace: this.containsStackTrace(content),
                extractedErrors: this.extractErrors(content),
                extractedUrls: this.extractUrls(content),
                extractedPaths: this.extractFilePaths(content),
                languageHints: this.detectLanguageHints(content)
            };
        } catch (error) {
            return {
                type: 'text',
                error: `Failed to read text file: ${error.message}`
            };
        }
    }

    /**
     * Analyze code file attachments
     * @param {string} filePath - Local path to code file
     * @returns {Object} Code analysis result
     */
    async analyzeCodeFile(filePath) {
        try {
            const content = fs.readFileSync(filePath, 'utf-8');
            const extension = path.extname(filePath);
            
            return {
                type: 'code',
                language: this.detectLanguage(extension),
                lineCount: content.split('\n').length,
                charCount: content.length,
                hasImports: this.hasImports(content),
                hasFunctions: this.hasFunctions(content),
                hasClasses: this.hasClasses(content),
                extractedIdentifiers: this.extractIdentifiers(content),
                extractedComments: this.extractComments(content),
                complexity: this.estimateCodeComplexity(content)
            };
        } catch (error) {
            return {
                type: 'code',
                error: `Failed to analyze code file: ${error.message}`
            };
        }
    }

    /**
     * Generate AI insights for an attachment
     * @param {Object} analysis - Attachment analysis object
     * @returns {Object} AI insights
     */
    async generateAIInsights(analysis) {
        const insights = {
            relevantCodeAreas: [],
            suggestedSearchTerms: [],
            potentialFiles: [],
            implementationHints: [],
            priority: 'medium'
        };

        // Generate insights based on content analysis
        if (analysis.contentAnalysis?.extractedElements) {
            analysis.contentAnalysis.extractedElements.forEach(element => {
                insights.relevantCodeAreas.push(this.mapElementToCodeArea(element));
                insights.suggestedSearchTerms.push(element);
            });
        }

        if (analysis.contentAnalysis?.extractedErrors) {
            analysis.contentAnalysis.extractedErrors.forEach(error => {
                insights.suggestedSearchTerms.push(error.type);
                insights.potentialFiles.push(...this.guessFilesFromError(error));
                insights.priority = 'high'; // Errors are high priority
            });
        }

        if (analysis.contentAnalysis?.type === 'image' && analysis.contentAnalysis.isScreenshot) {
            insights.implementationHints.push('Visual bug - check UI components and styling');
            insights.relevantCodeAreas.push('UI components', 'CSS/styling');
        }

        return insights;
    }

    /**
     * Generate summary of all attachments
     * @param {Array} analysisResults - Array of attachment analysis results
     * @returns {Object} Summary object
     */
    generateAttachmentSummary(analysisResults) {
        const summary = {
            totalAttachments: analysisResults.length,
            imageCount: 0,
            codeFileCount: 0,
            textFileCount: 0,
            errorCount: 0,
            keyFindings: [],
            suggestedInvestigationAreas: new Set(),
            extractedUIComponents: new Set(),
            overallPriority: 'medium'
        };

        analysisResults.forEach(analysis => {
            // Count by type
            switch (analysis.contentAnalysis?.type) {
                case 'image':
                    summary.imageCount++;
                    if (analysis.contentAnalysis.extractedElements) {
                        analysis.contentAnalysis.extractedElements.forEach(el => 
                            summary.extractedUIComponents.add(el)
                        );
                    }
                    break;
                case 'code':
                    summary.codeFileCount++;
                    break;
                case 'text':
                    summary.textFileCount++;
                    if (analysis.contentAnalysis.hasErrorLogs) {
                        summary.errorCount++;
                    }
                    break;
            }

            // Collect investigation areas
            if (analysis.aiInsights?.relevantCodeAreas) {
                analysis.aiInsights.relevantCodeAreas.forEach(area => 
                    summary.suggestedInvestigationAreas.add(area)
                );
            }

            // Update priority
            if (analysis.aiInsights?.priority === 'high') {
                summary.overallPriority = 'high';
            }
        });

        // Convert sets to arrays
        summary.extractedUIComponents = Array.from(summary.extractedUIComponents);
        summary.suggestedInvestigationAreas = Array.from(summary.suggestedInvestigationAreas);

        // Generate key findings
        if (summary.errorCount > 0) {
            summary.keyFindings.push(`${summary.errorCount} file(s) contain error logs`);
        }
        if (summary.imageCount > 0) {
            summary.keyFindings.push(`${summary.imageCount} visual reference(s) available`);
        }
        if (summary.extractedUIComponents.length > 0) {
            summary.keyFindings.push(`UI components identified: ${summary.extractedUIComponents.join(', ')}`);
        }

        return summary;
    }

    /**
     * Generate empty summary for issues without attachments
     */
    generateEmptySummary() {
        return {
            totalAttachments: 0,
            imageCount: 0,
            codeFileCount: 0,
            textFileCount: 0,
            errorCount: 0,
            keyFindings: ['No attachments found'],
            suggestedInvestigationAreas: [],
            extractedUIComponents: [],
            overallPriority: 'medium'
        };
    }

    /**
     * Perform fallback analysis when attachment download fails
     * @param {Object} attachment - JIRA attachment object
     * @returns {Object} Fallback analysis result
     */
    performFallbackAnalysis(attachment) {
        const analysis = {
            type: 'fallback',
            downloadFailed: true,
            filename: attachment.filename,
            mimeType: attachment.mimeType,
            size: attachment.size
        };

        // Analyze based on file type even without content
        if (this.isImage(attachment.mimeType)) {
            analysis.type = 'image';
            analysis.isScreenshot = this.isScreenshot(attachment.filename);
            analysis.isUIElement = this.isUIElement(attachment.filename);
            analysis.isErrorState = this.isErrorState(attachment.filename);
            analysis.extractedElements = [];
            analysis.suggestedContext = [];

            // Extract UI elements from filename
            this.extractUIElementsFromFilename(attachment.filename, analysis);
            
            // Generate context suggestions
            this.generateImageContextSuggestions(analysis);

            // Add note about limited analysis
            analysis.analysisNote = 'Analysis based on filename only - visual content not available due to download restrictions';
            
        } else if (this.isText(attachment.mimeType)) {
            analysis.type = 'text';
            analysis.analysisNote = 'Text file detected but content not available due to download restrictions';
            
            // Guess content type from filename
            if (attachment.filename.toLowerCase().includes('log')) {
                analysis.likelyErrorLog = true;
                analysis.suggestedContext = ['Likely contains error logs or debugging information'];
            }
            
        } else if (this.isCode(attachment.filename)) {
            analysis.type = 'code';
            analysis.language = this.detectLanguage(path.extname(attachment.filename));
            analysis.analysisNote = 'Code file detected but content not available due to download restrictions';
            analysis.suggestedContext = [`${analysis.language} code sample attached for reference`];
        }

        return analysis;
    }

    // Helper methods for file type detection
    isImage(mimeType) {
        return mimeType && mimeType.startsWith('image/');
    }

    isText(mimeType) {
        return mimeType && (
            mimeType.startsWith('text/') || 
            mimeType === 'application/json' ||
            mimeType === 'application/xml'
        );
    }

    isCode(filename) {
        const codeExtensions = ['.js', '.jsx', '.ts', '.tsx', '.py', '.java', '.css', '.scss', '.html', '.vue', '.php'];
        return codeExtensions.some(ext => filename.toLowerCase().endsWith(ext));
    }

    isScreenshot(filename) {
        const screenshotPatterns = ['screenshot', 'screen-shot', 'capture', 'screen', 'snap'];
        return screenshotPatterns.some(pattern => 
            filename.toLowerCase().includes(pattern)
        );
    }

    isUIElement(filename) {
        const uiPatterns = ['button', 'modal', 'dialog', 'form', 'table', 'component', 'widget'];
        return uiPatterns.some(pattern => 
            filename.toLowerCase().includes(pattern)
        );
    }

    isErrorState(filename) {
        const errorPatterns = ['error', 'bug', 'issue', 'problem', 'fail', 'warning'];
        return errorPatterns.some(pattern => 
            filename.toLowerCase().includes(pattern)
        );
    }

    // Content analysis helper methods
    extractUIElementsFromFilename(filename, analysis) {
        const filename_lower = filename.toLowerCase();
        
        // Common UI element patterns
        const elementMap = {
            'error': 'error-state',
            'warning': 'warning-message', 
            'button': 'button-component',
            'modal': 'modal-dialog',
            'table': 'table-component',
            'form': 'form-component',
            'dropdown': 'dropdown-component',
            'menu': 'menu-component',
            'nav': 'navigation',
            'header': 'header-component',
            'footer': 'footer-component',
            'sidebar': 'sidebar-component'
        };

        Object.entries(elementMap).forEach(([pattern, element]) => {
            if (filename_lower.includes(pattern)) {
                analysis.extractedElements.push(element);
            }
        });
    }

    generateImageContextSuggestions(analysis) {
        if (analysis.isScreenshot) {
            analysis.suggestedContext.push('User interface issue');
            analysis.suggestedContext.push('Visual bug or layout problem');
        }

        if (analysis.isErrorState) {
            analysis.suggestedContext.push('Error state visualization');
            analysis.suggestedContext.push('Exception handling UI');
        }

        if (analysis.extractedElements.length > 0) {
            analysis.suggestedContext.push(`Component issue: ${analysis.extractedElements.join(', ')}`);
        }
    }

    containsErrorLogs(content) {
        const errorPatterns = ['error:', 'exception:', 'stack trace:', 'failed:', 'ERROR', 'FATAL'];
        return errorPatterns.some(pattern => content.toLowerCase().includes(pattern.toLowerCase()));
    }

    containsStackTrace(content) {
        return content.includes('at ') && (content.includes('(') || content.includes('.js:'));
    }

    extractErrors(content) {
        const errorPatterns = [
            /Error: (.+)/gi,
            /TypeError: (.+)/gi,
            /ReferenceError: (.+)/gi,
            /SyntaxError: (.+)/gi,
            /FATAL: (.+)/gi
        ];

        const errors = [];
        errorPatterns.forEach(pattern => {
            const matches = content.matchAll(pattern);
            for (const match of matches) {
                errors.push({ 
                    type: match[0].split(':')[0], 
                    message: match[1]?.trim() || ''
                });
            }
        });

        return errors.slice(0, 10); // Limit to first 10 errors
    }

    extractUrls(content) {
        const urlPattern = /https?:\/\/[^\s]+/g;
        return (content.match(urlPattern) || []).slice(0, 20); // Limit to 20 URLs
    }

    extractFilePaths(content) {
        const pathPatterns = [
            /[a-zA-Z]?[\/\\][^\s]+\.[a-zA-Z0-9]+/g, // Unix/Windows paths with extensions
            /src\/[^\s]+/g, // Source paths
            /\.\/[^\s]+/g, // Relative paths
            /\.\.\/[^\s]+/g // Parent relative paths
        ];

        const paths = new Set();
        pathPatterns.forEach(pattern => {
            const matches = content.match(pattern) || [];
            matches.forEach(path => paths.add(path));
        });

        return Array.from(paths).slice(0, 15); // Limit to 15 paths
    }

    detectLanguageHints(content) {
        const hints = [];
        if (content.includes('import ') || content.includes('export ')) hints.push('JavaScript/TypeScript');
        if (content.includes('def ') || content.includes('import ')) hints.push('Python');
        if (content.includes('public class') || content.includes('package ')) hints.push('Java');
        if (content.includes('<?php')) hints.push('PHP');
        if (content.includes('function(') || content.includes('=>')) hints.push('JavaScript');
        
        return hints;
    }

    // Code analysis helpers
    detectLanguage(extension) {
        const langMap = {
            '.js': 'javascript',
            '.jsx': 'javascript',
            '.ts': 'typescript', 
            '.tsx': 'typescript',
            '.py': 'python',
            '.java': 'java',
            '.css': 'css',
            '.scss': 'scss',
            '.html': 'html',
            '.vue': 'vue',
            '.php': 'php'
        };
        return langMap[extension] || 'unknown';
    }

    hasImports(content) {
        return content.includes('import ') || 
               content.includes('require(') || 
               content.includes('from ') ||
               content.includes('#include');
    }

    hasFunctions(content) {
        return content.includes('function ') || 
               content.includes('=>') || 
               content.includes('def ') ||
               content.includes('public ') ||
               content.includes('private ');
    }

    hasClasses(content) {
        return content.includes('class ') || 
               content.includes('interface ') ||
               content.includes('extends ');
    }

    extractIdentifiers(content) {
        const patterns = [
            /function\s+(\w+)/g,
            /class\s+(\w+)/g,
            /const\s+(\w+)/g,
            /let\s+(\w+)/g,
            /var\s+(\w+)/g,
            /interface\s+(\w+)/g
        ];

        const identifiers = new Set();
        patterns.forEach(pattern => {
            const matches = content.matchAll(pattern);
            for (const match of matches) {
                identifiers.add(match[1]);
            }
        });

        return Array.from(identifiers).slice(0, 20); // Limit to 20 identifiers
    }

    extractComments(content) {
        const commentPatterns = [
            /\/\*[\s\S]*?\*\//g, // Multi-line comments
            /\/\/(.+)/g, // Single line comments
            /#(.+)/g, // Python/shell comments
            /<!--[\s\S]*?-->/g // HTML comments
        ];

        const comments = [];
        commentPatterns.forEach(pattern => {
            const matches = content.matchAll(pattern);
            for (const match of matches) {
                comments.push(match[0].trim());
            }
        });

        return comments.slice(0, 10); // Limit to 10 comments
    }

    estimateCodeComplexity(content) {
        const complexityFactors = {
            functions: (content.match(/function\s+\w+/g) || []).length,
            conditionals: (content.match(/if\s*\(/g) || []).length,
            loops: (content.match(/(for|while)\s*\(/g) || []).length,
            classes: (content.match(/class\s+\w+/g) || []).length,
            asyncOperations: (content.match(/(async|await|Promise)/g) || []).length
        };

        const totalComplexity = Object.values(complexityFactors).reduce((sum, count) => sum + count, 0);
        
        let level = 'low';
        if (totalComplexity > 20) level = 'high';
        else if (totalComplexity > 10) level = 'medium';

        return {
            level,
            factors: complexityFactors,
            totalScore: totalComplexity
        };
    }

    // AI insight helpers
    mapElementToCodeArea(element) {
        const mapping = {
            'error-state': 'error handling components',
            'warning-message': 'notification system',
            'button-component': 'UI components/buttons',
            'modal-dialog': 'modal components',
            'table-component': 'table/grid components', 
            'form-component': 'form validation',
            'dropdown-component': 'dropdown/select components',
            'menu-component': 'navigation components',
            'navigation': 'navigation system',
            'header-component': 'header/layout components',
            'footer-component': 'footer/layout components',
            'sidebar-component': 'sidebar/layout components'
        };
        return mapping[element] || element;
    }

    guessFilesFromError(error) {
        const files = [];
        const message = error.message.toLowerCase();
        
        if (message.includes('component')) {
            files.push('**/*Component.jsx', '**/*Component.tsx', '**/components/**');
        }
        if (message.includes('hook')) {
            files.push('**/hooks/**', '**/use*.js', '**/use*.ts');
        }
        if (message.includes('api') || message.includes('fetch')) {
            files.push('**/api/**', '**/services/**', '**/utils/api*');
        }
        if (message.includes('style') || message.includes('css')) {
            files.push('**/*.css', '**/*.scss', '**/styles/**');
        }
        if (message.includes('redux') || message.includes('store')) {
            files.push('**/store/**', '**/reducers/**', '**/actions/**');
        }
        
        return files;
    }
}

module.exports = { AttachmentAnalyzer };