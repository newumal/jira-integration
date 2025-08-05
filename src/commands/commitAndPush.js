const readline = require('readline');
const { execSync } = require('child_process');

async function commitAndPush(repoPath, branchName) {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question('Enter your commit message: ', (commitMsg) => {
        try {
            process.chdir(repoPath);
            execSync('git add .');
            execSync(`git commit -m "${commitMsg}"`);
            execSync(`git push origin ${branchName}`);
            console.log('Changes committed and pushed.');
        } catch (err) {
            console.error('Error during commit/push:', err.message);
        }
        rl.close();
    });
}

module.exports = { commitAndPush }; 