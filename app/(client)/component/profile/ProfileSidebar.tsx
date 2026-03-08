"use client";

import {
  User,
  MapPin,
  Package,
  Heart,
  LogOut,
  LayoutDashboard,
} from "lucide-react";

export type ProfileSection =
  | "overview"
  | "info"
  | "addresses"
  | "orders"
  | "wishlist";

interface ProfileSidebarProps {
  active: ProfileSection;
  onChange: (section: ProfileSection) => void;
  onLogout?: () => void;
}

const menuItems: {
  key: ProfileSection | "logout";
  label: string;
  icon: React.ComponentType<
    React.SVGProps<SVGSVGElement> & { strokeWidth?: number }
  >;
}[] = [
  { key: "overview", label: "Aperçu", icon: LayoutDashboard },
  { key: "info", label: "Informations Personnelles", icon: User },
  { key: "addresses", label: "Adresses", icon: MapPin },
  { key: "orders", label: "Commandes", icon: Package },
  { key: "wishlist", label: "Liste de Souhaits", icon: Heart },
  { key: "logout", label: "Déconnexion", icon: LogOut },
];

export default function ProfileSidebar({
  active,
  onChange,
  onLogout,
}: ProfileSidebarProps) {
  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:block w-64 shrink-0">
        <nav className="sticky top-28">
          <ul className="flex flex-col gap-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = item.key === active;
              const isLogout = item.key === "logout";

              return (
                <li key={item.key}>
                  <button
                    type="button"
                    onClick={() => {
                      if (isLogout) {
                        onLogout?.();
                      } else {
                        onChange(item.key as ProfileSection);
                      }
                    }}
                    className={`flex w-full cursor-pointer items-center gap-3 rounded-lg px-4 py-3 font-poppins text-[13px] transition-all duration-200 ${
                      isLogout
                        ? "text-[#999] hover:text-primary mt-4"
                        : isActive
                          ? "bg-primary/5 text-primary font-medium"
                          : "text-[#555] hover:bg-[#F5F4F1] hover:text-dark"
                    }`}
                    aria-current={isActive ? "page" : undefined}
                  >
                    <Icon className="h-4 w-4 shrink-0" strokeWidth={1.5} />
                    <span>{item.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>

      {/* Mobile horizontal tabs */}
      <div className="lg:hidden -mx-4 sm:-mx-6 px-4 sm:px-6 mb-5 sm:mb-8 overflow-x-auto scrollbar-hide">
        <div className="flex gap-1.5 sm:gap-2 min-w-max pb-1">
          {menuItems
            .filter((item) => item.key !== "logout")
            .map((item) => {
              const Icon = item.icon;
              const isActive = item.key === active;

              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => onChange(item.key as ProfileSection)}
                  className={`flex cursor-pointer items-center gap-1.5 sm:gap-2 whitespace-nowrap rounded-full px-3 py-2 sm:px-4 sm:py-2.5 font-poppins text-[11px] sm:text-[12px] font-medium transition-all duration-200 active:scale-95 ${
                    isActive
                      ? "bg-primary text-white shadow-sm"
                      : "bg-white text-[#555] hover:bg-[#F5F4F1] hover:text-dark border border-[#E8E6E1]"
                  }`}
                  aria-current={isActive ? "page" : undefined}
                >
                  <Icon
                    className="h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0"
                    strokeWidth={1.5}
                  />
                  <span>{item.label}</span>
                </button>
              );
            })}
        </div>
      </div>
    </>
  );
}
