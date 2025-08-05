const JiraClient = require('jira-client');
const fs = require('fs');
const path = require('path');

function initializeJiraClient() {
    const config = JSON.parse(fs.readFileSync(path.join(__dirname, '../../config.json'), 'utf8'));
    
    return new JiraClient({
        protocol: 'https',
        host: config.jira.baseUrl,
        username: config.jira.email,
        password: config.jira.apiToken,
        apiVersion: '2',
        strictSSL: true,
        timeout: 10000
    });
}

module.exports = { initializeJiraClient }; 