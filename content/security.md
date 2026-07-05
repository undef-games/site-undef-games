---
title: "Security & Vulnerability Disclosure"
kicker: "Legal"
description: "How to report a security vulnerability to undef games, and our safe-harbor commitment."
---

**Effective date:** June 28, 2026

We take the security of undef games (operated by **MindTenet&trade; LLC**)
seriously. If you've found a vulnerability, we want to hear from you.

## Reporting

Email **[security@undef.games](mailto:security@undef.games)** with:

- a description of the issue and where you found it,
- steps to reproduce (proof-of-concept if you have one),
- the impact you believe it has, and
- how we can contact you.

We aim to acknowledge reports promptly and keep you updated as we investigate.
<!-- TODO: confirm the security@undef.games mailbox is monitored; optionally
     publish a PGP key and a response-time SLA. -->

## Safe harbor

If you make a good-faith effort to follow this policy, we will not pursue or
support legal action against you for your research, and we'll treat your report as
authorized. This safe harbor does not apply if you break the law or the rules
below.

## Rules of engagement

Please **do**: test only against your own account or accounts you're authorized to
use; stop as soon as you find an issue and report it; and give us reasonable time
to fix it before disclosing publicly.

Please **don't**: access, modify, or delete other people's data; run
denial-of-service, spam, or social-engineering attacks; degrade the Services for
others; or exfiltrate more data than needed to demonstrate the issue.

## Scope

Our production Services and websites are in scope. Third-party services we use
(such as Stripe or Cloudflare) have their own disclosure programs — please report
issues in their systems to them.

A machine-readable version of this contact is published at
[/.well-known/security.txt](/.well-known/security.txt).
