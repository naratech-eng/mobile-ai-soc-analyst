output "dev_url" {
  value = "https://${azurerm_container_app.dev.latest_revision_fqdn}"
}

output "prod_url" {
  value = "https://${azurerm_container_app.prod.latest_revision_fqdn}"
}

output "resource_group" {
  value = azurerm_resource_group.main.name
}
