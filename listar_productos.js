require('dotenv').config()
var stripe = require('stripe')(process.env.STRIPE_SK)

stripe.plans.list({ limit: 3 }, function (err, plans) {
  console.log(plans)
})