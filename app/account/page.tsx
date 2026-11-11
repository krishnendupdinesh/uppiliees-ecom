"use client";

/*
  app/account/page.tsx  – SINGLE-FILE ACCOUNT PAGE
  (use src/app/account/page.tsx if your project has a src folder)

  Navbar / AnnouncementBar / Footer come from your existing layout.
  Tip: client pages can't export `metadata`. To set the tab title, add
  `export const metadata = { title: "My Account | UPPILIEES" }` in
  app/account/layout.tsx.

  WHAT THIS PAGE DOES
  - Signed out: Sign in / Create account forms.
  - Signed in:  Profile, Orders and Addresses tabs, plus links to Wishlist and Bag.

  NO BACKEND IS INVENTED. Every action goes through the API block in section 1.
  Leave an endpoint as "" until your real one exists – the page then says
  honestly that the feature "isn't connected yet" and never fakes a success.

  Expected API (JSON, cookies sent with every request):
    me             GET   → { name, email, phone?, addresses?: Address[] }   (401 when signed out)
    login          POST  { email, password }
    register       POST  { name, email, password }
    logout         POST
    updateProfile  PUT   { name, phone }
    orders         GET   → Order[]   (or { orders: Order[] })
    addAddress     POST  Address fields
  Error responses may include { "message": "text to show the visitor" }.
*/

import { useCallback, useEffect, useState, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

/* ═══════════════════════════════════════════════════════════════
   1. CONFIG – edit ONLY this part to change the page content
   ═══════════════════════════════════════════════════════════════ */

const PAGE_TEXT = {
  heading: "My Account",
  signedOutSubheading: "Sign in or create an account to view your profile and orders.",
  currency: "₹",
};

const API = {
  me: "/auth/me",
  login: "/auth/login",
  register: "/auth/register",
  logout: "/auth/logout",
  updateProfile: "",
  orders: "/orders/mine",
  addAddress: "",
  changePassword: "/auth/change-password",
};

/**
 * Set to true ONLY to preview the signed-in layout while no backend exists.
 * It shows placeholder text, saves nothing, and must be false in production.
 */
const PREVIEW_SIGNED_IN = false;

const WISHLIST_HREF = "/wishlist";
const CART_HREF = "/cart";
const SHOP_HREF = "/shop";

/* ═══════════════════════════════════════════════════════════════
   2. TYPES + API HELPER
   ═══════════════════════════════════════════════════════════════ */

interface Address {
  id?: string;
  name: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
}

interface User {
  name: string;
  email: string;
  phone?: string;
  addresses?: Address[];
}

interface OrderItem {
  name: string;
  qty: number;
}

interface Order {
  id: string | number;
  date?: string;
  created_at?: string;
  status: string;
  total: number;
  items?: OrderItem[];
}

function errorText(err: unknown, fallback: string) {
  if (!(err instanceof Error)) return fallback;
  if (err.message === "NOT_CONFIGURED") return "This feature isn't connected yet, so nothing was saved.";
  if (err.message === "REQUEST_FAILED") return fallback;
  return err.message || fallback;
}

const formatPrice = (n: number) =>
  `${PAGE_TEXT.currency}${n.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

const formatDate = (iso: string) => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? iso
    : d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/* ═══════════════════════════════════════════════════════════════
   3. ICONS
   ═══════════════════════════════════════════════════════════════ */

const ico = {
  width: 20,
  height: 20,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

const UserIcon = () => (
  <svg {...ico}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21a8 8 0 0 1 16 0" />
  </svg>
);
const BoxIcon = () => (
  <svg {...ico}>
    <path d="M21 8 12 3 3 8v8l9 5 9-5Z" />
    <path d="m3 8 9 5 9-5" />
    <path d="M12 13v8" />
  </svg>
);
const PinIcon = () => (
  <svg {...ico}>
    <path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0Z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);
const HeartIcon = () => (
  <svg {...ico}>
    <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
  </svg>
);
const BagIcon = () => (
  <svg {...ico}>
    <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
    <path d="M3 6h18" />
    <path d="M16 10a4 4 0 0 1-8 0" />
  </svg>
);
const LogoutIcon = () => (
  <svg {...ico}>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <path d="m16 17 5-5-5-5" />
    <path d="M21 12H9" />
  </svg>
);
const Spinner = () => (
  <svg
    className="size-4 animate-spin motion-reduce:animate-none"
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden="true"
  >
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.3" strokeWidth="3" />
    <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
  </svg>
);

/* ═══════════════════════════════════════════════════════════════
   4. SHARED UI PIECES
   ═══════════════════════════════════════════════════════════════ */

const focusRing =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#07552F]";

const inputBase =
  "h-12 w-full rounded-md border bg-white px-4 text-[15px] text-[#173D2A] placeholder:text-[#68786B]/70 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#07552F]/25 motion-reduce:transition-none disabled:bg-[#F4F8F1] disabled:text-[#68786B]";

const borderFor = (hasError: boolean) =>
  hasError
    ? "border-[#B3261E] focus:border-[#B3261E]"
    : "border-[#07552F]/30 hover:border-[#07552F]/60 focus:border-[#07552F]";

function Field({
  id,
  label,
  error,
  optional,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  optional?: boolean;
  children: ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-semibold text-[#173D2A]">
        {label}
        {optional && <span className="ml-1.5 font-normal text-[#68786B]">(optional)</span>}
      </label>
      {children}
      {error && (
        <p id={`${id}-error`} role="alert" className="mt-1.5 text-[13px] text-[#B3261E]">
          {error}
        </p>
      )}
    </div>
  );
}

function Banner({ kind, children }: { kind: "success" | "error" | "info"; children: ReactNode }) {
  const styles = {
    success: "border-[#4D9A18]/40 bg-[#EDF3E9] text-[#063D27]",
    error: "border-[#B3261E]/30 bg-[#FDF1F0] text-[#B3261E]",
    info: "border-[#07552F]/25 bg-[#F4F8F1] text-[#173D2A]",
  }[kind];
  return (
    <p
      role={kind === "error" ? "alert" : undefined}
      className={`rounded-md border px-4 py-3 text-sm leading-relaxed ${styles}`}
    >
      {children}
    </p>
  );
}

function PrimaryButton({
  loading,
  children,
  className = "",
}: {
  loading?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <button
      type="submit"
      disabled={loading}
      className={`inline-flex h-12 items-center justify-center gap-2 rounded-md bg-[#07552F] px-8 text-[15px] font-semibold text-white transition-colors duration-200 hover:bg-[#063D27] disabled:cursor-not-allowed disabled:opacity-70 ${focusRing} ${className}`}
    >
      {loading && <Spinner />}
      {children}
    </button>
  );
}

