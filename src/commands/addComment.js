const { initializeJiraClient } = require('../utils/jiraClient');
const fs = require('fs');

async function addComment(issueKey, filePath) {
    const jira = initializeJiraClient();
    try {
        const comment = fs.readFileSync(filePath, 'utf8');
        await jira.addComment(issueKey, comment);
        console.log(`Comment added to ${issueKey}`);
    } catch (error) {
        console.error('Error adding comment:', error);
    }
}

module.exports = { addComment }; 