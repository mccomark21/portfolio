terraform {
  backend "s3" {
    bucket       = "portfolio-tfstate-692112934115"
    key          = "site/terraform.tfstate"
    region       = "us-east-1"
    use_lockfile = true
    encrypt      = true

    assume_role = {
      role_arn     = "arn:aws:iam::692112934115:role/portfolio-terraform"
      session_name = "portfolio-site-state"
    }
  }
}
