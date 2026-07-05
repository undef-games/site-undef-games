# Cloudflare Email Routing for the legal/contact addresses referenced on the site
# (support@, copyright@, security@). Email routing is already live on this zone
# (MX = route*.mx.cloudflare.net); these resources bring it under Terraform.
# IMPORTANT: import the existing settings, destination, and rules before applying —
# see terraform/README.md ("Email routing — import before apply").

# Ensure Email Routing is enabled for the zone.
resource "cloudflare_email_routing_settings" "undef" {
  zone_id = data.cloudflare_zone.root.id
}

# The verified destination address that mail is forwarded to (account-level).
# Creating this fresh triggers a Cloudflare verification email; when importing an
# already-verified destination, no verification is needed.
resource "cloudflare_email_routing_address" "forward_to" {
  account_id = var.cloudflare_account_id
  email      = var.email_forward_to
}

# One forwarding rule per legal/contact local-part -> the destination above.
resource "cloudflare_email_routing_rule" "legal" {
  for_each = toset(var.routed_local_parts)

  zone_id = data.cloudflare_zone.root.id
  name    = "${each.key}@${var.apex_domain} -> ${var.email_forward_to}"
  enabled = true

  matchers = [{
    type  = "literal"
    field = "to"
    value = "${each.key}@${var.apex_domain}"
  }]

  actions = [{
    type  = "forward"
    value = [var.email_forward_to]
  }]

  depends_on = [
    cloudflare_email_routing_settings.undef,
    cloudflare_email_routing_address.forward_to,
  ]
}
