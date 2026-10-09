output "state_bucket" {
  description = "Bucket for the backend \"s3\" block of every stack in infra/."
  value       = aws_s3_bucket.state.bucket
}

output "terraform_role_arn" {
  description = "Role to assume for the site stack. Put it in the portfolio-terraform AWS CLI profile."
  value       = aws_iam_role.terraform.arn
}

output "deploy_role_arn" {
  description = "Role for deploy.yml to assume through OIDC (#13)."
  value       = aws_iam_role.deploy.arn
}

output "site_bucket_name" {
  description = "Bucket name the site stack (#12) must create. The deploy role is scoped to it."
  value       = var.site_bucket_name
}
