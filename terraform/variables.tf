variable "cloudflare_account_id" {
  description = "Cloudflare account ID that owns the Pages project and undef.games zone."
  type        = string
  default     = "0cd7f4f58f13e02c5bf57aa9dc347d1d" # pragma: allowlist secret
}

variable "project_name" {
  description = "Cloudflare Pages project name, also used by wrangler --project-name."
  type        = string
  default     = "undef-logos"
}

variable "root_zone" {
  description = "Cloudflare DNS zone that hosts the production Pages custom domains."
  type        = string
  default     = "undef.games"
}

variable "logos_domain" {
  description = "Primary logos hostname to attach to the Pages project."
  type        = string
  default     = "logos.undef.games"
}

variable "apex_domain" {
  description = "Apex hostname to attach to the same Pages project."
  type        = string
  default     = "undef.games"
}

variable "production_branch" {
  description = "Git branch that maps to production deployments in Cloudflare Pages."
  type        = string
  default     = "main"
}

variable "site_build_command" {
  description = "Cloudflare Pages build command for the Hugo and lab artifact."
  type        = string
  default     = "make build"
}

variable "site_destination_dir" {
  description = "Cloudflare Pages output directory produced by the build command."
  type        = string
  default     = "public"
}

variable "site_root_dir" {
  description = "Cloudflare Pages root directory for builds."
  type        = string
  default     = "/"
}

variable "email_forward_to" {
  description = "Verified destination inbox that support@/copyright@/security@ forward to. Must already be a verified Cloudflare Email Routing destination for a clean import."
  type        = string
}

variable "routed_local_parts" {
  description = "Local-parts (before @apex_domain) to route to the destination inbox."
  type        = list(string)
  default     = ["support", "copyright", "security"]
}
