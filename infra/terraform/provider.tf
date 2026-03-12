terraform {
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~>3.0"
      
    }
    
  }

  required_version = ">=1.5"
}

provider "azurerm" {
  features {
    key_vault {
      purge_soft_delete_on_destroy = false
      recover_soft_deleted_key_vaults = false
    }
  }
  }

data "azurerm_client_config" "current" {}
