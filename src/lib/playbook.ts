import { formatExpiryLabel } from "@/lib/time";
import { formatMoney, formatPrice, formatStrike } from "@/lib/format";
import type { CoverPick, MarketSnapshot } from "@/lib/market/types";
import { liveMark } from "@/lib/trades/math";
import { evaluateRollUp } from "@/lib/trades/roll";
import type { Trade } from "@/lib/trades/types";

export interface Playbook {
  kicker: string;
  headline: string;
  body: string;
  steps: string[];
  tone: "enter" | "hold" | "assign" | "keep" | "roll";
}

export function playbookForDesk(
  snapshot: MarketSnapshot,
  open: Trade[],
  pick: CoverPick | null,
): Playbook {
  const live = open[0];
  if (live) return playbookForPosition(live, snapshot);

  if (!pick || !snapshot.expectedMove) {
    return {
      kicker: "Waiting on the chain",
      headline: "No weekly ITM cover to score yet.",
      body: "Once the chain loads, the desk will pin the strike nearest one expected move in-the-money — for this week and next week.",
      steps: [],
      tone: "enter",
    };
  }

  const em = snapshot.expectedMove;
  const next = snapshot.nextPick;
  const nextEm = snapshot.nextExpectedMove;
  const nextLine = next && nextEm
    ? ` Next week’s same setup is the ${formatStrike(next.strike)}C (${formatExpiryLabel(next.expiry)}), about ${formatMoney(next.extrinsic)} of extrinsic, against a ±${formatPrice(nextEm.dollars)} move.`
    : "";

  return {
    kicker: "This week’s cover",
    headline: `Sell the ${formatStrike(pick.strike)} call, ${formatExpiryLabel(pick.expiry)}.`,
    body: `SPCX is ${formatPrice(snapshot.quote.last)}. This week’s expected move is ${formatPrice(em.dollars)} (${em.source === "straddle" ? "ATM straddle" : "IV"}). That puts one-move ITM around ${formatStrike(pick.targetStrike)}. Selling that weekly call harvests about ${formatMoney(pick.extrinsic)} of extrinsic per share. If shares are called away, that extrinsic is the locked profit. If SPCX drops, you keep the full premium and the cost basis falls to ${formatPrice(pick.breakeven)}.${nextLine}`,
    steps: [
      `Buy 100 shares (or a multiple) at the delayed close.`,
      `Sell 1 weekly ${formatStrike(pick.strike)} call per 100 shares.`,
      "If assigned: take the cash, journal the extrinsic, reload next week’s ITM pick.",
      "If the stock finishes below the strike: keep the shares, keep the premium, sell next week’s ITM call against the lower basis.",
      `If SPCX rallies a full expected move above your fill (about ${formatPrice(snapshot.quote.last + em.dollars)}), roll up only if you want to keep the shares. Default is still assignment.`,
    ],
    tone: "enter",
  };
}

