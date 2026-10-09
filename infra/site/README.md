# infra/site

This stack serves the static export at `https://markmccomiskey.com`.

| Resource | Purpose |
| --- | --- |
| `portfolio-site-692112934115` | Private S3 bucket that holds `out/`. Website hosting is off. |
| CloudFront distribution | Serves the bucket through Origin Access Control, over HTTPS, at the apex and `www`. `PriceClass_100`. |
| `portfolio-site-viewer-request` | CloudFront Function. See [The viewer request function](#the-viewer-request-function). |
| ACM certificate | Covers the apex and `www`. It lives in `us-east-1`, because CloudFront reads certificates only from that region. DNS validates it. |
| Route 53 records | A and AAAA aliases for the apex and `www`, plus the certificate validation records, in zone `Z10409132A5F5TMYYU7NL`. |
| `portfolio-logs-692112934115` | Private bucket for CloudFront standard logging (v2). Objects expire after 90 days. |
| `monthly-cost-10usd` | The existing account budget. An `import` block adopts it. |

The provider and the backend both assume `portfolio-terraform`, which `infra/bootstrap` creates. Run every command with `AWS_PROFILE=portfolio`. No other AWS CLI profile is needed.

## The viewer request function

The site is a Next.js static export with `trailingSlash: true`. S3 behind Origin Access Control does not resolve folder indexes. The function in `functions/viewer-request.js` does three things:

| Request | Result |
| --- | --- |
| `/projects/` | Serves `/projects/index.html`. |
| `/projects` | 301 to `/projects/`, with the same query string. |
| `www.markmccomiskey.com/...` | 301 to `https://markmccomiskey.com/...` in one hop, with the slash fix applied. |

A path whose last segment has a dot, such as `/favicon.ico`, is a file. The function passes it through unchanged.

## The budget alert address

The three budget alerts send email to one address. This repository is public, so the address is never committed. Set it in one of two ways:

- Create `terraform.tfvars` in this folder with `budget_alert_email = "<address>"`. Git ignores that file.
- Or set `TF_VAR_budget_alert_email` in your shell.

## Apply

1. Sign in: `aws sso login --profile portfolio`
2. Go to this folder: `cd infra/site`
3. Set the profile: `export AWS_PROFILE=portfolio`
4. Initialise: `terraform init`
5. Review the plan: `terraform plan`. Expect 1 to import, 25 to add, 1 to change, and 0 to destroy. The change adds tags to the budget.
6. Apply: `terraform apply`. The certificate validation can take several minutes.
7. Plan again: `terraform plan`. Expect "No changes."

## After the apply

The deploy role cannot invalidate the distribution until the bootstrap stack knows its ARN.

1. Read the ARN: `terraform output -raw distribution_arn`
2. Create `infra/bootstrap/terraform.tfvars` with `distribution_arn = "<ARN>"`.
3. In `infra/bootstrap`, run `terraform apply`. Expect one change, to `aws_iam_role_policy.deploy`.
4. Commit `infra/bootstrap/terraform.tfvars`. The ARN is not a secret.

## Tests

```sh
terraform init -backend=false
terraform test
```

The Terraform tests check the site bucket access and the distribution settings against a mock AWS provider. They make no AWS call. The budget import cannot run against a mock, so the tests override that resource. The live plan checks the budget instead.

`npm test` at the repository root runs `functions/viewer-request.test.mjs`. That file runs the function in a Node VM, in the same form CloudFront loads it.
