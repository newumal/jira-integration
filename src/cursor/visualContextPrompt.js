/**
 * Visual Context Prompt Builder
 * Creates intelligent prompts for Cursor AI agent based on JIRA issue analysis
 */

/**
 * Build a comprehensive prompt for Cursor AI agent with visual context
 * @param {Object} richContext - Enhanced context from aiFix command
 * @returns {string} Formatted prompt for Cursor agent
 */
function buildVisualContextPrompt(richContext) {
    const { issueKey, summary, attachments, contextualInsights, suggestedCodeAreas } = richContext;
    
    let prompt = `# 🎯 JIRA Issue Analysis with Visual Context

## 📋 Issue Overview
- **Issue Key**: ${issueKey}
- **Summary**: ${summary}
- **Status**: ${richContext.status}
- **Priority**: ${richContext.priority}
- **Assignee**: ${richContext.assignee}`;

    if (richContext.components && richContext.components.length > 0) {
        prompt += `
- **Components**: ${richContext.components.join(', ')}`;
    }

    if (richContext.labels && richContext.labels.length > 0) {
        prompt += `
- **Labels**: ${richContext.labels.join(', ')}`;
    }

    prompt += `

## 🔍 AI Analysis Results
- **Issue Type**: ${contextualInsights?.issueType || 'Not classified'}
- **Estimated Complexity**: ${contextualInsights?.complexity || 'Medium'}
- **Overall Priority**: ${attachments.summary?.overallPriority || 'Medium'}`;

    // Visual Context Section
    prompt += buildAttachmentSection(attachments);
    
    // Code Investigation Strategy
    prompt += buildInvestigationStrategy(richContext);
    
    // Technical Context
    prompt += buildTechnicalContext(richContext);
    
    // AI Instructions
    prompt += buildAIInstructions(richContext);
    
    prompt += `

---
*Generated with advanced attachment analysis at ${richContext.timestamp}*
*Local attachment directory: \`.jira-attachments/\`*`;

    return prompt;
}

/**
 * Build the attachment analysis section
 */
function buildAttachmentSection(attachments) {
    let section = `

## 📎 Attachment Analysis`;

    if (!attachments.hasAttachments) {
        section += `
- ℹ️  **No attachments found** - Relying on issue description and context`;
        return section;
    }

    section += `
- **Total Attachments**: ${attachments.count}
- **Images**: ${attachments.summary.imageCount}
- **Code Files**: ${attachments.summary.codeFileCount} 
- **Text/Log Files**: ${attachments.summary.textFileCount}
- **Error Files**: ${attachments.summary.errorCount}`;

    if (attachments.summary.keyFindings.length > 0) {
        section += `

### 🔎 Key Findings
${attachments.summary.keyFindings.map(finding => `- ${finding}`).join('\n')}`;
    }

    // Image Analysis Details
    const imageAttachments = attachments.analysis.filter(a => a.contentAnalysis?.type === 'image');
    if (imageAttachments.length > 0) {
        section += `

### 🖼️ Visual Evidence Analysis`;
        
        imageAttachments.forEach(img => {
            section += `

#### ${img.filename}
- **Type**: ${img.contentAnalysis.isScreenshot ? '📱 Screenshot' : '🖼️ Image'}
- **Dimensions**: ${img.contentAnalysis.dimensions ? 
    `${img.contentAnalysis.dimensions.width}x${img.contentAnalysis.dimensions.height}` : 'Unknown'}
- **Local Path**: \`${img.localPath}\``;

            if (img.contentAnalysis.extractedElements.length > 0) {
                section += `
- **UI Elements Detected**: ${img.contentAnalysis.extractedElements.join(', ')}`;
            }

            if (img.contentAnalysis.suggestedContext.length > 0) {
                section += `
- **Context Hints**: ${img.contentAnalysis.suggestedContext.join(', ')}`;
            }

            if (img.contentAnalysis.isErrorState) {
                section += `
- **⚠️ Error State Detected**: This image likely shows an error or problematic state`;
            }
        });
    }

    // Code File Analysis
    const codeAttachments = attachments.analysis.filter(a => a.contentAnalysis?.type === 'code');
    if (codeAttachments.length > 0) {
        section += `

### 💻 Code Attachments`;
        
        codeAttachments.forEach(code => {
            section += `

#### ${code.filename}
- **Language**: ${code.contentAnalysis.language}
- **Lines**: ${code.contentAnalysis.lineCount}
- **Complexity**: ${code.contentAnalysis.complexity?.level || 'Unknown'}
- **Local Path**: \`${code.localPath}\``;

            if (code.contentAnalysis.extractedIdentifiers.length > 0) {
                section += `
- **Key Identifiers**: ${code.contentAnalysis.extractedIdentifiers.slice(0, 5).join(', ')}`;
            }
        });
    }

    // Error Log Analysis
    const errorAttachments = attachments.analysis.filter(a => 
        a.contentAnalysis?.type === 'text' && a.contentAnalysis.hasErrorLogs
    );
    if (errorAttachments.length > 0) {
        section += `

### 🚨 Error Log Analysis`;
        
        errorAttachments.forEach(errorFile => {
            section += `

#### ${errorFile.filename}
- **Lines**: ${errorFile.contentAnalysis.lineCount}
- **Has Stack Trace**: ${errorFile.contentAnalysis.hasStackTrace ? '✅' : '❌'}
- **Local Path**: \`${errorFile.localPath}\``;

            if (errorFile.contentAnalysis.extractedErrors.length > 0) {
                section += `
- **Error Types Found**: ${errorFile.contentAnalysis.extractedErrors
                    .map(e => e.type).slice(0, 3).join(', ')}`;
            }

            if (errorFile.contentAnalysis.extractedPaths?.length > 0) {
                section += `
- **File Paths in Logs**: ${errorFile.contentAnalysis.extractedPaths
                    .slice(0, 3).join(', ')}`;
            }
        });
    }

    return section;
}

