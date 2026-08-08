terraform {
  required_version = ">= 1.7"

  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 4.0"
    }
  }

  # Remote state is required here, not optional: infra-apply.yml runs on a
  # fresh GitHub Actions runner every time, so local state would be blank
  # on every CI run. Bootstrap the storage account once (README.md), then
  # `terraform init` picks this up automatically. Values below are not
  # secret (storage account/container names) — auth is via ARM_* env vars
  # (Azure AD, no access key needed).
  backend "azurerm" {
    resource_group_name  = "rg-socanalyst-tfstate"
    storage_account_name = "socanalysttfstate"
    container_name        = "tfstate"
    key                    = "socanalyst.tfstate"
    use_azuread_auth       = true
  }
}

provider "azurerm" {
  features {
    key_vault {
      purge_soft_delete_on_destroy = true
    }
  }
}
