output "container_app_url" {
  value = azurerm_container_app.app.latest_revision_fqdn
}
output "aks_cluster_name" {
  value = azurerm_kubernetes_cluster.aks.name
}