/**
 * Build investigation strategy section
 */
function buildInvestigationStrategy(richContext) {
    const { searchStrategy, suggestedCodeAreas, attachments } = richContext;
    
    let section = `

## 🎯 Investigation Strategy`;

    if (suggestedCodeAreas.length > 0) {
        section += `

### 🔍 Primary Focus Areas
${suggestedCodeAreas.slice(0, 5).map(area => `- ${area}`).join('\n')}`;
    }

    if (searchStrategy?.primarySearchTerms.length > 0) {
        section += `

### 🔎 Suggested Search Terms
${searchStrategy.primarySearchTerms.slice(0, 8).map(term => `- \`${term}\``).join('\n')}`;
    }

    if (attachments.summary?.extractedUIComponents.length > 0) {
        section += `

### 🎨 UI Components to Investigate
${attachments.summary.extractedUIComponents.map(comp => `- ${comp}`).join('\n')}`;
    }

    if (attachments.summary?.suggestedInvestigationAreas.length > 0) {
        section += `

### 🧭 Code Areas to Explore
${attachments.summary.suggestedInvestigationAreas.map(area => `- ${area}`).join('\n')}`;
    }

    return section;
}

/**
 * Build technical context section
 */
function buildTechnicalContext(richContext) {
    let section = `

## 🔧 Technical Context`;

    if (richContext.description) {
        section += `

### 📝 Issue Description
${richContext.description}`;
    }

    // Add insights from attachments
    const insights = richContext.contextualInsights;
    if (insights?.technicalClues?.length > 0) {
        section += `

### 💡 Technical Clues
${insights.technicalClues.map(clue => `- ${clue}`).join('\n')}`;
    }

    // Add visual context insights
    if (insights?.visualContext?.length > 0) {
        section += `

### 👁️ Visual Context Insights
${insights.visualContext.map(insight => `- ${insight}`).join('\n')}`;
    }

    return section;
}

/**
 * Build AI instructions section
 */
function buildAIInstructions(richContext) {
    const hasImages = richContext.attachments.summary?.imageCount > 0;
    const hasErrors = richContext.attachments.summary?.errorCount > 0;
    const hasCode = richContext.attachments.summary?.codeFileCount > 0;
    
    let section = `

## 🤖 AI Assistant Instructions

### Step-by-Step Approach:

1. **📁 Review Attachments**`;
    
    if (hasImages) {
        section += `
   - 🖼️ **Examine visual evidence** in \`.jira-attachments/\` folder
   - Pay special attention to screenshots showing UI issues or error states`;
    }
    
    if (hasErrors) {
        section += `
   - 🚨 **Analyze error logs** for specific error messages and stack traces
   - Look for file paths and line numbers mentioned in error logs`;
    }
    
    if (hasCode) {
        section += `
   - 💻 **Study attached code samples** to understand the context better`;
    }

    section += `

2. **🔍 Codebase Analysis**
   - Search for the identified UI components and code areas
   - Use the suggested search terms to locate relevant files
   - Focus on the primary investigation areas listed above`;

    if (richContext.contextualInsights?.issueType === 'UI/UX Issue' || 
        richContext.contextualInsights?.issueType === 'Visual Bug') {
        section += `

3. **🎨 UI/Visual Issue Focus**
   - Check CSS/styling files for layout issues
   - Examine React/Vue components for rendering problems
   - Look for responsive design issues or browser compatibility problems`;
    }

    if (hasErrors) {
        section += `

3. **🐛 Error Investigation**
   - Trace error messages back to their source code
   - Check for missing error handling or validation
   - Look for asynchronous operation issues or timing problems`;
    }

    section += `

4. **🛠️ Implementation Plan**
   - Create a clear fix strategy based on your findings
   - Consider both the technical requirements and visual evidence
   - Plan for testing to ensure the fix addresses the visual/functional issue

5. **✅ Validation**
   - Ensure your solution addresses the specific issue shown in attachments
   - Consider edge cases and potential side effects
   - Document the changes for future reference

### 💡 Key Priorities:
- **Visual Accuracy**: If images show the problem, ensure your fix addresses what's shown
- **Error Resolution**: If error logs are present, fix the root cause, not just symptoms  
- **Component Integrity**: Maintain existing functionality while fixing the issue
- **Code Quality**: Follow existing patterns and maintain clean, readable code`;

    return section;
}

/**
 * Generate a simplified prompt for issues without attachments
 */
function buildSimplePrompt(richContext) {
    return `# 🎯 JIRA Issue: ${richContext.issueKey}

## Summary
${richContext.summary}

## Description  
${richContext.description || 'No description provided'}

## Investigation Focus
${richContext.suggestedCodeAreas.length > 0 ? 
    richContext.suggestedCodeAreas.map(area => `- ${area}`).join('\n') : 
    '- Analyze issue description for context clues'}

## Search Strategy
${richContext.searchStrategy?.primarySearchTerms.slice(0, 5).map(term => `- \`${term}\``).join('\n') || '- Use issue summary keywords'}

Please analyze the codebase to understand and implement a solution for this issue.

---
*Generated at ${richContext.timestamp}*`;
}

module.exports = { 
    buildVisualContextPrompt, 
    buildSimplePrompt 
};