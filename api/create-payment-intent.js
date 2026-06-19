// /api/create-payment-intent.js
// Creates a Stripe PaymentIntent for the selected plan (pro or elite).
// Requires env var: STRIPE_SECRET_KEY (set in Vercel project settings)

const PLAN_PRICES = {
  pro: 3000,   // $30.00 in cents
  elite: 7500  // $75.00 in cents
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { plan, email } = req.body;
    const amount = PLAN_PRICES[plan];

    if (!amount) {
      return res.status(400).json({ error: 'Invalid plan. Must be "pro" or "elite".' });
    }

    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: 'usd',
      receipt_email: email || undefined,
      metadata: { plan, email: email || 'unknown' },
      automatic_payment_methods: { enabled: true }
    });

    return res.status(200).json({
      clientSecret: paymentIntent.client_secret,
      amount,
      plan
    });
  } catch (err) {
    console.error('Stripe PaymentIntent error:', err);
    return res.status(500).json({ error: err.message || 'Payment setup failed' });
  }
}
