export type SupplierProduct = {
  sku: string;
  name: string;
  nameFr: string;
  description: string;
  descriptionFr: string;
  cost: number;
  suggestedPrice: number;
  images: string[];
  stock: number;
};

export type SupplierSearchResult = {
  products: SupplierProduct[];
};
