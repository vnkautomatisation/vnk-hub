import type { Supplier } from "@prisma/client";
import * as cj from "./cj";
import * as aliexpress from "./aliexpress";
import * as zendrop from "./zendrop";
import * as printful from "./printful";

export const supplierModules = {
  CJ_DROPSHIPPING: cj,
  ALIEXPRESS: aliexpress,
  ZENDROP: zendrop,
  PRINTFUL: printful,
} satisfies Partial<Record<Supplier, unknown>>;

export type ConnectableSupplier = keyof typeof supplierModules;

export const supplierLabels: Record<ConnectableSupplier, string> = {
  CJ_DROPSHIPPING: "CJ Dropshipping",
  ALIEXPRESS: "AliExpress",
  ZENDROP: "Zendrop",
  PRINTFUL: "Printful",
};

export const supplierSlugs: Record<ConnectableSupplier, string> = {
  CJ_DROPSHIPPING: "cj",
  ALIEXPRESS: "aliexpress",
  ZENDROP: "zendrop",
  PRINTFUL: "printful",
};

export const supplierInfo: Record<ConnectableSupplier, {
  label: string;
  deliveryDelay: string;
  coverage: string;
  warehouses: string;
  commission: string;
  docsUrl: string;
}> = {
  CJ_DROPSHIPPING: {
    label: "CJ Dropshipping",
    deliveryDelay: "7-15 jours",
    coverage: "Canada, USA, Europe",
    warehouses: "Chine, USA",
    commission: "Gratuit",
    docsUrl: "https://developers.cjdropshipping.com",
  },
  ALIEXPRESS: {
    label: "AliExpress",
    deliveryDelay: "10-25 jours",
    coverage: "Mondial",
    warehouses: "Chine",
    commission: "Gratuit",
    docsUrl: "https://developers.aliexpress.com",
  },
  ZENDROP: {
    label: "Zendrop",
    deliveryDelay: "5-10 jours",
    coverage: "Canada, USA",
    warehouses: "USA",
    commission: "Selon forfait",
    docsUrl: "https://zendrop.com/api",
  },
  PRINTFUL: {
    label: "Printful",
    deliveryDelay: "3-7 jours",
    coverage: "Canada, USA, Europe",
    warehouses: "USA, Europe",
    commission: "Gratuit",
    docsUrl: "https://developers.printful.com",
  },
};
