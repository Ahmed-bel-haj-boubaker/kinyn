/* eslint-disable react/no-unescaped-entities */
"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, CheckCircle2 } from "lucide-react";
import { useCart } from "@/lib/cart";

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  country: string;
  city: string;
  address: string;
  postalCode: string;
  shippingMethod: "standard" | "express";
  paymentMethod: "card" | "cod";
}

interface FormErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  country?: string;
  city?: string;
  address?: string;
  postalCode?: string;
}

interface SavedAddress {
  country: string;
  city: string;
  address: string;
  postalCode: string;
  isDefault: boolean;
}

interface AuthUser {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  addresses?: SavedAddress[];
}

export default function CheckoutPage() {
  const router = useRouter();
  const { items: cartItems, subtotal, clearCart } = useCart();

  /* â”€â”€ Auth state â”€â”€ */
  const [authLoading, setAuthLoading] = useState(true);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isGuest, setIsGuest] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    country: "Tunisie",
    city: "",
    address: "",
    postalCode: "",
    shippingMethod: "standard",
    paymentMethod: "cod",
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  /* â”€â”€ Check auth on mount, redirect if not logged in â”€â”€ */
  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch("/api/auth/me");
        if (!res.ok) {
          setIsGuest(true);
          setAuthLoading(false);
          return;
        }
        const data = await res.json();
        const u: AuthUser = data.user;
        setUser(u);

        /* Pre-fill personal info */
        const defaultAddr =
          u.addresses?.find((a) => a.isDefault) ?? u.addresses?.[0];
        setFormData((prev) => ({
          ...prev,
          firstName: u.firstName ?? "",
          lastName: u.lastName ?? "",
          email: u.email ?? "",
          phone: u.phone ?? "",
          country: defaultAddr?.country || prev.country,
          city: defaultAddr?.city || prev.city,
          address: defaultAddr?.address || prev.address,
          postalCode: defaultAddr?.postalCode || prev.postalCode,
        }));
      } catch {
        setIsGuest(true);
      } finally {
        setAuthLoading(false);
      }
    }
    checkAuth();
  }, [router]);

  const shippingCosts = {
    standard: 8,
    express: 20,
  };

  const shipping = shippingCosts[formData.shippingMethod];
  const total = subtotal + shipping;

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const { name, value } = e.target;
      setFormData((prev) => ({ ...prev, [name]: value }));
      if (errors[name as keyof FormErrors]) {
        setErrors((prev) => ({ ...prev, [name]: undefined }));
      }
    },
    [errors],
  );

  const handleBlur = useCallback(
    (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
      const { name } = e.target;
      setTouched((prev) => ({ ...prev, [name]: true }));
      validateField(name, formData[name as keyof FormData] as string);
    },
    [formData],
  );

  const validateField = (name: string, value: string) => {
    let error = "";
    if (!value.trim()) {
      error = "Ce champ est requis";
    } else if (name === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      error = "Email invalide";
    } else if (name === "phone" && !/^[0-9+\s\-()]{6,20}$/.test(value)) {
      error = "Numéro invalide";
    } else if (
      name === "postalCode" &&
      !/^[0-9]{4,10}$/.test(value.replace(/\s/g, ""))
    ) {
      error = "Code postal invalide";
    }
    setErrors((prev) => ({ ...prev, [name]: error || undefined }));
    return error === "";
  };

  const validateForm = (): boolean => {
    let isValid = true;
    const requiredFields: (keyof FormData)[] = [
      "firstName",
      "lastName",
      "email",
      "phone",
      "city",
      "address",
      "postalCode",
    ];
    requiredFields.forEach((field) => {
      const value = formData[field] as string;
      if (!validateField(field, value)) isValid = false;
    });
    return isValid;
  };

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const allTouched: Record<string, boolean> = {};
    Object.keys(formData).forEach((k) => (allTouched[k] = true));
    setTouched(allTouched);

    if (!validateForm()) return;
    if (cartItems.length === 0) return;

    setSubmitting(true);
    setSubmitError(null);

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cartItems.map((item) => ({
            productId: item.productId,
            name: item.name,
            image: item.image,
            price: item.promoPrice ?? item.price,
            quantity: item.quantity,
            size: item.size || "",
            color: item.color || "",
          })),
          shippingAddress: {
            firstName: formData.firstName,
            lastName: formData.lastName,
            phone: formData.phone,
            country: formData.country,
            city: formData.city,
            address: formData.address,
            postalCode: formData.postalCode,
          },
          shippingMethod: formData.shippingMethod,
          paymentMethod: formData.paymentMethod,
          /* Guest info — only used if not authenticated */
          ...(isGuest && {
            guest: {
              firstName: formData.firstName,
              lastName: formData.lastName,
              email: formData.email,
              phone: formData.phone,
            },
          }),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setSubmitError(data.error ?? "Une erreur est survenue.");
        return;
      }

      clearCart();
      setOrderSuccess(true);
    } catch {
      setSubmitError("Erreur de connexion. Veuillez réessayer.");
    } finally {
      setSubmitting(false);
    }
  };

  /* â”€â”€ Input class helper â”€â”€ */
  const inputCls = (field: keyof FormErrors) =>
    `w-full font-poppins px-4 py-3 rounded-lg border transition-all duration-200 focus:outline-none focus:ring-2 ${
      touched[field] && errors[field]
        ? "border-red-400 focus:ring-red-200"
        : "border-gray-200 focus:border-primary focus:ring-primary/20"
    } text-dark placeholder:text-gray-400 bg-white`;

  /* â”€â”€ Auth loading skeleton â”€â”€ */
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-dark/40">
          <Loader2 className="h-8 w-8 animate-spin" strokeWidth={1.5} />
          <p className="font-poppins text-sm">Vérification en cours</p>
        </div>
      </div>
    );
  }

  /* â”€â”€ Order success screen â”€â”€ */
  if (orderSuccess) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <CheckCircle2
            className="h-16 w-16 text-green-500 mx-auto mb-6"
            strokeWidth={1.2}
          />
          <h1 className="font-erotique text-3xl sm:text-4xl text-dark mb-3">
            Commande confirmée !
          </h1>
          <p className="font-poppins text-dark/50 text-sm mb-4">
            Merci {user?.firstName || formData.firstName}. Votre commande a été
            passée avec succès.
          </p>

          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-full bg-primary px-8 py-3 font-poppins text-sm font-semibold text-white transition-all duration-200 hover:bg-primary/90"
          >
            Retour à la boutique
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8 sm:py-12 lg:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Page Title */}
        <div className="mb-8 sm:mb-12">
          <h1 className="font-erotique text-4xl sm:text-5xl lg:text-6xl text-dark">
            Finaliser la commande
          </h1>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10">
            {/* â”€â”€â”€â”€â”€â”€ Left Column â”€â”€â”€â”€â”€â”€ */}
            <div className="lg:col-span-7 space-y-6">
              {/* Personal Information */}
              <section className="bg-white rounded-2xl shadow-sm p-6 sm:p-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-erotique text-2xl sm:text-3xl text-dark">
                    Informations personnelles
                  </h2>
                  {isGuest && (
                    <Link
                      href="/auth/sign-in?redirect=/checkout"
                      className="inline-flex items-center gap-1.5 font-poppins text-sm font-semibold text-primary hover:text-primary/80 transition-colors shrink-0"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75"
                        />
                      </svg>
                      Se connecter
                    </Link>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* First Name */}
                  <div>
                    <label
                      htmlFor="firstName"
                      className="block font-poppins text-sm font-medium text-dark mb-2"
                    >
                      Prénom *
                    </label>
                    <input
                      type="text"
                      id="firstName"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      onBlur={handleBlur}
                      className={inputCls("firstName")}
                      placeholder="Jean"
                      autoComplete="given-name"
                    />
                    {touched.firstName && errors.firstName && (
                      <p className="font-poppins text-xs text-red-500 mt-1">
                        {errors.firstName}
                      </p>
                    )}
                  </div>
                  {/* Last Name */}
                  <div>
                    <label
                      htmlFor="lastName"
                      className="block font-poppins text-sm font-medium text-dark mb-2"
                    >
                      Nom *
                    </label>
                    <input
                      type="text"
                      id="lastName"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      onBlur={handleBlur}
                      className={inputCls("lastName")}
                      placeholder="Dupont"
                      autoComplete="family-name"
                    />
                    {touched.lastName && errors.lastName && (
                      <p className="font-poppins text-xs text-red-500 mt-1">
                        {errors.lastName}
                      </p>
                    )}
                  </div>
                  {/* Email */}
                  <div>
                    <label
                      htmlFor="email"
                      className="block font-poppins text-sm font-medium text-dark mb-2"
                    >
                      Email *
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      onBlur={handleBlur}
                      className={inputCls("email")}
                      placeholder="jean@exemple.com"
                      autoComplete="email"
                    />
                    {touched.email && errors.email && (
                      <p className="font-poppins text-xs text-red-500 mt-1">
                        {errors.email}
                      </p>
                    )}
                  </div>
                  {/* Phone */}
                  <div>
                    <label
                      htmlFor="phone"
                      className="block font-poppins text-sm font-medium text-dark mb-2"
                    >
                      Téléphone *
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      onBlur={handleBlur}
                      className={inputCls("phone")}
                      placeholder="+216 28 111 222"
                      autoComplete="tel"
                    />
                    {touched.phone && errors.phone && (
                      <p className="font-poppins text-xs text-red-500 mt-1">
                        {errors.phone}
                      </p>
                    )}
                  </div>
                </div>
              </section>

              {/* Shipping Address */}
              <section className="bg-white rounded-2xl shadow-sm p-6 sm:p-8">
                <h2 className="font-erotique text-2xl sm:text-3xl text-dark mb-6">
                  Adresse de livraison
                </h2>
                <div className="space-y-4">
                  {/* Country */}
                  <div>
                    <label
                      htmlFor="country"
                      className="block font-poppins text-sm font-medium text-dark mb-2"
                    >
                      Pays *
                    </label>
                    <input
                      type="text"
                      id="country"
                      name="country"
                      value={formData.country}
                      onChange={handleInputChange}
                      className="w-full font-poppins px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:border-primary focus:ring-primary/20 text-dark placeholder:text-gray-400 bg-white transition-all duration-200"
                      placeholder="Tunisie"
                      autoComplete="country-name"
                    />
                  </div>
                  {/* City + Postal code */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="city"
                        className="block font-poppins text-sm font-medium text-dark mb-2"
                      >
                        Ville *
                      </label>
                      <input
                        type="text"
                        id="city"
                        name="city"
                        value={formData.city}
                        onChange={handleInputChange}
                        onBlur={handleBlur}
                        className={inputCls("city")}
                        placeholder="Tunis"
                        autoComplete="address-level2"
                      />
                      {touched.city && errors.city && (
                        <p className="font-poppins text-xs text-red-500 mt-1">
                          {errors.city}
                        </p>
                      )}
                    </div>
                    <div>
                      <label
                        htmlFor="postalCode"
                        className="block font-poppins text-sm font-medium text-dark mb-2"
                      >
                        Code postal *
                      </label>
                      <input
                        type="text"
                        id="postalCode"
                        name="postalCode"
                        value={formData.postalCode}
                        onChange={handleInputChange}
                        onBlur={handleBlur}
                        className={inputCls("postalCode")}
                        placeholder="1000"
                        autoComplete="postal-code"
                      />
                      {touched.postalCode && errors.postalCode && (
                        <p className="font-poppins text-xs text-red-500 mt-1">
                          {errors.postalCode}
                        </p>
                      )}
                    </div>
                  </div>
                  {/* Street address */}
                  <div>
                    <label
                      htmlFor="address"
                      className="block font-poppins text-sm font-medium text-dark mb-2"
                    >
                      Adresse *
                    </label>
                    <input
                      type="text"
                      id="address"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      onBlur={handleBlur}
                      className={inputCls("address")}
                      placeholder="123 Avenue Habib Bourguiba"
                      autoComplete="street-address"
                    />
                    {touched.address && errors.address && (
                      <p className="font-poppins text-xs text-red-500 mt-1">
                        {errors.address}
                      </p>
                    )}
                  </div>
                </div>
              </section>
            </div>

            <div className="lg:col-span-5">
              <div className="bg-white rounded-2xl shadow-sm p-6 sm:p-8 sticky top-8">
                <h2 className="font-erotique text-2xl sm:text-3xl text-dark mb-6">
                  Récapitulatif
                </h2>

                {/* Cart Items */}
                <div className="space-y-4 mb-6 pb-6 border-b border-gray-100">
                  {cartItems.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="font-poppins text-gray-400 mb-3 text-sm">
                        Votre panier est vide
                      </p>
                      <Link
                        href="/"
                        className="font-poppins text-sm text-primary underline underline-offset-2 hover:text-primary/80"
                      >
                        Retour à la boutique"
                      </Link>
                    </div>
                  ) : (
                    cartItems.map((item) => {
                      const unitPrice = item.promoPrice ?? item.price;
                      const variant = [item.color, item.size]
                        .filter(Boolean)
                        .join(" — ");
                      return (
                        <div
                          key={`${item.productId}__${item.color}__${item.size}`}
                          className="flex gap-4"
                        >
                          <div className="relative w-20 h-20 shrink-0 bg-gray-100 rounded-lg overflow-hidden">
                            <Image
                              src={item.image}
                              alt={item.name}
                              fill
                              className="object-cover"
                              sizes="80px"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-poppins text-sm font-semibold text-dark truncate">
                              {item.name}
                            </h3>
                            {variant && (
                              <p className="font-poppins text-xs text-gray-400 mt-0.5">
                                {variant}
                              </p>
                            )}
                            <p className="font-poppins text-xs text-gray-500 mt-0.5">
                              Qté : {item.quantity}
                            </p>
                          </div>
                          <div className="shrink-0 text-right">
                            <p className="font-poppins text-sm font-semibold text-dark">
                              {(unitPrice * item.quantity)
                                .toFixed(2)
                                .replace(".", ",")}{" "}
                              TND
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Totals */}
                <div className="space-y-2.5 mb-6">
                  <div className="flex justify-between font-poppins text-sm">
                    <span className="text-dark/50">Sous-total</span>
                    <span className="font-medium text-dark">
                      {subtotal.toFixed(2).replace(".", ",")} TND
                    </span>
                  </div>
                  <div className="flex justify-between font-poppins text-sm">
                    <span className="text-dark/50">Livraison</span>
                    <span className="font-medium text-dark">
                      {shipping.toFixed(2).replace(".", ",")} TND
                    </span>
                  </div>
                  <div className="pt-3 border-t border-gray-100 flex justify-between font-poppins">
                    <span className="text-base font-semibold text-dark">
                      Total
                    </span>
                    <span className="text-base font-bold text-dark">
                      {total.toFixed(2).replace(".", ",")} TND
                    </span>
                  </div>
                </div>

                {/* Submit Error */}
                {submitError && (
                  <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
                    <p className="font-poppins text-xs text-red-600">
                      {submitError}
                    </p>
                  </div>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={cartItems.length === 0 || submitting}
                  className="w-full bg-primary hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed text-white font-poppins font-semibold py-4 px-6 rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  {submitting ? "Traitement en cours…" : "Passer la commande"}
                </button>

                <p className="font-poppins text-[0.68rem] text-gray-400 text-center mt-4 leading-relaxed">
                  En passant commande, vous acceptez nos{" "}
                  <Link
                    href="/cgv"
                    className="underline hover:text-primary transition-colors"
                  >
                    conditions générales de vente
                  </Link>
                  .
                </p>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
