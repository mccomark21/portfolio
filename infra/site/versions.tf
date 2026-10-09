terraform {
  # 1.10 adds S3 native state locking (use_lockfile).
  required_version = ">= 1.10"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.0"
    }
  }
}

# Every call runs as portfolio-terraform, assumed from the AdminAccess role
# behind AWS_PROFILE=portfolio. The bootstrap stack (infra/bootstrap) creates
# the role and limits it to what this stack needs.
provider "aws" {
  # CloudFront reads certificates only from us-east-1.
  region = "us-east-1"

  # Stop before any change if the credentials point at a different account.
  allowed_account_ids = [var.account_id]

  assume_role {
    role_arn     = "arn:aws:iam::${var.account_id}:role/portfolio-terraform"
    session_name = "portfolio-site"
  }

  default_tags {
    tags = {
      Project   = "portfolio"
      Stack     = "site"
      ManagedBy = "terraform"
    }
  }
}
