import { getStripe } from "../_stripeClient.js";

function siteUrl(req) {
  if (process.env.SITE_URL) return process.env.SITE_URL;
  const origin = req.headers.origin;
  if (origin) return origin;
  const proto = req.headers["x-forwarded-proto"] || "https";
  return `${proto}://${req.headers.host}`;
}

export default async function handler(req, res) {
  res.setHeader("Content-Type", "application/json");

  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const { priceId, email, companyName, plan } = req.body || {};

  if (!priceId || typeof priceId !== "string") {
    res.status(400).json({ error: "priceId is required" });
    return;
  }
  if (!email || typeof email !== "string") {
    res.status(400).json({ error: "email is required" });
    return;
  }

  try {
    const stripe = getStripe();
    const base = siteUrl(req);

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer_email: email,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${base}/subscribe/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${base}/subscribe/cancel`,
      metadata: {
        company_name: companyName || "",
        plan: plan || "",
      },
      subscription_data: {
        metadata: {
          company_name: companyName || "",
          plan: plan || "",
        },
      },
    });

    res.status(200).json({ url: session.url });
  } catch (err) {
    console.error("Failed to create checkout session", err);
    res.status(500).json({ error: "Failed to start checkout. Please try again." });
  }
}
