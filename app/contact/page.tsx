"use client";

/*
  app/contact/page.tsx  – SINGLE-FILE CONTACT PAGE
  (use src/app/contact/page.tsx if your project has a src folder)
  Navbar / AnnouncementBar / Footer come from your existing layout.
  Tip: client pages can't export `metadata`. To set the tab title, add
  `export const metadata = { title: "Contact Us | UPPILIEES" }` in
  app/contact/layout.tsx.
*/

import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { api } from "@/lib/api";

/* ═══════════════════════════════════════════════════════════════
   1. CONFIG – edit ONLY this part to change the page content

   ⚠ No contact details are invented. Leave a value as "" and that
     card is simply hidden. Fill in only REAL details.

   - Email / phone / address / hours → CONTACT_INFO
   - Instagram / Facebook links      → SOCIAL_LINKS (full https:// URLs)
   - Form delivery                   → CONTACT_ENDPOINT (see section 3)
   - Enquiry types in the dropdown   → TOPICS
   ═══════════════════════════════════════════════════════════════ */

const PAGE_TEXT = {
  eyebrow: "GET IN TOUCH",
  heading: "We'd Love to Hear From You",
  subheading:
    "Have a question about our skincare and haircare essentials? Send us a message and we'll get back to you.",
  formHeading: "Send Us a Message",
  infoHeading: "Contact Details",
  noInfoNote:
    "Use the form and our team will reply to your message.",
  submitText: "Send Message",
};

/**
 * HERO IMAGE – paste your image here.
 *  - Local file:  put it in /public/images and use "/images/contact-hero.jpg"
 *  - Remote file: use a full "https://..." URL (and add the host to
 *    `images.remotePatterns` in next.config.js)
 * Leave "" to show a plain green background instead.
 * Use a wide product / botanical photo (no people). Suggested: 1920 x 700px.
 */
const HERO_IMAGE = {
  src: "/images/herosection2.png", // ← IMAGE URL / PATH GOES HERE
  alt: "UPPILIEES skincare and haircare products",
  position: "center", // object-position, e.g. "center", "top", "left center"
};

const CONTACT_INFO = {
  email: "", // ← real email, e.g. "care@yourdomain.com"
  phone: "", // ← real phone number
  address: "", // ← real address
  hours: "", // ← e.g. "Mon – Sat, 10 AM – 6 PM"
};

const SOCIAL_LINKS = {
  instagram: "", // ← official Instagram URL
  facebook: "", // ← official Facebook URL
};

/**
 * Where the form is sent. Set this to your real API route or form service,
 * e.g. "/api/contact". Leave "" until it exists.
 *   - endpoint set          → form is POSTed as JSON
 *   - endpoint "" + email   → opens the visitor's email app with the message filled in
 *   - both empty            → shows an honest "not connected yet" message
 */
const CONTACT_ENDPOINT = "";

const TOPICS = [
  "Product question",
  "Order enquiry",
  "Feedback",
  "Wholesale / collaboration",
  "Something else",
];

/* ═══════════════════════════════════════════════════════════════
   2. TYPES + VALIDATION
   ═══════════════════════════════════════════════════════════════ */

interface FormValues {
  name: string;
  email: string;
  phone: string;
  topic: string;
  message: string;
  website: string; // honeypot – real visitors never fill this
}

type FormErrors = Partial<Record<keyof FormValues, string>>;

