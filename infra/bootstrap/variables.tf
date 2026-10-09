variable "aws_region" {
  description = "Region for the state bucket and the provider. CloudFront certificates also need us-east-1."
  type        = string
  default     = "us-east-1"
}

variable "account_id" {
  description = "The only AWS account this stack can change."
  type        = string
  default     = "692112934115"
}

variable "github_repository" {
  description = "The GitHub repository, as owner/name, that can assume the deploy role."
  type        = string
  default     = "mccomark21/portfolio"
}

variable "github_branch" {
  description = "The one branch whose workflows can assume the deploy role."
  type        = string
  default     = "main"
}

variable "site_bucket_name" {
  description = "The S3 bucket that serves the site. The site stack (#12) creates it with this name."
  type        = string
  default     = "portfolio-site-692112934115"
}

variable "distribution_arn" {
  description = "The ARN of the one CloudFront distribution that the deploy role can invalidate. Keep it null until the site stack (#12) exists. Then set it. Then apply this stack again."
  type        = string
  default     = null

  validation {
    condition     = var.distribution_arn == null || can(regex("^arn:aws:cloudfront::[0-9]{12}:distribution/[A-Z0-9]+$", var.distribution_arn))
    error_message = "distribution_arn must name one distribution, as arn:aws:cloudfront::<account>:distribution/<ID>. This validation rejects a wildcard."
  }
}
