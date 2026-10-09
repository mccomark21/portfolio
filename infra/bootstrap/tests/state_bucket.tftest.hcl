# The state bucket holds every Terraform state file for this project. These
# tests hold it to issue #4: versioned, private, encrypted, TLS only. A mock
# provider stands in for AWS, so even `command = apply` makes no AWS call.

mock_provider "aws" {}

run "state_bucket_is_named_for_the_account" {
  command = apply

  assert {
    condition     = aws_s3_bucket.state.bucket == "portfolio-tfstate-692112934115"
    error_message = "The state bucket must be portfolio-tfstate-692112934115."
  }
}

run "state_bucket_keeps_every_version" {
  command = apply

  assert {
    condition     = aws_s3_bucket_versioning.state.bucket == "portfolio-tfstate-692112934115"
    error_message = "Versioning must apply to the state bucket."
  }

  assert {
    condition     = aws_s3_bucket_versioning.state.versioning_configuration[0].status == "Enabled"
    error_message = "The state bucket must have versioning Enabled, so that an operator can restore the state after a bad write."
  }
}

run "state_bucket_blocks_all_public_access" {
  command = apply

  assert {
    condition     = aws_s3_bucket_public_access_block.state.bucket == "portfolio-tfstate-692112934115"
    error_message = "The public access block must apply to the state bucket."
  }

  assert {
    condition = alltrue([
      aws_s3_bucket_public_access_block.state.block_public_acls,
      aws_s3_bucket_public_access_block.state.block_public_policy,
      aws_s3_bucket_public_access_block.state.ignore_public_acls,
      aws_s3_bucket_public_access_block.state.restrict_public_buckets,
    ])
    error_message = "All four public access blocks must be on for the state bucket."
  }

  assert {
    condition     = aws_s3_bucket_ownership_controls.state.rule[0].object_ownership == "BucketOwnerEnforced"
    error_message = "The state bucket must disable ACLs (BucketOwnerEnforced)."
  }
}

run "state_bucket_encrypts_at_rest" {
  command = apply

  assert {
    condition     = one(one(aws_s3_bucket_server_side_encryption_configuration.state.rule).apply_server_side_encryption_by_default).sse_algorithm == "AES256"
    error_message = "The state bucket must encrypt objects at rest with SSE-S3."
  }
}

run "state_bucket_refuses_plain_http" {
  command = apply

  assert {
    condition = jsondecode(aws_s3_bucket_policy.state.policy) == {
      Version = "2012-10-17"
      Statement = [{
        Sid       = "DenyInsecureTransport"
        Effect    = "Deny"
        Principal = "*"
        Action    = "s3:*"
        Resource = [
          "arn:aws:s3:::portfolio-tfstate-692112934115",
          "arn:aws:s3:::portfolio-tfstate-692112934115/*",
        ]
        Condition = { Bool = { "aws:SecureTransport" = "false" } }
      }]
    }
    error_message = "The state bucket policy must deny every request that does not use TLS."
  }
}
