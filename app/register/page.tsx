"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

const focusRing =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#07552F]";
const inputBase =
  "h-12 w-full rounded-md border bg-white px-4 text-[15px] text-[#173D2A] placeholder:text-[#68786B]/70 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#07552F]/25 motion-reduce:transition-none disabled:bg-[#F4F8F1] disabled:text-[#68786B]";

const borderFor = (hasError: boolean) =>
  hasError
    ? "border-[#B3261E] focus:border-[#B3261E]"
    : "border-[#07552F]/30 hover:border-[#07552F]/60 focus:border-[#07552F]";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export default function RegisterPage() {
  const router = useRouter();
  const [v, setV] = useState({ name: "", email: "", phone: "", password: "" });
  const [errors, setErrors] = useState<Partial<Record<"name" | "email" | "phone" | "password", string>>>({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState("");

  const set = (k: keyof typeof v) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setV((s) => ({ ...s, [k]: e.target.value }));
    if (errors[k]) setErrors((er) => ({ ...er, [k]: undefined }));
  };

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (loading) return;

    const found: typeof errors = {};
    if (v.name.trim().length < 2) found.name = "Please enter your name.";
    if (!EMAIL_RE.test(v.email.trim())) found.email = "Please enter a valid email address.";
    if (v.password.length < 6) found.password = "Password must be at least 6 characters.";
    setErrors(found);
    if (Object.keys(found).length) return;

    setLoading(true);
    setServerError("");
    try {
      await api("/auth/register", {
        method: "POST",
        body: JSON.stringify({
          name: v.name.trim(),
          email: v.email.trim(),
          phone: v.phone.trim() || undefined,
          password: v.password,
        }),
      });
      router.push("/account");
    } catch (err: any) {
      setServerError(err.message || "We couldn't create your account. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main>
      <section className="bg-[#F4F8F1] px-4 py-[32px] text-center md:px-[3.3vw] md:py-[48px] lg:py-[60px]">
        <h1 className="text-[30px] font-bold leading-tight tracking-tight text-[#07552F] md:text-[40px] lg:text-[46px]">
          Create Account
        </h1>
        <p className="mx-auto mt-2 max-w-[460px] text-[15px] leading-relaxed text-[#68786B] md:text-base">
          Sign up to track your orders, manage your profile and save favourites.
        </p>
      </section>

      <section className="bg-[#FAFBF6] px-4 py-[32px] md:px-[3.3vw] md:py-[56px] lg:py-[80px]">
        <div className="mx-auto max-w-[500px] rounded-2xl border-2 border-[#07552F]/40 bg-white p-6 md:p-8">
          <form onSubmit={onSubmit} noValidate className="space-y-5">
            <div>
              <label htmlFor="reg-name" className="mb-1.5 block text-sm font-semibold text-[#173D2A]">
                Full name
              </label>
              <input
                id="reg-name"
                type="text"
                autoComplete="name"
                value={v.name}
                onChange={set("name")}
                placeholder="Your name"
                className={`${inputBase} ${borderFor(!!errors.name)}`}
              />
              {errors.name && <p className="mt-1.5 text-[13px] text-[#B3261E]">{errors.name}</p>}
            </div>

            <div>
              <label htmlFor="reg-email" className="mb-1.5 block text-sm font-semibold text-[#173D2A]">
                Email
              </label>
              <input
                id="reg-email"
                type="email"
                inputMode="email"
                autoComplete="email"
                value={v.email}
                onChange={set("email")}
                placeholder="you@example.com"
                className={`${inputBase} ${borderFor(!!errors.email)}`}
              />
              {errors.email && <p className="mt-1.5 text-[13px] text-[#B3261E]">{errors.email}</p>}
            </div>

            <div>
              <label htmlFor="reg-phone" className="mb-1.5 block text-sm font-semibold text-[#173D2A]">
                Phone <span className="font-normal text-[#68786B]">(optional)</span>
              </label>
              <input
                id="reg-phone"
                type="tel"
                autoComplete="tel"
                value={v.phone}
                onChange={set("phone")}
                placeholder="Phone number"
                className={`${inputBase} ${borderFor(!!errors.phone)}`}
              />
            </div>

            <div>
              <label htmlFor="reg-password" className="mb-1.5 block text-sm font-semibold text-[#173D2A]">
                Password
              </label>
              <input
                id="reg-password"
                type="password"
                autoComplete="new-password"
                value={v.password}
                onChange={set("password")}
                placeholder="At least 6 characters"
                className={`${inputBase} ${borderFor(!!errors.password)}`}
              />
              {errors.password && <p className="mt-1.5 text-[13px] text-[#B3261E]">{errors.password}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`inline-flex h-12 w-full items-center justify-center rounded-md bg-[#07552F] px-8 text-[15px] font-semibold text-white transition-colors duration-200 hover:bg-[#063D27] disabled:cursor-not-allowed disabled:opacity-70 ${focusRing}`}
            >
              {loading ? "Please wait…" : "Create account"}
            </button>

            {serverError && (
              <p className="rounded-md border border-[#B3261E]/30 bg-[#FDF1F0] px-4 py-3 text-sm text-[#B3261E]">
                {serverError}
              </p>
            )}

            <p className="text-center text-sm text-[#68786B]">
              Already have an account?{" "}
              <Link href="/account" className="font-semibold text-[#07552F] underline hover:text-[#063D27]">
                Sign in
              </Link>
            </p>
          </form>
        </div>
      </section>
    </main>
  );
}

