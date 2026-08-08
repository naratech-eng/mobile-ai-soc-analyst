# infra

Azure deployment config (Terraform, `azurerm` provider) for the
backend, per [docs/engineering/tech-stack.md](../docs/engineering/tech-stack.md)
and the deployment diagram in [docs/engineering/system-design.md](../docs/engineering/system-design.md).

Provisions: one Container Apps Environment shared by two Container Apps
(`ca-socanalyst-dev` tracking the `dev` branch, `ca-socanalyst-prod`
tracking `main`), a Key Vault holding the OpenAI API key, and a Log
Analytics workspace. Images are pulled from `ghcr.io`.

## One-time setup (you run this locally, not CI)

**Bootstrap remote state first** — `infra-apply.yml` runs on a fresh GitHub
Actions runner every time, so Terraform state can't live on disk; it has to
live in Azure. This storage account has to exist *before* `terraform init`
can use it as a backend, so create it directly via `az`, not Terraform:

```bash
az login
az account set --subscription "<your-subscription-id>"

az group create --name rg-socanalyst-tfstate --location canadacentral
az storage account create \
  --name socanalysttfstate --resource-group rg-socanalyst-tfstate \
  --location canadacentral --sku Standard_LRS --allow-blob-public-access false
az storage container create \
  --name tfstate --account-name socanalysttfstate --auth-mode login

# The service principal used by GitHub Actions (see below) also needs
# access to this storage account for state read/write:
az role assignment create \
  --assignee "<service-principal-client-id>" \
  --role "Storage Blob Data Contributor" \
  --scope "/subscriptions/<your-subscription-id>/resourceGroups/rg-socanalyst-tfstate"
```

Then provision the real infra:

```bash
cd infra
cp terraform.tfvars.example terraform.tfvars   # fill in real values, never commit
terraform init
terraform plan
terraform apply
```

`terraform apply` is **not** run automatically on every push — infra changes
(new resources, resized apps) are deliberate, occasional actions, run
locally or via the manual-dispatch `infra-apply.yml` workflow. Only the
**app image** redeploys automatically on push — see
[`.github/workflows/deploy.yml`](../.github/workflows/deploy.yml).

## Remote state

Currently uses local Terraform state (`.gitignored`), fine for a solo
project. If more than one person ever runs `apply`, migrate to an
`azurerm` remote backend (Storage Account + blob container) first, or
state will conflict.

## GitHub Actions auth

`deploy.yml` and `infra-apply.yml` authenticate to Azure via a service
principal. One-time setup:

```bash
az ad sp create-for-rbac \
  --name "sp-socanalyst-github" \
  --role Contributor \
  --scopes /subscriptions/<your-subscription-id> \
  --sdk-auth
```

Take the four values from the JSON output and add them as GitHub
repository secrets (Settings → Secrets and variables → Actions):
- `AZURE_CLIENT_ID`
- `AZURE_CLIENT_SECRET`
- `AZURE_TENANT_ID`
- `AZURE_SUBSCRIPTION_ID`

Also add:
- `GHCR_PAT` — a GitHub PAT with `read:packages` (used by Container Apps to pull the image; can reuse `GITHUB_TOKEN`-scoped automation if you make the package public and skip this)
- `BACKEND_API_KEY_DEV`, `BACKEND_API_KEY_PROD` — bearer tokens each environment expects from clients
- `OPENAI_API_KEY` — already added, per your setup

Not needed for local development — see `backend/` for the local
`docker-compose` setup.
