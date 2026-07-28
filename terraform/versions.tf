terraform {
  # State lives in HCP Terraform (org neurotic-org, project undef-games) rather
  # than on one laptop. Workspace names are unique per ORGANISATION, hence the
  # repo-qualified name. `hostname` is explicit because OpenTofu, unlike
  # Terraform, provides no default for it.
  cloud {
    hostname     = "app.terraform.io"
    organization = "neurotic-org"
    workspaces {
      tags = ["site-undef-games"]
    }
  }

  required_version = ">= 1.6.0"

  required_providers {
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 5.0"
    }
  }
}
