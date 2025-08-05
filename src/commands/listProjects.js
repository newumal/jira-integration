const { initializeJiraClient } = require('../utils/jiraClient');

async function listProjects() {
    const jira = initializeJiraClient();
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

module.exports = { listProjects }; 