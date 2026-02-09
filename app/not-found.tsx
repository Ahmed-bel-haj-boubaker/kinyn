import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 text-center">
      <h1 className="font-poppins text-8xl sm:text-9xl text-primary leading-none">
        404
      </h1>
      <h2 className="font-erotique text-2xl sm:text-3xl text-dark mt-4">
        Page introuvable
      </h2>
      <p className="font-poppins text-dark/60 mt-3 max-w-md">
        La page que vous recherchez n&apos;existe pas ou a été déplacée.
      </p>
      <Link
        href="/"
        className="mt-8 inline-block bg-primary hover:bg-primary/90 text-white font-poppins font-semibold px-8 py-3 rounded-lg transition-colors duration-200"
      >
        Retour à l&apos;accueil
      </Link>
    </div>
  );
}
