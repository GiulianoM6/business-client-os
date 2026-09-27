export function authDestination(value: unknown): "/checkout" | "/thank-you" | "/account" {
  return value === "/checkout" || value === "/thank-you" ? value : "/account";
}