const EMPTY_FORM: FormValues = {
  name: "",
  email: "",
  phone: "",
  topic: TOPICS[0],
  message: "",
  website: "",
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function validate(v: FormValues): FormErrors {
  const e: FormErrors = {};
  if (v.name.trim().length < 2) e.name = "Please enter your name.";
  if (!EMAIL_RE.test(v.email.trim())) e.email = "Please enter a valid email address.";
  if (v.phone.trim() && !/^[+()\d\s-]{7,18}$/.test(v.phone.trim()))
    e.phone = "Please enter a valid phone number.";
  if (v.message.trim().length < 10)
    e.message = "Please write a message of at least 10 characters.";
  return e;
}

/* ═══════════════════════════════════════════════════════════════
   3. SUBMISSION LOGIC (kept separate so it is easy to replace)
   Never reports success unless the message really was sent / handed off.
   ═══════════════════════════════════════════════════════════════ */

type SubmitResult = "sent" | "mailto";

async function submitContact(values: FormValues): Promise<SubmitResult> {
  const payload = {
    name: values.name.trim(),
    email: values.email.trim(),
    message: values.message.trim(),
  };

  await api("/contact", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return "sent";
}

/* ═══════════════════════════════════════════════════════════════
   4. FADE-IN ON SCROLL (respects reduced motion)
   ═══════════════════════════════════════════════════════════════ */

function useInView<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced || typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          io.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return { ref, visible };
}

function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const { ref, visible } = useInView<HTMLDivElement>();
  return (
    <div
      ref={ref}
      style={{ transitionDelay: visible ? `${delay}ms` : "0ms" }}
      className={`transition-all duration-700 ease-out motion-reduce:transition-none ${
        visible
          ? "translate-y-0 opacity-100"
          : "translate-y-4 opacity-0 motion-reduce:translate-y-0 motion-reduce:opacity-100"
      } ${className}`}
    >
      {children}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   5. ICONS
   ═══════════════════════════════════════════════════════════════ */

const iconProps = {
  width: 22,
  height: 22,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.7,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

const MailIcon = () => (
  <svg {...iconProps}>
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="m3 7 9 6 9-6" />
  </svg>
);
const PhoneIcon = () => (
  <svg {...iconProps}>
    <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.2a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2Z" />
  </svg>
);
const PinIcon = () => (
  <svg {...iconProps}>
    <path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0Z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);
const ClockIcon = () => (
  <svg {...iconProps}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </svg>
);
const InstagramIcon = () => (
  <svg {...iconProps}>
    <rect x="3" y="3" width="18" height="18" rx="5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17.5" cy="6.5" r="0.8" fill="currentColor" />
  </svg>
);
const FacebookIcon = () => (
  <svg {...iconProps}>
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3Z" />
  </svg>
);

/* ═══════════════════════════════════════════════════════════════
   6. FORM FIELD WRAPPER
   ═══════════════════════════════════════════════════════════════ */

const inputBase =
  "w-full rounded-md border bg-white px-4 text-[15px] text-[#173D2A] placeholder:text-[#68786B]/70 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#07552F]/25 motion-reduce:transition-none";

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

/* ═══════════════════════════════════════════════════════════════
   7. CONTACT FORM
   ═══════════════════════════════════════════════════════════════ */

type Status =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "success"; text: string }
  | { kind: "error"; text: string };

function ContactForm() {
  const [values, setValues] = useState<FormValues>(EMPTY_FORM);
  const [errors, setErrors] = useState<FormErrors>({});
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  const set =
    (key: keyof FormValues) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      setValues((v) => ({ ...v, [key]: e.target.value }));
      if (errors[key]) setErrors((er) => ({ ...er, [key]: undefined }));
    };

  const borderFor = (key: keyof FormValues) =>
    errors[key]
      ? "border-[#B3261E] focus:border-[#B3261E]"
      : "border-[#07552F]/30 hover:border-[#07552F]/60 focus:border-[#07552F]";

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (status.kind === "loading") return;

    // Bots fill hidden fields – pretend nothing happened, send nothing.
    if (values.website) return;

    const found = validate(values);
    setErrors(found);
    if (Object.keys(found).length > 0) {
      setStatus({ kind: "idle" });
      return;
    }

    setStatus({ kind: "loading" });
    try {
      const result = await submitContact(values);
      setValues(EMPTY_FORM);
      setStatus({
        kind: "success",
        text:
          result === "sent"
            ? "Thank you! Your message has been sent. We'll get back to you soon."
            : "Your email app should now open with your message filled in. Press send there to reach us.",
      });
    } catch (err) {
      const notConfigured = err instanceof Error && err.message === "NOT_CONFIGURED";
      setStatus({
        kind: "error",
        text: notConfigured
          ? "The contact form isn't connected yet, so your message was not sent."
          : "Something went wrong and your message was not sent. Please try again.",
      });
    }
  }

  const loading = status.kind === "loading";

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <Field id="contact-name" label="Full name" error={errors.name}>
          <input
            id="contact-name"
            type="text"
            autoComplete="name"
            value={values.name}
            onChange={set("name")}
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? "contact-name-error" : undefined}
            placeholder="Your name"
            className={`${inputBase} h-12 ${borderFor("name")}`}
          />
        </Field>

        <Field id="contact-email" label="Email" error={errors.email}>
          <input
            id="contact-email"
            type="email"
            autoComplete="email"
            inputMode="email"
            value={values.email}
            onChange={set("email")}
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? "contact-email-error" : undefined}
            placeholder="you@example.com"
            className={`${inputBase} h-12 ${borderFor("email")}`}
          />
        </Field>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field id="contact-phone" label="Phone" optional error={errors.phone}>
          <input
            id="contact-phone"
            type="tel"
            autoComplete="tel"
            inputMode="tel"
            value={values.phone}
            onChange={set("phone")}
            aria-invalid={!!errors.phone}
            aria-describedby={errors.phone ? "contact-phone-error" : undefined}
            placeholder="Your phone number"
            className={`${inputBase} h-12 ${borderFor("phone")}`}
          />
        </Field>

        <Field id="contact-topic" label="What is it about?">
          <select
            id="contact-topic"
            value={values.topic}
            onChange={set("topic")}
            className={`${inputBase} h-12 ${borderFor("topic")}`}
          >
            {TOPICS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <Field id="contact-message" label="Message" error={errors.message}>
        <textarea
          id="contact-message"
          rows={5}
          value={values.message}
          onChange={set("message")}
          aria-invalid={!!errors.message}
          aria-describedby={errors.message ? "contact-message-error" : undefined}
          placeholder="How can we help you?"
          className={`${inputBase} resize-y py-3 ${borderFor("message")}`}
        />
      </Field>

      {/* Honeypot – hidden from people and screen readers */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label htmlFor="contact-website">Leave this field empty</label>
        <input
          id="contact-website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={values.website}
          onChange={set("website")}
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-md bg-[#07552F] px-8 text-[15px] font-semibold text-white transition-colors duration-200 hover:bg-[#063D27] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#07552F] disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
      >
        {loading ? (
          <>
            <svg
              className="size-4 animate-spin motion-reduce:animate-none"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.3" strokeWidth="3" />
              <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
            </svg>
            Sending…
          </>
        ) : (
          PAGE_TEXT.submitText
        )}
      </button>

      {/* Live feedback */}
      <div aria-live="polite">
        {status.kind === "success" && (
          <p className="rounded-md border border-[#4D9A18]/40 bg-[#EDF3E9] px-4 py-3 text-sm leading-relaxed text-[#063D27]">
            {status.text}
          </p>
        )}
        {status.kind === "error" && (
          <p
            role="alert"
            className="rounded-md border border-[#B3261E]/30 bg-[#FDF1F0] px-4 py-3 text-sm leading-relaxed text-[#B3261E]"
          >
            {status.text}
          </p>
        )}
      </div>
    </form>
  );
}

/* ═══════════════════════════════════════════════════════════════
   8. INFO CARD + SOCIAL LINK
   ═══════════════════════════════════════════════════════════════ */

function InfoCard({
  icon,
  label,
  value,
  href,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  href?: string;
}) {
  const content = (
    <>
      <span className="flex size-11 shrink-0 items-center justify-center rounded-full border-2 border-[#07552F]/40 bg-white text-[#07552F] transition-colors duration-300 group-hover:border-[#07552F] group-hover:bg-[#07552F] group-hover:text-white motion-reduce:transition-none lg:border-white/30 lg:bg-transparent lg:text-white lg:group-hover:border-white lg:group-hover:bg-white lg:group-hover:text-[#063D27]">
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-[#07552F] lg:text-[#C7E900]">{label}</span>
        <span className="mt-0.5 block break-words text-[15px] leading-relaxed text-[#173D2A] lg:text-white">
          {value}
        </span>
      </span>
    </>
  );

  const cls =
    "group flex items-start gap-4 rounded-xl border-2 border-[#07552F]/20 bg-white p-4 transition-colors duration-300 motion-reduce:transition-none lg:border-white/15 lg:bg-white/5";

  return href ? (
    <a
      href={href}
      className={`${cls} hover:border-[#07552F] lg:hover:border-white/60 lg:focus-visible:outline-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#07552F]`}
    >
      {content}
    </a>
  ) : (
    <div className={cls}>{content}</div>
  );
}

function SocialLink({ href, label, icon }: { href: string; label: string; icon: ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="flex size-11 items-center justify-center rounded-full border-2 border-[#07552F]/40 bg-white text-[#07552F] transition-colors duration-300 hover:border-[#07552F] hover:bg-[#07552F] hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#07552F] motion-reduce:transition-none lg:border-white/30 lg:bg-transparent lg:text-white lg:hover:border-white lg:hover:bg-white lg:hover:text-[#063D27] lg:focus-visible:outline-white"
    >
      {icon}
    </a>
  );
}

/* ═══════════════════════════════════════════════════════════════
   9. SECTION – the full contact page content
   Mobile: stacked (form first, details after). Desktop: details left, form right.
   ═══════════════════════════════════════════════════════════════ */

export default function ContactPage() {
  const infoItems = [
    CONTACT_INFO.email && {
      icon: <MailIcon />,
      label: "Email",
      value: CONTACT_INFO.email,
      href: `mailto:${CONTACT_INFO.email}`,
    },
    CONTACT_INFO.phone && {
      icon: <PhoneIcon />,
      label: "Phone",
      value: CONTACT_INFO.phone,
      href: `tel:${CONTACT_INFO.phone.replace(/[^\d+]/g, "")}`,
    },
    CONTACT_INFO.address && {
      icon: <PinIcon />,
      label: "Address",
      value: CONTACT_INFO.address,
      href: undefined,
    },
    CONTACT_INFO.hours && {
      icon: <ClockIcon />,
      label: "Working hours",
      value: CONTACT_INFO.hours,
      href: undefined,
    },
  ].filter(Boolean) as {
    icon: ReactNode;
    label: string;
    value: string;
    href?: string;
  }[];

  const socials = [
    SOCIAL_LINKS.instagram && { href: SOCIAL_LINKS.instagram, label: "Instagram", icon: <InstagramIcon /> },
    SOCIAL_LINKS.facebook && { href: SOCIAL_LINKS.facebook, label: "Facebook", icon: <FacebookIcon /> },
  ].filter(Boolean) as { href: string; label: string; icon: ReactNode }[];

  return (
    <main>
      {/* ── Hero with image ── */}
      <section
        aria-labelledby="contact-heading"
        className="relative isolate flex min-h-[230px] items-center justify-center overflow-hidden bg-[#063D27] px-4 py-[44px] text-center md:min-h-[300px] md:px-[3.3vw] md:py-[64px] lg:min-h-[400px] lg:py-[90px]"
      >
        {HERO_IMAGE.src ? (
          <>
            <Image
              src={HERO_IMAGE.src}
              alt={HERO_IMAGE.alt}
              fill
              priority
              sizes="100vw"
              quality={85}
              className="-z-20 object-cover"
              style={{ objectPosition: HERO_IMAGE.position }}
            />
            {/* Dark-green overlay so the white text is always readable */}
            <div className="absolute inset-0 -z-10 bg-gradient-to-b from-[#063D27]/80 via-[#063D27]/65 to-[#063D27]/85" />
          </>
        ) : (
          <div className="absolute inset-0 -z-10 bg-gradient-to-br from-[#063D27] to-[#07552F]" />
        )}

        <div className="mx-auto max-w-[680px]">
          <p className="text-sm font-bold tracking-[0.18em] text-[#C7E900]">
            {PAGE_TEXT.eyebrow}
          </p>
          <h1
            id="contact-heading"
            className="mt-3 text-[32px] font-bold leading-tight tracking-tight text-white md:text-[42px] lg:text-[54px]"
          >
            {PAGE_TEXT.heading}
          </h1>
          <p className="mt-3 text-base font-normal leading-relaxed text-white/90 md:text-[17px] lg:mt-4 lg:text-[19px]">
            {PAGE_TEXT.subheading}
          </p>
        </div>
      </section>

      {/* ── Form + details ── */}
      <section className="relative overflow-hidden bg-[#FAFBF6] px-4 py-[40px] md:px-[3.3vw] md:py-[64px] lg:py-[100px]">
        {/* Soft decorative shapes (laptop only) */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-24 top-10 hidden size-[340px] rounded-full bg-[#EDF3E9] lg:block"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-20 bottom-0 hidden size-[260px] rounded-full bg-[#F4F8F1] lg:block"
        />

        <div className="relative mx-auto grid max-w-[1280px] gap-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-0 lg:overflow-hidden lg:rounded-2xl lg:shadow-[0_30px_70px_-30px_rgba(7,85,47,0.45)]">
          {/* Form (first on mobile, right on laptop) */}
          <Reveal className="lg:order-2 lg:h-full">
            <div className="rounded-xl border-2 border-[#07552F]/40 bg-white p-5 md:p-8 lg:h-full lg:rounded-none lg:border-0 lg:p-12">
              <h2 className="text-[24px] font-bold leading-snug text-[#07552F] md:text-[28px] lg:text-[32px]">
                {PAGE_TEXT.formHeading}
              </h2>
              <p className="mt-1.5 hidden text-base font-normal leading-relaxed text-[#68786B] lg:block">
                Fill in the form below and we&apos;ll reply to your message.
              </p>
              <div className="relative mt-5 md:mt-6">
                <ContactForm />
              </div>
            </div>
          </Reveal>

          {/* Details (below the form on mobile, dark green panel on laptop) */}
          <Reveal
            delay={100}
            className="relative lg:order-1 lg:flex lg:h-full lg:flex-col lg:overflow-hidden lg:bg-[#063D27] lg:p-12"
          >
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -bottom-24 -right-24 hidden size-[280px] rounded-full border-[40px] border-white/5 lg:block"
            />

            <p className="hidden text-sm font-bold tracking-[0.18em] text-[#C7E900] lg:block">
              PURE NATURE. PURE GOODNESS.
            </p>
            <h2 className="text-[24px] font-bold leading-snug text-[#07552F] md:text-[28px] lg:mt-3 lg:text-[32px] lg:text-white">
              {PAGE_TEXT.infoHeading}
            </h2>

            {infoItems.length > 0 ? (
              <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:mt-8 lg:grid-cols-1">
                {infoItems.map((item) => (
                  <InfoCard key={item.label} {...item} />
                ))}
              </div>
            ) : (
              <p className="mt-4 max-w-[420px] text-[15px] leading-relaxed text-[#68786B] md:text-base lg:text-white/80">
                {PAGE_TEXT.noInfoNote}
              </p>
            )}

            {socials.length > 0 && (
              <div className="mt-6 lg:mt-8">
                <p className="text-sm font-semibold text-[#07552F] lg:text-[#C7E900]">Follow us</p>
                <div className="mt-3 flex gap-3">
                  {socials.map((s) => (
                    <SocialLink key={s.label} {...s} />
                  ))}
                </div>
              </div>
            )}

            <p className="mt-7 text-[15px] leading-relaxed text-[#68786B] lg:mt-auto lg:pt-10 lg:text-white/80">
              Looking for something in particular?{" "}
              <Link
                href="/products"
                className="font-semibold text-[#07552F] underline-offset-4 transition-colors hover:text-[#4D9A18] hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#07552F] lg:text-white lg:hover:text-[#C7E900] lg:focus-visible:outline-white"
              >
                Browse all products
              </Link>
            </p>
          </Reveal>
        </div>
      </section>

      {/* ── Closing band (laptop only) ── */}
      <section className="hidden bg-[#F4F8F1] px-[3.3vw] py-[64px] text-center lg:block">
        <div className="mx-auto max-w-[640px]">
          <h2 className="text-[34px] font-bold leading-tight tracking-tight text-[#07552F]">
            Explore Our Collections
          </h2>
          <p className="mt-3 text-[18px] font-normal leading-relaxed text-[#68786B]">
            Discover everyday essentials for your skincare and haircare routine.
          </p>
          <Link
            href="/products"
            className="mt-7 inline-flex h-12 items-center justify-center rounded-md border-2 border-[#07552F] bg-white px-9 text-[15px] font-semibold text-[#07552F] transition-colors duration-200 hover:bg-[#07552F] hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#07552F]"
          >
            Shop All
          </Link>
        </div>
      </section>
    </main>
  );
}