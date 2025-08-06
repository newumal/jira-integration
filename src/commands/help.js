const helpText = `
JIRA CLI Commands:

1. List all projects:
   jira projects

2. Get issue details:
   jira issue <issue-key>
   Example: jira issue WAR-123

3. List project issues:
   jira list <project-key> [options]
   Example: jira list WAR
   
   Options:
   --assignee <name>    Filter by assignee
   --status <status>    Filter by status
   --priority <level>   Filter by priority
   --limit <number>     Limit number of results

4. Add a comment to an issue:
   jira comment <issue-key> <file-path>
   Example: jira comment WAR-123 ./comment.txt

5. Identify relevant repositories:
   jira identify <issue-key>
   Example: jira identify WAR-123
   
   This command analyzes the JIRA ticket and scans local repositories
   to suggest which repositories are likely to need changes.
   Shows relevance scores based on ticket details and repo contents.

6. Create feature branch:
   jira branch <issue-key>
   Example: jira branch WAR-123
   
   Creates a feature branch based on the JIRA issue key and title.

7. Auto-generate AI fix:
   jira ai-fix <issue-key>
   Example: jira ai-fix WAR-123
   
   Analyzes issue and attachments, generates rich context for AI.

8. Generate Cursor AI prompt:
   jira cursor-prompt [--save] [--copy]
   Example: jira cursor-prompt --save
   
   Generates a comprehensive prompt for Cursor AI using the analysis
   from ai-fix command. Includes all context, attachments, and guidance.

9. Auto-comment from changes:
   jira auto-comment <issue-key>
   Example: jira auto-comment WAR-123
   
   Automatically generates and posts a comment based on recent changes.

10. Commit and push changes:
    jira commit <issue-key> [message]
    Example: jira commit WAR-123 "Fix login bug"
    
    Commits changes with JIRA-formatted message and pushes to remote.

11. Show this help:
    jira help
`;

function showHelp() {
    console.log(helpText);
}

module.exports = { showHelp, helpText }; 