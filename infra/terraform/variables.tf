variable "location" {
  default = "East US"
}

variable "resource_group_name" {
  default = "finai-rg"
}

variable "container_app_name" {
  default = "finai-app"
}

variable "github_image" {
  description = "Docker image stored in GHCR"
  default     = "ghcr.io/ronak-cn-98/fin.ai-3tier:latest"
}

variable "database_url" {
  sensitive = true
}

variable "resend_api_key" {
  sensitive = true
}

variable "google_client_id" {
  sensitive = true
}

variable "google_client_secret" {
  sensitive = true
}