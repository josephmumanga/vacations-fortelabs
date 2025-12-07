# Terraform Deployment for Azure Static Web App

This Terraform configuration deploys the vacations application to Azure Static Web Apps.

## Prerequisites

1. Azure CLI installed and logged in
2. Terraform installed (>= 1.0)
3. Node.js and npm installed
4. Application built (`npm run build`)

## Setup

1. **Install Terraform** (if not already installed):
   ```bash
   # Windows (using Chocolatey)
   choco install terraform
   
   # Or download from https://www.terraform.io/downloads
   ```

2. **Login to Azure**:
   ```bash
   az login
   az account set --subscription <your-subscription-id>
   ```

3. **Navigate to terraform directory**:
   ```bash
   cd terraform
   ```

## Deployment

1. **Initialize Terraform**:
   ```bash
   terraform init
   ```

2. **Review the deployment plan**:
   ```bash
   terraform plan
   ```

3. **Deploy the application**:
   ```bash
   terraform apply
   ```

   Type `yes` when prompted to confirm.

## What This Does

- **Builds the application**: Runs `npm run build` to create the production build
- **Deploys to Azure**: Uses Azure Static Web Apps CLI to deploy the built application
- **Triggers on changes**: Automatically rebuilds and redeploys when source files change

## Variables

Edit `terraform.tfvars` to customize:
- `resource_group_name`: Azure Resource Group name
- `static_web_app_name`: Static Web App name
- `deployment_token`: Azure Static Web Apps deployment token
- `location`: Azure region

## Outputs

After deployment, Terraform will output:
- Static Web App URL (default hostname)
- Custom domain URL
- Static Web App ID

## Troubleshooting

### If deployment fails:
1. Ensure you're logged into Azure: `az account show`
2. Verify the resource group and Static Web App exist
3. Check that the deployment token is valid
4. Ensure Node.js dependencies are installed: `npm install`

### To force a rebuild:
```bash
terraform apply -replace=null_resource.build_app
```

### To destroy and redeploy:
```bash
terraform destroy
terraform apply
```