function PanelCard({
  title,
  children,
  action,
}: {
  title: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-xl border-2 border-[#07552F]/40 bg-white p-5 md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-[22px] font-bold leading-snug text-[#07552F] md:text-[26px]">{title}</h2>
        {action}
      </div>
      <div className="mt-5 md:mt-6">{children}</div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   5. SIGNED-OUT VIEW – sign in / create account
   ═══════════════════════════════════════════════════════════════ */

type Status = { kind: "idle" } | { kind: "loading" } | { kind: "error"; text: string };

function AuthPanel({ onDone }: { onDone: () => void }) {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [v, setV] = useState({ name: "", email: "", password: "" });
  const [errors, setErrors] = useState<Partial<Record<"name" | "email" | "password", string>>>({});
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  const set = (k: keyof typeof v) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setV((s) => ({ ...s, [k]: e.target.value }));
    if (errors[k]) setErrors((er) => ({ ...er, [k]: undefined }));
  };

  const switchMode = (m: "login" | "register") => {
    setMode(m);
    setErrors({});
    setStatus({ kind: "idle" });
  };

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (status.kind === "loading") return;

    const found: typeof errors = {};
    if (mode === "register" && v.name.trim().length < 2) found.name = "Please enter your name.";
    if (!EMAIL_RE.test(v.email.trim())) found.email = "Please enter a valid email address.";
    if (mode === "register" ? v.password.length < 8 : v.password.length < 1)
      found.password =
        mode === "register" ? "Password must be at least 8 characters." : "Please enter your password.";
    setErrors(found);
    if (Object.keys(found).length) return;

    setStatus({ kind: "loading" });
    try {
      if (mode === "login") {
        const res = await api<{ role?: string }>(API.login, {
          method: "POST",
          body: JSON.stringify({ email: v.email.trim(), password: v.password }),
        });
        setStatus({ kind: "idle" });
        if (res?.role === "admin") {
          router.push("/admin");
          return;
        }
      } else {
        await api(API.register, {
          method: "POST",
          body: JSON.stringify({ name: v.name.trim(), email: v.email.trim(), password: v.password }),
        });
        setStatus({ kind: "idle" });
      }
      onDone();
    } catch (err) {
      setStatus({
        kind: "error",
        text: errorText(
          err,
          mode === "login"
            ? "We couldn't sign you in. Please check your details and try again."
            : "We couldn't create your account. Please try again."
        ),
      });
    }
  }

  const loading = status.kind === "loading";
  const tab = (m: "login" | "register", label: string) => (
    <button
      type="button"
      role="tab"
      aria-selected={mode === m}
      onClick={() => switchMode(m)}
      className={`h-11 flex-1 rounded-md text-[15px] font-semibold transition-colors duration-200 ${focusRing} ${
        mode === m ? "bg-[#07552F] text-white" : "text-[#07552F] hover:bg-[#EDF3E9]"
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="mx-auto grid max-w-[1000px] overflow-hidden rounded-2xl border-2 border-[#07552F]/40 bg-white lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:border-0 lg:shadow-[0_30px_70px_-30px_rgba(7,85,47,0.45)]">
      {/* Brand panel (laptop only) */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-[#063D27] p-12 lg:flex">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-24 -right-24 size-[280px] rounded-full border-[40px] border-white/5"
        />
        <div>
          <p className="text-[13px] font-semibold tracking-[0.18em] text-[#C7E900]">PURE NATURE. PURE GOODNESS.</p>
          <h2 className="mt-3 text-[30px] font-bold leading-tight text-white">Welcome to UPPILIEES</h2>
          <p className="mt-3 text-[16px] leading-relaxed text-white/80">
            Keep your details, orders and saved products together in one place.
          </p>
        </div>
        <ul className="mt-10 space-y-4 text-[15px] text-white/90">
          {[
            [<UserIcon key="u" />, "Manage your profile"],
            [<BoxIcon key="b" />, "View your orders"],
            [<HeartIcon key="h" />, "Keep your favourites"],
          ].map(([icon, text], i) => (
            <li key={i} className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-full border-2 border-white/30 text-white">
                {icon}
              </span>
              {text}
            </li>
          ))}
        </ul>
      </div>

      {/* Forms */}
      <div className="p-5 md:p-8 lg:p-12">
        <div role="tablist" aria-label="Sign in or create account" className="flex gap-1 rounded-lg bg-[#F4F8F1] p-1">
          {tab("login", "Sign in")}
          {tab("register", "Create account")}
        </div>

        <form onSubmit={onSubmit} noValidate className="mt-6 space-y-5">
          {mode === "register" && (
            <Field id="auth-name" label="Full name" error={errors.name}>
              <input
                id="auth-name"
                type="text"
                autoComplete="name"
                value={v.name}
                onChange={set("name")}
                aria-invalid={!!errors.name}
                aria-describedby={errors.name ? "auth-name-error" : undefined}
                placeholder="Your name"
                className={`${inputBase} ${borderFor(!!errors.name)}`}
              />
            </Field>
          )}

          <Field id="auth-email" label="Email" error={errors.email}>
            <input
              id="auth-email"
              type="email"
              inputMode="email"
              autoComplete="email"
              value={v.email}
              onChange={set("email")}
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? "auth-email-error" : undefined}
              placeholder="you@example.com"
              className={`${inputBase} ${borderFor(!!errors.email)}`}
            />
          </Field>

          <Field id="auth-password" label="Password" error={errors.password}>
            <input
              id="auth-password"
              type="password"
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              value={v.password}
              onChange={set("password")}
              aria-invalid={!!errors.password}
              aria-describedby={errors.password ? "auth-password-error" : undefined}
              placeholder={mode === "register" ? "At least 8 characters" : "Your password"}
              className={`${inputBase} ${borderFor(!!errors.password)}`}
            />
          </Field>

          <PrimaryButton loading={loading} className="w-full">
            {loading ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}
          </PrimaryButton>

          <div aria-live="polite">{status.kind === "error" && <Banner kind="error">{status.text}</Banner>}</div>
        </form>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   6. SIGNED-IN TABS
   ═══════════════════════════════════════════════════════════════ */

type Feedback = { kind: "idle" } | { kind: "loading" } | { kind: "success"; text: string } | { kind: "error"; text: string };

/* ── Profile ── */
function ProfileTab({ user, onUpdated }: { user: User; onUpdated: (u: User) => void }) {
  const [name, setName] = useState(user.name);
  const [phone, setPhone] = useState(user.phone ?? "");
  const [errors, setErrors] = useState<{ name?: string; phone?: string }>({});
  const [fb, setFb] = useState<Feedback>({ kind: "idle" });

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (fb.kind === "loading") return;
    const found: typeof errors = {};
    if (name.trim().length < 2) found.name = "Please enter your name.";
    if (phone.trim() && !/^[+()\d\s-]{7,18}$/.test(phone.trim())) found.phone = "Please enter a valid phone number.";
    setErrors(found);
    if (Object.keys(found).length) return;

    setFb({ kind: "loading" });
    try {
      await api(API.updateProfile, {
        method: "PUT",
        body: JSON.stringify({ name: name.trim(), phone: phone.trim() }),
      });
      onUpdated({ ...user, name: name.trim(), phone: phone.trim() });
      setFb({ kind: "success", text: "Your profile was updated." });
    } catch (err) {
      setFb({ kind: "error", text: errorText(err, "We couldn't update your profile. Please try again.") });
    }
  }

  return (
    <PanelCard title="Profile">
      <form onSubmit={onSubmit} noValidate className="space-y-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field id="pf-name" label="Full name" error={errors.name}>
            <input
              id="pf-name"
              type="text"
              autoComplete="name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setErrors((x) => ({ ...x, name: undefined }));
              }}
              aria-invalid={!!errors.name}
              aria-describedby={errors.name ? "pf-name-error" : undefined}
              className={`${inputBase} ${borderFor(!!errors.name)}`}
            />
          </Field>
          <Field id="pf-email" label="Email">
            <input id="pf-email" type="email" value={user.email} disabled className={`${inputBase} border-[#07552F]/20`} />
          </Field>
        </div>
        <div className="sm:max-w-[calc(50%-10px)]">
          <Field id="pf-phone" label="Phone" optional error={errors.phone}>
            <input
              id="pf-phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value);
                setErrors((x) => ({ ...x, phone: undefined }));
              }}
              aria-invalid={!!errors.phone}
              aria-describedby={errors.phone ? "pf-phone-error" : undefined}
              placeholder="Your phone number"
              className={`${inputBase} ${borderFor(!!errors.phone)}`}
            />
          </Field>
        </div>

        <PrimaryButton loading={fb.kind === "loading"} className="w-full sm:w-auto">
          {fb.kind === "loading" ? "Saving…" : "Save changes"}
        </PrimaryButton>

        <div aria-live="polite">
          {fb.kind === "success" && <Banner kind="success">{fb.text}</Banner>}
          {fb.kind === "error" && <Banner kind="error">{fb.text}</Banner>}
        </div>
      </form>

      <div className="mt-8 border-t border-[#07552F]/15 pt-6">
        <h3 className="text-base font-bold text-[#07552F]">Change Password</h3>
        <ChangePasswordForm />
      </div>
    </PanelCard>
  );
}

function ChangePasswordForm() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fb, setFb] = useState<Feedback>({ kind: "idle" });

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (fb.kind === "loading") return;

    if (newPassword.length < 8) {
      setFb({ kind: "error", text: "New password must be at least 8 characters long." });
      return;
    }

    if (newPassword !== confirmPassword) {
      setFb({ kind: "error", text: "New passwords do not match." });
      return;
    }

    setFb({ kind: "loading" });
    try {
      await api(API.changePassword, {
        method: "PUT",
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      setFb({ kind: "success", text: "Your password was updated." });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setFb({ kind: "error", text: err.message || "Could not change password." });
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate className="mt-4 space-y-4 max-w-md">
      <Field id="cp-current" label="Current password">
        <input
          id="cp-current"
          type="password"
          required
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          className={`${inputBase} border-[#07552F]/30`}
        />
      </Field>

      <Field id="cp-new" label="New password">
        <input
          id="cp-new"
          type="password"
          required
          minLength={8}
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder="Min 8 characters"
          className={`${inputBase} border-[#07552F]/30`}
        />
      </Field>

      <Field id="cp-confirm" label="Confirm new password">
        <input
          id="cp-confirm"
          type="password"
          required
          minLength={8}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className={`${inputBase} border-[#07552F]/30`}
        />
      </Field>

      <PrimaryButton loading={fb.kind === "loading"} className="w-full sm:w-auto">
        {fb.kind === "loading" ? "Updating…" : "Update password"}
      </PrimaryButton>

      <div aria-live="polite">
        {fb.kind === "success" && <Banner kind="success">{fb.text}</Banner>}
        {fb.kind === "error" && <Banner kind="error">{fb.text}</Banner>}
      </div>
    </form>
  );
}

/* ── Orders ── */
function OrdersTab({ preview }: { preview: boolean }) {
  const [state, setState] = useState<
    { kind: "loading" } | { kind: "error"; text: string } | { kind: "ready"; orders: Order[] }
  >({ kind: "loading" });

  useEffect(() => {
    let alive = true;
    if (preview) {
      setState({ kind: "ready", orders: [] });
      return;
    }
    api<Order[] | { orders: Order[] }>(API.orders)
      .then((data) => {
        if (!alive) return;
        const list = Array.isArray(data) ? data : data?.orders ?? [];
        setState({ kind: "ready", orders: list });
      })
      .catch((err) => {
        if (!alive) return;
        setState({
          kind: "error",
          text:
            err instanceof Error && err.message === "NOT_CONFIGURED"
              ? "Order history isn't connected yet."
              : errorText(err, "We couldn't load your orders. Please try again."),
        });
      });
    return () => {
      alive = false;
    };
  }, [preview]);

  return (
    <PanelCard title="My Orders">
      {state.kind === "loading" && (
        <div className="space-y-3" aria-hidden="true">
          {[0, 1].map((i) => (
            <div key={i} className="h-[88px] animate-pulse rounded-lg bg-[#EDF3E9] motion-reduce:animate-none" />
          ))}
        </div>
      )}

      {state.kind === "error" && <Banner kind="info">{state.text}</Banner>}

      {state.kind === "ready" && state.orders.length === 0 && (
        <div className="rounded-lg bg-[#FAFBF6] px-4 py-10 text-center">
          <div className="mx-auto flex size-[64px] items-center justify-center rounded-full border-2 border-[#07552F]/40 bg-white text-[#07552F]">
            <BoxIcon />
          </div>
          <p className="mt-4 text-[17px] font-bold text-[#07552F]">No orders yet</p>
          <p className="mt-1 text-[15px] text-[#68786B]">When you place an order, it will show up here.</p>
          <Link
            href={SHOP_HREF}
            className={`mt-5 inline-flex h-11 items-center justify-center rounded-md bg-[#07552F] px-6 text-[15px] font-semibold text-white transition-colors hover:bg-[#063D27] ${focusRing}`}
          >
            Start Shopping
          </Link>
        </div>
      )}

      {state.kind === "ready" && state.orders.length > 0 && (
        <ul className="space-y-3">
          {state.orders.map((o) => (
            <li key={o.id} className="rounded-lg border border-[#E2EBDD] bg-[#FAFBF6] p-4 md:p-5">
              <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
                <p className="text-[15px] font-bold text-[#07552F]">Order #{o.id}</p>
                <span className="rounded-full bg-[#EDF3E9] px-3 py-1 text-[13px] font-semibold text-[#063D27]">
                  {o.status}
                </span>
              </div>
              <p className="mt-1 text-sm text-[#68786B]">{formatDate(o.created_at || o.date || "")}</p>
              {o.items && o.items.length > 0 && (
                <p className="mt-2 text-[15px] text-[#173D2A]">
                  {o.items.map((i) => `${i.name} × ${i.qty}`).join(", ")}
                </p>
              )}
              <p className="mt-2 text-[15px] font-bold text-[#173D2A]">{formatPrice(o.total)}</p>
            </li>
          ))}
        </ul>
      )}
    </PanelCard>
  );
}

/* ── Addresses ── */
const EMPTY_ADDRESS: Address = { name: "", phone: "", line1: "", line2: "", city: "", state: "", pincode: "" };

function AddressesTab({ user, onChanged }: { user: User; onChanged: () => void }) {
  const [adding, setAdding] = useState(false);
  const [v, setV] = useState<Address>(EMPTY_ADDRESS);
  const [errors, setErrors] = useState<Partial<Record<keyof Address, string>>>({});
  const [fb, setFb] = useState<Feedback>({ kind: "idle" });
  const addresses = user.addresses ?? [];

  const set = (k: keyof Address) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setV((s) => ({ ...s, [k]: e.target.value }));
    if (errors[k]) setErrors((er) => ({ ...er, [k]: undefined }));
  };

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (fb.kind === "loading") return;
    const found: typeof errors = {};
    if (v.name.trim().length < 2) found.name = "Please enter a name.";
    if (!/^[+()\d\s-]{7,18}$/.test(v.phone.trim())) found.phone = "Please enter a valid phone number.";
    if (v.line1.trim().length < 3) found.line1 = "Please enter the address.";
    if (v.city.trim().length < 2) found.city = "Please enter the city.";
    if (v.state.trim().length < 2) found.state = "Please enter the state.";
    if (!/^\d{6}$/.test(v.pincode.trim())) found.pincode = "Enter a 6-digit pincode.";
    setErrors(found);
    if (Object.keys(found).length) return;

    setFb({ kind: "loading" });
    try {
      await api(API.addAddress, { method: "POST", body: JSON.stringify(v) });
      setV(EMPTY_ADDRESS);
      setAdding(false);
      setFb({ kind: "success", text: "Your address was saved." });
      onChanged();
    } catch (err) {
      setFb({ kind: "error", text: errorText(err, "We couldn't save your address. Please try again.") });
    }
  }

  const f = (id: keyof Address, label: string, opts?: { optional?: boolean; inputMode?: "tel" | "numeric"; auto?: string }) => (
    <Field id={`ad-${id}`} label={label} optional={opts?.optional} error={errors[id]}>
      <input
        id={`ad-${id}`}
        type="text"
        inputMode={opts?.inputMode}
        autoComplete={opts?.auto}
        value={(v[id] as string) ?? ""}
        onChange={set(id)}
        aria-invalid={!!errors[id]}
        aria-describedby={errors[id] ? `ad-${id}-error` : undefined}
        className={`${inputBase} ${borderFor(!!errors[id])}`}
      />
    </Field>
  );

  return (
    <PanelCard
      title="Addresses"
      action={
        !adding && (
          <button
            type="button"
            onClick={() => {
              setAdding(true);
              setFb({ kind: "idle" });
            }}
            className={`inline-flex h-11 items-center justify-center rounded-md border-2 border-[#07552F] bg-white px-5 text-[15px] font-semibold text-[#07552F] transition-colors hover:bg-[#07552F] hover:text-white ${focusRing}`}
          >
            Add address
          </button>
        )
      }
    >
      <div aria-live="polite" className="empty:hidden">
        {fb.kind === "success" && <div className="mb-4"><Banner kind="success">{fb.text}</Banner></div>}
        {fb.kind === "error" && !adding && <div className="mb-4"><Banner kind="error">{fb.text}</Banner></div>}
      </div>

      {adding ? (
        <form onSubmit={onSubmit} noValidate className="space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">
            {f("name", "Full name", { auto: "name" })}
            {f("phone", "Phone", { inputMode: "tel", auto: "tel" })}
          </div>
          {f("line1", "Address line 1", { auto: "address-line1" })}
          {f("line2", "Address line 2", { optional: true, auto: "address-line2" })}
          <div className="grid gap-5 sm:grid-cols-3">
            {f("city", "City", { auto: "address-level2" })}
            {f("state", "State", { auto: "address-level1" })}
            {f("pincode", "Pincode", { inputMode: "numeric", auto: "postal-code" })}
          </div>

          <div className="flex flex-wrap gap-3">
            <PrimaryButton loading={fb.kind === "loading"} className="w-full sm:w-auto">
              {fb.kind === "loading" ? "Saving…" : "Save address"}
            </PrimaryButton>
            <button
              type="button"
              onClick={() => {
                setAdding(false);
                setErrors({});
                setFb({ kind: "idle" });
              }}
              className={`inline-flex h-12 w-full items-center justify-center rounded-md border-2 border-[#07552F]/40 px-8 text-[15px] font-semibold text-[#07552F] transition-colors hover:border-[#07552F] sm:w-auto ${focusRing}`}
            >
              Cancel
            </button>
          </div>

          <div aria-live="polite">{fb.kind === "error" && <Banner kind="error">{fb.text}</Banner>}</div>
        </form>
      ) : addresses.length === 0 ? (
        <div className="rounded-lg bg-[#FAFBF6] px-4 py-10 text-center">
          <div className="mx-auto flex size-[64px] items-center justify-center rounded-full border-2 border-[#07552F]/40 bg-white text-[#07552F]">
            <PinIcon />
          </div>
          <p className="mt-4 text-[17px] font-bold text-[#07552F]">No saved addresses</p>
          <p className="mt-1 text-[15px] text-[#68786B]">Add an address to make checkout quicker.</p>
        </div>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {addresses.map((a, i) => (
            <li key={a.id ?? i} className="rounded-lg border border-[#E2EBDD] bg-[#FAFBF6] p-4 text-[15px] leading-relaxed text-[#173D2A]">
              <p className="font-bold text-[#07552F]">{a.name}</p>
              <p>{a.line1}</p>
              {a.line2 && <p>{a.line2}</p>}
              <p>
                {a.city}, {a.state} {a.pincode}
              </p>
              <p className="text-[#68786B]">{a.phone}</p>
            </li>
          ))}
        </ul>
      )}
    </PanelCard>
  );
}

