# Cloudflare Email Routing for the legal/contact addresses on undef.games.
# Routing is already enabled on the zone (MX = route*.mx.cloudflare.net); we manage
# only these three rules and leave the rest (no-reply, personal, catch-all) alone.
#
#   support@   -> already exists, routed to the `undef-support` Worker: IMPORT it.
#   copyright@ -> had NO rule (would bounce): created as a forward.
#   security@  -> had NO rule (would bounce): created as a forward.
#
# See terraform/README.md for the import command + token scopes.

locals {
  email_rules = {
    support = {
      to     = "support@${var.apex_domain}"
      type   = "worker"
      target = "undef-support"
    }
    copyright = {
      to     = "copyright@${var.apex_domain}"
      type   = "forward"
      target = var.email_forward_to
    }
    security = {
      to     = "security@${var.apex_domain}"
      type   = "forward"
      target = var.email_forward_to
    }
  }
}

resource "cloudflare_email_routing_rule" "legal" {
  for_each = local.email_rules

  zone_id = data.cloudflare_zone.root.id
  name    = "${each.value.to} (${each.value.type})"
  enabled = true

  matchers = [{
    type  = "literal"
    field = "to"
    value = each.value.to
  }]

  actions = [{
    type  = each.value.type
    value = [each.value.target]
  }]
}
