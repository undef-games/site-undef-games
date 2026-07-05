# undef.games — Terraform

Manages the Cloudflare Pages project (`undef-logos`), its custom domains + DNS,
and **Email Routing** for the legal/contact addresses. Cloudflare provider v5.

Provider auth: `export CLOUDFLARE_API_TOKEN=...` (token from the env).

## Variables you must set

`email_forward_to` — the **already-verified** Cloudflare Email Routing destination
inbox that `support@`, `copyright@`, and `security@undef.games` forward to. Set it
in `terraform.tfvars` (gitignored) or `TF_VAR_email_forward_to`. Plus the existing
account/zone/domain vars.

## Email routing — import before apply

Email Routing is already live on undef.games (its MX records are
`route*.mx.cloudflare.net`). `email.tf` describes that same state; **import the
existing objects before `apply`**, or Terraform may try to recreate live rules.

The API token must be scoped for **Email Routing: Read** and **Email Routing:
Edit** on the undef.games zone, and **Email Routing Addresses** on the account.

1. Discover the existing IDs (zone `Z`, account `A`):

   ```sh
   Z=<undef.games zone id>; A=<account id>
   # rule ids + their matchers/actions:
   curl -s -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
     "https://api.cloudflare.com/client/v4/zones/$Z/email/routing/rules" \
     | jq '.result[] | {id, name, matchers, actions}'
   # destination address id:
   curl -s -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
     "https://api.cloudflare.com/client/v4/accounts/$A/email/routing/addresses" \
     | jq '.result[] | {id, email, verified}'
   ```

2. Import (rule keys must match `routed_local_parts`: support, copyright, security):

   ```sh
   terraform import cloudflare_email_routing_settings.undef "$Z"
   terraform import cloudflare_email_routing_address.forward_to "$A/<address_id>"
   terraform import 'cloudflare_email_routing_rule.legal["support"]'   "$Z/<support_rule_id>"
   terraform import 'cloudflare_email_routing_rule.legal["copyright"]' "$Z/<copyright_rule_id>"
   terraform import 'cloudflare_email_routing_rule.legal["security"]'  "$Z/<security_rule_id>"
   ```

3. `terraform plan` — set `email_forward_to` to match the imported destination so
   the plan shows **no changes**. If a legal address doesn't have a rule yet,
   `apply` creates it (a new destination triggers a Cloudflare verification email).

## Usage

```sh
terraform init
terraform plan
terraform apply
```
