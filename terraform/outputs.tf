output "pages_subdomain" {
  description = "Default *.pages.dev hostname for the project."
  value       = cloudflare_pages_project.undef_logos.subdomain
}

output "hosted_domains" {
  description = "Custom hostnames attached to the Pages project."
  value = {
    for key, domain in cloudflare_pages_domain.hostnames :
    key => domain.name
  }
}

output "site_urls" {
  description = "User-facing URLs for the Pages project."
  value       = local.site_urls
}

output "logos_site_url" {
  description = "Primary logos site URL."
  value       = local.site_urls.logos
}

output "apex_site_url" {
  description = "Apex site URL."
  value       = local.site_urls.apex
}
