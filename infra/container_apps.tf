# Two Container Apps sharing one environment: dev tracks the `dev` branch,
# prod tracks `main`. CI updates only the image tag on push (see
# .github/workflows/deploy.yml); Terraform owns everything else.

locals {
  ghcr_image_ref = "ghcr.io/${var.ghcr_owner}/${var.ghcr_image}"
}

resource "azurerm_container_app" "dev" {
  name                         = "ca-${var.project_name}-dev"
  container_app_environment_id = azurerm_container_app_environment.main.id
  resource_group_name          = azurerm_resource_group.main.name
  revision_mode                = "Single"

  registry {
    server               = "ghcr.io"
    username             = var.ghcr_owner
    password_secret_name = "ghcr-pat"
  }

  secret {
    name  = "ghcr-pat"
    value = var.ghcr_pat
  }

  secret {
    name  = "openai-api-key"
    value = var.openai_api_key
  }

  secret {
    name  = "backend-api-key"
    value = var.backend_api_key_dev
  }

  template {
    min_replicas = 0
    max_replicas = 1

    container {
      name   = "backend"
      image  = "${local.ghcr_image_ref}:dev-latest"
      cpu    = 0.5
      memory = "1Gi"

      env {
        name        = "OPENAI_API_KEY"
        secret_name = "openai-api-key"
      }
      env {
        name        = "BACKEND_API_KEY"
        secret_name = "backend-api-key"
      }
      env {
        name  = "DATABASE_URL"
        value = "sqlite:////mnt/data/soc_analyst.db"
      }
      env {
        name  = "CHROMA_PERSIST_DIR"
        value = "/app/chroma_data"
      }

      volume_mounts {
        name = "app-data"
        path = "/mnt/data"
      }
    }

    volume {
      name         = "app-data"
      storage_type = "AzureFile"
      storage_name = azurerm_container_app_environment_storage.app_data_dev.name
    }
  }

  ingress {
    external_enabled = true
    target_port       = 8000
    traffic_weight {
      percentage      = 100
      latest_revision = true
    }
  }
}

resource "azurerm_container_app" "prod" {
  name                         = "ca-${var.project_name}-prod"
  container_app_environment_id = azurerm_container_app_environment.main.id
  resource_group_name          = azurerm_resource_group.main.name
  revision_mode                = "Single"

  registry {
    server               = "ghcr.io"
    username             = var.ghcr_owner
    password_secret_name = "ghcr-pat"
  }

  secret {
    name  = "ghcr-pat"
    value = var.ghcr_pat
  }

  secret {
    name  = "openai-api-key"
    value = var.openai_api_key
  }

  secret {
    name  = "backend-api-key"
    value = var.backend_api_key_prod
  }

  template {
    min_replicas = 0
    # Capped at 1: SQLite over a shared Azure Files mount doesn't handle
    # concurrent writers from separate replicas safely. Raise this once
    # the store is swapped to Postgres.
    max_replicas = 1

    container {
      name   = "backend"
      image  = "${local.ghcr_image_ref}:prod-latest"
      cpu    = 0.5
      memory = "1Gi"

      env {
        name        = "OPENAI_API_KEY"
        secret_name = "openai-api-key"
      }
      env {
        name        = "BACKEND_API_KEY"
        secret_name = "backend-api-key"
      }
      env {
        name  = "DATABASE_URL"
        value = "sqlite:////mnt/data/soc_analyst.db"
      }
      env {
        name  = "CHROMA_PERSIST_DIR"
        value = "/app/chroma_data"
      }

      volume_mounts {
        name = "app-data"
        path = "/mnt/data"
      }
    }

    volume {
      name         = "app-data"
      storage_type = "AzureFile"
      storage_name = azurerm_container_app_environment_storage.app_data_prod.name
    }
  }

  ingress {
    external_enabled = true
    target_port       = 8000
    traffic_weight {
      percentage      = 100
      latest_revision = true
    }
  }
}
