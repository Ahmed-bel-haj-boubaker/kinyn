"use client";

import { useState } from "react";
import { Pencil, Check } from "lucide-react";

interface UserData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

const initialData: UserData = {
  firstName: "Amira",
  lastName: "Ben Salah",
  email: "amira.bensalah@email.com",
  phone: "+216 50 123 456",
};

export default function ProfileInfo() {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<UserData>(initialData);
  const [saved, setSaved] = useState(false);

  const handleChange = (field: keyof UserData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    setEditing(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const fields: { key: keyof UserData; label: string; type: string }[] = [
    { key: "firstName", label: "Prénom", type: "text" },
    { key: "lastName", label: "Nom", type: "text" },
    { key: "email", label: "Email", type: "email" },
    { key: "phone", label: "Téléphone", type: "tel" },
  ];

  return (
    <section>
      {/* Profile Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-5 mb-6 sm:mb-10">
        <div className="flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-full bg-primary/10 text-primary shrink-0">
          <span className="font-erotique text-xl sm:text-2xl leading-none">
            {form.firstName[0]}
            {form.lastName[0]}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="font-erotique text-lg sm:text-xl md:text-2xl text-dark leading-tight">
            {form.firstName} {form.lastName}
          </h2>
          <p className="font-poppins text-[12px] sm:text-[13px] text-[#888] mt-0.5 sm:mt-1">
            {form.email}
          </p>
        </div>
        {!editing && (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="flex cursor-pointer items-center gap-2 rounded-full border border-primary px-4 py-2 sm:px-5 font-poppins text-[11.5px] sm:text-[12px] font-medium text-primary transition-all duration-200 hover:bg-primary hover:text-white active:scale-95"
          >
            <Pencil className="h-3.5 w-3.5" strokeWidth={1.5} />
            <span>Modifier le profil</span>
          </button>
        )}
      </div>

      {/* Info Card */}
      <div className="rounded-xl bg-white border border-[#EEECE7] shadow-[0_2px_16px_rgba(0,0,0,0.04)] p-4 sm:p-6 md:p-8">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <h3 className="font-erotique text-base sm:text-lg text-dark">
            Informations Personnelles
          </h3>
          {saved && (
            <span className="flex items-center gap-1.5 font-poppins text-[12px] text-emerald-600">
              <Check className="h-3.5 w-3.5" strokeWidth={2} />
              Enregistré
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
          {fields.map((field) => (
            <div key={field.key} className="flex flex-col gap-1 sm:gap-1.5">
              <label
                htmlFor={field.key}
                className="font-poppins text-[10.5px] sm:text-[11px] font-semibold uppercase tracking-wide text-[#999]"
              >
                {field.label}
              </label>
              {editing ? (
                <input
                  id={field.key}
                  type={field.type}
                  value={form[field.key]}
                  onChange={(e) => handleChange(field.key, e.target.value)}
                  className="w-full rounded-lg border border-[#E0DED9] bg-[#FAFAF8] px-3.5 py-2.5 sm:px-4 font-poppins text-[12.5px] sm:text-[13px] text-dark outline-none transition-all duration-200 focus:border-primary focus:ring-1 focus:ring-primary/20"
                />
              ) : (
                <p className="font-poppins text-[12.5px] sm:text-[13.5px] text-dark py-2.5">
                  {form[field.key]}
                </p>
              )}
            </div>
          ))}
        </div>

        {editing && (
          <div className="flex justify-end gap-2.5 sm:gap-3 mt-6 sm:mt-8">
            <button
              type="button"
              onClick={() => {
                setEditing(false);
                setForm(initialData);
              }}
              className="cursor-pointer rounded-full border border-[#E0DED9] px-6 py-2.5 font-poppins text-[12px] font-medium text-[#666] transition-all duration-200 hover:border-[#CCC] hover:text-dark"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="cursor-pointer rounded-full bg-primary px-6 py-2.5 font-poppins text-[12px] font-medium text-white transition-all duration-200 hover:bg-primary/90"
            >
              Enregistrer
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
