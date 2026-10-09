# portfolio-deploy: assumed by the deploy workflow on every push to main.
#
# The trust policy pins one repository and one branch with StringEquals. A
# wildcard in `sub` lets any GitHub repository assume the role, which is the
# most common way a personal AWS account is drained through Actions.

locals {
  github_oidc_host = "token.actions.githubusercontent.com"

  deploy_trust_policy = {
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Federated = aws_iam_openid_connect_provider.github.arn }
      Action    = "sts:AssumeRoleWithWebIdentity"
      Condition = {
        StringEquals = {
          "${local.github_oidc_host}:sub" = "repo:${var.github_repository}:ref:refs/heads/${var.github_branch}"
          "${local.github_oidc_host}:aud" = "sts.amazonaws.com"
        }
      }
    }]
  }
}

locals {
  site_bucket_arn = "arn:aws:s3:::${var.site_bucket_name}"

  # `aws s3 sync --delete` needs to list, put and delete. The invalidation
  # statement appears only once the distribution exists.
  deploy_permissions = {
    Version = "2012-10-17"
    Statement = concat(
      [
        {
          Sid      = "ListSiteBucket"
          Effect   = "Allow"
          Action   = "s3:ListBucket"
          Resource = local.site_bucket_arn
        },
        {
          Sid      = "WriteSiteObjects"
          Effect   = "Allow"
          Action   = ["s3:PutObject", "s3:DeleteObject"]
          Resource = "${local.site_bucket_arn}/*"
        },
      ],
      var.distribution_arn == null ? [] : [
        {
          Sid      = "InvalidateSiteDistribution"
          Effect   = "Allow"
          Action   = "cloudfront:CreateInvalidation"
          Resource = var.distribution_arn
        },
      ],
    )
  }
}

resource "aws_iam_role" "deploy" {
  name               = "portfolio-deploy"
  description        = "GitHub Actions deploy for ${var.github_repository}@${var.github_branch}. Site bucket and one distribution only."
  assume_role_policy = jsonencode(local.deploy_trust_policy)
}

resource "aws_iam_role_policy" "deploy" {
  name   = "portfolio-deploy-site"
  role   = aws_iam_role.deploy.name
  policy = jsonencode(local.deploy_permissions)
}
