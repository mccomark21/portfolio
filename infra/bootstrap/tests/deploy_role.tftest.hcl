# The deploy role runs on every push to main. These tests hold its trust and
# its permissions to the exact values in issue #4. A mock provider stands in for
# AWS, so even `command = apply` makes no AWS call.

mock_provider "aws" {
  mock_resource "aws_iam_openid_connect_provider" {
    defaults = {
      arn = "arn:aws:iam::692112934115:oidc-provider/token.actions.githubusercontent.com"
    }
  }
}

run "deploy_trust_pins_repository_and_branch" {
  command = apply

  assert {
    condition     = aws_iam_role.deploy.name == "portfolio-deploy"
    error_message = "The deploy role must be named portfolio-deploy."
  }

  assert {
    condition     = length(jsondecode(aws_iam_role.deploy.assume_role_policy).Statement) == 1
    error_message = "The deploy trust policy must hold exactly one statement."
  }

  assert {
    condition     = jsondecode(aws_iam_role.deploy.assume_role_policy).Statement[0].Action == "sts:AssumeRoleWithWebIdentity"
    error_message = "The deploy role must be assumable only through web identity (OIDC)."
  }

  assert {
    condition = jsondecode(aws_iam_role.deploy.assume_role_policy).Statement[0].Condition == {
      StringEquals = {
        "token.actions.githubusercontent.com:sub" = "repo:mccomark21/portfolio:ref:refs/heads/main"
        "token.actions.githubusercontent.com:aud" = "sts.amazonaws.com"
      }
    }
    error_message = "The deploy trust policy must pin sub and aud with StringEquals and no other condition."
  }

  assert {
    condition     = !strcontains(aws_iam_role.deploy.assume_role_policy, "*")
    error_message = "The deploy trust policy must contain no wildcard."
  }
}

run "deploy_permissions_before_the_distribution_exists" {
  command = apply

  # Until #12 creates the distribution, the role can sync the site bucket and
  # nothing else.
  assert {
    condition = jsondecode(aws_iam_role_policy.deploy.policy) == {
      Version = "2012-10-17"
      Statement = [
        {
          Sid      = "ListSiteBucket"
          Effect   = "Allow"
          Action   = "s3:ListBucket"
          Resource = "arn:aws:s3:::portfolio-site-692112934115"
        },
        {
          Sid      = "WriteSiteObjects"
          Effect   = "Allow"
          Action   = ["s3:PutObject", "s3:DeleteObject"]
          Resource = "arn:aws:s3:::portfolio-site-692112934115/*"
        },
      ]
    }
    error_message = "Without a distribution, the deploy policy must allow only ListBucket, PutObject and DeleteObject on the site bucket."
  }

  assert {
    condition     = aws_iam_role_policy.deploy.role == "portfolio-deploy"
    error_message = "The deploy policy must attach to portfolio-deploy."
  }
}

run "deploy_permissions_after_the_distribution_exists" {
  command = apply

  variables {
    distribution_arn = "arn:aws:cloudfront::692112934115:distribution/E2EXAMPLE12345"
  }

  assert {
    condition = jsondecode(aws_iam_role_policy.deploy.policy) == {
      Version = "2012-10-17"
      Statement = [
        {
          Sid      = "ListSiteBucket"
          Effect   = "Allow"
          Action   = "s3:ListBucket"
          Resource = "arn:aws:s3:::portfolio-site-692112934115"
        },
        {
          Sid      = "WriteSiteObjects"
          Effect   = "Allow"
          Action   = ["s3:PutObject", "s3:DeleteObject"]
          Resource = "arn:aws:s3:::portfolio-site-692112934115/*"
        },
        {
          Sid      = "InvalidateSiteDistribution"
          Effect   = "Allow"
          Action   = "cloudfront:CreateInvalidation"
          Resource = "arn:aws:cloudfront::692112934115:distribution/E2EXAMPLE12345"
        },
      ]
    }
    error_message = "With a distribution, the deploy policy must add CreateInvalidation on that one distribution and nothing else."
  }
}

run "deploy_rejects_a_wildcard_distribution" {
  command = plan

  variables {
    distribution_arn = "arn:aws:cloudfront::692112934115:distribution/*"
  }

  expect_failures = [var.distribution_arn]
}

run "deploy_trust_names_the_github_oidc_provider" {
  command = apply

  assert {
    condition     = aws_iam_openid_connect_provider.github.url == "https://token.actions.githubusercontent.com"
    error_message = "The OIDC provider must be GitHub Actions."
  }

  assert {
    condition     = aws_iam_openid_connect_provider.github.client_id_list == toset(["sts.amazonaws.com"])
    error_message = "The OIDC provider audience must be sts.amazonaws.com only."
  }
}
