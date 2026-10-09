import { redirect } from "next/navigation";

export const metadata = { title: "Create workspace" };

export default function OnboardingPage() {
  redirect("/account/onboarding");
}
