terraform {
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~>3.117"
    }
  }
  required_version = ">=1.5"
}

provider "azurerm" {
  features {}
}

data "azurerm_client_config" "current" {}