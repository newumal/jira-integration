# Jira Integration

A Node.js CLI tool for integrating with Jira API to manage issues, comments, and project workflows.

## Features

- Create and manage Jira issues
- Add comments to issues
- List projects and issues
- AI-powered fix suggestions
- Automated commenting
- Feature branch creation
- Commit and push automation

## Installation

```bash
npm install
```

## Configuration

1. Copy `config.json.example` to `config.json`
2. Update the configuration with your Jira credentials and settings

## Usage

```bash
node index.js [command] [options]
```

### Available Commands

- `help` - Show available commands
- `list-projects` - List all Jira projects
- `list-issues` - List issues for a project
- `get-issue` - Get details of a specific issue
- `add-comment` - Add a comment to an issue
- `create-feature-branch` - Create a feature branch for an issue
- `commit-and-push` - Commit changes and push to remote
- `auto-comment` - Automatically add comments based on changes
- `ai-fix` - Get AI-powered fix suggestions

## License

MIT 