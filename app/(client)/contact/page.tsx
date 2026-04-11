import type { Metadata } from "next";
import ContactSection from "../component/home/ContactSection";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Contactez KINYN. Service client disponible par email et formulaire. Livraison partout en Tunisie.",
  alternates: { canonical: "https://kinyn.tn/contact" },
  openGraph: {
    title: "Contactez KINYN",
    description:
      "Contactez notre équipe pour toute question sur vos commandes, la livraison ou nos produits.",
    url: "https://kinyn.tn/contact",
    type: "website",
  },
};

const page = () => {
  return (
    <div>
      <ContactSection />
    </div>
  );
};

export default page;
