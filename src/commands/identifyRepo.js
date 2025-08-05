const { getIssue } = require('./getIssue');
const fs = require('fs');
const path = require('path');

async function getAllRepositories(baseDir) {
    try {
        const items = fs.readdirSync(baseDir);
        return items.filter(item => {
            const fullPath = path.join(baseDir, item);
            return fs.statSync(fullPath).isDirectory() && 
                   !item.startsWith('.') && 
                   fs.existsSync(path.join(fullPath, '.git'));
        });
    } catch (error) {
        console.error('Error scanning repositories:', error);
        return [];
    }
}

function analyzeRelevance(text, repoName, repoPath) {
    let score = 0;
    const keywords = text.toLowerCase().split(/\W+/);
    
    // Check repo name relevance
    const repoKeywords = repoName.toLowerCase().split('-');
    score += keywords.filter(k => repoKeywords.includes(k)).length * 2;
    
    try {
        // Check package.json for dependencies and project info
        const pkgPath = path.join(repoPath, 'package.json');
        if (fs.existsSync(pkgPath)) {
            const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
            const pkgText = JSON.stringify(pkg).toLowerCase();
            score += keywords.filter(k => pkgText.includes(k)).length;
        }
        
        // Check README for project description
        const readmePath = path.join(repoPath, 'README.md');
        if (fs.existsSync(readmePath)) {
            const readme = fs.readFileSync(readmePath, 'utf8').toLowerCase();
            score += keywords.filter(k => readme.includes(k)).length;
        }
    } catch (error) {
        // Silently continue if files can't be read
    }
    
    return score;
}

async function identifyRepo(issueKey) {
    // Fetch the issue details
    const issue = await getIssue(issueKey, true);
    if (!issue) {
        console.error('Could not fetch JIRA issue.');
        return [];
    }

    const desc = issue.fields.description || '';
    const summary = issue.fields.summary || '';
    const components = (issue.fields.components || []).map(c => c.name).join(' ');
    const labels = (issue.fields.labels || []).join(' ');
    
    // Combine all relevant text for analysis
    const analysisText = `${summary} ${desc} ${components} ${labels}`;
    
    // Get all repositories from IdeaProjects
    const baseDir = path.resolve(__dirname, '../../../');
    const repos = await getAllRepositories(baseDir);
    
    // Analyze each repository for relevance
    const repoScores = repos.map(repo => ({
        name: repo,
        score: analyzeRelevance(analysisText, repo, path.join(baseDir, repo))
    })).filter(r => r.score > 0)
      .sort((a, b) => b.score - a.score);
    
    if (repoScores.length > 0) {
        const suggestedRepos = repoScores.map(r => r.name);
        console.log('Repository analysis results:');
        repoScores.forEach(r => {
            console.log(`- ${r.name} (relevance score: ${r.score})`);
        });
        console.log(`\nSuggested repositories to review: ${suggestedRepos.join(', ')}`);

        // Final result summary
        const topScore = repoScores[0].score;
        const topRepos = repoScores.filter(r => r.score === topScore).map(r => r.name);
        if (topRepos.length === 1) {
            console.log(`\nFinal result: The required change is in ${topRepos[0]}.`);
        } else {
            console.log(`\nFinal result: The required changes are likely in: ${topRepos.join(', ')}.`);
        }
        return suggestedRepos;
    } else {
        console.log('No relevant repositories found. Please review the ticket manually.');
        return [];
    }
}

module.exports = { identifyRepo }; 