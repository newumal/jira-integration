const { initializeJiraClient } = require('../utils/jiraClient');

async function getIssue(issueKey) {
    const jira = initializeJiraClient();
    try {
        const issue = await jira.findIssue(issueKey);
        console.log('\n=== Issue Details ===');
        console.log(`\nIssue Key: ${issue.key}`);
        console.log(`Summary: ${issue.fields.summary}`);
        console.log(`Status: ${issue.fields.status.name}`);
        console.log(`Priority: ${issue.fields.priority.name}`);
        console.log(`Assignee: ${issue.fields.assignee ? issue.fields.assignee.displayName : 'Unassigned'}`);
        console.log(`Created: ${new Date(issue.fields.created).toLocaleDateString()}`);
        console.log(`Updated: ${new Date(issue.fields.updated).toLocaleDateString()}`);
        
        if (issue.fields.description) {
            console.log('\nDescription:');
            console.log(issue.fields.description);
        }
        
        if (issue.fields.comment && issue.fields.comment.comments.length > 0) {
            console.log('\nComments:');
            issue.fields.comment.comments.forEach(comment => {
                console.log(`\n[${new Date(comment.created).toLocaleString()}] ${comment.author.displayName}:`);
                console.log(comment.body);
                console.log('----------------------------------------');
            });
        }
        
        return issue;
    } catch (error) {
        console.error('Error fetching issue:', error);
        return null;
    }
}

module.exports = { getIssue }; 