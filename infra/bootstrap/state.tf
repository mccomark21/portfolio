# Remote state for every stack in infra/. Each stack locks its state with an
# S3 lock file (backend "s3" { use_lockfile = true }), so no DynamoDB table.

locals {
  state_bucket_arn = "arn:aws:s3:::${aws_s3_bucket.state.bucket}"
}

resource "aws_s3_bucket" "state" {
  bucket = "portfolio-tfstate-${var.account_id}"

  # Losing this bucket loses the record of what every stack owns.
  lifecycle {
    prevent_destroy = true
  }
}

resource "aws_s3_bucket_versioning" "state" {
  bucket = aws_s3_bucket.state.bucket

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_public_access_block" "state" {
  bucket = aws_s3_bucket.state.bucket

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_ownership_controls" "state" {
  bucket = aws_s3_bucket.state.bucket

  rule {
    object_ownership = "BucketOwnerEnforced"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "state" {
  bucket = aws_s3_bucket.state.bucket

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_policy" "state" {
  bucket = aws_s3_bucket.state.bucket

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Sid       = "DenyInsecureTransport"
      Effect    = "Deny"
      Principal = "*"
      Action    = "s3:*"
      Resource  = [local.state_bucket_arn, "${local.state_bucket_arn}/*"]
      Condition = { Bool = { "aws:SecureTransport" = "false" } }
    }]
  })

  # S3 can reject two configuration changes on one bucket at the same time.
  # Terraform creates the public access block first.
  depends_on = [aws_s3_bucket_public_access_block.state]
}
