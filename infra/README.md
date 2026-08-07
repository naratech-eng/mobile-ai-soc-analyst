# infra

Azure deployment config (Terraform, `azurerm` provider) for the
backend, per [docs/engineering/tech-stack.md](../docs/engineering/tech-stack.md)
and the deployment diagram in [docs/engineering/system-design.md](../docs/engineering/system-design.md):
Azure Container Apps (or AKS) hosting the FastAPI+agent container, Azure Key
Vault for secrets (OpenAI API key), ChromaDB volume, event/alert store.

Not needed for local development — see `backend/` for local
`docker-compose` setup. Deferred until the detection pipeline (Phase 2/3) is
functionally complete.
