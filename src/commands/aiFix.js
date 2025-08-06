const { getIssue } = require('./getIssue');
const { AttachmentAnalyzer } = require('../attachments/attachmentAnalyzer');
const { buildVisualContextPrompt, buildSimplePrompt } = require('../cursor/visualContextPrompt');
const { initializeJiraClient } = require('../utils/jiraClient');
const fs = require('fs');
const path = require('path');

async function aiFix(issueKey) {
    console.log(`🚀 Starting AI fix analysis for ${issueKey}...`);
    
    // Initialize JIRA client and fetch issue
    const jira = initializeJiraClient();
    const issue = await getIssue(issueKey, true); // true = return object, not just print
    
    if (!issue) {
        console.error('❌ Could not fetch JIRA issue.');
        return;
    }

    console.log('📋 Issue fetched successfully');
    console.log('🔍 Analyzing attachments...');
    
    // Analyze attachments with our new AttachmentAnalyzer
    const attachmentAnalyzer = new AttachmentAnalyzer(jira);
    const attachmentData = await attachmentAnalyzer.processIssueAttachments(issueKey);
    
    // Build rich context with AI-driven insights
    const richContext = {
        // Basic issue information
        issueKey,
        summary: issue.fields.summary,
        description: issue.fields.description || '',
        status: issue.fields.status.name,
        priority: issue.fields.priority.name,
        assignee: issue.fields.assignee?.displayName || 'Unassigned',
        components: (issue.fields.components || []).map(c => c.name),
        labels: issue.fields.labels || [],
        
        // Attachment analysis results
        attachments: attachmentData,
        
        // AI-driven context analysis
        contextualInsights: generateContextualInsights(issue, attachmentData),
        suggestedCodeAreas: extractCodeAreas(issue, attachmentData),
        searchStrategy: buildSearchStrategy(issue, attachmentData),
        
        // Repository and system context
        repoPath: process.cwd(),
        timestamp: new Date().toISOString(),
        
        // Generate the AI prompt
        aiPrompt: null // Will be set below
    };

    // Generate appropriate prompt based on complexity
    richContext.aiPrompt = attachmentData.hasAttachments ? 
        buildVisualContextPrompt(richContext) : 
        buildSimplePrompt(richContext);

    // Write enhanced context for Cursor
    const triggerFile = path.join(process.cwd(), '.cursor-ai-fix-request.json');
    
    try {
        fs.writeFileSync(triggerFile, JSON.stringify(richContext, null, 2));
        
        // Display results
        console.log('\n✅ Enhanced AI fix request created successfully!');
        console.log(`📁 ${attachmentData.hasAttachments ? attachmentData.count : 0} attachment(s) processed`);
        
        if (attachmentData.hasAttachments) {
            console.log('🖼️  Visual context available from:', 
                attachmentData.analysis.map(a => a.filename).join(', '));
            
            if (attachmentData.summary.keyFindings.length > 0) {
                console.log('🔎 Key findings:');
                attachmentData.summary.keyFindings.forEach(finding => 
                    console.log(`   • ${finding}`)
                );
            }
            
            if (attachmentData.summary.suggestedInvestigationAreas.length > 0) {
                console.log('🎯 Suggested investigation areas:', 
                    attachmentData.summary.suggestedInvestigationAreas.join(', '));
            }
        }
        
        console.log(`\n💡 Issue Type: ${richContext.contextualInsights.issueType}`);
        console.log(`⚡ Complexity: ${richContext.contextualInsights.complexity}`);
        console.log(`🔥 Priority: ${richContext.attachments.summary.overallPriority}`);
        
        console.log(`\n📄 AI prompt preview (first 200 chars):`);
        console.log(`"${richContext.aiPrompt.substring(0, 200)}..."`);
        
        console.log(`\n🎯 CURSOR_AI_FIX_REQUEST: ${issueKey} ${process.cwd()}`);
        console.log('📋 Ready for Cursor AI agent processing!');
        
    } catch (err) {
        console.error('❌ Error writing Cursor AI fix request file:', err.message);
    }
}

/**
 * Generate contextual insights about the issue
 */
