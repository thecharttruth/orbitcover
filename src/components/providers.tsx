import { useEffect, useState, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { useTradeStore } from "@/lib/trades/store";

export function Providers({ children }: { children: ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 30_000, refetchOnWindowFocus: false, retry: 1 },
        },
      }),
  );

  useEffect(() => {
    void Promise.resolve(useTradeStore.persist.rehydrate()).then(() => {
      useTradeStore.getState().setHydrated();
    });
  }, []);

  return (
    <QueryClientProvider client={client}>
      {children}
      <Toaster
        theme="dark"
        position="bottom-center"
        toastOptions={{
          classNames: {
            toast: "bg-card text-foreground border-border shadow-none",
          },
        }}
      />
    </QueryClientProvider>
  );
}
