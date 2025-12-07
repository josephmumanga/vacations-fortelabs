variable "resource_group_name" {
  description = "Name of the existing Azure Resource Group"
  type        = string
  default     = "vacations-rg"
}

variable "static_web_app_name" {
  description = "Name of the existing Azure Static Web App"
  type        = string
  default     = "vacations-app"
}

variable "deployment_token" {
  description = "Azure Static Web Apps deployment token"
  type        = string
  sensitive   = true
}

variable "location" {
  description = "Azure region"
  type        = string
  default     = "East US 2"
}