function generateContextualInsights(issue, attachmentData) {
    const insights = {
        issueType: classifyIssueType(issue, attachmentData),
        complexity: estimateComplexity(issue, attachmentData),
        visualContext: extractVisualContext(attachmentData),
        technicalClues: extractTechnicalClues(issue, attachmentData),
        urgency: determineUrgency(issue, attachmentData)
    };
    
    return insights;
}

/**
 * Classify the type of issue based on content and attachments
 */
function classifyIssueType(issue, attachmentData) {
    const summary = issue.fields.summary.toLowerCase();
    const description = (issue.fields.description || '').toLowerCase();
    const combinedText = `${summary} ${description}`;
    
    // Check attachments first for visual clues
    if (attachmentData.hasAttachments && attachmentData.summary.imageCount > 0) {
        if (summary.includes('ui') || summary.includes('interface') || summary.includes('layout')) {
            return 'UI/UX Issue';
        }
        if (attachmentData.summary.extractedUIComponents.length > 0) {
            return 'Component Issue';
        }
        if (attachmentData.analysis.some(a => a.contentAnalysis?.isErrorState)) {
            return 'Visual Bug with Error State';
        }
        return 'Visual Bug';
    }
    
    // Check for error logs
    if (attachmentData.summary.errorCount > 0) {
        return 'Runtime Error';
    }
    
    // Classify based on text content
    if (combinedText.includes('feature') || combinedText.includes('implement') || combinedText.includes('add')) {
        return 'Feature Implementation';
    }
    
    if (combinedText.includes('bug') || combinedText.includes('error') || combinedText.includes('issue')) {
        return 'Bug Fix';
    }
    
    if (combinedText.includes('performance') || combinedText.includes('slow') || combinedText.includes('optimize')) {
        return 'Performance Issue';
    }
    
    if (combinedText.includes('test') || combinedText.includes('testing')) {
        return 'Testing Issue';
    }
    
    return 'General Issue';
}

/**
 * Estimate complexity based on various factors
 */
function estimateComplexity(issue, attachmentData) {
    let complexityScore = 0;
    
    // Base complexity from description length
    const descLength = (issue.fields.description || '').length;
    if (descLength > 500) complexityScore += 2;
    else if (descLength > 200) complexityScore += 1;
    
    // Attachment complexity
    if (attachmentData.hasAttachments) {
        complexityScore += Math.min(attachmentData.count * 0.5, 2);
        
        // Code files increase complexity
        complexityScore += attachmentData.summary.codeFileCount;
        
        // Error logs suggest debugging complexity
        if (attachmentData.summary.errorCount > 0) complexityScore += 2;
    }
    
    // Component involvement
    const componentCount = (issue.fields.components || []).length;
    complexityScore += Math.min(componentCount, 3);
    
    // UI components suggest frontend complexity
    if (attachmentData.summary.extractedUIComponents.length > 2) complexityScore += 1;
    
    // Classification
    if (complexityScore >= 6) return 'High';
    if (complexityScore >= 3) return 'Medium';
    return 'Low';
}

/**
 * Extract visual context from attachments
 */
function extractVisualContext(attachmentData) {
    const context = [];
    
    if (!attachmentData.hasAttachments) {
        return ['No visual context available'];
    }
    
    const imageAnalyses = attachmentData.analysis.filter(a => a.contentAnalysis?.type === 'image');
    
    imageAnalyses.forEach(img => {
        if (img.contentAnalysis.isScreenshot) {
            context.push('User interface screenshot available');
        }
        if (img.contentAnalysis.isErrorState) {
            context.push('Error state visualization provided');
        }
        if (img.contentAnalysis.extractedElements.length > 0) {
            context.push(`UI elements shown: ${img.contentAnalysis.extractedElements.join(', ')}`);
        }
    });
    
    return context.length > 0 ? context : ['Visual attachments present but no specific context extracted'];
}

/**
 * Extract technical clues from issue and attachments
 */
