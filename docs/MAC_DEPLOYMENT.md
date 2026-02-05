# Deploying STUHackathon from Mac/Linux

This guide is for deploying from macOS or Linux systems.

## Prerequisites

1. **Azure CLI** installed
   ```bash
   # macOS (using Homebrew)
   brew install azure-cli
   
   # Linux (Ubuntu/Debian)
   curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash
   ```

2. **jq** for JSON parsing (optional but recommended)
   ```bash
   # macOS
   brew install jq
   
   # Linux
   sudo apt-get install jq
   ```

## Deployment Steps

1. **Clone the repository** (if you haven't already)
   ```bash
   git clone https://github.com/comeredon/STUHackathon.git
   cd STUHackathon
   ```

2. **Make the deploy script executable**
   ```bash
   chmod +x deploy.sh
   ```

3. **Run the deployment script**
   ```bash
   ./deploy.sh
   ```

4. **Follow the prompts** to enter:
   - Resource Group name
   - Azure AD Client ID
   - Foundry Project ID and Agent ID (if prompted)

## Troubleshooting

### Line Ending Issues
If you see errors like `bad interpreter: No such file or directory`, it's a line ending issue:

```bash
# Fix line endings
dos2unix deploy.sh frontend/docker-entrypoint.sh

# Or if dos2unix isn't installed:
sed -i 's/\r$//' deploy.sh frontend/docker-entrypoint.sh
```

### Package-lock.json Missing
If the build fails with a package-lock.json error:

```bash
# Verify the file exists
ls -la frontend/package-lock.json

# If missing, regenerate it
cd frontend
npm install
git add package-lock.json
git commit -m "Add package-lock.json"
git push
cd ..
```

### Permission Denied
If you get permission errors:

```bash
# Ensure the script is executable
chmod +x deploy.sh

# Check file permissions
ls -la deploy.sh
```

## Configuration Persistence

Unlike the PowerShell version, the bash script doesn't currently save configuration between runs. You'll need to enter values each time or modify the script to add persistence if needed.

## What Gets Deployed

The script deploys:
- **Backend API**: Node.js/Express API at `app-stuhackathon-api`
- **Frontend**: React SPA at `app-stuhackathon-frontend`
- **Container Registry**: ACR with images
- **Container Apps Environment**: Shared environment for both apps
- **Managed Identity**: For secure Foundry access

## Post-Deployment

After deployment completes:

1. **Update Azure AD app registration** redirect URIs (shown in script output)
2. **Verify Foundry Managed Identity** has Fabric workspace access
3. **Test the frontend** at the provided URL

## Support

For issues specific to Mac/Linux deployment, check:
- Azure CLI is up to date: `az version`
- Shell script has correct line endings: `file deploy.sh` should show "ASCII text"
- Docker build context includes all files: `ls -la frontend/package-lock.json`
