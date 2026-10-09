# portfolio-terraform: assumed by a human, from the Identity Center AdminAccess
# session behind AWS_PROFILE=portfolio, to plan and apply the site stack (#12).
#
# It is broad on the services the site stack uses, and narrow everywhere else:
# - IAM writes reach only roles and policies named portfolio-site-*. It cannot
#   edit itself, portfolio-deploy, or the GitHub OIDC provider.
# - It cannot delete or weaken the state bucket that this stack owns.
#
# Assuming a role from an SSO session is role chaining, which AWS caps at one
# hour whatever max_session_duration says. So the default of one hour stays.

locals {
  # Identity Center creates the role behind a permission set at this path,
  # with a random suffix after the permission set name.
  admin_sso_role_pattern = "arn:aws:iam::${var.account_id}:role/aws-reserved/sso.amazonaws.com/*AWSReservedSSO_AdminAccess_*"

  terraform_trust_policy = {
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { AWS = "arn:aws:iam::${var.account_id}:root" }
      Action    = "sts:AssumeRole"
      Condition = {
        ArnLike = { "aws:PrincipalArn" = local.admin_sso_role_pattern }
      }
    }]
  }

  terraform_permissions = {
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "SiteStackServices"
        Effect = "Allow"
        Action = [
          "s3:*",
          "cloudfront:*",
          "acm:*",
          "route53:*",
          "route53domains:Get*",
          "route53domains:List*",
          "budgets:*",
          # CloudFront standard logging (v2) delivers through CloudWatch Logs
          # delivery sources and destinations.
          "logs:*",
        ]
        Resource = "*"
      },
      {
        Sid      = "ReadIam"
        Effect   = "Allow"
        Action   = ["iam:Get*", "iam:List*"]
        Resource = "*"
      },
      {
        Sid    = "WriteSiteStackIam"
        Effect = "Allow"
        Action = "iam:*"
        Resource = [
          "arn:aws:iam::${var.account_id}:role/portfolio-site-*",
          "arn:aws:iam::${var.account_id}:policy/portfolio-site-*",
        ]
      },
      {
        Sid    = "ProtectStateBucket"
        Effect = "Deny"
        Action = [
          "s3:DeleteBucket",
          "s3:DeleteBucketPolicy",
          "s3:PutBucketPolicy",
          "s3:PutBucketVersioning",
          "s3:PutBucketPublicAccessBlock",
          "s3:PutBucketOwnershipControls",
          "s3:PutEncryptionConfiguration",
        ]
        Resource = local.state_bucket_arn
      },
    ]
  }
}

resource "aws_iam_role" "terraform" {
  name               = "portfolio-terraform"
  description        = "Plans and applies the portfolio site stack. Assumed from the Identity Center AdminAccess session."
  assume_role_policy = jsonencode(local.terraform_trust_policy)
}

resource "aws_iam_role_policy" "terraform" {
  name   = "portfolio-terraform-site-stack"
  role   = aws_iam_role.terraform.name
  policy = jsonencode(local.terraform_permissions)
}
