import { i as __toESM } from "../_runtime.mjs";
import { o as require_jsx_runtime, r as Slot, s as require_react } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { a as DialogOverlay$1, i as DialogDescription$1, n as DialogClose, o as DialogPortal$1, r as DialogContent$1, s as DialogTitle$1, t as Dialog$1 } from "../_libs/@radix-ui/react-dialog+[...].mjs";
import { a as extrinsicCall, c as formatExpiryLong, s as formatExpiryLabel, u as intrinsicCall } from "./time-BTa-rzwC.mjs";
import { i as BookOpen, r as RefreshCw, t as X } from "../_libs/lucide-react.mjs";
import { t as useQuery } from "../_libs/tanstack__react-query.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { a as liveMark, c as lookupCall, i as useTradeStore, n as Route, o as premiumReceived, r as getMarketSnapshot, s as stats } from "./router-B4IgsJID.mjs";
import { r as rankItmCovers } from "./recommend-CrquKZtD.mjs";
import { n as clsx, t as cva } from "../_libs/class-variance-authority+clsx.mjs";
import { t as twMerge } from "../_libs/tailwind-merge.mjs";
import { i as Trigger, n as List, r as Root2, t as Content } from "../_libs/radix-ui__react-tabs.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-DFlp4l52.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var money = new Intl.NumberFormat("en-US", {
	style: "currency",
	currency: "USD",
	maximumFractionDigits: 2
});
var moneyWhole = new Intl.NumberFormat("en-US", {
	style: "currency",
	currency: "USD",
	maximumFractionDigits: 0
});
var px = new Intl.NumberFormat("en-US", {
	minimumFractionDigits: 2,
	maximumFractionDigits: 2
});
var compact = new Intl.NumberFormat("en-US", {
	notation: "compact",
	maximumFractionDigits: 1
});
function formatMoney(n, opts) {
	if (!Number.isFinite(n)) return "—";
	return (opts?.whole ? moneyWhole : money).format(n);
}
function formatPrice(n, digits = 2) {
	if (n == null || !Number.isFinite(n)) return "—";
	return n.toLocaleString("en-US", {
		minimumFractionDigits: digits,
		maximumFractionDigits: digits
	});
}
function formatSigned(n, digits = 2) {
	if (!Number.isFinite(n)) return "—";
	const abs = Math.abs(n).toLocaleString("en-US", {
		minimumFractionDigits: digits,
		maximumFractionDigits: digits
	});
	if (n > 0) return `+${abs}`;
	if (n < 0) return `−${abs}`;
	return px.format(0);
}
function formatSignedMoney(n) {
	if (!Number.isFinite(n)) return "—";
	const body = money.format(Math.abs(n));
	if (n > 0) return `+${body}`;
	if (n < 0) return `−${body}`;
	return money.format(0);
}
function formatPct(n, digits = 1) {
	if (!Number.isFinite(n)) return "—";
	const pct = n * 100;
	const abs = Math.abs(pct).toFixed(digits);
	if (pct > 0) return `+${abs}%`;
	if (pct < 0) return `−${abs}%`;
	return `${0 .toFixed(digits)}%`;
}
function formatPctPlain(n, digits = 1) {
	if (!Number.isFinite(n)) return "—";
	return `${(n * 100).toFixed(digits)}%`;
}
function formatCompact(n) {
	if (n == null || !Number.isFinite(n)) return "—";
	return compact.format(n);
}
function formatStrike(n) {
	if (!Number.isFinite(n)) return "—";
	return Number.isInteger(n) ? String(n) : n.toFixed(2);
}
function signClass(n) {
	if (n > 5e-4) return "text-gain";
	if (n < -5e-4) return "text-loss";
	return "text-muted-foreground";
}
function dteFor(trade, snapshot) {
	if (snapshot.weekly?.expiry === trade.call.expiry) return snapshot.weekly.dte;
	if (snapshot.nextWeekly?.expiry === trade.call.expiry) return snapshot.nextWeekly.dte;
	return 0;
}
function higherItmPick(spot, chain, move, floor) {
	const higher = rankItmCovers(spot, chain, move).filter((p) => p.strike > floor + .01);
	if (higher.length === 0) return null;
	higher.sort((a, b) => Math.abs(a.strike - (spot - move.dollars)) - Math.abs(b.strike - (spot - move.dollars)));
	return higher[0] ?? null;
}
function candidate(kind, pick, chain, buyback, oldStrike) {
	if (!pick || !chain) return null;
	const extraRoom = pick.strike - oldStrike;
	if (extraRoom <= 0) return null;
	const net = pick.sell - buyback;
	const debit = Math.max(0, -net);
	return {
		kind,
		expiry: pick.expiry,
		strike: pick.strike,
		sell: pick.sell,
		buyback,
		net,
		extraRoom,
		debitCovered: debit <= extraRoom + .05,
		extrinsic: pick.extrinsic,
		quote: lookupCall(chain, pick.strike),
		pick
	};
}
function evaluateRollUp(trade, snapshot) {
	const em = snapshot.expectedMove?.dollars ?? 0;
	const spot = snapshot.quote.last;
	const rally = spot - trade.stockFill;
	const watchAt = trade.stockFill + em * .5;
	const alertAt = trade.stockFill + em;
	const progress = em > 0 ? rally / em : 0;
	const dte = dteFor(trade, snapshot);
	const mark = liveMark(trade, snapshot);
	const currentChain = snapshot.weekly?.expiry === trade.call.expiry ? snapshot.weekly : snapshot.nextWeekly?.expiry === trade.call.expiry ? snapshot.nextWeekly : snapshot.weekly;
	const laterChain = currentChain && snapshot.nextWeekly && snapshot.nextWeekly.expiry !== currentChain.expiry ? snapshot.nextWeekly : null;
	const current = lookupCall(currentChain, trade.call.strike);
	const buyback = current?.buy ?? current?.ask ?? current?.last ?? mark.call ?? trade.call.fill;
	const samePick = currentChain && snapshot.expectedMove ? higherItmPick(spot, currentChain, currentChain === snapshot.nextWeekly && snapshot.nextExpectedMove ? snapshot.nextExpectedMove : snapshot.expectedMove, trade.call.strike) : null;
	const laterMove = laterChain === snapshot.nextWeekly ? snapshot.nextExpectedMove ?? snapshot.expectedMove : snapshot.expectedMove;
	const nextPick = laterChain && laterMove ? higherItmPick(spot, laterChain, laterMove, trade.call.strike) : null;
	const sameWeek = candidate("up", samePick, currentChain ?? null, buyback, trade.call.strike);
	const nextWeek = candidate("up-out", nextPick, laterChain, buyback, trade.call.strike);
	let status = "idle";
	if (dte <= 1) status = "too-late";
	else if (em > 0 && rally >= em) status = "alert";
	else if (em > 0 && rally >= em * .5) status = "watch";
	let recommended = null;
	if (status === "alert" || status === "watch") {
		if (dte >= 2 && sameWeek?.debitCovered) recommended = sameWeek;
		else if (nextWeek?.debitCovered) recommended = nextWeek;
		else recommended = (dte >= 2 ? sameWeek : nextWeek) ?? nextWeek ?? sameWeek;
	} else if (status === "too-late") recommended = nextWeek?.debitCovered ? nextWeek : nextWeek;
	return {
		status,
		rally,
		expectedMove: em,
		watchAt,
		alertAt,
		progress,
		dte,
		buyback,
		sameWeek,
		nextWeek,
		recommended
	};
}
function playbookForDesk(snapshot, open, pick) {
	const live = open[0];
	if (live) return playbookForPosition(live, snapshot);
	if (!pick || !snapshot.expectedMove) return {
		kicker: "Waiting on the chain",
		headline: "No weekly ITM cover to score yet.",
		body: "Once the chain loads, the desk will pin the strike nearest one expected move in-the-money — for this week and next week.",
		steps: [],
		tone: "enter"
	};
	const em = snapshot.expectedMove;
	const next = snapshot.nextPick;
	const nextEm = snapshot.nextExpectedMove;
	const nextLine = next && nextEm ? ` Next week’s same setup is the ${formatStrike(next.strike)}C (${formatExpiryLabel(next.expiry)}), about ${formatMoney(next.extrinsic)} of extrinsic, against a ±${formatPrice(nextEm.dollars)} move.` : "";
	return {
		kicker: "This week’s cover",
		headline: `Sell the ${formatStrike(pick.strike)} call, ${formatExpiryLabel(pick.expiry)}.`,
		body: `SPCX is ${formatPrice(snapshot.quote.last)}. This week’s expected move is ${formatPrice(em.dollars)} (${em.source === "straddle" ? "ATM straddle" : "IV"}). That puts one-move ITM around ${formatStrike(pick.targetStrike)}. Selling that weekly call harvests about ${formatMoney(pick.extrinsic)} of extrinsic per share. If shares are called away, that extrinsic is the locked profit. If SPCX drops, you keep the full premium and the cost basis falls to ${formatPrice(pick.breakeven)}.${nextLine}`,
		steps: [
			`Buy 100 shares (or a multiple) at the delayed close.`,
			`Sell 1 weekly ${formatStrike(pick.strike)} call per 100 shares.`,
			"If assigned: take the cash, journal the extrinsic, reload next week’s ITM pick.",
			"If the stock finishes below the strike: keep the shares, keep the premium, sell next week’s ITM call against the lower basis.",
			`If SPCX rallies a full expected move above your fill (about ${formatPrice(snapshot.quote.last + em.dollars)}), roll up only if you want to keep the shares. Default is still assignment.`
		],
		tone: "enter"
	};
}
function playbookForPosition(trade, snapshot) {
	const mark = liveMark(trade, snapshot);
	const dte = snapshot.weekly?.expiry === trade.call.expiry ? snapshot.weekly.dte : snapshot.nextWeekly?.expiry === trade.call.expiry ? snapshot.nextWeekly.dte : 0;
	const plan = evaluateRollUp(trade, snapshot);
	const next = snapshot.nextPick;
	if (plan.status === "alert") {
		const rec = plan.recommended;
		return {
			kicker: "Roll-up alert",
			headline: `SPCX is through a full expected move above your fill.`,
			body: `Entry ${formatPrice(trade.stockFill)}, now ${formatPrice(snapshot.quote.last)} — rally ${formatPrice(plan.rally)} vs a ${formatPrice(plan.expectedMove)} expected move. The trigger is ${formatPrice(plan.alertAt)}. Default is still assignment: keep the extrinsic you already sold. Roll up only to keep the shares. ${rec ? `Suggested: buy back the ${formatStrike(trade.call.strike)}C and sell the ${formatStrike(rec.strike)}C ${rec.kind === "up" ? "this week" : "next week"} (${rec.net >= 0 ? "credit" : "debit"} ${formatPrice(Math.abs(rec.net))}, extra room ${formatPrice(rec.extraRoom)}).` : "No clean higher strike scored yet."}`,
			steps: [
				"Default: do nothing. Let assignment harvest this week’s extrinsic.",
				rec?.debitCovered ? `To keep shares: roll ${rec.kind === "up" ? "up" : "up and out"} to ${formatStrike(rec.strike)}C. Debit should not exceed the extra strike room.` : "If you must keep shares, wait for a higher-strike credit that does not cost more than the extra room.",
				next ? `Next week’s standalone cover is ${formatStrike(next.strike)}C if you are assigned and recycle cash.` : "Reload next week’s ITM pick after assignment."
			],
			tone: "roll"
		};
	}
	if (dte <= 1 && mark.moneyness === "itm") return {
		kicker: "Expiry path",
		headline: "Expect the shares to be taken.",
		body: `The ${formatStrike(trade.call.strike)} call is in the money. Remaining time value is ${mark.remainingExtrinsic == null ? "thin" : formatMoney(mark.remainingExtrinsic)} per share. Buying it back now usually just donates leftover extrinsic. Let assignment harvest what you already sold, then reopen next week’s cover${next ? ` — the ${formatStrike(next.strike)}C` : ""}.`,
		steps: [
			"Do nothing into the close unless you must keep the shares.",
			"After assignment, journal the locked extrinsic as the week’s result.",
			next ? `Redeploy into next week’s ${formatStrike(next.strike)}C near that week’s expected move.` : "Redeploy the cash into the next weekly ITM call near the new expected move."
		],
		tone: "assign"
	};
	if (dte <= 1 && mark.moneyness !== "itm") return {
		kicker: "Expiry path",
		headline: "The call is likely to expire. Basis drops.",
		body: `SPCX is under the ${formatStrike(trade.call.strike)} strike. If it stays there, you keep the shares and the entire premium. Cost basis remains ${formatPrice(trade.currentCostBasis)}. Next week, sell a fresh ITM call${next ? ` — the ${formatStrike(next.strike)}C` : " near one expected move under the new spot"}.`,
		steps: [
			"Hold through expiry if you are willing to own SPCX lower.",
			"Do not panic-sell the stock to ‘save’ a covered call that is winning on premium.",
			next ? `Monday: sell the ${formatStrike(next.strike)}C against the same shares.` : "Monday: sell the new weekly ITM call against the same shares."
		],
		tone: "keep"
	};
	if (plan.status === "watch") return {
		kicker: "Watch",
		headline: `Halfway to a roll-up. Alert at ${formatPrice(plan.alertAt)}.`,
		body: `SPCX is up ${formatPrice(plan.rally)} from your ${formatPrice(trade.stockFill)} fill. The rule: do not roll on a bounce. If it adds another half expected move and you want to keep the shares, roll up to a higher ITM strike — same week if there is time, otherwise next week. Default remains assignment.`,
		steps: [
			"Hold. This is still a winning ITM cover.",
			`Roll-up alert prints at ${formatPrice(plan.alertAt)} (entry plus one expected move).`,
			next ? `Next week’s pick if you recycle: ${formatStrike(next.strike)}C.` : "Keep next week’s chain in view for a roll-out."
		],
		tone: "hold"
	};
	if (mark.moneyness === "otm" && (mark.remainingExtrinsic ?? 1) < .35) return {
		kicker: "Management",
		headline: "Premium is mostly gone. Sit or roll out.",
		body: "The short call has little time value left and is out of the money. Closing it now captures almost nothing extra. Hold for expiry, or roll to next week only if the new ITM call pays a real credit.",
		steps: ["Default: hold. Let it expire and keep the original credit.", next ? `Roll only if next week’s ${formatStrike(next.strike)}C bid minus this week’s buyback is a credit you actually want.` : "Roll only when next week’s ITM bid minus this week’s ask is a credit you actually want."],
		tone: "hold"
	};
	if (mark.moneyness === "itm" && dte >= 2) return {
		kicker: "Management",
		headline: "On track to be called away. That is the design.",
		body: `Delta is high and you are still ${formatPrice(mark.intrinsic)} in-the-money. Profit if assigned is the extrinsic you sold, about ${formatMoney(trade.extrinsicAtOpen)} per share at entry. Fighting assignment only makes sense if you must keep the shares. Roll-up trigger is ${formatPrice(plan.alertAt)} — one expected move above your fill.`,
		steps: [
			"Default: hold for assignment.",
			"To keep shares after a full expected-move rally: roll up, or up and out to next week, only if the debit is no larger than the extra strike room.",
			"Do not chase SPCX higher by buying back a rich ITM call for its own sake."
		],
		tone: "roll"
	};
	return {
		kicker: "Hold",
		headline: "Let theta work. The manager already captured the fill.",
		body: `You are short the ${formatStrike(trade.call.strike)} ${formatExpiryLabel(trade.call.expiry)} call against ${trade.shares} shares. Remaining extrinsic ${mark.remainingExtrinsic == null ? "is marking" : "is " + formatMoney(mark.remainingExtrinsic) + " per share"}. If called, you keep what you sold. If SPCX sells off, the credit keeps lowering basis. Roll-up only if the stock rips through ${formatPrice(plan.alertAt)}.`,
		steps: ["No day-to-day tweak is required.", "Revisit the day before expiry for the assignment vs. keep-shares fork."],
		tone: "hold"
	};
}
function cn(...inputs) {
	return twMerge(clsx(inputs));
}
var badgeVariants = cva("inline-flex items-center rounded-full px-2 py-0.5 text-kicker font-medium tracking-wide uppercase", {
	variants: { variant: {
		default: "bg-secondary text-muted-foreground",
		solid: "bg-primary text-primary-foreground",
		gain: "bg-gain/15 text-gain",
		loss: "bg-loss/15 text-loss",
		outline: "shadow-[0_0_0_1px_rgba(255,255,255,0.1)] text-muted-foreground"
	} },
	defaultVariants: { variant: "default" }
});
function Badge({ className, variant, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: cn(badgeVariants({ variant }), className),
		...props
	});
}
var buttonVariants = cva("inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-[color,background-color,box-shadow,transform,opacity] duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70 disabled:pointer-events-none disabled:opacity-40 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:not-disabled:scale-[0.96]", {
	variants: {
		variant: {
			default: "bg-primary text-primary-foreground hover:bg-primary/90",
			secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80 shadow-[0_0_0_1px_rgba(255,255,255,0.06)]",
			outline: "bg-transparent text-foreground shadow-[0_0_0_1px_rgba(255,255,255,0.1)] hover:bg-accent",
			ghost: "hover:bg-accent hover:text-accent-foreground",
			destructive: "bg-destructive text-white hover:bg-destructive/90"
		},
		size: {
			default: "h-10 min-h-10 px-4",
			sm: "h-9 min-h-9 px-3 text-xs",
			lg: "h-11 min-h-11 px-5",
			icon: "size-10 min-h-10 min-w-10"
		}
	},
	defaultVariants: {
		variant: "default",
		size: "default"
	}
});
var Button = import_react.forwardRef(({ className, variant, size, asChild = false, ...props }, ref) => {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(asChild ? Slot : "button", {
		className: cn(buttonVariants({
			variant,
			size,
			className
		})),
		ref,
		...props
	});
});
Button.displayName = "Button";
function Card({ className, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: cn("rounded-2xl bg-card text-card-foreground shadow-[0_0_0_1px_rgba(255,255,255,0.08)]", className),
		...props
	});
}
function CardHeader({ className, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: cn("flex flex-col gap-1 p-4 pb-0", className),
		...props
	});
}
function CardTitle({ className, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
		className: cn("text-sm font-medium tracking-tight", className),
		...props
	});
}
function CardDescription({ className, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: cn("text-sm text-muted-foreground", className),
		...props
	});
}
function CardContent({ className, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: cn("p-4", className),
		...props
	});
}
function Separator({ className, orientation = "horizontal" }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		role: "separator",
		className: cn("bg-border", orientation === "horizontal" ? "h-px w-full" : "h-full w-px", className)
	});
}
function Skeleton({ className, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: cn("animate-pulse rounded-md bg-secondary", className),
		...props
	});
}
var Tabs = Root2;
var TabsList = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(List, {
	ref,
	className: cn("inline-flex h-11 items-center gap-1 rounded-lg bg-secondary p-1 text-muted-foreground", className),
	...props
}));
TabsList.displayName = "TabsList";
var TabsTrigger = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trigger, {
	ref,
	className: cn("inline-flex min-h-9 items-center justify-center rounded-md px-3 text-sm font-medium transition-[color,background-color] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70 disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground", className),
	...props
}));
TabsTrigger.displayName = "TabsTrigger";
var TabsContent = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Content, {
	ref,
	className: cn("mt-4 focus-visible:outline-none", className),
	...props
}));
TabsContent.displayName = "TabsContent";
function ChainTable({ picks, recommendedStrike, spot, onSelect }) {
	const rows = [...picks].filter((p) => p.strike < spot).sort((a, b) => b.strike - a.strike);
	if (rows.length === 0) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "text-sm text-muted-foreground",
		children: "No ITM weekly calls in the chain."
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "-mx-1 overflow-x-auto",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
			className: "w-full min-w-3xl border-separate border-spacing-0 text-sm",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
				className: "text-kicker uppercase tracking-wide text-muted-foreground",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
						className: "px-2 py-2 text-left font-medium",
						children: "Strike"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
						className: "px-2 py-2 text-right font-medium",
						children: "Last"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
						className: "px-2 py-2 text-right font-medium",
						children: "Bid"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
						className: "px-2 py-2 text-right font-medium",
						children: "Ask"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
						className: "px-2 py-2 text-right font-medium",
						children: "Intrinsic"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
						className: "px-2 py-2 text-right font-medium",
						children: "Extrinsic"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
						className: "px-2 py-2 text-right font-medium",
						children: "Delta"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
						className: "px-2 py-2 text-right font-medium",
						children: "Yield"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
						className: "px-2 py-2 text-right font-medium",
						children: "Vol / OI"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { className: "px-2 py-2 text-right font-medium" })
				]
			}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: rows.map((row) => {
				const rec = recommendedStrike != null && row.strike === recommendedStrike;
				return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
					className: cn("border-t border-border", rec && "bg-secondary/80"),
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
							className: "px-2 py-2.5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "font-mono tabular",
								children: [formatStrike(row.strike), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-muted-foreground",
									children: "C"
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "text-kicker text-muted-foreground",
								children: [formatExpiryLabel(row.expiry), rec ? " · pick" : ""]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							className: "px-2 py-2.5 text-right font-mono tabular",
							children: formatPrice(row.last)
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							className: "px-2 py-2.5 text-right font-mono tabular",
							children: formatPrice(row.bid)
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							className: "px-2 py-2.5 text-right font-mono tabular text-muted-foreground",
							children: formatPrice(row.ask)
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							className: "px-2 py-2.5 text-right font-mono tabular text-muted-foreground",
							children: formatPrice(row.intrinsic)
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							className: "px-2 py-2.5 text-right font-mono tabular text-gain",
							children: formatPrice(row.extrinsic)
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							className: "px-2 py-2.5 text-right font-mono tabular",
							children: row.delta != null ? row.delta.toFixed(2) : "—"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							className: "px-2 py-2.5 text-right font-mono tabular",
							children: formatPctPlain(row.weeklyYield)
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
							className: "px-2 py-2.5 text-right font-mono tabular text-muted-foreground",
							children: [
								formatCompact(row.volume),
								" / ",
								formatCompact(row.openInterest)
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							className: "px-2 py-2.5 text-right",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								size: "sm",
								variant: rec ? "default" : "ghost",
								onClick: () => onSelect(row),
								children: "Cover"
							})
						})
					]
				}, `${row.expiry}-${row.strike}`);
			}) })]
		})
	});
}
function JournalView({ trades, snapshot }) {
	const removeTrade = useTradeStore((s) => s.removeTrade);
	const s = stats(trades, snapshot);
	const closed = trades.filter((t) => t.status !== "open");
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-col gap-5",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "grid grid-cols-2 gap-2 md:grid-cols-4",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat$2, {
					k: "Extrinsic harvested",
					v: formatMoney(s.harvestedExtrinsic)
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat$2, {
					k: "Realized P&L",
					v: formatSignedMoney(s.realizedPnl),
					tone: s.realizedPnl
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat$2, {
					k: "Open basis",
					v: s.avgOpenBasis == null ? "—" : formatPrice(s.avgOpenBasis)
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat$2, {
					k: "Closed weeks",
					v: String(s.closedCount)
				})
			]
		}), closed.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardContent, {
			className: "py-10 text-sm text-muted-foreground",
			children: "Closed weeks land here. The score that matters is harvested extrinsic — the time value you sold — not whether SPCX ripped or sold off."
		}) }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "flex flex-col gap-3",
			children: closed.map((t) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardHeader, {
					className: "flex-row items-start justify-between gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardTitle, { children: [
						t.status === "assigned" ? "Called away" : t.status === "expired" ? "Expired, shares kept" : "Closed",
						" ",
						"· ",
						formatStrike(t.call.strike),
						"C ",
						formatExpiryLabel(t.call.expiry)
					] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm text-muted-foreground",
						children: t.closeNote
					})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "ghost",
						size: "sm",
						onClick: () => removeTrade(t.id),
						children: "Remove"
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
					className: "grid grid-cols-2 gap-2 text-sm sm:grid-cols-4",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "text-kicker uppercase tracking-wide text-muted-foreground",
							children: "P&L"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: `font-mono tabular ${signClass(t.realizedPnl ?? 0)}`,
							children: formatSignedMoney(t.realizedPnl ?? 0)
						})] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "text-kicker uppercase tracking-wide text-muted-foreground",
							children: "Extrinsic"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "font-mono tabular",
							children: formatMoney(t.harvestedExtrinsic ?? 0)
						})] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "text-kicker uppercase tracking-wide text-muted-foreground",
							children: "Basis"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "font-mono tabular",
							children: formatPrice(t.currentCostBasis)
						})] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "text-kicker uppercase tracking-wide text-muted-foreground",
							children: "Contracts"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "font-mono tabular",
							children: t.contracts
						})] })
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ol", {
					className: "border-t border-border px-4 py-3 text-xs text-muted-foreground",
					children: t.events.filter((e) => e.type !== "mark").map((e) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
						className: "py-1",
						children: e.note
					}, e.id))
				})
			] }, t.id))
		})]
	});
}
function Stat$2({ k, v, tone }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "rounded-2xl bg-card px-4 py-3 shadow-[0_0_0_1px_rgba(255,255,255,0.08)]",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "text-kicker uppercase tracking-wide text-muted-foreground",
			children: k
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: `mt-1 font-mono text-lg tabular ${tone != null ? signClass(tone) : ""}`,
			children: v
		})]
	});
}
var Dialog = Dialog$1;
var DialogPortal = DialogPortal$1;
var DialogOverlay = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogOverlay$1, {
	ref,
	className: cn("fixed inset-0 z-50 bg-background/70 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0", className),
	...props
}));
DialogOverlay.displayName = "DialogOverlay";
var DialogContent = import_react.forwardRef(({ className, children, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogPortal, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogOverlay, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent$1, {
	ref,
	className: cn("fixed top-1/2 left-1/2 z-50 w-[calc(100%-1.5rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-card p-5 pt-6 text-card-foreground shadow-[0_0_0_1px_rgba(255,255,255,0.1)] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95", className),
	...props,
	children: [children, /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogClose, {
		className: "absolute top-4 right-4 rounded-md p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "size-4" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "sr-only",
			children: "Close"
		})]
	})]
})] }));
DialogContent.displayName = "DialogContent";
function DialogHeader({ className, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: cn("mb-4 flex flex-col gap-1 pr-10", className),
		...props
	});
}
function DialogTitle({ className, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle$1, {
		className: cn("text-lg font-medium tracking-tight", className),
		...props
	});
}
function DialogDescription({ className, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription$1, {
		className: cn("text-sm text-muted-foreground", className),
		...props
	});
}
var Input = import_react.forwardRef(({ className, type, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
	type,
	className: cn("flex h-11 w-full rounded-md bg-secondary px-3 text-sm tabular text-foreground shadow-[0_0_0_1px_rgba(255,255,255,0.08)] transition-[box-shadow] duration-150 placeholder:text-muted-foreground focus-visible:outline-none focus-visible:shadow-[0_0_0_1px_rgba(215,219,227,0.5)] disabled:cursor-not-allowed disabled:opacity-50", className),
	ref,
	...props
}));
Input.displayName = "Input";
function Label({ className, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
		className: cn("text-kicker font-medium uppercase tracking-wide text-muted-foreground", className),
		...props
	});
}
function PositionCard({ trade, snapshot }) {
	const mark = liveMark(trade, snapshot);
	const plan = evaluateRollUp(trade, snapshot);
	const markAssigned = useTradeStore((s) => s.markAssigned);
	const markExpired = useTradeStore((s) => s.markExpired);
	const closeTrade = useTradeStore((s) => s.closeTrade);
	const rollTrade = useTradeStore((s) => s.rollTrade);
	const [closeOpen, setCloseOpen] = (0, import_react.useState)(false);
	const [rollOpen, setRollOpen] = (0, import_react.useState)(false);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardHeader, {
			className: "flex-row items-start justify-between gap-3",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardTitle, { children: [
				trade.shares,
				" SPCX / ",
				trade.contracts,
				"× ",
				formatStrike(trade.call.strike),
				"C",
				" ",
				formatExpiryLabel(trade.call.expiry)
			] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "text-sm text-muted-foreground",
				children: [
					"Basis ",
					formatPrice(trade.currentCostBasis),
					" · premium ",
					formatMoney(premiumReceived(trade))
				]
			})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "rounded-full bg-secondary px-2 py-1 text-kicker uppercase tracking-wide text-muted-foreground",
				children: mark.moneyness
			})]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
			className: "flex flex-col gap-4",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "grid grid-cols-2 gap-2 sm:grid-cols-4",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Metric, {
							k: "Mark P&L",
							v: formatSignedMoney(mark.totalPnl),
							tone: mark.totalPnl
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Metric, {
							k: "Remaining ext.",
							v: mark.remainingExtrinsic == null ? "—" : formatPrice(mark.remainingExtrinsic)
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Metric, {
							k: "If assigned",
							v: formatSignedMoney(mark.ifAssigned),
							tone: mark.ifAssigned
						}),
						mark.moneyness === "otm" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Metric, {
							k: "If expires here",
							v: formatSignedMoney(mark.ifExpiredHere),
							tone: mark.ifExpiredHere
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Metric, {
							k: "Call mark",
							v: mark.call == null ? "—" : formatPrice(mark.call)
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "rounded-xl bg-secondary/70 px-3 py-2 text-sm",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "text-kicker uppercase tracking-wide text-muted-foreground",
						children: plan.status === "alert" ? "Roll-up alert" : plan.status === "watch" ? "Roll-up watch" : "Roll-up trigger"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-1 text-muted-foreground",
						children: [
							"Alert at ",
							formatPrice(plan.alertAt),
							" — one expected move above your ",
							formatPrice(trade.stockFill),
							" fill. Rally ",
							formatPrice(plan.rally),
							" of ",
							formatPrice(plan.expectedMove),
							". Default is assignment; roll up only to keep the shares."
						]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-wrap gap-2",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							size: "sm",
							onClick: () => markAssigned(trade.id),
							children: "Called away"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							size: "sm",
							variant: "secondary",
							onClick: () => markExpired(trade.id, snapshot.quote.last),
							children: "Expired, keep shares"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							size: "sm",
							variant: plan.status === "alert" ? "default" : "outline",
							onClick: () => setRollOpen(true),
							children: "Roll up"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							size: "sm",
							variant: "ghost",
							onClick: () => setCloseOpen(true),
							children: "Close both"
						})
					]
				})
			]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CloseDialog, {
			open: closeOpen,
			onOpenChange: setCloseOpen,
			trade,
			snapshot,
			onConfirm: (s, c) => {
				closeTrade(trade.id, s, c);
				toast.success("Position closed");
			}
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RollDialog, {
			open: rollOpen,
			onOpenChange: setRollOpen,
			trade,
			snapshot,
			onConfirm: (next, buyback, kind) => {
				rollTrade(trade.id, next, buyback);
				toast.success(kind === "up" ? "Rolled up this week" : "Rolled up and out");
			}
		})
	] });
}
function Metric({ k, v, tone }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "rounded-xl bg-secondary/70 px-3 py-2",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "text-kicker uppercase tracking-wide text-muted-foreground",
			children: k
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: `font-mono text-sm tabular ${tone != null ? signClass(tone) : ""}`,
			children: v
		})]
	});
}
function CloseDialog({ open, onOpenChange, trade, snapshot, onConfirm }) {
	const mark = liveMark(trade, snapshot);
	const [stock, setStock] = (0, import_react.useState)(snapshot.quote.last);
	const [call, setCall] = (0, import_react.useState)(mark.call ?? trade.call.fill);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
		open,
		onOpenChange,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, { children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, { children: "Close stock and call" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription, { children: "Sell the shares and buy back the short call at these fills." })] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid grid-cols-2 gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-col gap-1.5",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Stock exit" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						value: stock,
						onChange: (e) => setStock(Number(e.target.value) || 0)
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-col gap-1.5",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Call buyback" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						value: call,
						onChange: (e) => setCall(Number(e.target.value) || 0)
					})]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				className: "mt-5 w-full",
				onClick: () => {
					onConfirm(stock, call);
					onOpenChange(false);
				},
				children: "Close position"
			})
		] })
	});
}
function RollDialog({ open, onOpenChange, trade, snapshot, onConfirm }) {
	const plan = (0, import_react.useMemo)(() => evaluateRollUp(trade, snapshot), [trade, snapshot]);
	const [kind, setKind] = (0, import_react.useState)(plan.recommended?.kind ?? "up-out");
	const candidate = kind === "up" ? plan.sameWeek : plan.nextWeek;
	const [buyback, setBuyback] = (0, import_react.useState)(plan.buyback);
	const [strike, setStrike] = (0, import_react.useState)(candidate?.strike ?? trade.call.strike);
	const [credit, setCredit] = (0, import_react.useState)(candidate?.sell ?? 0);
	(0, import_react.useEffect)(() => {
		if (!open) return;
		const nextKind = plan.recommended?.kind ?? (plan.sameWeek ? "up" : "up-out");
		const next = nextKind === "up" ? plan.sameWeek : plan.nextWeek;
		setKind(nextKind);
		setBuyback(plan.buyback);
		setStrike(next?.strike ?? trade.call.strike);
		setCredit(next?.sell ?? 0);
	}, [
		open,
		plan,
		trade.call.strike
	]);
	const quote = kind === "up" ? lookupCall(snapshot.weekly, strike) : lookupCall(snapshot.nextWeekly, strike);
	const pick = candidate?.pick ?? null;
	const net = credit - buyback;
	const extraRoom = strike - trade.call.strike;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
		open,
		onOpenChange,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, { children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, { children: "Roll the short call" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogDescription, { children: [
				"Buy back ",
				formatStrike(trade.call.strike),
				"C and sell a higher ITM strike. Assignment is still the default win — roll only to keep the shares. Debit should not exceed the extra strike room."
			] })] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					size: "sm",
					variant: kind === "up" ? "default" : "outline",
					disabled: !plan.sameWeek,
					onClick: () => {
						setKind("up");
						if (plan.sameWeek) {
							setStrike(plan.sameWeek.strike);
							setCredit(plan.sameWeek.sell);
						}
					},
					children: "Up this week"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					size: "sm",
					variant: kind === "up-out" ? "default" : "outline",
					disabled: !plan.nextWeek,
					onClick: () => {
						setKind("up-out");
						if (plan.nextWeek) {
							setStrike(plan.nextWeek.strike);
							setCredit(plan.nextWeek.sell);
						}
					},
					children: "Up & out next week"
				})]
			}),
			pick ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "rounded-xl bg-secondary/70 px-3 py-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "font-mono text-base tabular",
						children: [
							formatStrike(pick.strike),
							"C · ",
							formatExpiryLong(pick.expiry)
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 text-sm text-muted-foreground",
						children: pick.why
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dl", {
						className: "mt-3 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mini$1, {
								k: "Last",
								v: formatPrice(pick.last)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mini$1, {
								k: "Bid",
								v: formatPrice(pick.bid)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mini$1, {
								k: "Ask",
								v: formatPrice(pick.ask)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mini$1, {
								k: "Extrinsic",
								v: formatPrice(pick.extrinsic)
							})
						]
					})
				]
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "text-sm text-muted-foreground",
				children: [
					"No higher ITM strike scored for ",
					kind === "up" ? "this week" : "next week",
					" yet."
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid grid-cols-3 gap-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-col gap-1.5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Buyback" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							value: buyback,
							onChange: (e) => setBuyback(Number(e.target.value) || 0)
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-col gap-1.5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "New strike" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							value: strike,
							onChange: (e) => setStrike(Number(e.target.value) || 0)
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-col gap-1.5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "New credit" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							value: credit,
							onChange: (e) => setCredit(Number(e.target.value) || 0)
						})]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "font-mono text-sm tabular",
				children: [
					"Net ",
					net >= 0 ? "credit" : "debit",
					" ",
					formatPrice(Math.abs(net)),
					" · extra room ",
					formatPrice(extraRoom),
					" · new basis ",
					formatPrice(trade.currentCostBasis - net)
				]
			}),
			extraRoom > 0 && -Math.min(net, 0) > extraRoom + .05 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-loss",
				children: "Debit is larger than the extra strike room — assignment is cleaner."
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				className: "w-full",
				disabled: !candidate,
				onClick: () => {
					const expiry = kind === "up" ? snapshot.weekly?.expiry : snapshot.nextWeekly?.expiry;
					if (!expiry) return;
					onConfirm({
						contracts: trade.contracts,
						stockFill: snapshot.quote.last,
						callFill: credit,
						strike,
						expiry,
						bid: quote?.bid ?? pick?.bid ?? null,
						ask: quote?.ask ?? pick?.ask ?? null,
						last: quote?.last ?? pick?.last ?? null
					}, buyback, kind);
					onOpenChange(false);
				},
				children: "Capture roll"
			})
		] })
	});
}
function Mini$1({ k, v }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
		className: "text-kicker uppercase tracking-wide text-muted-foreground",
		children: k
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
		className: "font-mono tabular",
		children: v
	})] });
}
function Sparkline({ points, className }) {
	if (points.length < 2) return null;
	const w = 160;
	const h = 36;
	const values = points.map((p) => p.c);
	const min = Math.min(...values);
	const span = Math.max(...values) - min || 1;
	const d = values.map((v, i) => {
		const x = i / (values.length - 1) * w;
		const y = h - (v - min) / span * 34 - 1;
		return `${i === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`;
	}).join(" ");
	const up = values[values.length - 1] >= values[0];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("svg", {
		viewBox: `0 0 ${w} ${h}`,
		className,
		"aria-hidden": "true",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
			d,
			fill: "none",
			stroke: up ? "var(--color-gain)" : "var(--color-loss)",
			strokeWidth: "1.5",
			strokeLinejoin: "round",
			strokeLinecap: "round"
		})
	});
}
function TicketDialog({ open, onOpenChange, pick, spot, delayed = true }) {
	const openTrade = useTradeStore((s) => s.openTrade);
	const [contracts, setContracts] = (0, import_react.useState)(1);
	const [stockFill, setStockFill] = (0, import_react.useState)(spot);
	const [callFill, setCallFill] = (0, import_react.useState)(pick?.sell ?? 0);
	(0, import_react.useEffect)(() => {
		if (!open || !pick) return;
		setContracts(1);
		setStockFill(Number(spot.toFixed(2)));
		setCallFill(Number(pick.sell.toFixed(2)));
	}, [
		open,
		pick,
		spot
	]);
	const math = (0, import_react.useMemo)(() => {
		if (!pick) return null;
		const shares = contracts * 100;
		const intrinsic = intrinsicCall(stockFill, pick.strike);
		const extrinsic = extrinsicCall(callFill, stockFill, pick.strike);
		return {
			shares,
			intrinsic,
			extrinsic,
			debit: stockFill * shares - callFill * shares,
			basis: stockFill - callFill,
			assigned: extrinsic * shares,
			cushion: callFill / stockFill
		};
	}, [
		pick,
		contracts,
		stockFill,
		callFill
	]);
	if (!pick || !math) return null;
	function confirm() {
		if (!pick || !math) return;
		openTrade({
			contracts,
			stockFill,
			callFill,
			strike: pick.strike,
			expiry: pick.expiry,
			bid: pick.bid,
			ask: pick.ask,
			last: pick.last
		});
		toast.success("Cover captured", { description: `${math.shares} SPCX / ${contracts} ${formatStrike(pick.strike)}C. Extrinsic ${formatMoney(math.extrinsic * math.shares)} booked against basis.` });
		onOpenChange(false);
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
		open,
		onOpenChange,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, { children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, { children: "Open ITM cover" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogDescription, { children: [
				"Buy ",
				math.shares,
				" SPCX and sell ",
				contracts,
				" ",
				formatStrike(pick.strike),
				" call expiring",
				" ",
				formatExpiryLong(pick.expiry),
				".",
				" ",
				delayed ? "Fills default to the delayed last print (close). This desk does not send broker orders." : "Fills default to last / bid. This desk does not send broker orders."
			] })] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid grid-cols-3 gap-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						label: "Contracts",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							inputMode: "numeric",
							value: contracts,
							onChange: (e) => setContracts(Math.max(1, Math.min(20, Number(e.target.value) || 1)))
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						label: "Stock fill",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							inputMode: "decimal",
							value: stockFill,
							onChange: (e) => setStockFill(Number(e.target.value) || 0)
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						label: "Call credit",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							inputMode: "decimal",
							value: callFill,
							onChange: (e) => setCallFill(Number(e.target.value) || 0)
						})
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dl", {
				className: "mt-4 grid grid-cols-2 gap-2 text-sm",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
						k: "Shares",
						v: String(math.shares)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
						k: "Net debit",
						v: formatMoney(math.debit)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
						k: "Cost basis",
						v: formatPrice(math.basis)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
						k: "Intrinsic sold",
						v: formatPrice(math.intrinsic)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
						k: "Extrinsic harvested",
						v: formatPrice(math.extrinsic)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
						k: "If assigned, locked",
						v: formatMoney(math.assigned)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
						k: "Cushion",
						v: formatPctPlain(math.cushion)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
						k: "Breakeven",
						v: formatPrice(math.basis)
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				className: "mt-5 w-full",
				onClick: confirm,
				children: "Capture cover"
			})
		] })
	});
}
function Field({ label, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-col gap-1.5",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: label }), children]
	});
}
function Row({ k, v }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex items-baseline justify-between gap-3 rounded-lg bg-secondary/60 px-3 py-2",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
			className: "text-muted-foreground",
			children: k
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
			className: "font-mono text-sm tabular",
			children: v
		})]
	});
}
function Glossary({ open, onOpenChange }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
		open,
		onOpenChange,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
			className: "max-h-[85vh] overflow-y-auto",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, { children: "How the cover works" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription, { children: "The desk is built around one idea: sell weekly in-the-money calls near the expected move, and let assignment or a lower basis do the work." })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dl", {
				className: "flex flex-col gap-4 text-sm",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Item, {
						t: "Extrinsic value",
						d: "The part of the option price that is not already in the stock. Intrinsic is spot minus strike. Extrinsic is everything else — time. If you are assigned, intrinsic nets out against the stock sale. Extrinsic is what you keep."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Item, {
						t: "Expected move",
						d: "What the options market is pricing for the week, usually the at-the-money straddle. The desk sells a call about one of those moves in-the-money, so you are paid to sit inside the range the market already expects."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Item, {
						t: "If shares are taken",
						d: "The call finishes in the money, your 100 shares are sold at the strike, and you keep the premium. Realized profit collapses to the extrinsic you sold. That is a completed week, not a failure. Recycle the cash into next Friday’s cover."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Item, {
						t: "If the stock drops",
						d: "The call expires. You keep the shares and the entire premium. Cost basis falls by that credit. Next week, sell a new ITM call against the same shares — do not automatically buy more stock."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Item, {
						t: "Next week",
						d: "The same cover, one Friday later: that week’s ATM straddle as the expected move, the ITM call nearest one move under spot, last / bid / ask, extrinsic, and yield. Use it to recycle after assignment, to overlay shares you kept, or as the up-and-out roll target."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Item, {
						t: "If the stock rips — when to roll up",
						d: "Do not roll on a bounce. The desk flags a roll-up when SPCX is up one full expected move from your stock fill. Default is still assignment — that harvests the extrinsic you sold. Roll up (same week, higher strike) or up-and-out (next week) only if you want to keep the shares, and only if the debit to swap strikes is no larger than the extra room you just bought."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Item, {
						t: "What the manager captures",
						d: "Fills, the intrinsic/extrinsic split, net debit, cost basis, live remaining time value, roll-up alerts, and auto-settlement after expiry (assigned vs. expired). You still confirm rolls and early closes."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Item, {
						t: "What it will not do",
						d: "This is not a broker. Quotes are delayed (close is fine). Paper fills default to the delayed last print after the bell. Size stays in 100-share lots."
					})
				]
			})]
		})
	});
}
function Item({ t, d }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
		className: "font-medium",
		children: t
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
		className: "mt-1 text-muted-foreground",
		children: d
	})] });
}
function clamp(n, lo, hi) {
	return Math.min(hi, Math.max(lo, n));
}
function MoveMap({ last, expectedMove, pick }) {
	if (!expectedMove) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "text-sm text-muted-foreground",
		children: "Expected move loads with this expiry’s chain."
	});
	const lo = Math.min(expectedMove.down - 4, pick?.breakeven ?? expectedMove.down, last - 8);
	const span = Math.max(expectedMove.up + 4, last + 6) - lo || 1;
	const pct = (px) => `${clamp((px - lo) / span * 100, 1, 99)}%`;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-col gap-4",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "relative h-20",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "absolute top-7 right-0 left-0 h-px bg-border" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "absolute top-6 h-3 rounded-full bg-track",
					style: {
						left: pct(expectedMove.down),
						width: `${clamp((expectedMove.up - expectedMove.down) / span * 100, 4, 90)}%`
					}
				}),
				pick ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tick, {
					left: pct(pick.strike),
					label: `${formatStrike(pick.strike)}C`,
					sub: "strike"
				}) : null,
				pick && Math.abs(pick.breakeven - pick.strike) / span > .045 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tick, {
					left: pct(pick.breakeven),
					label: formatPrice(pick.breakeven),
					sub: "basis"
				}) : null,
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tick, {
					left: pct(last),
					label: formatPrice(last),
					sub: "spot",
					accent: true
				})
			]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "grid grid-cols-3 gap-2 text-xs",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat$1, {
					k: "Expected move",
					v: `±${formatPrice(expectedMove.dollars)}`,
					d: expectedMove.source === "straddle" ? "ATM straddle" : "From IV"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat$1, {
					k: "Downside band",
					v: formatPrice(expectedMove.down),
					d: "One move below"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat$1, {
					k: "Upside band",
					v: formatPrice(expectedMove.up),
					d: "One move above"
				})
			]
		})]
	});
}
function Tick({ left, label, sub, accent }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "absolute top-0 -translate-x-1/2",
		style: { left },
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex flex-col items-center",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: `font-mono text-kicker tabular ${accent ? "text-foreground" : "text-muted-foreground"}`,
					children: label
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "text-kicker uppercase tracking-wide text-muted-foreground",
					children: sub
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: `mt-1 h-3 w-px ${accent ? "bg-primary" : "bg-border"}` }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: `size-1.5 rounded-full ${accent ? "bg-primary" : "bg-muted-foreground"}` })
			]
		})
	});
}
function Stat$1({ k, v, d }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "rounded-xl bg-secondary/70 px-3 py-2",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "text-kicker uppercase tracking-wide text-muted-foreground",
				children: k
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "font-mono text-sm tabular",
				children: v
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "text-kicker text-muted-foreground",
				children: d
			})
		]
	});
}
function WeekPanel({ label, last, pick, expectedMove, onOpen }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, { children: label }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardDescription, { children: pick ? `${formatExpiryLong(pick.expiry)} · ${pick.dte} DTE · sell near one expected move ITM` : "Waiting on this expiry’s delayed chain." })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
		className: "flex flex-col gap-5",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MoveMap, {
			last,
			expectedMove,
			pick
		}), pick ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-kicker uppercase tracking-wide text-muted-foreground",
					children: "Recommended cover"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "mt-1 font-mono text-2xl tabular tracking-tight",
					children: [
						formatStrike(pick.strike),
						"C · ",
						formatExpiryLong(pick.expiry)
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-sm text-muted-foreground",
					children: pick.why
				})
			] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dl", {
				className: "grid grid-cols-2 gap-2 sm:grid-cols-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
						k: "Last",
						v: formatPrice(pick.last)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
						k: "Bid",
						v: formatPrice(pick.bid)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
						k: "Ask",
						v: formatPrice(pick.ask)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
						k: "Sell / credit",
						v: formatPrice(pick.sell)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
						k: "Extrinsic",
						v: formatPrice(pick.extrinsic),
						gain: true
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
						k: "Intrinsic",
						v: formatPrice(pick.intrinsic)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
						k: "Delta",
						v: pick.delta != null ? pick.delta.toFixed(2) : "—"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
						k: "Weekly yield",
						v: formatPctPlain(pick.weeklyYield)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
						k: "Basis if filled",
						v: formatPrice(pick.breakeven)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
						k: "If assigned",
						v: formatMoney(pick.maxProfitIfAssigned)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
						k: "Volume",
						v: formatCompact(pick.volume)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
						k: "Open interest",
						v: formatCompact(pick.openInterest)
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
				className: "w-full sm:w-auto",
				onClick: () => onOpen(pick),
				children: [
					"Open 1× ",
					formatStrike(pick.strike),
					"C"
				]
			})
		] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-sm text-muted-foreground",
			children: "No ITM call scored for this expiry yet."
		})]
	})] });
}
function Stat({ k, v, gain }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "rounded-xl bg-secondary/70 px-3 py-2",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "text-kicker uppercase tracking-wide text-muted-foreground",
			children: k
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: `font-mono text-sm tabular ${gain ? "text-gain" : ""}`,
			children: v
		})]
	});
}
function sessionLabel(state) {
	if (state === "open") return "Regular hours";
	if (state === "pre") return "Pre-market";
	if (state === "post") return "After hours";
	return "Closed";
}
function DeskPage({ initial }) {
	const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
		queryKey: ["market"],
		queryFn: () => getMarketSnapshot(),
		initialData: initial,
		initialDataUpdatedAt: initial?.fetchedAt
	});
	const hydrated = useTradeStore((s) => s.hydrated);
	const trades = useTradeStore((s) => s.trades);
	const markOpen = useTradeStore((s) => s.markOpen);
	const settleExpired = useTradeStore((s) => s.settleExpired);
	const [ticket, setTicket] = (0, import_react.useState)(null);
	const [tab, setTab] = (0, import_react.useState)("desk");
	const [glossary, setGlossary] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		if (!hydrated || !data) return;
		settleExpired(data);
		markOpen(data);
	}, [
		hydrated,
		data,
		markOpen,
		settleExpired
	]);
	const open = (0, import_react.useMemo)(() => trades.filter((t) => t.status === "open"), [trades]);
	const book = data ? playbookForDesk(data, open, data.pick) : null;
	const portfolio = stats(trades, data ?? null);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto flex min-h-screen max-w-6xl flex-col px-4 pt-5 pb-16 sm:px-6",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "flex flex-wrap items-end justify-between gap-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-kicker font-medium uppercase tracking-widest text-muted-foreground",
					children: "Orbit Cover"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "mt-1 text-2xl font-medium tracking-tight",
					children: "SPCX ITM covered-call desk"
				})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
						variant: "ghost",
						size: "sm",
						onClick: () => setGlossary(true),
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BookOpen, {}), "How it works"]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
						variant: "secondary",
						size: "sm",
						onClick: () => void refetch(),
						disabled: isFetching,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RefreshCw, { className: isFetching ? "animate-spin" : "" }), "Refresh"]
					})]
				})]
			}),
			isLoading || !data ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoadingState, {}) : isError ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-10 text-sm text-loss",
				children: error instanceof Error ? error.message : "Market data failed."
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "mt-8 grid items-end gap-6 md:grid-cols-[1fr_auto]",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-wrap items-baseline gap-3",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "font-mono text-kicker uppercase tracking-wide text-muted-foreground",
									children: "SPCX"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "font-mono text-display leading-none tabular tracking-tight",
									children: formatPrice(data.quote.last)
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: `font-mono text-lg tabular ${signClass(data.quote.change)}`,
									children: [
										formatSigned(data.quote.change),
										" ",
										formatPct(data.quote.changePct)
									]
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
									variant: "outline",
									children: "Delayed"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
									variant: "outline",
									children: sessionLabel(data.quote.marketState)
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [data.quote.asOf, " ET close"] }),
								data.quote.postLast != null ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: ["AH ", formatPrice(data.quote.postLast)] }) : null,
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: ["Vol ", formatCompact(data.quote.volume)] }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
									"52w ",
									formatPrice(data.quote.yearLow),
									"–",
									formatPrice(data.quote.yearHigh)
								] })
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-2 text-kicker text-muted-foreground",
							children: data.source
						})
					] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sparkline, {
						points: data.history,
						className: "hidden h-12 w-40 md:block"
					})]
				}),
				data.warning ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-4 text-xs text-muted-foreground",
					children: data.warning
				}) : null,
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-6 grid grid-cols-2 gap-2 sm:grid-cols-4",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mini, {
							k: "Open contracts",
							v: hydrated ? String(portfolio.openContracts) : "—"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mini, {
							k: "Capital at work",
							v: hydrated ? formatMoney(portfolio.capitalAtWork, { whole: true }) : "—"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mini, {
							k: "Harvested extrinsic",
							v: hydrated ? formatMoney(portfolio.harvestedExtrinsic, { whole: true }) : "—"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mini, {
							k: "Remaining theta",
							v: hydrated ? formatMoney(portfolio.openRemainingExtrinsic) : "—"
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Tabs, {
					value: tab,
					onValueChange: setTab,
					className: "mt-8",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TabsList, { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsTrigger, {
								value: "desk",
								children: "Desk"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsTrigger, {
								value: "chain",
								children: "Weeklies"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsTrigger, {
								value: "journal",
								children: "Journal"
							})
						] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TabsContent, {
							value: "desk",
							className: "flex flex-col gap-4",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "grid gap-4 lg:grid-cols-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(WeekPanel, {
										label: "This week",
										last: data.quote.last,
										pick: data.pick,
										expectedMove: data.expectedMove,
										onOpen: setTicket
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(WeekPanel, {
										label: "Next week",
										last: data.quote.last,
										pick: data.nextPick,
										expectedMove: data.nextExpectedMove,
										onOpen: setTicket
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, { children: book?.kicker }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardDescription, { children: book?.headline })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
									className: "flex flex-col gap-4",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-sm leading-relaxed text-muted-foreground",
										children: book?.body
									}), book?.steps.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ol", {
										className: "flex list-decimal flex-col gap-1.5 pl-4 text-sm text-muted-foreground",
										children: book.steps.map((step) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: step }, step))
									}) : null]
								})] }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Separator, {}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex flex-col gap-3",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
										className: "text-sm font-medium",
										children: "Open covers"
									}), !hydrated ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-28" }) : open.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-sm text-muted-foreground",
										children: "No live cover. Open this week or next week and the desk will capture fills, split intrinsic vs. extrinsic, and settle assignment or expiry on its own."
									}) : open.map((t) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PositionCard, {
										trade: t,
										snapshot: data
									}, t.id))]
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TabsContent, {
							value: "chain",
							className: "flex flex-col gap-4",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardTitle, { children: ["This week · ", data.weekly ? formatExpiryLong(data.weekly.expiry) : "—"] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardDescription, { children: "Delayed last prints. Highlighted row is nearest one expected move in-the-money." })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardContent, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChainTable, {
								picks: data.ranked,
								recommendedStrike: data.pick?.strike ?? null,
								spot: data.quote.last,
								onSelect: setTicket
							}) })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardTitle, { children: ["Next week · ", data.nextWeekly ? formatExpiryLong(data.nextWeekly.expiry) : "—"] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardDescription, { children: "Same ranking on next Friday’s chain, using that week’s own expected move." })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardContent, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChainTable, {
								picks: data.nextRanked,
								recommendedStrike: data.nextPick?.strike ?? null,
								spot: data.quote.last,
								onSelect: setTicket
							}) })] })]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsContent, {
							value: "journal",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(JournalView, {
								trades: hydrated ? trades : [],
								snapshot: data
							})
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TicketDialog, {
					open: ticket != null,
					onOpenChange: (v) => {
						if (!v) setTicket(null);
					},
					pick: ticket,
					spot: data.quote.last,
					delayed: data.quote.marketState !== "open"
				})
			] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Glossary, {
				open: glossary,
				onOpenChange: setGlossary
			})
		]
	});
}
function Mini({ k, v }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "rounded-2xl bg-card px-3 py-3 shadow-[0_0_0_1px_rgba(255,255,255,0.08)]",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "text-kicker uppercase tracking-wide text-muted-foreground",
			children: k
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mt-1 font-mono text-base tabular sm:text-lg",
			children: v
		})]
	});
}
function LoadingState() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mt-10 flex flex-col gap-4",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-16 w-64" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "grid gap-3 md:grid-cols-2",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-48" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-48" })]
		})]
	});
}
function Home() {
	const initial = Route.useLoaderData();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DeskPage, { initial });
}
//#endregion
export { Home as component };
