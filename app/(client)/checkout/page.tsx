"use client";

import { useState } from "react";
import Image from "next/image";

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

interface CartItem {
  id: string;
  name: string;
  image: string;
  price: number;
  quantity: number;
}

export default function CheckoutPage() {
  const [formData, setFormData] = useState<FormData>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    country: "",
    city: "",
    address: "",
    postalCode: "",
    shippingMethod: "standard",
    paymentMethod: "card",
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Mock cart data
  const cartItems: CartItem[] = [
    {
      id: "1",
      name: "Robe élégante en soie",
      image: "/images/placeholder.jpg",
      price: 450,
      quantity: 1,
    },
    {
      id: "2",
      name: "Sac à main en cuir",
      image: "/images/placeholder.jpg",
      price: 320,
      quantity: 1,
    },
  ];

  const shippingCosts = {
    standard: 15,
    express: 35,
  };

  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );
  const shipping = shippingCosts[formData.shippingMethod];
  const total = subtotal + shipping;

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear error when user starts typing
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleBlur = (
    e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    validateField(name, formData[name as keyof FormData] as string);
  };

  const validateField = (name: string, value: string) => {
    let error = "";

    if (!value.trim()) {
      error = "Ce champ est requis";
    } else if (name === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      error = "Email invalide";
    } else if (name === "phone" && !/^[0-9+\s-()]+$/.test(value)) {
      error = "Numéro de téléphone invalide";
    } else if (
      name === "postalCode" &&
      !/^[0-9]{4,10}$/.test(value.replace(/\s/g, ""))
    ) {
      error = "Code postal invalide";
    }

    setErrors((prev) => ({ ...prev, [name]: error }));
    return error === "";
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    let isValid = true;

    const requiredFields: (keyof FormData)[] = [
      "firstName",
      "lastName",
      "email",
      "phone",
      "country",
      "city",
      "address",
      "postalCode",
    ];

    requiredFields.forEach((field) => {
      const value = formData[field] as string;
      if (!validateField(field, value)) {
        isValid = false;
      }
    });

    return isValid;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Mark all fields as touched
    const allTouched: Record<string, boolean> = {};
    Object.keys(formData).forEach((key) => {
      allTouched[key] = true;
    });
    setTouched(allTouched);

    if (validateForm()) {
      // Handle order submission
      console.log("Order submitted:", { formData, cartItems, total });
      alert("Commande passée avec succès !");
    }
  };

  return (
    <div className="min-h-screen bg-background py-8 sm:py-12 lg:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Page Title */}
        <h1 className="font-erotique text-4xl sm:text-5xl lg:text-6xl text-dark mb-8 sm:mb-12">
          Finaliser la commande
        </h1>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
            {/* Left Column - Checkout Forms */}
            <div className="lg:col-span-7 space-y-6">
              {/* Personal Information */}
              <section className="bg-white rounded-2xl shadow-sm p-6 sm:p-8">
                <h2 className="font-erotique text-2xl sm:text-3xl text-dark mb-6">
                  Informations personnelles
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                      aria-label="Prénom"
                      aria-required="true"
                      aria-invalid={!!(touched.firstName && errors.firstName)}
                      className={`w-full font-poppins px-4 py-3 rounded-lg border transition-all duration-200 focus:outline-none focus:ring-2 ${
                        touched.firstName && errors.firstName
                          ? "border-red-500 focus:ring-red-200"
                          : "border-gray-300 focus:border-primary focus:ring-primary/20"
                      } text-dark placeholder:text-gray-400`}
                      placeholder="Jean"
                    />
                    {touched.firstName && errors.firstName && (
                      <p className="font-poppins text-sm text-red-500 mt-1">
                        {errors.firstName}
                      </p>
                    )}
                  </div>
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
                      aria-label="Nom"
                      aria-required="true"
                      aria-invalid={!!(touched.lastName && errors.lastName)}
                      className={`w-full font-poppins px-4 py-3 rounded-lg border transition-all duration-200 focus:outline-none focus:ring-2 ${
                        touched.lastName && errors.lastName
                          ? "border-red-500 focus:ring-red-200"
                          : "border-gray-300 focus:border-primary focus:ring-primary/20"
                      } text-dark placeholder:text-gray-400`}
                      placeholder="Dupont"
                    />
                    {touched.lastName && errors.lastName && (
                      <p className="font-poppins text-sm text-red-500 mt-1">
                        {errors.lastName}
                      </p>
                    )}
                  </div>
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
                      aria-label="Email"
                      aria-required="true"
                      aria-invalid={!!(touched.email && errors.email)}
                      className={`w-full font-poppins px-4 py-3 rounded-lg border transition-all duration-200 focus:outline-none focus:ring-2 ${
                        touched.email && errors.email
                          ? "border-red-500 focus:ring-red-200"
                          : "border-gray-300 focus:border-primary focus:ring-primary/20"
                      } text-dark placeholder:text-gray-400`}
                      placeholder="jean.dupont@example.com"
                    />
                    {touched.email && errors.email && (
                      <p className="font-poppins text-sm text-red-500 mt-1">
                        {errors.email}
                      </p>
                    )}
                  </div>
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
                      aria-label="Téléphone"
                      aria-required="true"
                      aria-invalid={!!(touched.phone && errors.phone)}
                      className={`w-full font-poppins px-4 py-3 rounded-lg border transition-all duration-200 focus:outline-none focus:ring-2 ${
                        touched.phone && errors.phone
                          ? "border-red-500 focus:ring-red-200"
                          : "border-gray-300 focus:border-primary focus:ring-primary/20"
                      } text-dark placeholder:text-gray-400`}
                      placeholder="+216 28 111 222"
                    />
                    {touched.phone && errors.phone && (
                      <p className="font-poppins text-sm text-red-500 mt-1">
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
                        aria-label="Ville"
                        aria-required="true"
                        aria-invalid={!!(touched.city && errors.city)}
                        className={`w-full font-poppins px-4 py-3 rounded-lg border transition-all duration-200 focus:outline-none focus:ring-2 ${
                          touched.city && errors.city
                            ? "border-red-500 focus:ring-red-200"
                            : "border-gray-300 focus:border-primary focus:ring-primary/20"
                        } text-dark placeholder:text-gray-400`}
                        placeholder="Paris"
                      />
                      {touched.city && errors.city && (
                        <p className="font-poppins text-sm text-red-500 mt-1">
                          {errors.city}
                        </p>
                      )}
                    </div>
                  </div>
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
                      aria-label="Adresse"
                      aria-required="true"
                      aria-invalid={!!(touched.address && errors.address)}
                      className={`w-full font-poppins px-4 py-3 rounded-lg border transition-all duration-200 focus:outline-none focus:ring-2 ${
                        touched.address && errors.address
                          ? "border-red-500 focus:ring-red-200"
                          : "border-gray-300 focus:border-primary focus:ring-primary/20"
                      } text-dark placeholder:text-gray-400`}
                      placeholder="123 Rue de la Paix"
                    />
                    {touched.address && errors.address && (
                      <p className="font-poppins text-sm text-red-500 mt-1">
                        {errors.address}
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
                      aria-label="Code postal"
                      aria-required="true"
                      aria-invalid={!!(touched.postalCode && errors.postalCode)}
                      className={`w-full font-poppins px-4 py-3 rounded-lg border transition-all duration-200 focus:outline-none focus:ring-2 ${
                        touched.postalCode && errors.postalCode
                          ? "border-red-500 focus:ring-red-200"
                          : "border-gray-300 focus:border-primary focus:ring-primary/20"
                      } text-dark placeholder:text-gray-400`}
                      placeholder="75001"
                    />
                    {touched.postalCode && errors.postalCode && (
                      <p className="font-poppins text-sm text-red-500 mt-1">
                        {errors.postalCode}
                      </p>
                    )}
                  </div>
                </div>
              </section>
            </div>

            {/* Right Column - Order Summary */}
            <div className="lg:col-span-5">
              <div className="bg-white rounded-2xl shadow-sm p-6 sm:p-8 sticky top-8">
                <h2 className="font-erotique text-2xl sm:text-3xl text-dark mb-6">
                  Récapitulatif
                </h2>

                {/* Cart Items */}
                <div className="space-y-4 mb-6 pb-6 border-b border-gray-200">
                  {cartItems.map((item) => (
                    <div key={item.id} className="flex gap-4">
                      <div className="relative w-20 h-20 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden">
                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs font-poppins">
                          Image
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-poppins font-medium text-dark mb-1 truncate">
                          {item.name}
                        </h3>
                        <p className="font-poppins text-sm text-gray-600">
                          Quantité: {item.quantity}
                        </p>
                      </div>
                      <div className="flex-shrink-0">
                        <p className="font-poppins font-semibold text-dark">
                          {item.price} TND
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Order Totals */}
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between font-poppins">
                    <span className="text-gray-600">Sous-total</span>
                    <span className="font-medium text-dark">
                      {subtotal} TND
                    </span>
                  </div>
                  <div className="flex justify-between font-poppins">
                    <span className="text-gray-600">Livraison</span>
                    <span className="font-medium text-dark">
                      {shipping} TND
                    </span>
                  </div>
                  <div className="pt-3 border-t border-gray-200">
                    <div className="flex justify-between font-poppins">
                      <span className="text-lg font-semibold text-dark">
                        Total
                      </span>
                      <span className="text-lg font-bold text-dark">
                        {total} TND
                      </span>
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  className="w-full bg-primary hover:bg-primary/90 text-white font-poppins font-semibold py-4 px-6 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 active:scale-[0.98]"
                  aria-label="Passer la commande"
                >
                  Passer la commande
                </button>

                <p className="font-poppins text-xs text-gray-500 text-center mt-4">
                  En passant commande, vous acceptez nos conditions générales de
                  vente
                </p>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
