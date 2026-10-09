# The account budget existed before this stack (created 2026-09-23). The import
# block adopts it, so Terraform manages it without a second budget. The values
# below match the live budget as read on 2026-10-09.

import {
  to = aws_budgets_budget.monthly
  id = "${var.account_id}:monthly-cost-10usd"
}

resource "aws_budgets_budget" "monthly" {
  name              = "monthly-cost-10usd"
  budget_type       = "COST"
  limit_amount      = "10.0"
  limit_unit        = "USD"
  time_unit         = "MONTHLY"
  time_period_start = "2026-09-01_00:00"
  time_period_end   = "2087-06-15_00:00"

  cost_types {
    include_credit             = true
    include_discount           = true
    include_other_subscription = true
    include_recurring          = true
    include_refund             = true
    include_subscription       = true
    include_support            = true
    include_tax                = true
    include_upfront            = true
    use_amortized              = false
    use_blended                = false
  }

  # The address stays out of the repository. See var.budget_alert_email.
  dynamic "notification" {
    for_each = [
      { type = "ACTUAL", threshold = 85 },
      { type = "ACTUAL", threshold = 100 },
      { type = "FORECASTED", threshold = 100 },
    ]

    content {
      notification_type          = notification.value.type
      comparison_operator        = "GREATER_THAN"
      threshold                  = notification.value.threshold
      threshold_type             = "PERCENTAGE"
      subscriber_email_addresses = [var.budget_alert_email]
    }
  }
}
