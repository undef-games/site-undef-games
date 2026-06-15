# API token is picked up from the CLOUDFLARE_API_TOKEN env var.
provider "cloudflare" {}

resource "cloudflare_pages_project" "undef_logos" {
  account_id        = var.cloudflare_account_id
  name              = var.project_name
  production_branch = var.production_branch

  build_config = {
    build_caching   = true
    build_command   = var.site_build_command
    destination_dir = var.site_destination_dir
    root_dir        = var.site_root_dir
  }
}

resource "cloudflare_pages_domain" "hostnames" {
  for_each = local.hosted_domains

  account_id   = var.cloudflare_account_id
  project_name = cloudflare_pages_project.undef_logos.name
  name         = each.value
}

data "cloudflare_zone" "root" {
  filter = { name = var.root_zone }
}

resource "cloudflare_dns_record" "pages_hostnames" {
  for_each = local.hosted_domains

  zone_id = data.cloudflare_zone.root.id
  name    = each.value
  type    = "CNAME"
  content = cloudflare_pages_project.undef_logos.subdomain
  proxied = true
  ttl     = local.proxied_auto_ttl
  comment = "Route ${each.value} to the ${cloudflare_pages_project.undef_logos.name} Pages project."

  depends_on = [cloudflare_pages_domain.hostnames]
}
