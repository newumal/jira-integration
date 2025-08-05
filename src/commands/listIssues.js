const { initializeJiraClient } = require('../utils/jiraClient');

async function listIssues(projectKey, options = {}) {
    const jira = initializeJiraClient();
    try {
        let jql = `project = ${projectKey}`;
        
        // Add filters based on options
        if (options.assignee) {
            jql += ` AND assignee = ${options.assignee}`;
        }
        if (options.status) {
            jql += ` AND status = "${options.status}"`;
        }
        if (options.priority) {
            jql += ` AND priority = "${options.priority}"`;
        }
        
        jql += ' ORDER BY created DESC';
        
        const issues = await jira.searchJira(jql, {
            maxResults: options.maxResults || 50,
            fields: ['summary', 'status', 'priority', 'assignee', 'created', 'description']
        });
        
        if (issues.issues.length === 0) {
            console.log(`No issues found in project ${projectKey}`);
            return [];
        }

        console.log(`\nFound ${issues.issues.length} issues in project ${projectKey}`);
        issues.issues.forEach((issue, index) => {
            console.log(`\n[${index + 1}] ${issue.key}: ${issue.fields.summary}`);
            console.log(`Status: ${issue.fields.status.name}`);
            console.log(`Priority: ${issue.fields.priority.name}`);
            console.log(`Assignee: ${issue.fields.assignee ? issue.fields.assignee.displayName : 'Unassigned'}`);
            console.log(`Created: ${new Date(issue.fields.created).toLocaleDateString()}`);
            if (issue.fields.description) {
                console.log(`Description: ${issue.fields.description.substring(0, 100)}${issue.fields.description.length > 100 ? '...' : ''}`);
            }
            console.log('----------------------------------------');
        });
        
        return issues.issues;
    } catch (error) {
        console.error('Error fetching issues:', error);
        return [];
    }
}

module.exports = { listIssues }; 