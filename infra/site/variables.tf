variable "account_id" {
  description = "The only AWS account this stack can change."
  type        = string
  default     = "692112934115"
}

variable "domain_name" {
  description = "The apex domain that serves the site. The certificate also covers www."
  type        = string
  default     = "markmccomiskey.com"
}

variable "hosted_zone_id" {
  description = "The Route 53 hosted zone that domain registration created (#5)."
  type        = string
  default     = "Z10409132A5F5TMYYU7NL"
}

variable "site_bucket_name" {
  description = "The site bucket name. It must match site_bucket_name in infra/bootstrap, because the deploy role can write to that name only."
  type        = string
  default     = "portfolio-site-692112934115"
}

variable "budget_alert_email" {
  description = "The address that receives the three budget alerts. Set it in terraform.tfvars, which git ignores, or in TF_VAR_budget_alert_email. Never commit it, because this repository is public."
  type        = string
  sensitive   = true
}
