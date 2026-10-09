# CloudFront standard logging (v2). CloudFront sends access logs through a
# CloudWatch Logs delivery to a separate, private bucket. Objects expire after
# 90 days. The delivery writes JSON under date folders, so a later Athena
# table (#3.3 in the plan) can partition by date.

locals {
  logs_bucket_arn = "arn:aws:s3:::${aws_s3_bucket.logs.bucket}"
}

resource "aws_s3_bucket" "logs" {
  bucket = "portfolio-logs-${var.account_id}"
}

resource "aws_s3_bucket_public_access_block" "logs" {
  bucket = aws_s3_bucket.logs.bucket

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_ownership_controls" "logs" {
  bucket = aws_s3_bucket.logs.bucket

  rule {
    object_ownership = "BucketOwnerEnforced"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "logs" {
  bucket = aws_s3_bucket.logs.bucket

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "logs" {
  bucket = aws_s3_bucket.logs.bucket

  rule {
    id     = "expire-after-90-days"
    status = "Enabled"

    filter {}

    expiration {
      days = 90
    }

    abort_incomplete_multipart_upload {
      days_after_initiation = 1
    }
  }
}

resource "aws_s3_bucket_policy" "logs" {
  bucket = aws_s3_bucket.logs.bucket

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "LogDeliveryWrite"
        Effect    = "Allow"
        Principal = { Service = "delivery.logs.amazonaws.com" }
        Action    = "s3:PutObject"
        Resource  = "${local.logs_bucket_arn}/*"
        Condition = {
          StringEquals = {
            "s3:x-amz-acl"      = "bucket-owner-full-control"
            "aws:SourceAccount" = var.account_id
          }
          ArnLike = {
            "aws:SourceArn" = "arn:aws:logs:us-east-1:${var.account_id}:delivery-source:*"
          }
        }
      },
      {
        Sid       = "LogDeliveryAclCheck"
        Effect    = "Allow"
        Principal = { Service = "delivery.logs.amazonaws.com" }
        Action    = "s3:GetBucketAcl"
        Resource  = local.logs_bucket_arn
        Condition = {
          StringEquals = { "aws:SourceAccount" = var.account_id }
        }
      },
      {
        Sid       = "DenyInsecureTransport"
        Effect    = "Deny"
        Principal = "*"
        Action    = "s3:*"
        Resource  = [local.logs_bucket_arn, "${local.logs_bucket_arn}/*"]
        Condition = { Bool = { "aws:SecureTransport" = "false" } }
      },
    ]
  })

  depends_on = [aws_s3_bucket_public_access_block.logs]
}

resource "aws_cloudwatch_log_delivery_source" "access_logs" {
  name         = "portfolio-site-access-logs"
  log_type     = "ACCESS_LOGS"
  resource_arn = aws_cloudfront_distribution.site.arn
}

resource "aws_cloudwatch_log_delivery_destination" "logs_bucket" {
  name          = "portfolio-site-logs-bucket"
  output_format = "json"

  delivery_destination_configuration {
    destination_resource_arn = local.logs_bucket_arn
  }
}

resource "aws_cloudwatch_log_delivery" "access_logs" {
  delivery_source_name     = aws_cloudwatch_log_delivery_source.access_logs.name
  delivery_destination_arn = aws_cloudwatch_log_delivery_destination.logs_bucket.arn

  s3_delivery_configuration {
    suffix_path                 = "{DistributionId}/{yyyy}/{MM}/{dd}/{HH}"
    enable_hive_compatible_path = false
  }

  depends_on = [aws_s3_bucket_policy.logs]
}
