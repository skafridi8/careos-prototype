import Stripe from "stripe";

let cachedClient = null;

export function getStripe() {
  if (cachedClient) return cachedClient;

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error("Missing STRIPE_SECRET_KEY server environment variable.");
  }

  cachedClient = new Stripe(secretKey, { apiVersion: "2024-06-20" });
  return cachedClient;
}