/* ═══════════════════════════════════════════════════════════════
   7. SIGNED-IN LAYOUT
   Mobile: scrollable pill tabs on top. Laptop: sidebar card on the left.
   ═══════════════════════════════════════════════════════════════ */

type TabId = "profile" | "orders" | "addresses";

function Dashboard({
  user,
  preview,
  onUserChange,
  onRefresh,
  onSignOut,
}: {
  user: User;
  preview: boolean;
  onUserChange: (u: User) => void;
  onRefresh: () => void;
  onSignOut: () => Promise<void>;
}) {
  const [tab, setTab] = useState<TabId>("profile");
  const [signingOut, setSigningOut] = useState(false);
  const [outError, setOutError] = useState("");

  const tabs: { id: TabId; label: string; icon: ReactNode }[] = [
    { id: "profile", label: "Profile", icon: <UserIcon /> },
    { id: "orders", label: "Orders", icon: <BoxIcon /> },
    { id: "addresses", label: "Addresses", icon: <PinIcon /> },
  ];

  async function signOut() {
    setSigningOut(true);
    setOutError("");
    try {
      await onSignOut();
    } catch (err) {
      setOutError(errorText(err, "We couldn't sign you out. Please try again."));
      setSigningOut(false);
    }
  }

  const itemBase = `flex shrink-0 items-center gap-2.5 rounded-md px-4 py-3 text-[15px] font-semibold transition-colors duration-200 ${focusRing}`;
  const initial = (user.name.trim()[0] ?? "U").toUpperCase();

  return (
    <div className="grid items-start gap-5 lg:grid-cols-[300px_minmax(0,1fr)] lg:gap-10">
      {/* Sidebar / tabs */}
      <aside className="lg:sticky lg:top-28">
        {/* Identity (laptop) */}
        <div className="hidden rounded-xl border-2 border-[#07552F]/40 bg-white p-6 lg:block">
          <div className="flex items-center gap-4">
            <span className="flex size-14 shrink-0 items-center justify-center rounded-full bg-[#07552F] text-xl font-bold text-white">
              {initial}
            </span>
            <div className="min-w-0">
              <p className="truncate text-[17px] font-bold text-[#07552F]">{user.name}</p>
              <p className="truncate text-sm text-[#68786B]">{user.email}</p>
            </div>
          </div>
        </div>

        <nav
          aria-label="Account sections"
          className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:mx-0 lg:mt-4 lg:flex-col lg:gap-1 lg:overflow-visible lg:rounded-xl lg:border-2 lg:border-[#07552F]/40 lg:bg-white lg:p-3"
        >
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              aria-current={tab === t.id ? "page" : undefined}
              className={`${itemBase} ${
                tab === t.id
                  ? "bg-[#07552F] text-white"
                  : "border-2 border-[#07552F]/30 bg-white text-[#07552F] hover:bg-[#EDF3E9] lg:border-0 lg:bg-transparent"
              }`}
            >
              {t.icon}
              {t.label}
            </button>
          ))}

          <Link href={WISHLIST_HREF} className={`${itemBase} border-2 border-[#07552F]/30 bg-white text-[#07552F] hover:bg-[#EDF3E9] lg:border-0 lg:bg-transparent`}>
            <HeartIcon />
            Wishlist
          </Link>
          <Link href={CART_HREF} className={`${itemBase} border-2 border-[#07552F]/30 bg-white text-[#07552F] hover:bg-[#EDF3E9] lg:border-0 lg:bg-transparent`}>
            <BagIcon />
            Bag
          </Link>
          <button
            type="button"
            onClick={signOut}
            disabled={signingOut}
            className={`${itemBase} border-2 border-[#07552F]/30 bg-white text-[#68786B] hover:bg-[#EDF3E9] hover:text-[#07552F] disabled:opacity-60 lg:border-0 lg:bg-transparent`}
          >
            <LogoutIcon />
            {signingOut ? "Signing out…" : "Sign out"}
          </button>
        </nav>

        {outError && (
          <div className="mt-3">
            <Banner kind="error">{outError}</Banner>
          </div>
        )}
      </aside>

      {/* Content */}
      <div className="min-w-0 space-y-4">
        {preview && (
          <Banner kind="info">
            Preview mode: this is placeholder text to check the layout. Nothing here is saved.
          </Banner>
        )}
        {tab === "profile" && <ProfileTab key={user.email} user={user} onUpdated={onUserChange} />}
        {tab === "orders" && <OrdersTab preview={preview} />}
        {tab === "addresses" && <AddressesTab user={user} onChanged={onRefresh} />}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   8. PAGE
   ═══════════════════════════════════════════════════════════════ */

