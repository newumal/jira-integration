const readline = require('readline');
const path = require('path');
const fs = require('fs');

async function prompt(question) {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    return new Promise(resolve => rl.question(question, ans => { rl.close(); resolve(ans); }));
}

async function triggerCursorAgent() {
    const fileInput = await prompt('Paste the JIRA key and file path (e.g., WAR-8674 /path/to/repo): ');
    const [issueKey, ...repoParts] = fileInput.trim().split(' ');
    const repoPath = repoParts.join(' ');
    const triggerFile = path.join(repoPath, '.cursor-ai-fix-request.json');
    if (!fs.existsSync(triggerFile)) {
        console.error(`File not found: ${triggerFile}`);
        return;
    }
    const systemPrompt = `A .cursor-ai-fix-request.json file has been created in this repository.\nPlease open a new chat, read the JIRA issue details from the file, and start the code fix process for the specified ticket in this repo.\n\n- File path: .cursor-ai-fix-request.json\n- Action:\n  1. Parse the JIRA key, summary, and description from the file.\n  2. Analyze the codebase in the current directory.\n  3. Propose and/or apply the necessary code changes to address the JIRA issue as described.\n  4. Show the changes and reasoning in the new chat.`;
    console.log('\n--- System Prompt for Cursor Agent ---\n');
    console.log(systemPrompt);
    console.log('\n-------------------------------------\n');
}

module.exports = { triggerCursorAgent }; 