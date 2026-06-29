import { Card } from "@/components/ui/card";

export type SupplierInfo = {
  label: string;
  deliveryDelay: string;
  coverage: string;
  warehouses: string;
  commission: string;
  docsUrl: string;
};

export function SupplierInfoCard({ info }: { info: SupplierInfo }) {
  const rows: [string, string][] = [
    ["Délai livraison moyen", info.deliveryDelay],
    ["Couverture", info.coverage],
    ["Entrepôts", info.warehouses],
    ["Commission", info.commission],
  ];

  return (
    <Card className="space-y-3">
      <h2 className="card-title">{info.label}</h2>
      <ul className="space-y-2">
        {rows.map(([label, value]) => (
          <li key={label} className="flex items-center justify-between text-[13px]">
            <span style={{ color: "var(--text-2)" }}>{label}</span>
            <span style={{ color: "var(--text-1)" }}>{value}</span>
          </li>
        ))}
      </ul>
      <a
        href={info.docsUrl}
        target="_blank"
        rel="noreferrer"
        className="inline-block text-[12px]"
        style={{ color: "var(--accent-light)" }}
      >
        Documentation API →
      </a>
    </Card>
  );
}
