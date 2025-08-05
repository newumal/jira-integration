const { addComment } = require('./addComment');
const fs = require('fs');

async function autoComment(issueKey, summary, impactedAreas, testingScope) {
    const comment = `
{panel:title=📝 Change Summary & Impacted Areas|borderStyle=solid|borderColor=#ccc|bgColor=#F4F5F7}

✅ *Testing Scope*
${testingScope.map(line => `- ${line}`).join('\n')}

🚩 *Impacted Areas*
${impactedAreas.map(line => `- ${line}`).join('\n')}

🛠️ **Summary of the Fix**\n${summary}

{panel}
`;
    // Write to a temp file
    const filePath = './auto_comment.txt';
    fs.writeFileSync(filePath, comment, 'utf8');
    await addComment(issueKey, filePath);
    fs.unlinkSync(filePath);
}

module.exports = { autoComment }; 