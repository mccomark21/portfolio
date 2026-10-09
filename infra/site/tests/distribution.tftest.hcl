# The distribution serves the site. These tests hold it to the settings in
# issue #12. A mock provider stands in for AWS, so even `command = apply` makes
# no AWS call.

mock_provider "aws" {
  source = "./tests/mocks"
}

# The budget import block cannot run against a mock provider. Its settings are
# checked by the live plan instead.
override_resource {
  target = aws_budgets_budget.monthly
}

variables {
  budget_alert_email = "alerts@example.com"
}

run "distribution_reads_the_bucket_through_oac" {
  command = apply

  assert {
    condition     = one(aws_cloudfront_distribution.site.origin).origin_access_control_id == aws_cloudfront_origin_access_control.site.id
    error_message = "The distribution must read the site bucket through the Origin Access Control."
  }

  assert {
    condition     = aws_cloudfront_origin_access_control.site.origin_access_control_origin_type == "s3" && aws_cloudfront_origin_access_control.site.signing_behavior == "always" && aws_cloudfront_origin_access_control.site.signing_protocol == "sigv4"
    error_message = "The Origin Access Control must sign every S3 request with SigV4."
  }

  assert {
    condition     = one(aws_cloudfront_distribution.site.origin).domain_name == aws_s3_bucket.site.bucket_regional_domain_name
    error_message = "The origin must be the site bucket's regional domain, not a website endpoint."
  }
}

run "distribution_serves_index_html_at_the_root" {
  command = apply

  assert {
    condition     = aws_cloudfront_distribution.site.default_root_object == "index.html"
    error_message = "The default root object must be index.html."
  }
}

run "distribution_maps_404_to_the_404_page" {
  command = apply

  assert {
    condition = [
      for r in aws_cloudfront_distribution.site.custom_error_response : {
        error_code         = r.error_code
        response_code      = r.response_code
        response_page_path = r.response_page_path
      }
      ] == [{
        error_code         = 404
        response_code      = 404
        response_page_path = "/404.html"
    }]
    error_message = "A 404 must return /404.html with status 404, and no other error must be remapped."
  }
}

run "distribution_redirects_http_compresses_and_runs_the_function" {
  command = apply

  assert {
    condition     = one(aws_cloudfront_distribution.site.default_cache_behavior).viewer_protocol_policy == "redirect-to-https"
    error_message = "HTTP must redirect to HTTPS."
  }

  assert {
    condition     = one(aws_cloudfront_distribution.site.default_cache_behavior).compress
    error_message = "Compression must be on."
  }

  assert {
    condition = [
      for f in one(aws_cloudfront_distribution.site.default_cache_behavior).function_association : {
        event_type   = f.event_type
        function_arn = f.function_arn
      }
      ] == [{
        event_type   = "viewer-request"
        function_arn = "arn:aws:cloudfront::692112934115:function/portfolio-site-viewer-request"
    }]
    error_message = "The viewer request function must run on the default cache behavior, and it must be the only function."
  }

  assert {
    condition     = aws_cloudfront_function.viewer_request.runtime == "cloudfront-js-2.0" && aws_cloudfront_function.viewer_request.publish
    error_message = "The function must use cloudfront-js-2.0 and be published."
  }

  assert {
    condition     = aws_cloudfront_function.viewer_request.code == file("${path.module}/functions/viewer-request.js")
    error_message = "The function code must be functions/viewer-request.js, the file the Node tests cover."
  }
}

run "distribution_uses_price_class_100" {
  command = apply

  assert {
    condition     = aws_cloudfront_distribution.site.price_class == "PriceClass_100"
    error_message = "The price class must be PriceClass_100."
  }
}

run "distribution_serves_apex_and_www_over_the_certificate" {
  command = apply

  assert {
    condition     = aws_cloudfront_distribution.site.aliases == toset(["markmccomiskey.com", "www.markmccomiskey.com"])
    error_message = "The distribution must answer for the apex and www."
  }

  assert {
    condition     = aws_acm_certificate.site.domain_name == "markmccomiskey.com" && aws_acm_certificate.site.subject_alternative_names == toset(["www.markmccomiskey.com"]) && aws_acm_certificate.site.validation_method == "DNS"
    error_message = "The certificate must cover the apex and www, validated by DNS."
  }

  assert {
    condition     = one(aws_cloudfront_distribution.site.viewer_certificate).acm_certificate_arn == "arn:aws:acm:us-east-1:692112934115:certificate/00000000-0000-0000-0000-000000000000"
    error_message = "The distribution must use the validated certificate."
  }

  assert {
    condition     = one(aws_cloudfront_distribution.site.viewer_certificate).ssl_support_method == "sni-only" && one(aws_cloudfront_distribution.site.viewer_certificate).minimum_protocol_version == "TLSv1.2_2021"
    error_message = "The certificate must use SNI and TLS 1.2 or later."
  }
}
