"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { IconX } from "@tabler/icons-react";
import { Step1Basic, slugify } from "./step1-basic";
import { Step2Appearance } from "./step2-appearance";
import { Step3Products } from "./step3-products";
import { Step4Payment } from "./step4-payment";
import { Step5Emails } from "./step5-emails";
import { ProgressSteps } from "./progress-steps";
import { defaultEmailTemplates, type EmailTemplates, type StoreWithProducts } from "./types";
import { Button } from "@/components/ui/button";

const steps = ["Infos", "Apparence", "Produits", "Paiement", "Confirmation"];

export function StoreBuilderWizard({ store }: { store: StoreWithProducts | null }) {
  const router = useRouter();
  const [storeId, setStoreId] = useState(store?.id ?? null);
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState(store?.name ?? "");
  const [niche, setNiche] = useState(store?.niche ?? "");
  const [language, setLanguage] = useState<string>(store?.language ?? "FR");
  const [domain, setDomain] = useState(store?.domain ?? "");
  const slug = store?.slug ?? "";

  const [primaryColor, setPrimaryColor] = useState(store?.primaryColor ?? "#111827");
  const [logoText, setLogoText] = useState(store?.logoText ?? "");
  const [heroImageUrl, setHeroImageUrl] = useState(store?.heroImageUrl ?? "");
  const [heroTitle, setHeroTitle] = useState(store?.heroTitle ?? "");
  const [heroSubtitle, setHeroSubtitle] = useState(store?.heroSubtitle ?? "");
  const [slogan, setSlogan] = useState(store?.slogan ?? "");

  const [useMainStripeKey, setUseMainStripeKey] = useState(store?.useMainStripeKey ?? true);
  const [stripeKey, setStripeKey] = useState(store?.stripeKey ?? "");
  const [currency, setCurrency] = useState(store?.currency ?? "CAD");
  const [paymentMethods, setPaymentMethods] = useState<string[]>(store?.paymentMethods ?? ["card"]);

  const [templates, setTemplates] = useState<EmailTemplates>(
    (store?.emailTemplates as EmailTemplates) ?? defaultEmailTemplates
  );

  async function handleNext() {
    setSaving(true);

    if (step === 1) {
      if (!storeId) {
        const res = await fetch("/api/stores", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, slug: slugify(name), niche, domain, language }),
        });
        const created = await res.json();
        setStoreId(created.id);
        router.replace(`/stores/builder/${created.id}`);
      } else {
        await fetch(`/api/stores/${storeId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, niche, domain, language }),
        });
      }
    } else if (step === 2 && storeId) {
      await fetch(`/api/stores/${storeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ primaryColor, logoText, heroImageUrl, heroTitle, heroSubtitle, slogan }),
      });
    } else if (step === 4 && storeId) {
      await fetch(`/api/stores/${storeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ useMainStripeKey, stripeKey, currency, paymentMethods }),
      });
    } else if (step === 5 && storeId) {
      await fetch(`/api/stores/${storeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailTemplates: templates }),
      });
    }

    setSaving(false);

    if (step < 5) {
      setStep(step + 1);
    } else {
      router.push("/stores");
    }
  }

  return (
    <div
      className="fixed inset-0 z-[1000] overflow-y-auto"
      style={{ background: "var(--bg-base)" }}
    >
      <div className="mx-auto max-w-3xl px-6 py-10">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-[20px] font-medium" style={{ color: "var(--text-1)", letterSpacing: "-0.3px" }}>
            {store ? `Modifier ${store.name}` : "Nouvelle boutique"}
          </h1>
          <button onClick={() => router.push("/stores")} className="btn-icon" style={{ color: "var(--text-2)" }} aria-label="Fermer">
            <IconX size={18} />
          </button>
        </div>

        <ProgressSteps
          steps={steps}
          current={step}
          canJump={(s) => Boolean(storeId) || s === 1}
          onJump={(s) => setStep(s)}
        />

        <div className="card">
          {step === 1 && (
            <Step1Basic
              name={name}
              setName={setName}
              niche={niche}
              setNiche={setNiche}
              language={language}
              setLanguage={setLanguage}
              domain={domain}
              setDomain={setDomain}
              slug={slug}
            />
          )}

          {step === 2 && (
            <Step2Appearance
              primaryColor={primaryColor}
              setPrimaryColor={setPrimaryColor}
              logoText={logoText}
              setLogoText={setLogoText}
              heroImageUrl={heroImageUrl}
              setHeroImageUrl={setHeroImageUrl}
              heroTitle={heroTitle}
              setHeroTitle={setHeroTitle}
              heroSubtitle={heroSubtitle}
              setHeroSubtitle={setHeroSubtitle}
              slogan={slogan}
              setSlogan={setSlogan}
            />
          )}

          {step === 3 && storeId && (
            <Step3Products storeId={storeId} products={store?.products ?? []} onChange={() => router.refresh()} />
          )}

          {step === 4 && (
            <Step4Payment
              useMainStripeKey={useMainStripeKey}
              setUseMainStripeKey={setUseMainStripeKey}
              stripeKey={stripeKey}
              setStripeKey={setStripeKey}
              currency={currency}
              setCurrency={setCurrency}
              paymentMethods={paymentMethods}
              setPaymentMethods={setPaymentMethods}
            />
          )}

          {step === 5 && (
            <div className="space-y-4">
              <h2 className="card-title">Récapitulatif</h2>
              <div className="grid grid-cols-2 gap-3 text-[13px]">
                <p style={{ color: "var(--text-2)" }}>Nom</p>
                <p style={{ color: "var(--text-1)" }}>{name}</p>
                <p style={{ color: "var(--text-2)" }}>Niche</p>
                <p style={{ color: "var(--text-1)" }}>{niche}</p>
                <p style={{ color: "var(--text-2)" }}>Langue</p>
                <p style={{ color: "var(--text-1)" }}>{language}</p>
                <p style={{ color: "var(--text-2)" }}>Devise</p>
                <p style={{ color: "var(--text-1)" }}>{currency}</p>
                <p style={{ color: "var(--text-2)" }}>Stripe</p>
                <p style={{ color: "var(--text-1)" }}>{useMainStripeKey ? "Clé principale VNK" : "Clé dédiée"}</p>
              </div>
              <Step5Emails templates={templates} setTemplates={setTemplates} />
            </div>
          )}
        </div>

        <div className="mt-6 flex items-center justify-between">
          <Button variant="secondary" onClick={() => setStep(Math.max(1, step - 1))} disabled={step === 1}>
            Retour modifier
          </Button>

          <div className="flex items-center gap-3">
            {slug && (
              <Link href={`/${slug}`} target="_blank" className="text-[13px]" style={{ color: "var(--accent-light)" }}>
                Aperçu du site →
              </Link>
            )}
            <Button onClick={handleNext} disabled={saving || (step === 1 && (!name || !niche))}>
              {saving ? "Enregistrement..." : step === 5 ? "Créer la boutique" : "Continuer →"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
