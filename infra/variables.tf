variable "location" {
  description = "Azure region"
  type        = string
  default     = "canadacentral"
}

variable "project_name" {
  description = "Short name used to prefix all resources"
  type        = string
  default     = "socanalyst"
}

variable "ghcr_owner" {
  description = "GitHub org/user that owns the ghcr.io image (e.g. naratech-eng)"
  type        = string
}

variable "ghcr_image" {
  description = "Image name, e.g. mobile-ai-soc-analyst-backend"
  type        = string
  default     = "mobile-ai-soc-analyst-backend"
}

variable "ghcr_pat" {
  description = "GitHub PAT with read:packages, used by Container Apps to pull from ghcr.io if the package is private"
  type        = string
  sensitive   = true
}

variable "openai_api_key" {
  description = "OpenAI API key for the Pydantic AI agent (NFR-003: never hard-coded)"
  type        = string
  sensitive   = true
}

variable "backend_api_key_dev" {
  description = "Bearer token the dev Container App expects from clients"
  type        = string
  sensitive   = true
}

variable "backend_api_key_prod" {
  description = "Bearer token the prod Container App expects from clients"
  type        = string
  sensitive   = true
}
