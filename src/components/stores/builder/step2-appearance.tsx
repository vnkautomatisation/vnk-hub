"use client";

import { Input } from "@/components/ui/input";

export function Step2Appearance({
  primaryColor,
  setPrimaryColor,
  logoText,
  setLogoText,
  heroImageUrl,
  setHeroImageUrl,
  heroTitle,
  setHeroTitle,
  heroSubtitle,
  setHeroSubtitle,
  slogan,
  setSlogan,
}: {
  primaryColor: string;
  setPrimaryColor: (v: string) => void;
  logoText: string;
  setLogoText: (v: string) => void;
  heroImageUrl: string;
  setHeroImageUrl: (v: string) => void;
  heroTitle: string;
  setHeroTitle: (v: string) => void;
  heroSubtitle: string;
  setHeroSubtitle: (v: string) => void;
  slogan: string;
  setSlogan: (v: string) => void;
}) {
  const labelClass = "text-[13px]";
  const labelStyle = { color: "var(--text-2)" };

  return (
    <div className="grid grid-cols-2 gap-6">
      <div className="max-w-lg space-y-4">
        <div className="space-y-1">
          <label className={labelClass} style={labelStyle}>
            Couleur principale
          </label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={primaryColor}
              onChange={(e) => setPrimaryColor(e.target.value)}
              className="h-9 w-14 rounded-lg"
              style={{ border: "0.5px solid var(--border)" }}
            />
            <Input value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="flex-1" />
          </div>
        </div>

        <div className="space-y-1">
          <label className={labelClass} style={labelStyle}>
            Logo (texte)
          </label>
          <Input
            value={logoText}
            onChange={(e) => setLogoText(e.target.value)}
            placeholder="Nom affiché en haut du site"
            className="w-full"
          />
        </div>

        <div className="space-y-1">
          <label className={labelClass} style={labelStyle}>
            Image bannière (URL)
          </label>
          <Input value={heroImageUrl} onChange={(e) => setHeroImageUrl(e.target.value)} placeholder="https://..." className="w-full" />
        </div>

        <div className="space-y-1">
          <label className={labelClass} style={labelStyle}>
            Titre bannière
          </label>
          <Input value={heroTitle} onChange={(e) => setHeroTitle(e.target.value)} className="w-full" />
        </div>

        <div className="space-y-1">
          <label className={labelClass} style={labelStyle}>
            Sous-titre bannière
          </label>
          <Input value={heroSubtitle} onChange={(e) => setHeroSubtitle(e.target.value)} className="w-full" />
        </div>

        <div className="space-y-1">
          <label className={labelClass} style={labelStyle}>
            Slogan
          </label>
          <Input value={slogan} onChange={(e) => setSlogan(e.target.value)} className="w-full" />
        </div>
      </div>

      <div className="rounded-xl p-4" style={{ border: "0.5px solid var(--border)" }}>
        <p className="mb-2 text-[12px]" style={{ color: "var(--text-2)" }}>
          Aperçu
        </p>
        <div
          className="flex h-48 flex-col items-center justify-center rounded-lg text-white"
          style={{
            backgroundColor: primaryColor,
            backgroundImage: heroImageUrl ? `url(${heroImageUrl})` : undefined,
            backgroundSize: "cover",
          }}
        >
          <p className="text-lg font-semibold">{heroTitle || "Titre de la bannière"}</p>
          <p className="text-sm">{heroSubtitle || "Sous-titre"}</p>
        </div>
        <p className="mt-2 text-sm font-medium" style={{ color: "var(--text-1)" }}>
          {logoText || "Logo"}
        </p>
        <p className="text-[12px]" style={{ color: "var(--text-2)" }}>
          {slogan || "Slogan de la boutique"}
        </p>
      </div>
    </div>
  );
}
