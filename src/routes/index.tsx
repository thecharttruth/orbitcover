import { createFileRoute } from "@tanstack/react-router";
import { DeskPage } from "@/components/desk/desk-page";
import { getMarketSnapshot } from "@/lib/market/server";

export const Route = createFileRoute("/")({
  loader: () => getMarketSnapshot(),
  component: Home,
});

function Home() {
  const initial = Route.useLoaderData();
  return <DeskPage initial={initial} />;
}
