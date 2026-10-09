terraform {
  # 1.10 adds S3 native state locking (use_lockfile), so no DynamoDB table.
  required_version = ">= 1.10"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.0"
    }
  }
}

provider "aws" {
  region = var.aws_region

  # Stop before any change if the credentials point at a different account.
  allowed_account_ids = [var.account_id]

  default_tags {
    tags = {
      Project   = "portfolio"
      Stack     = "bootstrap"
      ManagedBy = "terraform"
    }
  }
}
