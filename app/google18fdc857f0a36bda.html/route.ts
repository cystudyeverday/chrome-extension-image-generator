export const dynamic = "force-static";

export function GET() {
  return new Response("google-site-verification: google18fdc857f0a36bda.html", {
    headers: {
      "content-type": "text/html; charset=utf-8"
    }
  });
}