const PREVIEW_USER: User = { name: "Your Name", email: "you@example.com", phone: "", addresses: [] };

export default function AccountPage() {
  // undefined = still checking, null = signed out
  const [user, setUser] = useState<User | null | undefined>(undefined);

  const loadUser = useCallback(async () => {
    if (PREVIEW_SIGNED_IN) {
      setUser(PREVIEW_USER);
      return;
    }
    if (!API.me) {
      setUser(null);
      return;
    }
    try {
      const me = await api<User>(API.me);
      setUser(me && typeof me.email === "string" ? me : null);
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const signOut = async () => {
    if (!PREVIEW_SIGNED_IN) await api(API.logout, { method: "POST" });
    setUser(null);
  };

  const signedIn = !!user;

  return (
    <main>
      {/* Title band */}
      <section
        aria-labelledby="account-heading"
        className="bg-[#F4F8F1] px-4 py-[32px] text-center md:px-[3.3vw] md:py-[48px] lg:py-[60px]"
      >
        <h1
          id="account-heading"
          className="text-[30px] font-bold leading-tight tracking-tight text-[#07552F] md:text-[40px] lg:text-[46px]"
        >
          {PAGE_TEXT.heading}
        </h1>
        {user === undefined ? null : signedIn ? (
          <p className="mt-2 text-[15px] text-[#68786B] md:text-base">Hello, {user.name.split(" ")[0]}</p>
        ) : (
          <p className="mx-auto mt-2 max-w-[460px] text-[15px] leading-relaxed text-[#68786B] md:text-base">
            {PAGE_TEXT.signedOutSubheading}
          </p>
        )}
      </section>

      <section className="bg-[#FAFBF6] px-4 py-[32px] md:px-[3.3vw] md:py-[56px] lg:py-[80px]">
        <div className="mx-auto max-w-[1280px]">
          {user === undefined ? (
            <div className="mx-auto max-w-[1000px]" aria-hidden="true">
              <div className="h-[380px] animate-pulse rounded-2xl bg-[#EDF3E9] motion-reduce:animate-none" />
            </div>
          ) : user ? (
            <Dashboard
              user={user}
              preview={PREVIEW_SIGNED_IN}
              onUserChange={setUser}
              onRefresh={loadUser}
              onSignOut={signOut}
            />
          ) : (
            <AuthPanel onDone={loadUser} />
          )}
        </div>
      </section>
    </main>
  );
}