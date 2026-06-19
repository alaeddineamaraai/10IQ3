// /api/stripe-webhook.js
// Listens for payment_intent.succeeded events from Stripe and upgrades the
// user's plan in Supabase. Requires env vars:
//   STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, SUPABASE_URL, SUPABASE_SERVICE_KEY
//
// Setup in Stripe Dashboard > Developers > Webhooks:
//   Endpoint URL: https://yourdomain.com/api/stripe-webhook
//   Event to send: payment_intent.succeeded

export const config = { api: { bodyParser: false } };

function buffer(readable) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    readable.on('data', (c) => chunks.push(c));
    readable.on('end', () => resolve(Buffer.concat(chunks)));
    readable.on('error', reject);
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    const rawBody = await buffer(req);
    event = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).json({ error: 'Invalid signature' });
  }

  if (event.type === 'payment_intent.succeeded') {
    const intent = event.data.object;
    const { plan, email } = intent.metadata || {};

    if (plan && email && email !== 'unknown') {
      try {
        await fetch(
          `${process.env.SUPABASE_URL}/rest/v1/users?email=eq.${encodeURIComponent(email)}`,
          {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              apikey: process.env.SUPABASE_SERVICE_KEY,
              Authorization: `Bearer ${process.env.SUPABASE_SERVICE_KEY}`
            },
            body: JSON.stringify({ plan })
          }
        );
      } catch (err) {
        console.error('Failed to update Supabase plan:', err);
      }
    }
  }

  return res.status(200).json({ received: true });
}
