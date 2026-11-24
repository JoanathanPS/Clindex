// Where to buy. Links go to each seller's own search page: no scraping, and
// affiliate tags can be appended once programmes are approved.

import type { Seller } from "./basket";

export interface SellerLink {
  id: string;
  name: string;
  url: (query: string) => string;
}

const enc = encodeURIComponent;

export const INDIA_SELLER_LINKS: SellerLink[] = [
  { id: "tata-1mg", name: "Tata 1mg", url: (q) => `https://www.1mg.com/search/all?name=${enc(q)}` },
  { id: "pharmeasy", name: "PharmEasy", url: (q) => `https://pharmeasy.in/search/all?name=${enc(q)}` },
  { id: "netmeds", name: "Netmeds", url: (q) => `https://www.netmeds.com/catalogsearch/result/${enc(q)}/all` },
  { id: "apollo", name: "Apollo 24|7", url: (q) => `https://www.apollopharmacy.in/search-medicines/${enc(q)}` },
];

export const JAN_AUSHADHI_LOCATOR = "https://janaushadhi.gov.in/KendraDetails.aspx";

/**
 * Seller profiles used by the multi-seller optimiser. Fees and ETAs here are
 * placeholders for the demo; real values come from partner feeds.
 */
export const DEMO_SELLERS: Seller[] = [
  { id: "online-a", name: "Online pharmacy A", kind: "online", deliveryFee: 49, freeAbove: 499, etaHours: 24 },
  { id: "online-b", name: "Online pharmacy B", kind: "online", deliveryFee: 39, freeAbove: 299, etaHours: 48 },
  { id: "quick-c", name: "Quick-commerce C", kind: "online", deliveryFee: 25, freeAbove: null, etaHours: 1 },
  { id: "store-d", name: "Local chemist (pickup)", kind: "store", deliveryFee: 0, freeAbove: null, etaHours: 0.5 },
  { id: "jan-e", name: "Jan Aushadhi Kendra", kind: "store", deliveryFee: 0, freeAbove: null, etaHours: 1 },
];
