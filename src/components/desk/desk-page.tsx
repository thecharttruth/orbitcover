import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, RefreshCw } from "lucide-react";
import { getMarketSnapshot } from "@/lib/market/server";
import { formatCompact, formatMoney, formatPct, formatPrice, formatSigned, signClass } from "@/lib/format";
import { playbookForDesk } from "@/lib/playbook";
import { stats } from "@/lib/trades/math";
import { useTradeStore } from "@/lib/trades/store";
import type { CoverPick, MarketSnapshot } from "@/lib/market/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChainTable } from "@/components/desk/chain-table";
import { JournalView } from "@/components/desk/journal-view";
import { PositionCard } from "@/components/desk/position-card";
import { Sparkline } from "@/components/desk/sparkline";
import { TicketDialog } from "@/components/desk/ticket-dialog";
import { Glossary } from "@/components/desk/glossary";
import { WeekPanel } from "@/components/desk/pick-card";
import { formatExpiryLong } from "@/lib/time";

function sessionLabel(state: MarketSnapshot["quote"]["marketState"]): string {
  if (state === "open") return "Regular hours";
  if (state === "pre") return "Pre-market";
  if (state === "post") return "After hours";
  return "Closed";
}

export function DeskPage({ initial }: { initial?: MarketSnapshot }) {
  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ["market"],
    queryFn: () => getMarketSnapshot(),
    initialData: initial,
    initialDataUpdatedAt: initial?.fetchedAt,
  });
  const hydrated = useTradeStore((s) => s.hydrated);
  const trades = useTradeStore((s) => s.trades);
  const markOpen = useTradeStore((s) => s.markOpen);
  const settleExpired = useTradeStore((s) => s.settleExpired);
  const [ticket, setTicket] = useState<CoverPick | null>(null);
  const [tab, setTab] = useState("desk");
  const [glossary, setGlossary] = useState(false);

  useEffect(() => {
    if (!hydrated || !data) return;
    settleExpired(data);
    markOpen(data);
  }, [hydrated, data, markOpen, settleExpired]);

  const open = useMemo(() => trades.filter((t) => t.status === "open"), [trades]);
  const book = data ? playbookForDesk(data, open, data.pick) : null;
  const portfolio = stats(trades, data ?? null);

  return (
    <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-4 pt-5 pb-16 sm:px-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-kicker font-medium uppercase tracking-widest text-muted-foreground">
            Orbit Cover
          </p>
          <h1 className="mt-1 text-2xl font-medium tracking-tight">SPCX ITM covered-call desk</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => setGlossary(true)}>
            <BookOpen />
            How it works
          </Button>
          <Button variant="secondary" size="sm" onClick={() => void refetch()} disabled={isFetching}>
            <RefreshCw className={isFetching ? "animate-spin" : ""} />
            Refresh
          </Button>
        </div>
      </header>

      {isLoading || !data ? (
        <LoadingState />
      ) : isError ? (
        <p className="mt-10 text-sm text-loss">{error instanceof Error ? error.message : "Market data failed."}</p>
      ) : (
        <>
          <section className="mt-8 grid items-end gap-6 md:grid-cols-[1fr_auto]">
            <div>
              <div className="flex flex-wrap items-baseline gap-3">
                <span className="font-mono text-kicker uppercase tracking-wide text-muted-foreground">SPCX</span>
                <span className="font-mono text-display leading-none tabular tracking-tight">
                  {formatPrice(data.quote.last)}
                </span>
                <span className={`font-mono text-lg tabular ${signClass(data.quote.change)}`}>
                  {formatSigned(data.quote.change)} {formatPct(data.quote.changePct)}
                </span>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <Badge variant="outline">Delayed</Badge>
                <Badge variant="outline">{sessionLabel(data.quote.marketState)}</Badge>
                <span>{data.quote.asOf} ET close</span>
                {data.quote.postLast != null ? <span>AH {formatPrice(data.quote.postLast)}</span> : null}
                <span>Vol {formatCompact(data.quote.volume)}</span>
                <span>
                  52w {formatPrice(data.quote.yearLow)}–{formatPrice(data.quote.yearHigh)}
                </span>
              </div>
              <p className="mt-2 text-kicker text-muted-foreground">{data.source}</p>
            </div>
            <Sparkline points={data.history} className="hidden h-12 w-40 md:block" />
          </section>

          {data.warning ? (
            <p className="mt-4 text-xs text-muted-foreground">{data.warning}</p>
          ) : null}

          <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Mini k="Open contracts" v={hydrated ? String(portfolio.openContracts) : "—"} />
            <Mini k="Capital at work" v={hydrated ? formatMoney(portfolio.capitalAtWork, { whole: true }) : "—"} />
            <Mini k="Harvested extrinsic" v={hydrated ? formatMoney(portfolio.harvestedExtrinsic, { whole: true }) : "—"} />
            <Mini k="Remaining theta" v={hydrated ? formatMoney(portfolio.openRemainingExtrinsic) : "—"} />
          </div>

          <Tabs value={tab} onValueChange={setTab} className="mt-8">
            <TabsList>
              <TabsTrigger value="desk">Desk</TabsTrigger>
              <TabsTrigger value="chain">Weeklies</TabsTrigger>
              <TabsTrigger value="journal">Journal</TabsTrigger>
            </TabsList>

            <TabsContent value="desk" className="flex flex-col gap-4">
              <div className="grid gap-4 lg:grid-cols-2">
                <WeekPanel
                  label="This week"
                  last={data.quote.last}
                  pick={data.pick}
                  expectedMove={data.expectedMove}
                  onOpen={setTicket}
                />
                <WeekPanel
                  label="Next week"
                  last={data.quote.last}
                  pick={data.nextPick}
                  expectedMove={data.nextExpectedMove}
                  onOpen={setTicket}
                />
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>{book?.kicker}</CardTitle>
                  <CardDescription>{book?.headline}</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                  <p className="text-sm leading-relaxed text-muted-foreground">{book?.body}</p>
                  {book?.steps.length ? (
                    <ol className="flex list-decimal flex-col gap-1.5 pl-4 text-sm text-muted-foreground">
                      {book.steps.map((step) => (
                        <li key={step}>{step}</li>
                      ))}
                    </ol>
                  ) : null}
                </CardContent>
              </Card>

              <Separator />

              <div className="flex flex-col gap-3">
                <h2 className="text-sm font-medium">Open covers</h2>
                {!hydrated ? (
                  <Skeleton className="h-28" />
                ) : open.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No live cover. Open this week or next week and the desk will capture fills, split intrinsic vs.
                    extrinsic, and settle assignment or expiry on its own.
                  </p>
                ) : (
                  open.map((t) => <PositionCard key={t.id} trade={t} snapshot={data} />)
                )}
              </div>
            </TabsContent>

            <TabsContent value="chain" className="flex flex-col gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>This week · {data.weekly ? formatExpiryLong(data.weekly.expiry) : "—"}</CardTitle>
                  <CardDescription>
                    Delayed last prints. Highlighted row is nearest one expected move in-the-money.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ChainTable
                    picks={data.ranked}
                    recommendedStrike={data.pick?.strike ?? null}
                    spot={data.quote.last}
                    onSelect={setTicket}
                  />
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Next week · {data.nextWeekly ? formatExpiryLong(data.nextWeekly.expiry) : "—"}</CardTitle>
                  <CardDescription>
                    Same ranking on next Friday’s chain, using that week’s own expected move.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ChainTable
                    picks={data.nextRanked}
                    recommendedStrike={data.nextPick?.strike ?? null}
                    spot={data.quote.last}
                    onSelect={setTicket}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="journal">
              <JournalView trades={hydrated ? trades : []} snapshot={data} />
            </TabsContent>
          </Tabs>

          <TicketDialog
            open={ticket != null}
            onOpenChange={(v) => {
              if (!v) setTicket(null);
            }}
            pick={ticket}
            spot={data.quote.last}
            delayed={data.quote.marketState !== "open"}
          />
        </>
      )}

      <Glossary open={glossary} onOpenChange={setGlossary} />
    </div>
  );
}

function Mini({ k, v }: { k: string; v: string }) {
  return (
    <div className="rounded-2xl bg-card px-3 py-3 shadow-[0_0_0_1px_rgba(255,255,255,0.08)]">
      <div className="text-kicker uppercase tracking-wide text-muted-foreground">{k}</div>
      <div className="mt-1 font-mono text-base tabular sm:text-lg">{v}</div>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="mt-10 flex flex-col gap-4">
      <Skeleton className="h-16 w-64" />
      <div className="grid gap-3 md:grid-cols-2">
        <Skeleton className="h-48" />
        <Skeleton className="h-48" />
      </div>
    </div>
  );
}
