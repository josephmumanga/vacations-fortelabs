terraform {
  required_version = ">= 1.0"
  
  required_providers {
    null = {
      source  = "hashicorp/null"
      version = "~> 3.0"
    }
  }
}

# Note: We're using the deployment token directly, so we don't need Azure provider authentication
# The SWA CLI handles authentication via the deployment token

# Build the application
resource "null_resource" "build_app" {
  triggers = {
    package_json = filemd5("../package.json")
    src_files    = sha256(join("", [for f in fileset("../src", "**") : filesha256("../src/${f}")]))
  }

  provisioner "local-exec" {
    command     = "npm run build"
    working_dir = ".."
  }
}

# Deploy the application using SWA CLI
resource "null_resource" "deploy_app" {
  depends_on = [null_resource.build_app]

  triggers = {
    build_id = null_resource.build_app.id
    api_hash = sha256(join("", [for f in fileset("../api", "**") : filesha256("../api/${f}")]))
  }

  provisioner "local-exec" {
    command = <<-EOT
      npx @azure/static-web-apps-cli deploy \
        "../dist" \
        --api-location "../api" \
        --deployment-token "${var.deployment_token}" \
        --app-name "${var.static_web_app_name}" \
        --env production \
        --no-use-keychain
    EOT
    working_dir = ".."
  }
}

