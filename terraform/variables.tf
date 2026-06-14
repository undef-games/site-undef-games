variable "cloudflare_account_id" {
  description = "Cloudflare account ID that owns the Pages project and undef.games zone."
  type        = string
  default     = "0cd7f4f58f13e02c5bf57aa9dc347d1d" # pragma: allowlist secret
}

variable "project_name" {
  description = "Cloudflare Pages project name (also wrangler --project-name)."
  type        = string
  default     = "undef-logos"
}

variable "root_zone" {
  description = "The DNS zone that hosts the subdomain."
  type        = string
  default     = "undef.games"
}

variable "subdomain" {
  description = "Fully-qualified subdomain to attach to the Pages project."
  type        = string
  default     = "logos.undef.games"
}

variable "production_branch" {
  description = "Git branch that maps to production deployments in Cloudflare Pages."
  type        = string
  default     = "main"
}

variable "auto_deploy" {
  description = "If true, run `npm run build` and `wrangler pages deploy` after infra is created/updated."
  type        = bool
  default     = true
}
