locals {
  hosted_domains = {
    logos = var.logos_domain
    apex  = var.apex_domain
  }

  site_urls = {
    for key, hostname in local.hosted_domains :
    key => "https://${hostname}"
  }

  proxied_auto_ttl = 1
}
