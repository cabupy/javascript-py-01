require('dotenv').config()
var stripe = require('stripe')(process.env.STRIPE_SK)

stripe.customers.list({ limit: 10 }, function (err, customers) {
  console.log(customers)
})
