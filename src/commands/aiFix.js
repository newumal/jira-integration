const { getIssue } = require('./getIssue');
const fs = require('fs');
const path = require('path');

async function aiFix(issueKey) {
    // Fetch the issue details
    const issue = await getIssue(issueKey, true); // true = return object, not just print
    if (!issue) {
        console.error('Could not fetch JIRA issue.');
        return;
    }
    const summary = issue.fields.summary;
    const description = issue.fields.description;
    const repoPath = process.cwd();
    const request = {
        issueKey,
        summary,
        description,
        repoPath,
        timestamp: new Date().toISOString()
    };
    const triggerFile = path.join(repoPath, '.cursor-ai-fix-request.json');
    try {
        fs.writeFileSync(triggerFile, JSON.stringify(request, null, 2));
        console.log(`Cursor agent: AI fix request written to .cursor-ai-fix-request.json.`);
        console.log(`CURSOR_AI_FIX_REQUEST: ${issueKey} ${repoPath}`);
    } catch (err) {
        console.error('Error writing Cursor AI fix request file:', err.message);
    }
}

module.exports = { aiFix }; 