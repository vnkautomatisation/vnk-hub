export function DnsInstructions({ domain }: { domain: string }) {
  if (!domain) return null;

  return (
    <div
      className="rounded-xl p-3 text-[12px]"
      style={{ background: "var(--info-bg)", color: "var(--info)", border: "0.5px solid var(--border)" }}
    >
      <p className="font-medium">Configuration DNS chez Namecheap pour {domain}</p>
      <ol className="ml-4 mt-1 list-decimal space-y-1">
        <li>Ouvrir Namecheap → Domain List → Manage → Advanced DNS</li>
        <li>
          Ajouter un enregistrement <strong>A</strong> : Host <code>@</code> → Value{" "}
          <code>76.76.21.21</code> (IP Vercel)
        </li>
        <li>
          Ajouter un enregistrement <strong>CNAME</strong> : Host <code>www</code> → Value{" "}
          <code>cname.vercel-dns.com</code>
        </li>
        <li>Attendre la propagation DNS (jusqu&apos;à 24h) — le statut passera à &quot;Actif&quot;</li>
      </ol>
    </div>
  );
}
