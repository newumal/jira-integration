const { execSync } = require('child_process');
const readline = require('readline');
const path = require('path');
const { identifyRepo } = require('./identifyRepo');
const { getIssue } = require('./getIssue');

async function prompt(question) {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    return new Promise(resolve => rl.question(question, ans => { rl.close(); resolve(ans); }));
}

async function createFeatureBranch(issueKey) {
    // Get issue details for summary
    const issue = await getIssue(issueKey, true);
    if (!issue) {
        console.error('Could not fetch JIRA issue.');
        return;
    }
    const summary = issue.fields.summary || issueKey;

    // Identify repo(s)
    const repos = await identifyRepo(issueKey);
    let repo;
    if (repos.length === 0) {
        repo = await prompt('No repo identified. Enter repository name: ');
    } else if (repos.length === 1) {
        const confirm = (await prompt(`Create feature branch in ${repos[0]}? (Y/n): `)).trim().toLowerCase();
        if (confirm === '' || confirm === 'y' || confirm === 'yes') {
            repo = repos[0];
        } else {
            repo = await prompt('Enter repository name: ');
        }
    } else {
        console.log('Multiple possible repositories:');
        repos.forEach((r, i) => console.log(`${i + 1}. ${r}`));
        const idx = parseInt(await prompt('Select repository number: '), 10);
        if (idx > 0 && idx <= repos.length) {
            repo = repos[idx - 1];
        } else {
            repo = await prompt('Enter repository name: ');
        }
    }
    if (!repo) {
        console.error('No repository selected. Aborting.');
        return;
    }
    const repoPath = path.resolve(__dirname, '../../../', repo);
    const baseBranch = await prompt('Enter the base branch to create the feature branch from: ');
    const fiscalYear = await prompt('Enter the fiscal year (e.g., fy25): ');
    const sprint = await prompt('Enter the sprint (e.g., sprint12): ');
    try {
        process.chdir(repoPath);
        execSync(`git fetch origin ${baseBranch}`);
        execSync(`git checkout ${baseBranch}`);
        execSync('git pull');
        const summarySlug = summary.replace(/\s+/g, '-').toLowerCase().replace(/[^a-z0-9\-]/g, '');
        const branchName = `${fiscalYear}/${sprint}/${issueKey.toLowerCase()}/${summarySlug}`;
        execSync(`git checkout -b ${branchName}`);
        console.log(`Feature branch created: ${branchName} in ${repo}`);
    } catch (err) {
        console.error('Error creating feature branch:', err.message);
    }
}

module.exports = { createFeatureBranch }; 