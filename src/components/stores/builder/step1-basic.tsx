"use client";

import { DnsInstructions } from "./dns-instructions";
import { NichePicker } from "./niche-picker";
import { Input } from "@/components/ui/input";

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

const languages = [
  { value: "FR", label: "Français" },
  { value: "EN", label: "English" },
  { value: "BILINGUAL", label: "Bilingue" },
];

export function Step1Basic({
  name,
  setName,
  niche,
  setNiche,
  language,
  setLanguage,
  domain,
  setDomain,
  slug,
}: {
  name: string;
  setName: (v: string) => void;
  niche: string;
  setNiche: (v: string) => void;
  language: string;
  setLanguage: (v: string) => void;
  domain: string;
  setDomain: (v: string) => void;
  slug: string;
}) {
  return (
    <div className="max-w-lg space-y-4">
      <div>
        <label className="input-label">Nom de la boutique</label>
        <Input value={name} onChange={(e) => setName(e.target.value)} required className="w-full" />
      </div>

      <div>
        <label className="input-label">Niche</label>
        <NichePicker value={niche} onChange={setNiche} />
      </div>

      <div>
        <label className="input-label">Langue principale</label>
        <div className="flex gap-2">
          {languages.map((l) => {
            const selected = language === l.value;
            return (
              <button
                key={l.value}
                type="button"
                onClick={() => setLanguage(l.value)}
                className="rounded-[20px] px-3.5 py-1.5 text-[13px]"
                style={
                  selected
                    ? { background: "var(--accent)", color: "white", border: "0.5px solid var(--accent)" }
                    : { border: "0.5px solid var(--border)", color: "var(--text-2)" }
                }
              >
                {l.label}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <label className="input-label">Slug URL</label>
        <div className="flex items-center gap-2">
          <Input value={slug || slugify(name)} readOnly className="flex-1" style={{ color: "var(--text-2)" }} />
          <span className="badge badge-neutral">/{slug || slugify(name)}</span>
        </div>
        <p className="mt-1 text-[12px]" style={{ color: "var(--text-3)" }}>
          votresite.com/{slug || slugify(name)}
        </p>
      </div>

      <div>
        <label className="input-label">Domaine personnalisé (optionnel)</label>
        <Input value={domain} onChange={(e) => setDomain(e.target.value)} placeholder="maboutique.com" className="w-full" />
      </div>

      <DnsInstructions domain={domain} />
    </div>
  );
}

export { slugify };
