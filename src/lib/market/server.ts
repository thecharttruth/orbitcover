import { createServerFn } from "@tanstack/react-start";
import { buildSnapshot, fetchExpiryChain } from "@/lib/market/fetch";
import { UNDERLIER } from "@/lib/market/types";

export const getMarketSnapshot = createServerFn({ method: "GET" }).handler(async () => {
  return buildSnapshot();
});

export const getExpiryChain = createServerFn({ method: "GET" })
  .validator((input: unknown) => {
    const d = (input ?? {}) as { expiry?: string };
    if (!d.expiry || !/^\d{4}-\d{2}-\d{2}$/.test(d.expiry)) {
      throw new Error("expiry required");
    }
    return { expiry: d.expiry };
  })
  .handler(async ({ data }) => {
    const snap = await buildSnapshot();
    if (snap.weekly?.expiry === data.expiry) return snap.weekly;
    if (snap.nextWeekly?.expiry === data.expiry) return snap.nextWeekly;
    return fetchExpiryChain(snap.quote.last, data.expiry);
  });

export { UNDERLIER };
