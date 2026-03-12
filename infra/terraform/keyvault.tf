resource "azurerm_key_vault" "kv" {
  name                = "finaikeyvault123"
  location            = azurerm_resource_group.rg.location
  resource_group_name = azurerm_resource_group.rg.name
  tenant_id           = data.azurerm_client_config.current.tenant_id
  sku_name            = "standard"

  purge_protection_enabled = false

  access_policy {
    tenant_id = data.azurerm_client_config.current.tenant_id
    object_id = data.azurerm_client_config.current.object_id

    secret_permissions = [
      "Get",
      "List",
      "Set",
      "Delete"
    ]
  }
}

resource "azurerm_key_vault_secret" "database_url" {
  name         = "DATABASE-URL"
  value        = var.database_url
  key_vault_id = azurerm_key_vault.kv.id
}

resource "azurerm_key_vault_secret" "google_client_id" {
  name         = "GOOGLE-CLIENT-ID"
  value        = var.google_client_id
  key_vault_id = azurerm_key_vault.kv.id
}

resource "azurerm_key_vault_secret" "google_client_secret" {
  name         = "GOOGLE-CLIENT-SECRET"
  value        = var.google_client_secret
  key_vault_id = azurerm_key_vault.kv.id
}

resource "azurerm_key_vault_secret" "resend_api_key" {
  name         = "RESEND-API-KEY"
  value        = var.resend_api_key
  key_vault_id = azurerm_key_vault.kv.id
}