import { createClient } from "npm:@supabase/supabase-js@2";

const headers = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
};

Deno.serve(async (req) => {
  try {
    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ error: "Method not allowed" }),
        { status: 405, headers }
      );
    }

    const rawBody = await req.text();

    const signature = req.headers.get("x-paystack-signature");

    if (!signature) {
      return new Response(
        JSON.stringify({ error: "Missing signature" }),
        { status: 401, headers }
      );
    }

    const secretKey = Deno.env.get("PAYSTACK_SECRET_KEY");

    if (!secretKey) {
      console.error("PAYSTACK_SECRET_KEY is not configured");

      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        { status: 500, headers }
      );
    }

    const encoder = new TextEncoder();

    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secretKey),
      {
        name: "HMAC",
        hash: "SHA-512",
      },
      false,
      ["sign"]
    );

    const signatureBuffer = await crypto.subtle.sign(
      "HMAC",
      key,
      encoder.encode(rawBody)
    );

    const calculatedSignature = Array.from(
      new Uint8Array(signatureBuffer)
    )
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join("");

    if (calculatedSignature !== signature) {
      return new Response(
        JSON.stringify({ error: "Invalid signature" }),
        { status: 401, headers }
      );
    }

    const event = JSON.parse(rawBody);

    if (event.event !== "charge.success") {
      return new Response(
        JSON.stringify({ received: true }),
        { status: 200, headers }
      );
    }

    const reference = event.data?.reference;

    if (!reference) {
      return new Response(
        JSON.stringify({ error: "Missing payment reference" }),
        { status: 400, headers }
      );
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: order, error: orderError } = await admin
      .from("orders")
      .select("id,user_id,book_id,status")
      .eq("payment_reference", reference)
      .maybeSingle();

    if (orderError) {
      console.error("Order lookup error:", orderError);

      return new Response(
        JSON.stringify({ error: "Order lookup failed" }),
        { status: 500, headers }
      );
    }

    if (!order) {
      console.error("Order not found:", reference);

      return new Response(
        JSON.stringify({ error: "Order not found" }),
        { status: 404, headers }
      );
    }

    if (order.status === "paid") {
      return new Response(
        JSON.stringify({ received: true }),
        { status: 200, headers }
      );
    }

    const { error: updateError } = await admin
      .from("orders")
      .update({
        status: "paid",
        paid_at: new Date().toISOString(),
      })
      .eq("id", order.id);

    if (updateError) {
      console.error("Order update error:", updateError);

      return new Response(
        JSON.stringify({ error: "Could not update order" }),
        { status: 500, headers }
      );
    }

    return new Response(
      JSON.stringify({ received: true }),
      { status: 200, headers }
    );
  } catch (error) {
    console.error("Webhook error:", error);

    return new Response(
      JSON.stringify({ error: "Webhook processing failed" }),
      { status: 500, headers }
    );
  }
});