function extractTechnicalClues(issue, attachmentData) {
    const clues = [];
    
    // From issue components
    if (issue.fields.components && issue.fields.components.length > 0) {
        clues.push(`Components involved: ${issue.fields.components.map(c => c.name).join(', ')}`);
    }
    
    // From error logs
    if (attachmentData.summary.errorCount > 0) {
        clues.push('Error logs available for debugging');
    }
    
    // From code files
    if (attachmentData.summary.codeFileCount > 0) {
        clues.push('Code samples provided for reference');
    }
    
    // From description patterns
    const description = issue.fields.description || '';
    if (description.includes('API') || description.includes('endpoint')) {
        clues.push('API or backend service involvement');
    }
    if (description.includes('database') || description.includes('SQL')) {
        clues.push('Database operations involved');
    }
    if (description.includes('CSS') || description.includes('style')) {
        clues.push('Styling or CSS changes needed');
    }
    
    return clues.length > 0 ? clues : ['Limited technical context available'];
}

/**
 * Determine issue urgency
 */
function determineUrgency(issue, attachmentData) {
    // High priority issues
    if (issue.fields.priority.name.toLowerCase().includes('critical') || 
        issue.fields.priority.name.toLowerCase().includes('blocker')) {
        return 'Critical';
    }
    
    // Error states are urgent
    if (attachmentData.summary.errorCount > 0) {
        return 'High';
    }
    
    // Visual bugs with screenshots are moderately urgent
    if (attachmentData.summary.imageCount > 0) {
        return 'Medium';
    }
    
    return 'Normal';
}

/**
 * Extract code areas to investigate
 */
function extractCodeAreas(issue, attachmentData) {
    const areas = new Set();
    
    // From components
    (issue.fields.components || []).forEach(c => areas.add(c.name));
    
    // From attachment analysis
    if (attachmentData.hasAttachments) {
        attachmentData.summary.suggestedInvestigationAreas.forEach(area => areas.add(area));
        attachmentData.summary.extractedUIComponents.forEach(comp => areas.add(comp));
        
        // From AI insights
        attachmentData.analysis.forEach(analysis => {
            if (analysis.aiInsights?.relevantCodeAreas) {
                analysis.aiInsights.relevantCodeAreas.forEach(area => areas.add(area));
            }
        });
    }
    
    // From issue text analysis
    const text = `${issue.fields.summary} ${issue.fields.description || ''}`.toLowerCase();
    const codeAreaKeywords = [
        'frontend', 'backend', 'api', 'database', 'ui', 'component', 
        'service', 'handler', 'controller', 'model', 'view'
    ];
    
    codeAreaKeywords.forEach(keyword => {
        if (text.includes(keyword)) {
            areas.add(keyword);
        }
    });
    
    return Array.from(areas).slice(0, 8); // Limit to top 8 areas
}

/**
 * Build search strategy for the issue
 */
function buildSearchStrategy(issue, attachmentData) {
    const strategy = {
        primarySearchTerms: [],
        filePatterns: [],
        excludePatterns: ['node_modules', '.git', 'dist', 'build'],
        searchOrder: ['components', 'services', 'utils', 'styles']
    };
    
    // Extract keywords from issue
    const keywords = extractKeywords(issue.fields.summary + ' ' + (issue.fields.description || ''));
    strategy.primarySearchTerms.push(...keywords);
    
    // Add attachment-based search terms
    if (attachmentData.hasAttachments) {
        attachmentData.analysis.forEach(analysis => {
            if (analysis.aiInsights?.suggestedSearchTerms) {
                strategy.primarySearchTerms.push(...analysis.aiInsights.suggestedSearchTerms);
            }
        });
    }
    
    // Remove duplicates and limit
    strategy.primarySearchTerms = [...new Set(strategy.primarySearchTerms)].slice(0, 10);
    
    return strategy;
}

/**
 * Extract meaningful keywords from text
 */
function extractKeywords(text) {
    const stopWords = ['the', 'is', 'at', 'which', 'on', 'and', 'a', 'to', 'are', 'as', 'for', 'with', 'be', 'by'];
    
    return text.toLowerCase()
        .split(/\W+/)
        .filter(word => word.length > 2 && !stopWords.includes(word))
        .filter(word => !/^\d+$/.test(word)) // Remove pure numbers
        .slice(0, 10); // Top 10 keywords
}

module.exports = { aiFix }; 