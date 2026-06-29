import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Input, Select } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function ProductsFilterBar({
  stores,
  storeId,
  supplier,
  search,
}: {
  stores: { id: string; name: string }[];
  storeId?: string;
  supplier?: string;
  search?: string;
}) {
  return (
    <Card>
      <form className="flex flex-wrap items-end gap-2">
        <Select name="storeId" defaultValue={storeId ?? ""}>
          <option value="">Toutes les boutiques</option>
          {stores.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </Select>
        <Select name="supplier" defaultValue={supplier ?? ""}>
          <option value="">Tous les fournisseurs</option>
          <option value="CJ_DROPSHIPPING">CJ Dropshipping</option>
          <option value="ALIEXPRESS">AliExpress</option>
          <option value="ZENDROP">Zendrop</option>
          <option value="PRINTFUL">Printful</option>
          <option value="MANUAL">Manuel</option>
        </Select>
        <Input name="search" defaultValue={search ?? ""} placeholder="Rechercher un produit..." className="flex-1" style={{ minWidth: 200 }} />
        <Button type="submit">Filtrer</Button>
        <Link href="/products" className="btn btn-ghost">
          Réinitialiser
        </Link>
      </form>
    </Card>
  );
}
