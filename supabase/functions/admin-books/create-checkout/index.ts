import { createClient } from "npm:@supabase/supabase-js@2";

const PAYSTACK_API = "https://api.paystack.co";

const headers = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers });
  }

  try {
    const authorization = req.headers.get("Authorization");

    if (!authorization) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      {
        global: {
          headers: {
            Authorization: authorization,
          },
        },
      }
    );

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers }
      );
    }

    const { bookId } = await req.json();

    if (!bookId) {
      return new Response(
        JSON.stringify({ error: "Book ID is required" }),
        { status: 400, headers }
      );
    }

    const { data: book, error: bookError } = await supabase
      .from("books")
      .select("id,title,price_kobo,currency")
      .eq("id", bookId)
      .eq("published", true)
      .single();

    if (bookError || !book) {
      return new Response(
        JSON.stringify({ error: "Book not found" }),
        { status: 404, headers }
      );
    }

    if (book.price_kobo <= 0) {
      return new Response(
        JSON.stringify({ error: "This book does not require payment" }),
        { status: 400, headers }
      );
    }

    const reference = `book_${book.id}_${crypto.randomUUID()}`;

    const { error: orderError } = await supabase
      .from("orders")
      .insert({
        user_id: user.id,
        book_id: book.id,
        amount_kobo: book.price_kobo,
        currency: book.currency,
        provider: "paystack",
        payment_reference: reference,
        status: "pending",
      });

    if (orderError) {
      console.error("Order creation error:", orderError);

      return new Response(
        JSON.stringify({ error: "Could not create order" }),
        { status: 500, headers }
      );
    }

    const paystackResponse = await fetch(
      `${PAYSTACK_API}/transaction/initialize`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${Deno.env.get("PAYSTACK_SECRET_KEY")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: user.email,
          amount: book.price_kobo,
          currency: book.currency,
          reference,
          callback_url: `${Deno.env.get("SITE_URL")}/dashboard`,
          metadata: {
            user_id: user.id,
            book_id: book.id,
          },
        }),
      }
    );

    const result = await paystackResponse.json();

    if (!paystackResponse.ok || !result.status) {
      console.error("Paystack error:", result);

      return new Response(
        JSON.stringify({ error: "Payment initialization failed" }),
        { status: 502, headers }
      );
    }

    return new Response(
      JSON.stringify({
        authorization_url: result.data.authorization_url,
        reference,
      }),
      { status: 200, headers }
    );
  } catch (error) {
    console.error("Checkout error:", error);

    return new Response(
      JSON.stringify({ error: "Unexpected server error" }),
      { status: 500, headers }
    );
  }
});
