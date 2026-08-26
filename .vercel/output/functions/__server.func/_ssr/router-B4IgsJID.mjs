import { i as __toESM } from "../_runtime.mjs";
import { o as require_jsx_runtime, s as require_react } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { _ as useRouter, f as createRouter, g as createRootRoute, h as createFileRoute, l as Scripts, m as lazyRouteComponent, p as Outlet, u as HeadContent } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as TSS_SERVER_FUNCTION, r as getServerFnById, t as createServerFn } from "./ssr.mjs";
import { a as extrinsicCall, o as formatDateET, u as intrinsicCall } from "./time-BTa-rzwC.mjs";
import { n as TriangleAlert } from "../_libs/lucide-react.mjs";
import { a as union, i as string, n as number, r as object, t as literal } from "../_libs/zod.mjs";
import { n as QueryClientProvider } from "../_libs/tanstack__react-query.mjs";
import { t as QueryClient } from "../_libs/tanstack__query-core.mjs";
import { t as Toaster } from "../_libs/sonner.mjs";
import { n as create, t as persist } from "../_libs/zustand.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/router-B4IgsJID.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var __defProp = Object.defineProperty;
var __exportAll = (all, no_symbols) => {
	let target = {};
	for (var name in all) __defProp(target, name, {
		get: all[name],
		enumerable: true
	});
	if (!no_symbols) __defProp(target, Symbol.toStringTag, { value: "Module" });
	return target;
};
function AppErrorComponent({ error }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "flex min-h-screen flex-col items-center justify-center gap-3 px-6 text-center bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "text-red-500",
				"aria-hidden": "true",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TriangleAlert, {
					className: "size-10",
					strokeWidth: 2
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "text-lg font-semibold",
				children: "Something went wrong"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "max-w-md text-sm break-words text-zinc-500 dark:text-zinc-400",
				children: error.message || "An unexpected error occurred. Try reloading the page."
			})
		]
	});
}
/**
* App-wide client provider mounted once near the root (in `src/routes/__root.tsx`):
*
*   <AuthProvider><Outlet /></AuthProvider>
*
* Better Auth's React client (`@/lib/auth/client`) needs NO context provider —
* its `useSession()` works standalone — so this is a passthrough today. It's
* kept as the single, stable mount point for any future client-side providers
* (e.g. a toast or theme provider) without churning the root shell.
*/
function AuthProvider({ children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_jsx_runtime.Fragment, { children });
}
function isGrokEmbedderOrigin(origin) {
	try {
		const url = new URL(origin);
		if (url.protocol !== "https:" && url.protocol !== "http:") return false;
		const host = url.hostname.toLowerCase();
		if (host === "grok.com" || host.endsWith(".grok.com")) return true;
		if (host === "localhost" || host === "127.0.0.1" || host === "[::1]") return true;
		return false;
	} catch {
		return false;
	}
}
function isSandboxPreviewGuestHost(hostname) {
	const host = hostname.toLowerCase();
	return host === "grok-sandbox.com" || host.endsWith(".grok-sandbox.com");
}
function isRemintPreviewPair(guestHost, parentHost) {
	const guest = guestHost.toLowerCase();
	const parent = parentHost.toLowerCase();
	const i = guest.indexOf(".preview.");
	if (i <= 0) return false;
	const label = guest.slice(0, i);
	const rest = guest.slice(i + 9);
	if (label.includes(".") || !rest.includes(".")) return false;
	return parent === rest || parent === `grok.${rest}`;
}
function resolveParentEmbedderOrigin(parentIsSelf, referrer, ancestorOrigin, guestHostname = "") {
	if (parentIsSelf) return null;
	for (const candidate of [referrer, ancestorOrigin ?? ""].filter(Boolean)) try {
		const url = new URL(candidate.includes("://") ? candidate : `https://${candidate}`);
		if (url.protocol !== "https:" && url.protocol !== "http:") continue;
		if (isGrokEmbedderOrigin(url.origin)) return url.origin;
		if (isSandboxPreviewGuestHost(guestHostname) || isRemintPreviewPair(guestHostname, url.hostname)) return url.origin;
	} catch {}
	return null;
}
/**
* Guest side of the grok-web ↔ sandbox preview postMessage bridge.
*
* Activates only when this page is framed by an allowlisted Grok embedder.
* Top-level runs (download/export, local `npm run dev`, deployed sites) noop.
*/
var PREVIEW_BRIDGE_CHANNEL = "grok-preview-bridge";
var EnvelopeSchema = object({
	channel: literal(PREVIEW_BRIDGE_CHANNEL),
	version: number().int().positive(),
	type: string().min(1)
});
var HelloSchema = EnvelopeSchema.extend({ type: literal("hello") });
var NavigateSchema = EnvelopeSchema.extend({
	type: literal("navigate"),
	path: string().min(1)
});
var HistorySchema = EnvelopeSchema.extend({
	type: literal("history"),
	delta: union([literal(-1), literal(1)])
});
function isSafeBridgePath(path) {
	if (!path.startsWith("/") || path.startsWith("//") || path.includes("\\")) return false;
	try {
		return new URL(path, "https://preview.invalid").origin === "https://preview.invalid";
	} catch {
		return false;
	}
}
/**
* Install host↔guest messaging. Returns a dispose function.
* Noops (returns a no-op dispose) when not embedded under a Grok parent.
*/
function installPreviewHostBridge(options = {}) {
	if (typeof window === "undefined") return () => {};
	const ancestorOrigin = typeof location.ancestorOrigins !== "undefined" && location.ancestorOrigins.length > 0 ? location.ancestorOrigins[0] : null;
	const parentOrigin = resolveParentEmbedderOrigin(window.parent === window, document.referrer, ancestorOrigin, window.location.hostname);
	if (parentOrigin === null) return () => {};
	const ROOT_STATE_KEY = "__grokPreviewBridgeRoot";
	const originalPushState = window.history.pushState.bind(window.history);
	const originalReplaceState = window.history.replaceState.bind(window.history);
	const isAtHistoryRoot = () => {
		const state = window.history.state;
		return Boolean(state && typeof state === "object" && state[ROOT_STATE_KEY] === true);
	};
	try {
		const current = window.history.state;
		if (!(current !== null && typeof current === "object" && Object.prototype.hasOwnProperty.call(current, ROOT_STATE_KEY))) {
			const isRoot = window.history.length <= 1;
			originalReplaceState(current && typeof current === "object" ? {
				...current,
				[ROOT_STATE_KEY]: isRoot
			} : { [ROOT_STATE_KEY]: isRoot }, "", window.location.href);
		}
	} catch {}
	const post = (message) => {
		window.parent.postMessage(message, parentOrigin);
	};
	const reportLocation = () => {
		post({
			channel: PREVIEW_BRIDGE_CHANNEL,
			version: 1,
			type: "location",
			path: window.location.pathname || "/",
			search: window.location.search,
			hash: window.location.hash
		});
	};
	const reportRoutes = () => {
		const paths = options.getRoutePaths?.() ?? [];
		post({
			channel: PREVIEW_BRIDGE_CHANNEL,
			version: 1,
			type: "routes",
			paths
		});
	};
	const defaultNavigate = (path) => {
		if (!isSafeBridgePath(path)) return;
		try {
			const url = new URL(path, window.location.origin);
			if (url.origin !== window.location.origin) return;
			const next = `${url.pathname}${url.search}${url.hash}`;
			window.history.pushState(window.history.state, "", next);
			window.dispatchEvent(new PopStateEvent("popstate", { state: window.history.state }));
		} catch {}
	};
	const navigate = (path) => {
		if (!isSafeBridgePath(path)) return;
		if (options.navigate) {
			options.navigate(path);
			return;
		}
		defaultNavigate(path);
	};
	const announce = () => {
		reportLocation();
		reportRoutes();
		post({
			channel: PREVIEW_BRIDGE_CHANNEL,
			version: 1,
			type: "ready"
		});
	};
	const onMessage = (event) => {
		if (event.source !== window.parent) return;
		if (event.origin !== parentOrigin) return;
		const envelope = EnvelopeSchema.safeParse(event.data);
		if (!envelope.success || envelope.data.version !== 1) return;
		if (envelope.data.type === "hello") {
			if (!HelloSchema.safeParse(event.data).success) return;
			announce();
			return;
		}
		if (envelope.data.type === "navigate") {
			const parsed = NavigateSchema.safeParse(event.data);
			if (!parsed.success) return;
			navigate(parsed.data.path);
			queueMicrotask(reportLocation);
			return;
		}
		if (envelope.data.type === "history") {
			const parsed = HistorySchema.safeParse(event.data);
			if (!parsed.success) return;
			if (parsed.data.delta === -1 && isAtHistoryRoot()) return;
			window.history.go(parsed.data.delta);
		}
	};
	const onPopState = () => {
		reportLocation();
	};
	const onHashChange = () => {
		reportLocation();
	};
	window.history.pushState = (data, unused, url) => {
		const next = data && typeof data === "object" ? {
			...data,
			[ROOT_STATE_KEY]: false
		} : data;
		originalPushState(next, unused, url);
		reportLocation();
	};
	window.history.replaceState = (data, unused, url) => {
		const next = isAtHistoryRoot() ? {
			...data && typeof data === "object" ? data : {},
			[ROOT_STATE_KEY]: true
		} : data;
		originalReplaceState(next, unused, url);
		reportLocation();
	};
	window.addEventListener("message", onMessage);
	window.addEventListener("popstate", onPopState);
	window.addEventListener("hashchange", onHashChange);
	announce();
	return () => {
		window.removeEventListener("message", onMessage);
		window.removeEventListener("popstate", onPopState);
		window.removeEventListener("hashchange", onHashChange);
		window.history.pushState = originalPushState;
		window.history.replaceState = originalReplaceState;
	};
}
/** Collect static path patterns from a TanStack route tree (best-effort). */
function collectRoutePathsFromTree(routeTree) {
	const paths = /* @__PURE__ */ new Set();
	const walk = (node) => {
		if (!node || typeof node !== "object") return;
		const record = node;
		const full = typeof record.fullPath === "string" ? record.fullPath : typeof record.path === "string" ? record.path : null;
		if (full !== null && full !== "") paths.add(full.startsWith("/") ? full : `/${full}`);
		else if (full === "") paths.add("/");
		const children = record.children;
		if (Array.isArray(children)) for (const child of children) walk(child);
		else if (children && typeof children === "object") for (const child of Object.values(children)) walk(child);
	};
	walk(routeTree);
	return [...paths];
}
/**
* Mount once in `__root.tsx` so the Grok preview chrome can drive navigation
* (and later receive registered routes). Noops when the app is not embedded.
*/
function PreviewHostBridge() {
	const router = useRouter();
	(0, import_react.useEffect)(() => {
		return installPreviewHostBridge({
			navigate: (path) => {
				router.history.push(path);
			},
			getRoutePaths: () => collectRoutePathsFromTree(router.routeTree)
		});
	}, [router]);
	return null;
}
function lookupCall(chain, strike) {
	if (!chain) return null;
	return chain.calls.find((c) => Math.abs(c.strike - strike) < .001) ?? null;
}
function lookupCallAnywhere(snapshot, expiry, strike) {
	for (const chain of [snapshot.weekly, snapshot.nextWeekly]) if (chain && chain.expiry === expiry) {
		const hit = lookupCall(chain, strike);
		if (hit) return hit;
	}
	return null;
}
function multiplier(trade) {
	return trade.contracts * 100;
}
function premiumReceived(trade) {
	return trade.call.fill * multiplier(trade);
}
function stockCost(trade) {
	return trade.stockFill * trade.shares;
}
function netDebit(trade) {
	return stockCost(trade) - premiumReceived(trade);
}
function liveMark(trade, snapshot) {
	const stock = snapshot.quote.last;
	const quote = lookupCallAnywhere(snapshot, trade.call.expiry, trade.call.strike);
	const callPx = quote?.mid ?? quote?.last ?? quote?.sell ?? null;
	const intrinsic = intrinsicCall(stock, trade.call.strike);
	const remainingExtrinsic = callPx != null ? Math.max(0, callPx - intrinsic) : null;
	const stockPnl = (stock - trade.stockFill) * trade.shares;
	const optionPnl = callPx != null ? (trade.call.fill - callPx) * multiplier(trade) : 0;
	const totalPnl = stockPnl + (callPx != null ? optionPnl : premiumReceived(trade) * 0);
	const ifAssigned = (trade.call.strike - trade.stockFill) * trade.shares + premiumReceived(trade);
	const ifExpiredHere = (stock - trade.stockFill) * trade.shares + premiumReceived(trade);
	const diff = stock - trade.call.strike;
	const moneyness = diff > .05 ? "itm" : diff < -.05 ? "otm" : "atm";
	return {
		stock,
		call: callPx,
		intrinsic,
		remainingExtrinsic,
		stockPnl,
		optionPnl,
		totalPnl: callPx != null ? totalPnl : ifExpiredHere - premiumReceived(trade) + optionPnl,
		ifAssigned,
		ifExpiredHere,
		moneyness,
		assignmentLikely: moneyness === "itm" && (quote?.delta ?? .7) >= .65
	};
}
function assignedPnl(trade) {
	return (trade.call.strike - trade.stockFill) * trade.shares + premiumReceived(trade);
}
function expiredPnl(trade, stockAtExpiry) {
	return (stockAtExpiry - trade.stockFill) * trade.shares + premiumReceived(trade);
}
function closePnl(trade, stockExit, callBuyback) {
	return (stockExit - trade.stockFill) * trade.shares + (trade.call.fill - callBuyback) * multiplier(trade);
}
function harvestedOnAssign(trade) {
	return trade.extrinsicAtOpen * multiplier(trade);
}
function stats(trades, snapshot) {
	const open = trades.filter((t) => t.status === "open");
	const closed = trades.filter((t) => t.status !== "open");
	let harvested = 0;
	let realized = 0;
	for (const t of trades) {
		harvested += t.harvestedExtrinsic ?? 0;
		realized += t.realizedPnl ?? 0;
	}
	let openUnrealized = 0;
	let openRemaining = 0;
	if (snapshot) for (const t of open) {
		const m = liveMark(t, snapshot);
		openUnrealized += m.totalPnl;
		openRemaining += (m.remainingExtrinsic ?? 0) * multiplier(t);
	}
	const capital = open.reduce((s, t) => s + netDebit(t), 0);
	const basisSum = open.reduce((s, t) => s + t.currentCostBasis * t.shares, 0);
	const shareSum = open.reduce((s, t) => s + t.shares, 0);
	return {
		openTrades: open.length,
		openShares: shareSum,
		openContracts: open.reduce((s, t) => s + t.contracts, 0),
		capitalAtWork: capital,
		harvestedExtrinsic: harvested,
		realizedPnl: realized,
		openUnrealized,
		openRemainingExtrinsic: openRemaining,
		avgOpenBasis: shareSum ? basisSum / shareSum : null,
		closedCount: closed.length
	};
}
function nid() {
	return crypto.randomUUID();
}
function event(type, note, payload) {
	return {
		id: nid(),
		at: (/* @__PURE__ */ new Date()).toISOString(),
		type,
		note,
		payload
	};
}
function makeTrade(input) {
	const shares = input.contracts * 100;
	const intrinsic = intrinsicCall(input.stockFill, input.strike);
	const extrinsic = extrinsicCall(input.callFill, input.stockFill, input.strike);
	const basis = input.stockFill - input.callFill;
	const now = (/* @__PURE__ */ new Date()).toISOString();
	const callOpenedAt = now;
	return {
		id: nid(),
		openedAt: now,
		contracts: input.contracts,
		shares,
		stockFill: input.stockFill,
		call: {
			expiry: input.expiry,
			strike: input.strike,
			fill: input.callFill,
			bidAtOpen: input.bid,
			askAtOpen: input.ask,
			lastAtOpen: input.last,
			openedAt: callOpenedAt
		},
		intrinsicAtOpen: intrinsic,
		extrinsicAtOpen: extrinsic,
		openingCostBasis: basis,
		currentCostBasis: basis,
		status: "open",
		events: [event("open", `Bought ${shares} SPCX @ ${input.stockFill.toFixed(2)} and sold ${input.contracts} ${input.strike}C ${input.expiry} @ ${input.callFill.toFixed(2)}. Extrinsic ${extrinsic.toFixed(2)} captured at open.`, {
			stockFill: input.stockFill,
			callFill: input.callFill,
			strike: input.strike,
			expiry: input.expiry,
			extrinsic,
			intrinsic,
			basis
		})]
	};
}
var useTradeStore = create()(persist((set, get) => ({
	hydrated: false,
	trades: [],
	setHydrated: () => set({ hydrated: true }),
	openTrade: (input) => {
		const trade = makeTrade(input);
		set({ trades: [trade, ...get().trades] });
		return trade;
	},
	markOpen: (snapshot) => {
		const today = formatDateET();
		set({ trades: get().trades.map((t) => {
			if (t.status !== "open") return t;
			if (t.lastMarkAt === today) return {
				...t,
				lastStockMark: snapshot.quote.last,
				lastCallMark: liveMark(t, snapshot).call ?? t.lastCallMark
			};
			const m = liveMark(t, snapshot);
			return {
				...t,
				lastMarkAt: today,
				lastStockMark: m.stock,
				lastCallMark: m.call ?? t.lastCallMark,
				events: [...t.events, event("mark", `Marked ${m.stock.toFixed(2)} / call ${m.call?.toFixed(2) ?? "—"}. Remaining extrinsic ${m.remainingExtrinsic?.toFixed(2) ?? "—"}.`, {
					stock: m.stock,
					call: m.call,
					remainingExtrinsic: m.remainingExtrinsic,
					totalPnl: m.totalPnl
				})]
			};
		}) });
	},
	settleExpired: (snapshot) => {
		const today = formatDateET();
		set({ trades: get().trades.map((t) => {
			if (t.status !== "open") return t;
			if (t.call.expiry >= today) return t;
			const close = snapshot.quote.last;
			if (close >= t.call.strike) {
				const pnl = assignedPnl(t);
				const harvested = harvestedOnAssign(t);
				return {
					...t,
					status: "assigned",
					closedAt: (/* @__PURE__ */ new Date()).toISOString(),
					realizedPnl: pnl,
					harvestedExtrinsic: harvested,
					closeNote: "Auto-settled: close ≥ strike — shares called away.",
					events: [...t.events, event("assigned", `Auto-assigned. Shares sold at ${t.call.strike.toFixed(2)}. Realized ${pnl.toFixed(2)} (extrinsic harvested ${harvested.toFixed(2)}).`, {
						pnl,
						harvested,
						close
					})]
				};
			}
			const pnl = expiredPnl(t, close);
			const harvested = t.call.fill * t.contracts * 100;
			return {
				...t,
				status: "expired",
				closedAt: (/* @__PURE__ */ new Date()).toISOString(),
				realizedPnl: pnl,
				harvestedExtrinsic: harvested,
				currentCostBasis: t.stockFill - t.call.fill,
				closeNote: "Auto-settled: close < strike — call expired, shares kept.",
				events: [...t.events, event("expired", `Call expired. Kept ${t.shares} shares. Premium ${harvested.toFixed(2)} stays as basis reduction. Mark ${close.toFixed(2)}.`, {
					pnl,
					harvested,
					close
				})]
			};
		}) });
	},
	markAssigned: (id) => {
		set({ trades: get().trades.map((t) => {
			if (t.id !== id || t.status !== "open") return t;
			const pnl = assignedPnl(t);
			const harvested = harvestedOnAssign(t);
			return {
				...t,
				status: "assigned",
				closedAt: (/* @__PURE__ */ new Date()).toISOString(),
				realizedPnl: pnl,
				harvestedExtrinsic: harvested,
				closeNote: "Shares called away at strike.",
				events: [...t.events, event("assigned", `Called away at ${t.call.strike.toFixed(2)}. Locked the extrinsic harvested at open ($${harvested.toFixed(2)}).`, {
					pnl,
					harvested
				})]
			};
		}) });
	},
	markExpired: (id, stockAtExpiry) => {
		set({ trades: get().trades.map((t) => {
			if (t.id !== id || t.status !== "open") return t;
			const pnl = expiredPnl(t, stockAtExpiry);
			const harvested = t.call.fill * t.contracts * 100;
			return {
				...t,
				status: "expired",
				closedAt: (/* @__PURE__ */ new Date()).toISOString(),
				realizedPnl: pnl,
				harvestedExtrinsic: harvested,
				closeNote: "Call expired; shares kept.",
				events: [...t.events, event("expired", `Expired OTM. Kept shares. Full premium ${harvested.toFixed(2)} reduced cost basis to ${t.currentCostBasis.toFixed(2)}.`, {
					pnl,
					harvested,
					stockAtExpiry
				})]
			};
		}) });
	},
	closeTrade: (id, stockExit, callBuyback) => {
		set({ trades: get().trades.map((t) => {
			if (t.id !== id || t.status !== "open") return t;
			const pnl = closePnl(t, stockExit, callBuyback);
			const optionHarvest = (t.call.fill - callBuyback) * t.contracts * 100;
			return {
				...t,
				status: "closed",
				closedAt: (/* @__PURE__ */ new Date()).toISOString(),
				realizedPnl: pnl,
				harvestedExtrinsic: Math.max(0, optionHarvest),
				closeNote: "Closed stock and short call.",
				events: [...t.events, event("close", `Closed: sold shares @ ${stockExit.toFixed(2)}, bought back call @ ${callBuyback.toFixed(2)}. P&L ${pnl.toFixed(2)}.`, {
					pnl,
					stockExit,
					callBuyback
				})]
			};
		}) });
	},
	rollTrade: (id, next, buyback) => {
		set({ trades: get().trades.map((t) => {
			if (t.id !== id || t.status !== "open") return t;
			const rollCredit = next.callFill - buyback;
			const newBasis = t.currentCostBasis - rollCredit;
			const intrinsic = intrinsicCall(next.stockFill, next.strike);
			const extrinsic = extrinsicCall(next.callFill, next.stockFill, next.strike);
			return {
				...t,
				currentCostBasis: newBasis,
				call: {
					expiry: next.expiry,
					strike: next.strike,
					fill: next.callFill,
					bidAtOpen: next.bid,
					askAtOpen: next.ask,
					lastAtOpen: next.last,
					openedAt: (/* @__PURE__ */ new Date()).toISOString()
				},
				intrinsicAtOpen: intrinsic,
				extrinsicAtOpen: extrinsic,
				events: [...t.events, event("roll", `Rolled to ${next.strike}C ${next.expiry}. Bought back @ ${buyback.toFixed(2)}, sold @ ${next.callFill.toFixed(2)} (${rollCredit >= 0 ? "credit" : "debit"} ${Math.abs(rollCredit).toFixed(2)}). Basis now ${newBasis.toFixed(2)}.`, {
					buyback,
					newFill: next.callFill,
					newStrike: next.strike,
					newExpiry: next.expiry,
					rollCredit,
					newBasis
				})]
			};
		}) });
	},
	removeTrade: (id) => set({ trades: get().trades.filter((t) => t.id !== id) })
}), {
	name: "orbit-cover.trades",
	skipHydration: true,
	partialize: (s) => ({ trades: s.trades })
}));
function Providers({ children }) {
	const [client] = (0, import_react.useState)(() => new QueryClient({ defaultOptions: { queries: {
		staleTime: 3e4,
		refetchOnWindowFocus: false,
		retry: 1
	} } }));
	(0, import_react.useEffect)(() => {
		Promise.resolve(useTradeStore.persist.rehydrate()).then(() => {
			useTradeStore.getState().setHydrated();
		});
	}, []);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(QueryClientProvider, {
		client,
		children: [children, /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toaster, {
			theme: "dark",
			position: "bottom-center",
			toastOptions: { classNames: { toast: "bg-card text-foreground border-border shadow-none" } }
		})]
	});
}
var styles_default = "/assets/styles-ldYa00T1.css";
var APP_NAME = "Orbit Cover";
var Route$1 = createRootRoute({
	head: () => ({
		meta: [
			{ charSet: "utf-8" },
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1"
			},
			{ title: APP_NAME },
			{
				name: "theme-color",
				content: "#0a0b0d"
			},
			{
				name: "description",
				content: "ITM covered-call desk for SPCX — harvest weekly extrinsic near the expected move."
			}
		],
		links: [
			{
				rel: "icon",
				type: "image/svg+xml",
				href: "/favicon.svg"
			},
			{
				rel: "stylesheet",
				href: styles_default
			},
			{
				rel: "manifest",
				href: "/__grok/manifest.webmanifest"
			},
			{
				rel: "apple-touch-icon",
				href: "/__grok/icon-180.png"
			},
			{
				rel: "preconnect",
				href: "https://fonts.googleapis.com"
			},
			{
				rel: "preconnect",
				href: "https://fonts.gstatic.com",
				crossOrigin: "anonymous"
			},
			{
				rel: "stylesheet",
				href: "https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=Instrument+Sans:wght@400;500;600&display=swap"
			}
		]
	}),
	component: () => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("html", {
		lang: "en",
		className: "antialiased",
		suppressHydrationWarning: true,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("head", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(HeadContent, {}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("body", { children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PreviewHostBridge, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AuthProvider, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Providers, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Outlet, {}) }) }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Scripts, {})
		] })]
	})
});
var createSsrRpc = (functionId) => {
	const url = "/_serverFn/" + functionId;
	const serverFnMeta = { id: functionId };
	const fn = async (...args) => {
		return (await getServerFnById(functionId, { origin: "server" }))(...args);
	};
	return Object.assign(fn, {
		url,
		serverFnMeta,
		[TSS_SERVER_FUNCTION]: true
	});
};
var getMarketSnapshot = createServerFn({ method: "GET" }).handler(createSsrRpc("4f770c30bfcf4b5ebc36bebfbedefcee6cb0d6b6b396debf85ee95f3fdc893bc"));
createServerFn({ method: "GET" }).validator((input) => {
	const d = input ?? {};
	if (!d.expiry || !/^\d{4}-\d{2}-\d{2}$/.test(d.expiry)) throw new Error("expiry required");
	return { expiry: d.expiry };
}).handler(createSsrRpc("af7b8afae18a1f384c132e43faab98d0bfcdd661acd1167a6b841017125368ab"));
var $$splitComponentImporter = () => import("./routes-DFlp4l52.mjs");
var Route = createFileRoute("/")({
	loader: () => getMarketSnapshot(),
	component: lazyRouteComponent($$splitComponentImporter, "component")
});
var rootRouteChildren = { IndexRoute: Route.update({
	id: "/",
	path: "/",
	getParentRoute: () => Route$1
}) };
var routeTree = Route$1._addFileChildren(rootRouteChildren)._addFileTypes();
var router_exports = /* @__PURE__ */ __exportAll({ getRouter: () => getRouter });
function getRouter() {
	return createRouter({
		routeTree,
		defaultErrorComponent: AppErrorComponent
	});
}
//#endregion
export { liveMark as a, lookupCall as c, useTradeStore as i, Route as n, premiumReceived as o, getMarketSnapshot as r, stats as s, router_exports as t };
