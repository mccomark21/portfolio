# The site bucket holds the static export. These tests hold it to issue #12: it
# is private, and only this stack's distribution can read it. A mock provider
# stands in for AWS, so even `command = apply` makes no AWS call.

mock_provider "aws" {
  source = "./tests/mocks"
}

# The budget import block cannot run against a mock provider. The live plan
# checks the budget instead.
override_resource {
  target = aws_budgets_budget.monthly
}

variables {
  budget_alert_email = "alerts@example.com"
}

run "site_bucket_has_the_name_the_deploy_role_expects" {
  command = apply

  assert {
    condition     = aws_s3_bucket.site.bucket == "portfolio-site-692112934115"
    error_message = "The site bucket must be portfolio-site-692112934115, the name in the deploy role policy."
  }
}

run "site_bucket_blocks_all_public_access" {
  command = apply

  assert {
    condition     = aws_s3_bucket_public_access_block.site.bucket == "portfolio-site-692112934115"
    error_message = "The public access block must apply to the site bucket."
  }

  assert {
    condition = alltrue([
      aws_s3_bucket_public_access_block.site.block_public_acls,
      aws_s3_bucket_public_access_block.site.block_public_policy,
      aws_s3_bucket_public_access_block.site.ignore_public_acls,
      aws_s3_bucket_public_access_block.site.restrict_public_buckets,
    ])
    error_message = "All four public access blocks must be on for the site bucket."
  }

  assert {
    condition     = aws_s3_bucket_ownership_controls.site.rule[0].object_ownership == "BucketOwnerEnforced"
    error_message = "The site bucket must disable ACLs (BucketOwnerEnforced)."
  }
}

run "site_bucket_uses_sse_s3" {
  command = apply

  # The deploy role has no KMS permission, so KMS encryption would stop deploys.
  assert {
    condition     = one(one(aws_s3_bucket_server_side_encryption_configuration.site.rule).apply_server_side_encryption_by_default).sse_algorithm == "AES256"
    error_message = "The site bucket must use SSE-S3 (AES256), not KMS."
  }
}

run "only_this_distribution_can_read_the_site_bucket" {
  command = apply

  assert {
    condition = jsondecode(aws_s3_bucket_policy.site.policy) == {
      Version = "2012-10-17"
      Statement = [
        {
          Sid       = "CloudFrontReadsSite"
          Effect    = "Allow"
          Principal = { Service = "cloudfront.amazonaws.com" }
          Action    = ["s3:GetObject", "s3:ListBucket"]
          Resource = [
            "arn:aws:s3:::portfolio-site-692112934115",
            "arn:aws:s3:::portfolio-site-692112934115/*",
          ]
          Condition = {
            StringEquals = {
              "AWS:SourceArn" = "arn:aws:cloudfront::692112934115:distribution/E2EXAMPLE12345"
            }
          }
        },
        {
          Sid       = "DenyInsecureTransport"
          Effect    = "Deny"
          Principal = "*"
          Action    = "s3:*"
          Resource = [
            "arn:aws:s3:::portfolio-site-692112934115",
            "arn:aws:s3:::portfolio-site-692112934115/*",
          ]
          Condition = { Bool = { "aws:SecureTransport" = "false" } }
        },
      ]
    }
    error_message = "The site bucket policy must let only this distribution read it. It must deny every request that does not use TLS."
  }
}
