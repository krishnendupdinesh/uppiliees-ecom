"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { getCart, saveCart, type CartItem } from "@/lib/cart";

const focusRing =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#07552F]";
const inputBase =
  "h-12 w-full rounded-md border bg-white px-4 text-[15px] text-[#173D2A] placeholder:text-[#68786B]/70 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#07552F]/25 motion-reduce:transition-none disabled:bg-[#F4F8F1] disabled:text-[#68786B]";

const borderFor = (hasError: boolean) =>
  hasError
    ? "border-[#B3261E] focus:border-[#B3261E]"
    : "border-[#07552F]/30 hover:border-[#07552F]/60 focus:border-[#07552F]";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export default function CheckoutPage() {
  const router = useRouter();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [confirmedOrder, setConfirmedOrder] = useState<{ id: number | string; total: number } | null>(null);
  const [serverError, setServerError] = useState("");

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
  });
  const [errors, setErrors] = useState<Partial<Record<keyof typeof form, string>>>({});

  useEffect(() => {
    // Check if user is logged in
    api("/auth/me")
      .then((user) => {
        if (!user || !user.id) {
          router.push("/login");
          return;
        }
        setForm((prev) => ({
          ...prev,
          name: user.name || "",
          email: user.email || "",
          phone: user.phone || "",
        }));
      })
      .catch(() => {
        router.push("/login");
      });

    const items = getCart();
    setCart(items);
    setLoaded(true);
  }, [router]);

  const setField = (k: keyof typeof form) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm((prev) => ({ ...prev, [k]: e.target.value }));
    if (errors[k]) setErrors((prev) => ({ ...prev, [k]: undefined }));
  };

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (loading) return;

    const found: typeof errors = {};
    if (form.name.trim().length < 2) found.name = "Customer name is required.";
    if (!EMAIL_RE.test(form.email.trim())) found.email = "Valid email is required.";
    if (form.phone.trim().length < 5) found.phone = "Phone number is required.";
    if (form.address.trim().length < 5) found.address = "Complete address is required.";
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    if (cart.length === 0) {
      setServerError("Your cart is empty.");
      return;
    }

    setLoading(true);
    setServerError("");

    try {
      const itemsPayload = cart.map((item) => ({
        product_id: Number(item.id),
        qty: item.qty,
      }));

      const res = await api<{ id: number | string; total: number; message: string }>("/orders", {
        method: "POST",
        body: JSON.stringify({
          customer_name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          address: form.address.trim(),
          items: itemsPayload,
        }),
      });

      // Clear the client-side cart
      saveCart([]);
      setCart([]);
      setConfirmedOrder({ id: res.id, total: res.total });
    } catch (err: any) {
      if (err?.status === 401) {
        router.push("/login");
        return;
      }
      setServerError(err.message || "Failed to place your order. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (confirmedOrder) {
    return (
      <main>
        <section className="bg-[#F4F8F1] px-4 py-[32px] text-center md:px-[3.3vw] md:py-[48px] lg:py-[60px]">
          <h1 className="text-[30px] font-bold leading-tight tracking-tight text-[#07552F] md:text-[40px] lg:text-[46px]">
            Order Confirmed!
          </h1>
          <p className="mx-auto mt-2 max-w-[460px] text-[15px] leading-relaxed text-[#68786B] md:text-base">
            Thank you for shopping with UPPILIEES.
          </p>
        </section>

        <section className="bg-white px-4 py-[32px] md:px-[3.3vw] md:py-[56px] lg:py-[72px]">
          <div className="mx-auto max-w-[560px] rounded-xl border-2 border-[#07552F]/30 bg-[#FAFBF6] px-6 py-12 text-center md:p-12">
            <div className="mx-auto flex size-[76px] items-center justify-center rounded-full border-2 border-[#07552F]/40 bg-white text-[#07552F]">
              <svg width={36} height={36} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h2 className="mt-5 text-[22px] font-bold text-[#07552F] md:text-[26px]">
              Order #{confirmedOrder.id}
            </h2>
            <p className="mt-2 text-[15px] text-[#68786B]">
              Total Amount: <span className="font-bold text-[#07552F]">₹{confirmedOrder.total.toLocaleString("en-IN")}</span>
            </p>
            <p className="mt-2 text-sm text-[#68786B]">
              Your order has been placed successfully and is pending fulfillment.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
              <Link
                href="/account"
                className={`inline-flex h-11 items-center justify-center rounded-md bg-[#07552F] px-6 text-[15px] font-semibold text-white transition-colors hover:bg-[#063D27] ${focusRing}`}
              >
                View Your Orders
              </Link>
              <Link
                href="/products"
                className={`inline-flex h-11 items-center justify-center rounded-md border-2 border-[#07552F] bg-white px-6 text-[15px] font-semibold text-[#07552F] transition-colors hover:bg-[#07552F] hover:text-white ${focusRing}`}
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main>
      <section className="bg-[#F4F8F1] px-4 py-[32px] text-center md:px-[3.3vw] md:py-[48px] lg:py-[60px]">
        <h1 className="text-[30px] font-bold leading-tight tracking-tight text-[#07552F] md:text-[40px] lg:text-[46px]">
          Checkout
        </h1>
        <p className="mx-auto mt-2 max-w-[460px] text-[15px] leading-relaxed text-[#68786B] md:text-base">
          Please provide your shipping and contact information.
        </p>
      </section>

      <section className="bg-white px-4 py-[32px] md:px-[3.3vw] md:py-[56px] lg:py-[72px]">
        <div className="mx-auto max-w-[1100px]">
          {loaded && cart.length === 0 ? (
            <div className="mx-auto max-w-[520px] rounded-xl border-2 border-[#07552F]/30 bg-[#FAFBF6] px-6 py-12 text-center md:py-16">
              <h2 className="text-[22px] font-bold text-[#07552F]">Your bag is empty</h2>
              <p className="mt-2 text-[15px] text-[#68786B]">Add some products before proceeding to checkout.</p>
              <Link
                href="/products"
                className={`mt-6 inline-flex h-12 items-center justify-center rounded-md bg-[#07552F] px-8 text-[15px] font-semibold text-white transition-colors hover:bg-[#063D27] ${focusRing}`}
              >
                Start Shopping
              </Link>
            </div>
          ) : (
            <div className="grid gap-8 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
              {/* Form */}
              <div className="rounded-xl border-2 border-[#07552F]/40 bg-white p-5 md:p-8">
                <h2 className="text-[20px] font-bold text-[#07552F] md:text-[24px]">Shipping Details</h2>
                <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-4">
                  <div>
                    <label htmlFor="chk-name" className="mb-1.5 block text-sm font-semibold text-[#173D2A]">
                      Full name
                    </label>
                    <input
                      id="chk-name"
                      type="text"
                      autoComplete="name"
                      value={form.name}
                      onChange={setField("name")}
                      placeholder="Your full name"
                      className={`${inputBase} ${borderFor(!!errors.name)}`}
                    />
                    {errors.name && <p className="mt-1 text-[13px] text-[#B3261E]">{errors.name}</p>}
                  </div>

                  <div>
                    <label htmlFor="chk-email" className="mb-1.5 block text-sm font-semibold text-[#173D2A]">
                      Email
                    </label>
                    <input
                      id="chk-email"
                      type="email"
                      inputMode="email"
                      autoComplete="email"
                      value={form.email}
                      onChange={setField("email")}
                      placeholder="you@example.com"
                      className={`${inputBase} ${borderFor(!!errors.email)}`}
                    />
                    {errors.email && <p className="mt-1 text-[13px] text-[#B3261E]">{errors.email}</p>}
                  </div>

                  <div>
                    <label htmlFor="chk-phone" className="mb-1.5 block text-sm font-semibold text-[#173D2A]">
                      Phone
                    </label>
                    <input
                      id="chk-phone"
                      type="tel"
                      autoComplete="tel"
                      value={form.phone}
                      onChange={setField("phone")}
                      placeholder="Phone number"
                      className={`${inputBase} ${borderFor(!!errors.phone)}`}
                    />
                    {errors.phone && <p className="mt-1 text-[13px] text-[#B3261E]">{errors.phone}</p>}
                  </div>

                  <div>
                    <label htmlFor="chk-address" className="mb-1.5 block text-sm font-semibold text-[#173D2A]">
                      Address
                    </label>
                    <textarea
                      id="chk-address"
                      rows={3}
                      value={form.address}
                      onChange={setField("address")}
                      placeholder="Street, City, State, PIN code"
                      className={`w-full rounded-md border bg-white p-3 text-[15px] text-[#173D2A] placeholder:text-[#68786B]/70 focus:outline-none focus:ring-2 focus:ring-[#07552F]/25 ${borderFor(
                        !!errors.address
                      )}`}
                    />
                    {errors.address && <p className="mt-1 text-[13px] text-[#B3261E]">{errors.address}</p>}
                  </div>

                  {serverError && (
                    <p className="rounded-md border border-[#B3261E]/30 bg-[#FDF1F0] px-4 py-3 text-sm text-[#B3261E]">
                      {serverError}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className={`inline-flex h-12 w-full items-center justify-center rounded-md bg-[#07552F] px-8 text-[15px] font-semibold text-white transition-colors duration-200 hover:bg-[#063D27] disabled:cursor-not-allowed disabled:opacity-70 ${focusRing}`}
                  >
                    {loading ? "Placing Order…" : "Place Order"}
                  </button>
                </form>
              </div>

              {/* Summary */}
              <aside className="rounded-xl border-2 border-[#07552F]/40 bg-[#FAFBF6] p-5 md:p-8">
                <h2 className="text-[20px] font-bold text-[#07552F]">Order Summary</h2>
                <ul className="mt-4 divide-y divide-[#E2EBDD]">
                  {cart.map((item) => (
                    <li key={item.id} className="py-3 flex justify-between gap-4 text-sm">
                      <div>
                        <p className="font-semibold text-[#173D2A]">{item.name}</p>
                        <p className="text-[#68786B]">Qty: {item.qty}</p>
                      </div>
                      <p className="font-semibold text-[#173D2A]">₹{(item.price * item.qty).toLocaleString("en-IN")}</p>
                    </li>
                  ))}
                </ul>

                <div className="mt-4 border-t border-[#E2EBDD] pt-4 flex justify-between text-base font-bold text-[#07552F]">
                  <span>Total</span>
                  <span>₹{subtotal.toLocaleString("en-IN")}</span>
                </div>
              </aside>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

