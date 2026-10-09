# Mock values for the AWS provider in every site stack test. Each value has the
# shape of the real attribute, so tests can assert on exact ARNs.

mock_resource "aws_cloudfront_distribution" {
  defaults = {
    id             = "E2EXAMPLE12345"
    arn            = "arn:aws:cloudfront::692112934115:distribution/E2EXAMPLE12345"
    domain_name    = "d111111abcdef8.cloudfront.net"
    hosted_zone_id = "Z2FDTNDATAQYW2"
  }
}

mock_resource "aws_cloudfront_function" {
  defaults = {
    arn = "arn:aws:cloudfront::692112934115:function/portfolio-site-viewer-request"
  }
}

# One validation option per domain, as ACM returns for a DNS-validated
# certificate on the apex and www.
mock_resource "aws_acm_certificate" {
  defaults = {
    arn = "arn:aws:acm:us-east-1:692112934115:certificate/00000000-0000-0000-0000-000000000000"
    domain_validation_options = [
      {
        domain_name           = "markmccomiskey.com"
        resource_record_name  = "_apex.markmccomiskey.com."
        resource_record_type  = "CNAME"
        resource_record_value = "_apex.acm-validations.aws."
      },
      {
        domain_name           = "www.markmccomiskey.com"
        resource_record_name  = "_www.markmccomiskey.com."
        resource_record_type  = "CNAME"
        resource_record_value = "_www.acm-validations.aws."
      },
    ]
  }
}

mock_resource "aws_acm_certificate_validation" {
  defaults = {
    certificate_arn = "arn:aws:acm:us-east-1:692112934115:certificate/00000000-0000-0000-0000-000000000000"
  }
}

mock_resource "aws_cloudwatch_log_delivery_destination" {
  defaults = {
    arn = "arn:aws:logs:us-east-1:692112934115:delivery-destination:portfolio-site-logs-bucket"
  }
}
