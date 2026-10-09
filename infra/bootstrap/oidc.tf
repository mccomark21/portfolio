# GitHub Actions proves its identity to AWS with a short-lived OIDC token, so
# no AWS access key is stored as a GitHub secret.
resource "aws_iam_openid_connect_provider" "github" {
  url            = "https://${local.github_oidc_host}"
  client_id_list = ["sts.amazonaws.com"]
}
