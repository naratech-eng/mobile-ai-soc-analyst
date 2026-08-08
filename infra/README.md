# infra

Azure deployment config (Terraform, `azurerm` provider) for the
backend, per [docs/engineering/tech-stack.md](../docs/engineering/tech-stack.md)
and the deployment diagram in [docs/engineering/system-design.md](../docs/engineering/system-design.md).

Provisions: one Container Apps Environment shared by two Container Apps
(`ca-socanalyst-dev` tracking the `dev` branch, `ca-socanalyst-prod`
tracking `main`), a Key Vault holding the OpenAI API key, and a Log
Analytics workspace. Images are pulled from `ghcr.io`.

## Azure auth: User-Assigned Managed Identity + GitHub OIDC

This tenant restricts Azure AD app registration (`az ad sp create-for-rbac`
fails with `Insufficient privileges to complete the operation` — common on
school/restricted tenants). The workaround: a **User-Assigned Managed
Identity** is a plain ARM resource governed by Azure RBAC (`Contributor`),
not an Azure AD app registration, so creating one doesn't need the
restricted directory permission. Federate it with GitHub's OIDC issuer and
GitHub Actions authenticates with **no stored secret at all** — just a
client ID, tenant ID, and subscription ID.

### One-time bootstrap (already done for this project — kept here for
### reference / re-running on a new subscription)

**1. Remote state storage** (must exist before `terraform init` can use it
as a backend — Terraform can't create its own backend):
```bash
az login
az account set --subscription "<your-subscription-id>"

az group create --name rg-socanalyst-tfstate --location canadacentral
az storage account create \
  --name socanalysttfstate --resource-group rg-socanalyst-tfstate \
  --location canadacentral --sku Standard_LRS --allow-blob-public-access false
az storage container create --name tfstate --account-name socanalysttfstate --auth-mode login
```

**2. Managed identity for GitHub Actions:**
```bash
az identity create --name id-socanalyst-github --resource-group rg-socanalyst-tfstate --location canadacentral
```
Note the `clientId` and `principalId` from the output.

**3. Federate it with GitHub OIDC** — one credential per branch that
triggers a workflow (`dev` and `main`; add more if other branches ever
need to run `deploy.yml`/`infra-apply.yml`):
```bash
az identity federated-credential create --name github-dev \
  --identity-name id-socanalyst-github --resource-group rg-socanalyst-tfstate \
  --issuer https://token.actions.githubusercontent.com \
  --subject repo:naratech-eng/mobile-ai-soc-analyst:ref:refs/heads/dev \
  --audiences api://AzureADTokenExchange

az identity federated-credential create --name github-main \
  --identity-name id-socanalyst-github --resource-group rg-socanalyst-tfstate \
  --issuer https://token.actions.githubusercontent.com \
  --subject repo:naratech-eng/mobile-ai-soc-analyst:ref:refs/heads/main \
  --audiences api://AzureADTokenExchange
```

**4. Grant the identity access** (needs `Owner`/`User Access
Administrator` on the subscription — if this step is also blocked by
insufficient privileges, it needs to be run by the subscription owner):
```bash
az role assignment create --assignee "<principalId-from-step-2>" --role Contributor \
  --scope /subscriptions/<your-subscription-id>

az role assignment create --assignee "<principalId-from-step-2>" \
  --role "Storage Blob Data Contributor" \
  --scope /subscriptions/<your-subscription-id>/resourceGroups/rg-socanalyst-tfstate
```

**5. GitHub repository secrets** (Settings → Secrets and variables →
Actions → New repository secret) — only identifiers, no client secret:

| Secret | Value | This project's value |
|---|---|---|
| `AZURE_CLIENT_ID` | managed identity `clientId` from step 2 | `51c411b8-e395-4312-9a6d-210cca3a6ac5` |
| `AZURE_TENANT_ID` | your tenant ID | `eb34f74a-58e7-4a8b-9e59-433e4c412757` |
| `AZURE_SUBSCRIPTION_ID` | your subscription ID | `2a0d34d6-c961-4a14-abc4-78f5e031500e` |
| `GHCR_PAT` | GitHub PAT with `read:packages` — lets the Container App pull the image | — |
| `BACKEND_API_KEY_DEV` | any strong random string — bearer token the dev backend expects | — |
| `BACKEND_API_KEY_PROD` | same, different value, for prod | — |
| `OPENAI_API_KEY` | already added ✓ | — |

`.github/workflows/deploy.yml` and `infra-apply.yml` both use
`azure/login@v2` with `client-id`/`tenant-id`/`subscription-id` (OIDC —
`permissions: id-token: write` is set in each workflow) instead of a
`creds` JSON blob with a secret.

## Provisioning the actual infra

`terraform apply` is **not** run automatically on every push — infra
changes (new resources, resized apps) are a deliberate, occasional action,
run locally or via the manual-dispatch `infra-apply.yml` workflow. Only
the **app image** redeploys automatically on push — see
[`.github/workflows/deploy.yml`](../.github/workflows/deploy.yml).

```bash
cd infra
cp terraform.tfvars.example terraform.tfvars   # fill in real values, never commit
terraform init
terraform plan
terraform apply
```

Or via GitHub: Actions tab → "Terraform apply (manual)" → run with
`action: plan` first, review, then re-run with `action: apply`.

## Remote state

State lives in the `tfstate` blob container on `socanalysttfstate`
(bootstrapped above), authenticated via Azure AD (`use_azuread_auth`) —
no storage account key involved. Both local runs (`az login`) and CI runs
(OIDC via `ARM_USE_OIDC=true`) authenticate to it the same way.

Not needed for local development — see `backend/` for the local
`docker-compose` setup.
