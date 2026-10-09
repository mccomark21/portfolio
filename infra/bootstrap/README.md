# infra/bootstrap

This stack creates the AWS resources that every other stack in `infra/` needs:

| Resource | Purpose |
| --- | --- |
| `portfolio-tfstate-692112934115` | S3 bucket for remote state. Versioned, private, encrypted, TLS only. |
| GitHub OIDC provider | Lets GitHub Actions assume a role with no stored AWS key. |
| `portfolio-terraform` | Role for a human to plan and apply the site stack (#12). |
| `portfolio-deploy` | Role for `deploy.yml` (#13). It can sync the site bucket and invalidate one distribution. |

**A human applies this stack once, under `AWS_PROFILE=portfolio`.** No workflow runs it. Every later stack runs as `portfolio-terraform`.

## The two roles

| Role | Assumed by | Can do |
| --- | --- | --- |
| `portfolio-terraform` | The Identity Center `AdminAccess` role | S3, CloudFront, ACM, Route 53, Budgets and CloudWatch Logs. IAM writes only on `portfolio-site-*` roles and policies. It cannot weaken or delete the state bucket, or delete old state versions. |
| `portfolio-deploy` | GitHub Actions on `mccomark21/portfolio`, branch `main` only | `s3:ListBucket`, `s3:PutObject` and `s3:DeleteObject` on the site bucket. `cloudfront:CreateInvalidation` on one distribution. |

The `portfolio-deploy` trust policy pins `sub` to `repo:mccomark21/portfolio:ref:refs/heads/main` and `aud` to `sts.amazonaws.com`. It has no wildcard. A wildcard in `sub` lets any GitHub repository assume the role.

## First apply

Run these steps one time, from a clean checkout.

1. Sign in: `aws sso login --profile portfolio`
2. Go to this folder: `cd infra/bootstrap`
3. Set the profile: `export AWS_PROFILE=portfolio`
4. Initialise: `terraform init`
5. Review the plan: `terraform plan`. Expect 11 resources to add and nothing to change or destroy.
6. Apply: `terraform apply`
7. Plan again: `terraform plan`. Expect "No changes."

The first apply keeps state in a local `terraform.tfstate` file, because the state bucket does not exist before the apply. Git ignores that file.

## Move the bootstrap state into the bucket

Do this immediately after the first apply. Until you do it, the only copy of this stack's state is on your machine.

1. Create `backend.tf` in this folder:

   ```hcl
   terraform {
     backend "s3" {
       bucket       = "portfolio-tfstate-692112934115"
       key          = "bootstrap/terraform.tfstate"
       region       = "us-east-1"
       use_lockfile = true
       encrypt      = true
     }
   }
   ```

2. Run `terraform init -migrate-state`. Answer `yes` when Terraform asks to copy the state.
3. Run `terraform plan`. Expect "No changes."
4. Delete the local `terraform.tfstate` and `terraform.tfstate.backup` files.
5. Commit `backend.tf`.

`use_lockfile = true` enables S3 native state locking. It needs Terraform 1.10 or later. No DynamoDB table is needed.

## After the site stack exists

`portfolio-deploy` cannot invalidate a CloudFront distribution until you give this stack the distribution ARN. The site stack (#12) creates the distribution.

1. Create `terraform.tfvars` in this folder:

   ```hcl
   distribution_arn = "arn:aws:cloudfront::692112934115:distribution/<ID>"
   ```

2. Run `terraform apply`. Expect one change, to `aws_iam_role_policy.deploy`.
3. Commit `terraform.tfvars`. The ARN is not a secret.

## Rules for later stacks

These roles work only if the later stacks follow these rules.

| Rule | Stack | Reason |
| --- | --- | --- |
| Name the site bucket `portfolio-site-692112934115`, the `site_bucket_name` output. | #12 | The deploy role can write to that bucket name only. |
| Encrypt the site bucket with SSE-S3, not KMS. | #12 | The deploy role has no KMS permission. |
| Name every IAM role and policy `portfolio-site-*`. | #12 | `portfolio-terraform` can write IAM resources with that prefix only. |
| Do not give the deploy job a GitHub `environment:`. | #13 | An environment changes the token `sub` to `repo:...:environment:<name>`, and the trust policy then rejects it. |
| Keep the Identity Center permission set named exactly `AdminAccess`. | all | The `portfolio-terraform` trust policy matches the role name `AWSReservedSSO_AdminAccess_*`. |

## Use portfolio-terraform

Add this profile to `~/.aws/config`:

```ini
[profile portfolio-terraform]
source_profile = portfolio
role_arn       = arn:aws:iam::692112934115:role/portfolio-terraform
region         = us-east-1
```

Then run the site stack with `AWS_PROFILE=portfolio-terraform`. AWS limits a role assumed from an SSO session to a one-hour session. When it expires, run the command again.

## Tests

`terraform test` checks the deploy trust policy, the deploy permissions and the state bucket settings. The tests use a mock AWS provider, so they make no AWS call and need no credentials.

```sh
terraform init -backend=false
terraform test
```
