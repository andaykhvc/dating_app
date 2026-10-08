import type { Metadata } from "next";
import { VerifyEmailForm } from "@/features/auth/components/VerifyEmailForm";

export const metadata: Metadata = { title: "Enter your code" };

export default function VerifyEmailPage() {
  return <VerifyEmailForm />;
}
