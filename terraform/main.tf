# API token is picked up from the CLOUDFLARE_API_TOKEN env var.
# Set CLOUDFLARE_ACCOUNT_ID too; wrangler in the deploy step reads it.
provider "cloudflare" {}

resource "cloudflare_pages_project" "undef_logos" {
  account_id        = var.cloudflare_account_id
  name              = var.project_name
  production_branch = var.production_branch

  # Build config is managed locally via wrangler / Vite, not via the Pages
  # GitHub integration, so do not let Terraform fight dashboard-written values.
  lifecycle {
    ignore_changes = [build_config]
  }
}

resource "cloudflare_pages_domain" "prod" {
  account_id   = var.cloudflare_account_id
  project_name = cloudflare_pages_project.undef_logos.name
  name         = var.subdomain
}

data "cloudflare_zone" "root" {
  filter = { name = var.root_zone }
}

resource "cloudflare_dns_record" "prod_cname" {
  zone_id = data.cloudflare_zone.root.id
  name    = var.subdomain
  type    = "CNAME"
  content = cloudflare_pages_project.undef_logos.subdomain
  ttl     = 1
  proxied = true

  depends_on = [cloudflare_pages_domain.prod]
}

# Build the SPA and ship it to the Pages project after infra exists.
# Re-runs every apply because of the timestamp trigger; safe to disable via
# `terraform apply -var=auto_deploy=false`.
resource "null_resource" "deploy" {
  count = var.auto_deploy ? 1 : 0

  triggers = {
    project_id = cloudflare_pages_project.undef_logos.id
    domain     = cloudflare_pages_domain.prod.name
    cname      = cloudflare_dns_record.prod_cname.id
    always     = timestamp()
  }

  # Inherits the parent process env, so CLOUDFLARE_API_TOKEN /
  # CLOUDFLARE_ACCOUNT_ID flow straight through to wrangler.
  provisioner "local-exec" {
    working_dir = "${path.module}/.."
    interpreter = ["/bin/bash", "-c"]
    command     = "npm install && npm run build && npx wrangler pages deploy public --project-name=${cloudflare_pages_project.undef_logos.name} --branch=${var.production_branch} --commit-dirty=true"
  }

  depends_on = [
    cloudflare_pages_domain.prod,
    cloudflare_dns_record.prod_cname,
  ]
}