export function playbookForPosition(trade: Trade, snapshot: MarketSnapshot): Playbook {
  const mark = liveMark(trade, snapshot);
  const dte = snapshot.weekly?.expiry === trade.call.expiry
    ? snapshot.weekly.dte
    : snapshot.nextWeekly?.expiry === trade.call.expiry
      ? snapshot.nextWeekly.dte
      : 0;
  const plan = evaluateRollUp(trade, snapshot);
  const next = snapshot.nextPick;

  if (plan.status === "alert") {
    const rec = plan.recommended;
    return {
      kicker: "Roll-up alert",
      headline: `SPCX is through a full expected move above your fill.`,
      body: `Entry ${formatPrice(trade.stockFill)}, now ${formatPrice(snapshot.quote.last)} — rally ${formatPrice(plan.rally)} vs a ${formatPrice(plan.expectedMove)} expected move. The trigger is ${formatPrice(plan.alertAt)}. Default is still assignment: keep the extrinsic you already sold. Roll up only to keep the shares. ${
        rec
          ? `Suggested: buy back the ${formatStrike(trade.call.strike)}C and sell the ${formatStrike(rec.strike)}C ${rec.kind === "up" ? "this week" : "next week"} (${rec.net >= 0 ? "credit" : "debit"} ${formatPrice(Math.abs(rec.net))}, extra room ${formatPrice(rec.extraRoom)}).`
          : "No clean higher strike scored yet."
      }`,
      steps: [
        "Default: do nothing. Let assignment harvest this week’s extrinsic.",
        rec?.debitCovered
          ? `To keep shares: roll ${rec.kind === "up" ? "up" : "up and out"} to ${formatStrike(rec.strike)}C. Debit should not exceed the extra strike room.`
          : "If you must keep shares, wait for a higher-strike credit that does not cost more than the extra room.",
        next
          ? `Next week’s standalone cover is ${formatStrike(next.strike)}C if you are assigned and recycle cash.`
          : "Reload next week’s ITM pick after assignment.",
      ],
      tone: "roll",
    };
  }

  if (dte <= 1 && mark.moneyness === "itm") {
    return {
      kicker: "Expiry path",
      headline: "Expect the shares to be taken.",
      body: `The ${formatStrike(trade.call.strike)} call is in the money. Remaining time value is ${mark.remainingExtrinsic == null ? "thin" : formatMoney(mark.remainingExtrinsic)} per share. Buying it back now usually just donates leftover extrinsic. Let assignment harvest what you already sold, then reopen next week’s cover${next ? ` — the ${formatStrike(next.strike)}C` : ""}.`,
      steps: [
        "Do nothing into the close unless you must keep the shares.",
        "After assignment, journal the locked extrinsic as the week’s result.",
        next
          ? `Redeploy into next week’s ${formatStrike(next.strike)}C near that week’s expected move.`
          : "Redeploy the cash into the next weekly ITM call near the new expected move.",
      ],
      tone: "assign",
    };
  }

  if (dte <= 1 && mark.moneyness !== "itm") {
    return {
      kicker: "Expiry path",
      headline: "The call is likely to expire. Basis drops.",
      body: `SPCX is under the ${formatStrike(trade.call.strike)} strike. If it stays there, you keep the shares and the entire premium. Cost basis remains ${formatPrice(trade.currentCostBasis)}. Next week, sell a fresh ITM call${next ? ` — the ${formatStrike(next.strike)}C` : " near one expected move under the new spot"}.`,
      steps: [
        "Hold through expiry if you are willing to own SPCX lower.",
        "Do not panic-sell the stock to ‘save’ a covered call that is winning on premium.",
        next
          ? `Monday: sell the ${formatStrike(next.strike)}C against the same shares.`
          : "Monday: sell the new weekly ITM call against the same shares.",
      ],
      tone: "keep",
    };
  }

  if (plan.status === "watch") {
    return {
      kicker: "Watch",
      headline: `Halfway to a roll-up. Alert at ${formatPrice(plan.alertAt)}.`,
      body: `SPCX is up ${formatPrice(plan.rally)} from your ${formatPrice(trade.stockFill)} fill. The rule: do not roll on a bounce. If it adds another half expected move and you want to keep the shares, roll up to a higher ITM strike — same week if there is time, otherwise next week. Default remains assignment.`,
      steps: [
        "Hold. This is still a winning ITM cover.",
        `Roll-up alert prints at ${formatPrice(plan.alertAt)} (entry plus one expected move).`,
        next
          ? `Next week’s pick if you recycle: ${formatStrike(next.strike)}C.`
          : "Keep next week’s chain in view for a roll-out.",
      ],
      tone: "hold",
    };
  }

  if (mark.moneyness === "otm" && (mark.remainingExtrinsic ?? 1) < 0.35) {
    return {
      kicker: "Management",
      headline: "Premium is mostly gone. Sit or roll out.",
      body: "The short call has little time value left and is out of the money. Closing it now captures almost nothing extra. Hold for expiry, or roll to next week only if the new ITM call pays a real credit.",
      steps: [
        "Default: hold. Let it expire and keep the original credit.",
        next
          ? `Roll only if next week’s ${formatStrike(next.strike)}C bid minus this week’s buyback is a credit you actually want.`
          : "Roll only when next week’s ITM bid minus this week’s ask is a credit you actually want.",
      ],
      tone: "hold",
    };
  }

  if (mark.moneyness === "itm" && dte >= 2) {
    return {
      kicker: "Management",
      headline: "On track to be called away. That is the design.",
      body: `Delta is high and you are still ${formatPrice(mark.intrinsic)} in-the-money. Profit if assigned is the extrinsic you sold, about ${formatMoney(trade.extrinsicAtOpen)} per share at entry. Fighting assignment only makes sense if you must keep the shares. Roll-up trigger is ${formatPrice(plan.alertAt)} — one expected move above your fill.`,
      steps: [
        "Default: hold for assignment.",
        "To keep shares after a full expected-move rally: roll up, or up and out to next week, only if the debit is no larger than the extra strike room.",
        "Do not chase SPCX higher by buying back a rich ITM call for its own sake.",
      ],
      tone: "roll",
    };
  }

  return {
    kicker: "Hold",
    headline: "Let theta work. The manager already captured the fill.",
    body: `You are short the ${formatStrike(trade.call.strike)} ${formatExpiryLabel(trade.call.expiry)} call against ${trade.shares} shares. Remaining extrinsic ${mark.remainingExtrinsic == null ? "is marking" : "is " + formatMoney(mark.remainingExtrinsic) + " per share"}. If called, you keep what you sold. If SPCX sells off, the credit keeps lowering basis. Roll-up only if the stock rips through ${formatPrice(plan.alertAt)}.`,
    steps: [
      "No day-to-day tweak is required.",
      "Revisit the day before expiry for the assignment vs. keep-shares fork.",
    ],
    tone: "hold",
  };
}
