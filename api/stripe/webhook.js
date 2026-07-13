import { getStripe } from "../_stripeClient.js";
import { getSupabaseAdmin } from "../_supabaseAdmin.js";

// Stripe requires the raw request body to verify the webhook signature,
// so we disable Vercel's automatic JSON body parsing for this route.
export const config = {
  api: { bodyParser: false },
};

function readRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

function planFromPrice(subscription) {
  const interval = subscription.items?.data?.[0]?.price?.recurring?.interval;
  if (interval === "year") return "yearly";
  if (interval === "month") return "monthly";
  return subscription.metadata?.plan || null;
}

async function upsertSubscription(supabaseAdmin, { subscription, customerEmail, companyName }) {
  const payload = {
    company_name: companyName || subscription.metadata?.company_name || null,
    email: customerEmail,
    stripe_customer_id: subscription.customer,
    stripe_subscription_id: subscription.id,
    plan: planFromPrice(subscription),
    status: subscription.status,
    current_period_end: subscription.current_period_end
      ? new Date(subscription.current_period_end * 1000).toISOString()
      : null,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabaseAdmin
    .from("customer_subscriptions")
    .upsert(payload, { onConflict: "stripe_subscription_id" });

  if (error) throw error;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).send("Method not allowed");
    return;
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("STRIPE_WEBHOOK_SECRET is not set");
    res.status(500).send("Webhook not configured");
    return;
  }

  const stripe = getStripe();
  const rawBody = await readRawBody(req);
  const signature = req.headers["stripe-signature"];

  let event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    console.error("Stripe webhook signature verification failed", err.message);
    res.status(400).send(`Webhook signature verification failed`);
    return;
  }

  const supabaseAdmin = getSupabaseAdmin();

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        if (session.mode === "subscription" && session.subscription) {
          const subscription = await stripe.subscriptions.retrieve(session.subscription);
          await upsertSubscription(supabaseAdmin, {
            subscription,
            customerEmail: session.customer_details?.email || session.customer_email,
            companyName: session.metadata?.company_name,
          });
        }
        break;
      }
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subscription = event.data.object;
        const customer = await stripe.customers.retrieve(subscription.customer);
        await upsertSubscription(supabaseAdmin, {
          subscription,
          customerEmail: customer.email,
          companyName: subscription.metadata?.company_name,
        });
        break;
      }
      default:
        break;
    }

    res.status(200).json({ received: true });
  } catch (err) {
    console.error("Failed to process Stripe webhook", err);
    res.status(500).send("Webhook handler failed");
  }
}
