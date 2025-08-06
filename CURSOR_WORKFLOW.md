# 🚀 Streamlined Cursor AI Workflow for JIRA Issues

## 📋 Quick Workflow

This is the **easiest way** to get Cursor AI to resolve any JIRA issue with full context and visual evidence.

### Step 1: Analyze the JIRA Issue
```bash
jira ai-fix ROC-3803
```
This command:
- 📎 Downloads and analyzes all attachments
- 🧠 Classifies the issue type and complexity
- 🔍 Generates search strategies and focus areas
- 💾 Creates rich context in `.cursor-ai-fix-request.json`

### Step 2: Generate Cursor AI Prompt
```bash
jira cursor-prompt
```
This command:
- 📄 Creates a comprehensive, ready-to-use prompt
- 🖼️ Includes all visual context and attachment details
- 🎯 Provides step-by-step instructions for AI
- 📋 Lists all relevant files and investigation areas

### Step 3: Copy & Paste to Cursor AI
1. **Copy** the generated prompt from terminal output
2. **Open** Cursor AI chat
3. **Paste** and send the prompt
4. **Done!** Cursor AI has complete context including attachments

## 🎯 Example Complete Workflow

```bash
# 1. Analyze JIRA issue with attachments
jira ai-fix ROC-3803
# ✅ Downloads 2 attachments (56KB total)
# ✅ Identifies warning-message component
# ✅ Classifies as "Component Issue"
# ✅ Suggests "notification system" investigation

# 2. Generate comprehensive prompt
jira cursor-prompt --save
# ✅ Creates detailed prompt with visual context
# ✅ Saves to cursor-prompt.md for reference
# ✅ Ready to copy-paste to Cursor AI

# 3. Use with Cursor AI
# Copy the prompt → Paste in Cursor AI → Get intelligent solution!
```

## 📊 What Cursor AI Gets

### 🔍 Rich Context
- **Issue Classification**: UI Bug, Feature Implementation, Runtime Error, etc.
- **Complexity Assessment**: Low/Medium/High with reasoning
- **Visual Evidence**: Screenshots with dimension analysis and UI component detection
- **Technical Clues**: Component involvement, error patterns, code areas

### 📎 Attachment Intelligence
- **Image Analysis**: Screenshot detection, UI element extraction, error state identification
- **Code Analysis**: Language detection, complexity metrics, identifier extraction  
- **Error Log Processing**: Stack trace analysis, error pattern recognition
- **Smart Fallbacks**: Works even when attachments can't be downloaded

### 🎯 Investigation Strategy
- **Search Terms**: Intelligently extracted keywords from issue and attachments
- **Focus Areas**: Prioritized code areas to investigate
- **File Patterns**: Suggested file types and locations to examine
- **Step-by-Step Guidance**: Tailored approach based on issue type

## 💡 Advanced Options

### Save Prompt to File
```bash
jira cursor-prompt --save
```
Saves the prompt to `cursor-prompt.md` for reference or later use.

### Custom Workflow for Different Issue Types

#### 🖼️ Visual/UI Issues
```bash
jira ai-fix UI-123    # Analyzes screenshots and UI components
jira cursor-prompt    # Generates UI-focused investigation strategy
```

#### 🐛 Error/Bug Issues  
```bash
jira ai-fix BUG-456   # Processes error logs and stack traces
jira cursor-prompt    # Creates debugging-focused prompt
```

#### ⚡ Feature Requests
```bash
jira ai-fix FEAT-789  # Analyzes requirements and visual mockups
jira cursor-prompt    # Generates implementation-focused guidance
```

## 🎨 Generated Prompt Structure

The generated prompt includes:

### 📋 Issue Overview
- Key, summary, status, priority
- AI-classified issue type and complexity
- Assignee and component information

### 📎 Visual Context
- Detailed attachment analysis
- Image dimensions and UI component detection
- Error state identification
- Local file paths for AI access

### 🔍 Investigation Strategy
- Prioritized focus areas
- Intelligent search terms
- Suggested file patterns
- Code area recommendations

### 🤖 AI Instructions
- Step-by-step approach tailored to issue type
- Specific guidance for UI, error, or feature issues
- Testing and validation recommendations
- Code quality and integration considerations

## 🚀 Benefits

### ⚡ Speed
- **No manual prompt writing** - Everything auto-generated
- **No context searching** - All relevant info included
- **No file hunting** - Attachments analyzed and referenced

### 🎯 Accuracy
- **Visual understanding** - AI sees actual screenshots
- **Component intelligence** - UI elements automatically identified
- **Error context** - Stack traces and logs processed
- **Code awareness** - Relevant areas highlighted

### 🔄 Consistency
- **Standardized approach** - Same high-quality process every time
- **Complete context** - Never miss important details
- **Proven patterns** - Issue-type-specific guidance

## 📁 File Management

### Auto-Ignored Files
These are automatically excluded from git:
- `.jira-attachments/` - Downloaded attachment files
- `cursor-prompt.md` - Generated prompt file
- `.cursor-ai-fix-request.json` - Rich context file

### Local Files
These persist locally for AI analysis:
- **Attachments**: Available in `.jira-attachments/` with organized naming
- **Context**: Rich analysis in `.cursor-ai-fix-request.json`
- **Prompt**: Human-readable prompt in `cursor-prompt.md` (if --save used)

## 🎯 Pro Tips

### 1. Always Start with Analysis
```bash
# ✅ Good workflow
jira ai-fix ISSUE-123
jira cursor-prompt

# ❌ Won't work - no context file
jira cursor-prompt
```

### 2. Use --save for Complex Issues
```bash
jira cursor-prompt --save
# Creates cursor-prompt.md for reference during development
```

### 3. Re-run for Updated Context
```bash
# After JIRA issue is updated with new attachments
jira ai-fix ISSUE-123  # Refresh analysis
jira cursor-prompt     # Generate updated prompt
```

### 4. Visual Issues Need Screenshots
- Attach screenshots to JIRA for visual bugs
- The system automatically detects and analyzes UI components
- Cursor AI gets visual context for accurate fixes

---

This workflow transforms JIRA issue resolution from **manual context gathering** to **intelligent, automated analysis** with **rich visual understanding**! 🚀