terraform {
  backend "s3" {
    bucket       = "portfolio-tfstate-692112934115"
    key          = "bootstrap/terraform.tfstate"
    region       = "us-east-1"
    use_lockfile = true
    encrypt      = true
  }
}
