variable "location" {
  default = "centralindia"
}

variable "resource_group_name" {
  default = "finai-rg"
}

variable "aks_cluster_name" {
  default = "finai-aks"
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