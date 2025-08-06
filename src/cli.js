#!/usr/bin/env node

const { listProjects } = require('./commands/listProjects');
const { getIssue } = require('./commands/getIssue');
const { listIssues } = require('./commands/listIssues');
const { addComment } = require('./commands/addComment');
const { identifyRepo } = require('./commands/identifyRepo');
const { createFeatureBranch } = require('./commands/createFeatureBranch');
const { aiFix } = require('./commands/aiFix');
const { autoComment } = require('./commands/autoComment');
const { commitAndPush } = require('./commands/commitAndPush');
const { showHelp } = require('./commands/help');
const { triggerCursorAgent } = require('./commands/triggerCursorAgent');
const { generateCursorPrompt } = require('./commands/generateCursorPrompt');

// Get command line arguments
const args = process.argv.slice(2);
const command = args[0];

async function main() {
    try {
        switch (command) {
            case 'projects':
                await listProjects();
                break;
                
            case 'issue':
                if (!args[1]) {
                    console.error('Please provide an issue key. Example: jira issue WAR-123');
                    process.exit(1);
                }
                await getIssue(args[1]);
                break;
                
            case 'list':
                if (!args[1]) {
                    console.error('Please provide a project key. Example: jira list WAR');
                    process.exit(1);
                }
                const options = {
                    assignee: args[2] === '--assignee' ? args[3] : undefined,
                    status: args[2] === '--status' ? args[3] : undefined,
                    priority: args[2] === '--priority' ? args[3] : undefined,
                    maxResults: args[2] === '--limit' ? parseInt(args[3]) : 50
                };
                await listIssues(args[1], options);
                break;

            case 'comment':
                if (!args[1] || !args[2]) {
                    console.error('Usage: jira comment <issue-key> <file-path>');
                    process.exit(1);
                }
                await addComment(args[1], args[2]);
                break;

            case 'identify':
                if (!args[1]) {
                    console.error('Please provide an issue key. Example: jira identify WAR-123');
                    process.exit(1);
                }
                await identifyRepo(args[1]);
                break;

            case 'branch':
                if (!args[1]) {
                    console.error('Please provide an issue key. Example: jira branch WAR-123');
                    process.exit(1);
                }
                await createFeatureBranch(args[1]);
                break;

            case 'ai-fix':
                if (!args[1]) {
                    console.error('Please provide an issue key. Example: jira ai-fix WAR-123');
                    process.exit(1);
                }
                await aiFix(args[1]);
                break;

            case 'auto-comment':
                if (!args[1]) {
                    console.error('Please provide an issue key. Example: jira auto-comment WAR-123');
                    process.exit(1);
                }
                await autoComment(args[1]);
                break;

            case 'commit':
                if (!args[1]) {
                    console.error('Usage: jira commit <issue-key> [message]');
                    process.exit(1);
                }
                const message = args.slice(2).join(' ');
                await commitAndPush(args[1], message);
                break;

            case 'help':
                showHelp();
                break;

            case 'trigger-cursor-agent':
                await triggerCursorAgent();
                break;

            case 'cursor-prompt':
                const cursorOptions = {
                    save: args.includes('--save'),
                    copy: args.includes('--copy')
                };
                await generateCursorPrompt(cursorOptions);
                break;

            default:
                showHelp();
                process.exit(1);
        }
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}

main(); 