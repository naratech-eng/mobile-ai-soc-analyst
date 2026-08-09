# Persistent storage for the SQLite event/alert store and the ChromaDB
# RAG index — Container Apps are stateless (min_replicas = 0, revisions
# get replaced), so anything written to local disk is lost on scale-to-zero
# or redeploy without this. Two separate Azure Files shares — one per
# environment — mounted at /mnt/data; DATABASE_URL and CHROMA_PERSIST_DIR
# point at subpaths of that mount. Separate shares are deliberate: dev and
# prod must never read/write the same underlying data.

resource "azurerm_storage_account" "data" {
  name                     = "st${var.project_name}data"
  resource_group_name      = azurerm_resource_group.main.name
  location                 = azurerm_resource_group.main.location
  account_tier             = "Standard"
  account_replication_type = "LRS"
  min_tls_version           = "TLS1_2"
}

resource "azurerm_storage_share" "app_data_dev" {
  name                = "app-data-dev"
  storage_account_id = azurerm_storage_account.data.id
  quota               = 5 # GB — plenty for a SQLite file + a small ChromaDB index
}

resource "azurerm_storage_share" "app_data_prod" {
  name                = "app-data-prod"
  storage_account_id = azurerm_storage_account.data.id
  quota               = 5
}

resource "azurerm_container_app_environment_storage" "app_data_dev" {
  name                         = "app-data-dev"
  container_app_environment_id = azurerm_container_app_environment.main.id
  account_name                  = azurerm_storage_account.data.name
  access_key                    = azurerm_storage_account.data.primary_access_key
  share_name                    = azurerm_storage_share.app_data_dev.name
  access_mode                   = "ReadWrite"
}

resource "azurerm_container_app_environment_storage" "app_data_prod" {
  name                         = "app-data-prod"
  container_app_environment_id = azurerm_container_app_environment.main.id
  account_name                  = azurerm_storage_account.data.name
  access_key                    = azurerm_storage_account.data.primary_access_key
  share_name                    = azurerm_storage_share.app_data_prod.name
  access_mode                   = "ReadWrite"
}
