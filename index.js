const JiraClient = require('jira-client');
const cron = require('node-cron');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Load configuration
const config = JSON.parse(fs.readFileSync(path.join(__dirname, 'config.json'), 'utf8'));

// Initialize JIRA client
const jira = new JiraClient({
    protocol: 'https',
    host: config.jira.baseUrl,
    username: config.jira.email,
    password: config.jira.apiToken,
    apiVersion: '2',
    strictSSL: true
});

// Create readline interface for user interaction
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// Function to list all available projects
async function listProjects() {
    try {
        const projects = await jira.listProjects();
        console.log('\n=== Available JIRA Projects ===');
        projects.forEach(project => {
            console.log(`\nProject Name: ${project.name}`);
            console.log(`Project Key: ${project.key}`);
            console.log(`Project ID: ${project.id}`);
            console.log('----------------------------------------');
        });
        return projects;
    } catch (error) {
        console.error('Error fetching projects:', error);
        return [];
    }
}

// Function to display issues in a formatted way
function displayIssues(issues) {
    console.log('\n=== JIRA Issues ===');
    issues.forEach((issue, index) => {
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
}

// Function to fetch issues for a project
async function fetchProjectIssues(projectKey) {
    try {
        // JQL to fetch recent issues
        const jql = `project = ${projectKey} ORDER BY created DESC`;
        const issues = await jira.searchJira(jql, {
            maxResults: 50,
            fields: ['summary', 'status', 'priority', 'assignee', 'created', 'description']
        });
        
        if (issues.issues.length === 0) {
            console.log(`No issues found in project ${projectKey}`);
            return;
        }

        console.log(`\nFound ${issues.issues.length} issues in project ${projectKey}`);
        displayIssues(issues.issues);
        
        return issues.issues;
    } catch (error) {
        console.error('Error fetching issues:', error);
        return [];
    }
}

// Function to handle user selection
async function handleIssueSelection(issues) {
    return new Promise((resolve) => {
        rl.question('\nEnter the number of the issue you want to work on (or "q" to quit): ', (answer) => {
            if (answer.toLowerCase() === 'q') {
                resolve(null);
                return;
            }

            const index = parseInt(answer) - 1;
            if (index >= 0 && index < issues.length) {
                resolve(issues[index]);
            } else {
                console.log('Invalid selection. Please try again.');
                resolve(handleIssueSelection(issues));
            }
        });
    });
}

// Function to update issue status
async function updateIssueStatus(issue) {
    const transitions = await jira.listTransitions(issue.key);
    console.log('\nAvailable status transitions:');
    transitions.transitions.forEach((transition, index) => {
        console.log(`${index + 1}. ${transition.name}`);
    });

    return new Promise((resolve) => {
        rl.question('Select new status (number) or press Enter to cancel: ', async (answer) => {
            if (!answer) {
                resolve(null);
                return;
            }

            const index = parseInt(answer) - 1;
            if (index >= 0 && index < transitions.transitions.length) {
                try {
                    await jira.transitionIssue(issue.key, {
                        transition: {
                            id: transitions.transitions[index].id
                        }
                    });
                    resolve(transitions.transitions[index].name);
                } catch (error) {
                    console.error('Error updating status:', error);
                    resolve(null);
                }
            } else {
                console.log('Invalid selection');
                resolve(null);
            }
        });
    });
}

// Function to fetch and display a specific issue
async function fetchSpecificIssue(issueKey) {
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

// Start the application
console.log('Welcome to JIRA-Cursor Integration!');
console.log('Fetching issue WAR-8187...\n');

// Fetch the specific issue
fetchSpecificIssue('WAR-8187').then(issue => {
    if (issue) {
        console.log('\nWould you like to:');
        console.log('1. View more details');
        console.log('2. Start working on this issue');
        console.log('3. Update issue status');
        
        rl.question('Enter your choice (1-3): ', async (choice) => {
            switch (choice) {
                case '1':
                    console.log('\nFull Issue Details:');
                    console.log(JSON.stringify(issue, null, 2));
                    break;
                case '2':
                    console.log('\nStarting work on issue...');
                    console.log('Ready to work on:', issue.key);
                    break;
                case '3':
                    const transitions = await jira.listTransitions(issue.key);
                    console.log('\nAvailable status transitions:');
                    transitions.transitions.forEach((transition, index) => {
                        console.log(`${index + 1}. ${transition.name}`);
                    });
                    break;
                default:
                    console.log('Invalid choice');
            }
            rl.close();
        });
    }
}); 