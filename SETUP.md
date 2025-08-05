# JIRA Integration Setup Guide

## 🔑 Authentication Issue

The current API token in `config.json` is expired. Here's how to fix it:

### 1. Generate New API Token

1. Go to [Atlassian API Tokens](https://id.atlassian.com/manage-profile/security/api-tokens)
2. Click "Create API token"
3. Give it a name like "JIRA CLI Tool"
4. Copy the generated token

### 2. Update Configuration

Replace the `apiToken` in `config.json`:

```json
{
    "jira": {
        "baseUrl": "velaris.atlassian.net",
        "email": "newumal.weerasinghe@velaris.io",
        "apiToken": "YOUR_NEW_API_TOKEN_HERE",
        "projectKey": "WAR"
    },
    "cursor": {
        "workspacePath": "/Users/user/IdeaProjects",
        "autoSync": true,
        "syncInterval": 300
    }
}
```

### 3. Test Connection

After updating the token, run:

```bash
node test-connection.js
```

### 4. Verify Commands Work

```bash
jira projects
jira issue WAR-123
```

## Alternative: Use Personal Access Token (PAT)

If API tokens don't work, you can use a Personal Access Token:

1. Go to [Atlassian Personal Access Tokens](https://id.atlassian.com/manage-profile/security/api-tokens)
2. Create a new PAT
3. Update `config.json` to use the PAT instead

## Troubleshooting

- **401 Unauthorized**: Token is expired or invalid
- **403 Forbidden**: Token doesn't have required permissions
- **404 Not Found**: Issue doesn't exist or you don't have access

## Required Permissions

Your JIRA account needs:
- Read access to projects
- Read access to issues
- Write access to comments (for commenting features) 