# The site bucket holds the static export. It stays private: CloudFront reads
# it through Origin Access Control, and S3 website hosting stays off.

locals {
  site_bucket_arn = "arn:aws:s3:::${aws_s3_bucket.site.bucket}"
}

resource "aws_s3_bucket" "site" {
  bucket = var.site_bucket_name
}

resource "aws_s3_bucket_public_access_block" "site" {
  bucket = aws_s3_bucket.site.bucket

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_ownership_controls" "site" {
  bucket = aws_s3_bucket.site.bucket

  rule {
    object_ownership = "BucketOwnerEnforced"
  }
}

# SSE-S3, not KMS: the deploy role has no KMS permission.
resource "aws_s3_bucket_server_side_encryption_configuration" "site" {
  bucket = aws_s3_bucket.site.bucket

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_policy" "site" {
  bucket = aws_s3_bucket.site.bucket

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        # s3:ListBucket makes S3 return 404 for a missing object, not 403, so
        # the distribution's 404 page applies.
        Sid       = "CloudFrontReadsSite"
        Effect    = "Allow"
        Principal = { Service = "cloudfront.amazonaws.com" }
        Action    = ["s3:GetObject", "s3:ListBucket"]
        Resource  = [local.site_bucket_arn, "${local.site_bucket_arn}/*"]
        Condition = {
          StringEquals = { "AWS:SourceArn" = aws_cloudfront_distribution.site.arn }
        }
      },
      {
        Sid       = "DenyInsecureTransport"
        Effect    = "Deny"
        Principal = "*"
        Action    = "s3:*"
        Resource  = [local.site_bucket_arn, "${local.site_bucket_arn}/*"]
        Condition = { Bool = { "aws:SecureTransport" = "false" } }
      },
    ]
  })

  # S3 can reject two configuration changes on one bucket at the same time.
  # Terraform creates the public access block first.
  depends_on = [aws_s3_bucket_public_access_block.site]
}
