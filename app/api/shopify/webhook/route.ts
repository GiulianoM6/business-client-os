// Disabled integration seam: never acknowledge an order or grant access prematurely.
export async function POST() {
 return Response.json({error:"Purchase fulfillment is not configured."},{status:503,headers:{"Cache-Control":"no-store"}});
}
