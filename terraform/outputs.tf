output "pages_subdomain" {
  description = "Default *.pages.dev hostname for the project."
  value       = cloudflare_pages_project.undef_logos.subdomain
}

output "custom_domain" {
  description = "Public custom domain attached to the Pages project."
  value       = cloudflare_pages_domain.prod.name
}

output "site_url" {
  description = "User-facing URL once DNS propagates."
  value       = "https://${var.subdomain}"
}
