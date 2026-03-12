variable "location" {
  description = "Azure region for all resources"
  type        = string
  default     = "centralindia"
}

variable "resource_group_name" {
  description = "Azure Resource Group Name"
  type        = string
  default     = "finai-rg"
}

variable "aks_cluster_name" {
  description = "AKS Cluster Name"
  type        = string
  default     = "finai-aks"
}

variable "github_image" {
  description = "Docker image stored in GitHub Container Registry"
  type        = string
  default     = "ghcr.io/ronak-cn-98/fin.ai-3tier:latest"
}

variable "database_url" {
  description = "Database connection string"
  type        = string
  sensitive   = true
}

variable "resend_api_key" {
  description = "Resend email API key"
  type        = string
  sensitive   = true
}

variable "google_client_id" {
  description = "Google OAuth client id"
  type        = string
  sensitive   = true
}

variable "google_client_secret" {
  description = "Google OAuth client secret"
  type        = string
  sensitive   = true
}