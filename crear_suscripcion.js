require('dotenv').config()
var stripe = require('stripe')(process.env.STRIPE_SK)

// pagos recursivos .. de 10 dolares por mes fijos...
stripe.subscriptions.create(
  {
    customer: '',
    items: [{ plan: 'prod_HXVESZ2i6us0fm',  quantity: 1}],
  },
  function (err, subscription) {
    if (err) { 
      console.error(err) 
    } else {
      console.log(subscription)
    }
  }
)