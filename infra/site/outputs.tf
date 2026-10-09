output "distribution_id" {
  description = "The distribution ID. deploy.yml (#13) invalidates this distribution."
  value       = aws_cloudfront_distribution.site.id
}

output "distribution_arn" {
  description = "The ARN that infra/bootstrap needs. Set it as distribution_arn in infra/bootstrap/terraform.tfvars. Then apply the bootstrap stack again."
  value       = aws_cloudfront_distribution.site.arn
}

output "distribution_domain_name" {
  description = "The CloudFront domain that the A and AAAA records point at."
  value       = aws_cloudfront_distribution.site.domain_name
}

output "site_bucket_name" {
  description = "The bucket that deploy.yml (#13) syncs out/ into."
  value       = aws_s3_bucket.site.bucket
}

output "logs_bucket_name" {
  description = "The bucket that holds CloudFront access logs for 90 days."
  value       = aws_s3_bucket.logs.bucket
}
