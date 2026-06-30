export const dynamic = "force-static";

export function GET() {
  return new Response(
    "google-site-verification: googlea9d31f1424bbaf17.html",
    {
      headers: {
        "content-type": "text/html; charset=utf-8"
      }
    }
  );
}
