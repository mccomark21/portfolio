locals {
  www_domain_name = "www.${var.domain_name}"

  # The AWS managed cache policy "Managed-CachingOptimized". The deploy
  # workflow invalidates /* after every sync, so long cache times are safe.
  caching_optimized_policy_id = "658327ea-f89d-4fab-a63d-7e88639e58f6"
}

resource "aws_cloudfront_origin_access_control" "site" {
  name                              = "portfolio-site"
  description                       = "CloudFront reads the private site bucket."
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

# Adds index.html to folder paths, sends a page path without a slash to the
# slash form, and sends www to the apex. functions/viewer-request.test.mjs
# covers its behavior.
resource "aws_cloudfront_function" "viewer_request" {
  name    = "portfolio-site-viewer-request"
  comment = "Folder index, trailing slash and www redirects."
  runtime = "cloudfront-js-2.0"
  publish = true
  code    = file("${path.module}/functions/viewer-request.js")
}

resource "aws_cloudfront_distribution" "site" {
  enabled             = true
  comment             = "portfolio site"
  aliases             = [var.domain_name, local.www_domain_name]
  default_root_object = "index.html"
  price_class         = "PriceClass_100"
  http_version        = "http2and3"
  is_ipv6_enabled     = true

  origin {
    origin_id                = "site-bucket"
    domain_name              = aws_s3_bucket.site.bucket_regional_domain_name
    origin_access_control_id = aws_cloudfront_origin_access_control.site.id
  }

  default_cache_behavior {
    target_origin_id       = "site-bucket"
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods        = ["GET", "HEAD"]
    cached_methods         = ["GET", "HEAD"]
    compress               = true
    cache_policy_id        = local.caching_optimized_policy_id

    function_association {
      event_type   = "viewer-request"
      function_arn = aws_cloudfront_function.viewer_request.arn
    }
  }

  custom_error_response {
    error_code            = 404
    response_code         = 404
    response_page_path    = "/404.html"
    error_caching_min_ttl = 60
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    acm_certificate_arn      = aws_acm_certificate_validation.site.certificate_arn
    ssl_support_method       = "sni-only"
    minimum_protocol_version = "TLSv1.2_2021"
  }
}
