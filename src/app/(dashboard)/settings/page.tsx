import { prisma } from "@/lib/prisma";
import { VerticalTabs } from "@/components/ui/vertical-tabs";
import { GeneralTab } from "@/components/settings/general-tab";
import { ApisTab } from "@/components/settings/apis-tab";
import { EmailsTab } from "@/components/settings/emails-tab";
import { SecurityTab } from "@/components/settings/security-tab";
import { SubscriptionTab } from "@/components/settings/subscription-tab";

export default async function SettingsPage() {
  const [settings, connections] = await Promise.all([
    prisma.appSettings.findFirst(),
    prisma.supplierConnection.findMany(),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-[22px] font-medium tracking-[-0.3px]" style={{ color: "var(--text-1)" }}>
        Paramètres
      </h1>

      <VerticalTabs
        tabs={[
          { key: "general", label: "Général", content: <GeneralTab settings={settings} /> },
          { key: "apis", label: "APIs & Intégrations", content: <ApisTab settings={settings} connections={connections} /> },
          { key: "emails", label: "Emails", content: <EmailsTab settings={settings} /> },
          { key: "security", label: "Sécurité", content: <SecurityTab /> },
          { key: "subscription", label: "Abonnement", content: <SubscriptionTab /> },
        ]}
      />
    </div>
  );
}
