import { Catalog } from "@clindex/find";

/** Shared browser catalogue client (static shards under /catalog). */
export const catalog = new Catalog("/catalog");

export const rupees = (n: number) => `₹${n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
