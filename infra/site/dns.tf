# The certificate lives in us-east-1, the provider region, because CloudFront
# reads certificates only from that region.
resource "aws_acm_certificate" "site" {
  domain_name               = var.domain_name
  subject_alternative_names = [local.www_domain_name]
  validation_method         = "DNS"

  lifecycle {
    create_before_destroy = true
  }
}

locals {
  validation_options = {
    for option in aws_acm_certificate.site.domain_validation_options : option.domain_name => option
  }
}

# The for_each keys come from configuration, so Terraform knows them at plan
# time. The record values come from the certificate after it exists.
resource "aws_route53_record" "certificate_validation" {
  for_each = toset(local.site_domain_names)

  zone_id         = var.hosted_zone_id
  name            = local.validation_options[each.key].resource_record_name
  type            = local.validation_options[each.key].resource_record_type
  records         = [local.validation_options[each.key].resource_record_value]
  ttl             = 300
  allow_overwrite = true
}

resource "aws_acm_certificate_validation" "site" {
  certificate_arn         = aws_acm_certificate.site.arn
  validation_record_fqdns = [for record in aws_route53_record.certificate_validation : record.fqdn]
}

# A and AAAA alias records for the apex and www. The viewer request function
# sends www to the apex.
resource "aws_route53_record" "site" {
  for_each = {
    for pair in setproduct(local.site_domain_names, ["A", "AAAA"]) :
    "${pair[0]}-${pair[1]}" => { name = pair[0], type = pair[1] }
  }

  zone_id = var.hosted_zone_id
  name    = each.value.name
  type    = each.value.type

  alias {
    name                   = aws_cloudfront_distribution.site.domain_name
    zone_id                = aws_cloudfront_distribution.site.hosted_zone_id
    evaluate_target_health = false
  }
}
