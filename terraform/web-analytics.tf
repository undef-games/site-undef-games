# Cloudflare Web Analytics (privacy-friendly RUM) for undef.games.
# auto_install injects the beacon on the proxied zone — no code change needed.
# Already live (site_tag 5cd193f42fa14dedbd147192fa1b934a); import before apply:
#   terraform import cloudflare_web_analytics_site.undef <account_id>/5cd193f42fa14dedbd147192fa1b934a
resource "cloudflare_web_analytics_site" "undef" {
  account_id   = var.cloudflare_account_id
  zone_tag     = data.cloudflare_zone.root.id
  auto_install = true
}

output "web_analytics_site_tag" {
  description = "Cloudflare Web Analytics site tag for undef.games."
  value       = cloudflare_web_analytics_site.undef.site_tag
}
