import { createClient } from "npm:@supabase/supabase-js@2";

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

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("id,status,book_id")
      .eq("user_id", user.id)
      .eq("book_id", bookId)
      .eq("status", "paid")
      .limit(1)
      .maybeSingle();

    if (orderError) {
      console.error("Order lookup error:", orderError);

      return new Response(
        JSON.stringify({ error: "Could not verify purchase" }),
        { status: 500, headers }
      );
    }

    if (!order) {
      return new Response(
        JSON.stringify({ error: "Purchase required" }),
        { status: 403, headers }
      );
    }

    const { data: book, error: bookError } = await supabase
      .from("books")
      .select("id,ebook_path")
      .eq("id", bookId)
      .eq("published", true)
      .single();

    if (bookError || !book || !book.ebook_path) {
      return new Response(
        JSON.stringify({ error: "Book file not available" }),
        { status: 404, headers }
      );
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: signedUrl, error: signedUrlError } =
      await admin.storage
        .from("ebooks")
        .createSignedUrl(book.ebook_path, 300);

    if (signedUrlError || !signedUrl) {
      console.error("Signed URL error:", signedUrlError);

      return new Response(
        JSON.stringify({ error: "Could not create secure download" }),
        { status: 500, headers }
      );
    }

    return new Response(
      JSON.stringify({
        url: signedUrl.signedUrl,
        expires_in: 300,
      }),
      { status: 200, headers }
    );
  } catch (error) {
    console.error("Download error:", error);

    return new Response(
      JSON.stringify({ error: "Unexpected server error" }),
      { status: 500, headers }
    );
  }
});
