# Orbit Cover

SPCX ITM covered-call desk — rank weekly ITM calls near one expected move, paper-track fills, extrinsic harvest, roll-up alerts, and journal.

## Thinkorswim (Copy TOS)

On **this week** / **next week** pick panels and on each chain row:

- **Copy TOS** / **TOS** copies option symbol + covered-stock legs to the clipboard  
- Example:

```text
.SPCX260828C132

BUY +100 SPCX @ LMT 137.95
SELL -1 SPCX 100 28 AUG 26 132 CALL @ LMT 6.97
```

Limits are **delayed desk prints** — always reprice on the live TOS chain before send.

## Run locally

```bash
npm install
npm run dev
```

App listens on `http://0.0.0.0:8080`.

## Deploy

Import this repo on [Vercel](https://vercel.com) (Nitro / TanStack Start). Market data uses delayed Yahoo + Nasdaq public endpoints.

## Status

Latest `main` includes Copy TOS (`src/lib/market/tos-copy.ts`, week panels, chain table).
