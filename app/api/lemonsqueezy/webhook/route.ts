import { handleLemonWebhook } from "@/lib/commerce/lemon-webhook";
import { recordLemonOrder } from "@/lib/commerce/lemon-store";

export const runtime = "nodejs";

export async function POST(request: Request) {
  return handleLemonWebhook(request, process.env, recordLemonOrder);
}
