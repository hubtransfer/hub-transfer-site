# RELATÓRIO FRONTEND — HUB Transfer Site
**Data:** 10/06/2026 · **Gerado por:** auditoria somente-leitura (nada foi alterado, commitado ou pushado)
**Repo:** `C:\Projetos\hub-transfer-site` (GitHub: hubtransfer/hub-transfer-site)

---

## 1. GIT — ESTADO EXATO

### Branches (`git branch -a`)
```
* camada2-coords-motorista
  master
  remotes/origin/master
```
- **Branch ativo:** `camada2-coords-motorista`
- O branch `camada2-coords-motorista` existe **apenas localmente** (não há `remotes/origin/camada2-coords-motorista`).

### Commit e9285ec
`git log camada2-coords-motorista --oneline -5`:
```
e9285ec feat(camada2): coordsOrigem/coordsDestino fluem do getViagens ate ao SwipeBar
24cc1f4 fix: remove footer background - same as body, separated by gold line only
d13c20a feat: professional footer with legal compliance + privacy/terms pages
a8e696a feat: restaurant improvements - DDI detection, polling, type badges and filters
6f6a4b9 feat: delete trip button in admin with password confirmation
```

`git branch --contains e9285ec`:
```
* camada2-coords-motorista
```
**→ e9285ec NÃO foi mergeado para master.** Só existe no branch camada2.

`git log master --oneline -10` (HEAD de master = `24cc1f4`, ou seja, master está exatamente 1 commit atrás de camada2):
```
24cc1f4 fix: remove footer background - same as body, separated by gold line only
d13c20a feat: professional footer with legal compliance + privacy/terms pages
a8e696a feat: restaurant improvements - DDI detection, polling, type badges and filters
6f6a4b9 feat: delete trip button in admin with password confirmation
f8c5d1b fix: restaurant portal tabs - session loading + sticky tabs
9b5a1e7 feat: unify restaurant login into /login page
fcf762a feat: change password when logged in - all portals
e350008 feat: reset password page with token validation
67ada90 feat: forgot password flow - all portals
1eda17c feat: AddressAutocomplete with Google Places across entire project
```

### Working tree (`git status`)
```
On branch camada2-coords-motorista
Changes not staged for commit:
	modified:   .claude/settings.local.json

Untracked files:
	DIAGNOSTICO_TRACKING.md
	ESTADO_ATUAL.md
```
(+ este `RELATORIO_FRONTEND_10JUN2026.md` ficará untracked após a geração.)

---

## 2. STACK E VERSÕES (package.json real)

| Pacote | Versão declarada | Versão resolvida no build |
|---|---|---|
| next | `^16.2.1` | **16.2.1 (Turbopack)** |
| react / react-dom | `^19.2.4` | 19.2.x |
| typescript | `^5.9.3` | 5.9.x |
| tailwindcss | `^4.2.2` (+ `@tailwindcss/postcss ^4.2.2`) | 4.2.x |
| framer-motion | `^12.38.0` | — |
| lucide-react | `^0.577.0` | — |
| @base-ui/react | `^1.3.0` | — |
| eslint / eslint-config-next | `^9.39.4` / `^16.2.1` | — |

> Nota: o CLAUDE.md diz "Next.js 15", mas o package.json e o build real usam **Next.js 16.2.1**.

### Scripts
```json
"scripts": {
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "next lint"
}
```

---

## 3. ESTRUTURA DE ROTAS (App Router)

Páginas existentes (`src/app/**/page.tsx`) — **não há route handlers** (`route.ts`) nem rotas API:

| Rota | Ficheiro |
|---|---|
| `/` | `src/app/page.tsx` |
| `/admin/trips` | `src/app/admin/trips/page.tsx` |
| `/admin/partners` | `src/app/admin/partners/page.tsx` |
| `/driver/trips` | `src/app/driver/trips/page.tsx` |
| `/portal` | `src/app/portal/page.tsx` |
| `/restaurante` | `src/app/restaurante/page.tsx` |
| `/login` | `src/app/login/page.tsx` |
| `/reset-password` | `src/app/reset-password/page.tsx` |
| `/privacidade` | `src/app/privacidade/page.tsx` |
| `/termos` | `src/app/termos/page.tsx` |

---

## 4. FICHEIROS DO TRACKING

### 4.1 `src/lib/trips.ts` — interface HubViagem (linhas 38–82)

**✅ CONFIRMADO: `coordsOrigem` e `coordsDestino` existem na interface** (linhas 80–81).

```typescript
export interface HubViagem {
  id: string;
  rowIndex?: string;
  type?: string;
  date?: string;          // DD/MM/YYYY — trip date
  client: string;
  phone: string;
  origin: string;
  destination: string;
  pickupTime: string;
  flight: string;
  flightDate?: string;
  depAirport?: string;
  depCity?: string;
  depTime?: string;
  depTerminal?: string;
  arrAirport?: string;
  arrCity?: string;
  arrTime?: string;
  arrTerminal?: string;
  depIata?: string;
  arrIata?: string;
  statusVoo?: string;      // "AGUARDANDO" | "MONITORANDO" | "EN_VOO" | "ATERRISADO"
  atrasoMin?: string;      // delay minutes ("25", "0")
  depTimeProg?: string;    // programmed departure time
  etaChegada?: string;     // estimated arrival time
  etaChegadaFull?: string;  // full ETA string from backend
  depTimeFull?: string;     // full departure time string from backend
  depActual?: string;       // HH:MM — actual departure time
  depActualFull?: string;   // YYYY-MM-DD HH:MM
  depDelay?: string;        // departure delay minutes
  arrOriginal?: string;     // HH:MM — original scheduled arrival
  arrOriginalFull?: string; // YYYY-MM-DD HH:MM
  language: string;
  pax: string;
  bags?: string;
  notes?: string;
  driver: string;
  platform: string;
  concluida: boolean;
  status?: string;
  statusMotorista?: string;  // BD(56): AGUARDANDO/NO_LOCAL/EM_VIAGEM/FINALIZADO
  coordsOrigem?: string;   // "lat,lng" geocoded do pickup (DL/116)
  coordsDestino?: string;  // "lat,lng" geocoded do destino (DM/117)
}
```

URL central do GAS (linhas 100–101):
```typescript
export const HUB_CENTRAL_URL =
  'https://script.google.com/macros/s/AKfycbwwr4_wjibbZgVEDD7JC0VSYce7C8iIvSmJFSbDHO_IX1L5KHSagOxkJZOL0ya746Uicw/exec';
```

### 4.2 `src/hooks/useDriverStore.ts` — como recebe e guarda as viagens

Fetch principal (linhas 100–141) — `action=viagens`, aceita array direto ou `json.viagens`, filtra por nome do motorista (normalizado, match parcial bidirecional), e só faz `setViagens` se a chave de comparação mudou:

```typescript
const dateParam = selectedDateRef.current || '';
const url = `${gasUrl}?action=viagens&t=${Date.now()}${dateParam ? `&data=${encodeURIComponent(dateParam)}` : ''}`;
const res = await fetch(url, { redirect: 'follow' });
const json = await res.json();
const raw: HubViagem[] = Array.isArray(json) ? json : (json.viagens || []);

const me = normalize(name);
const filtered = raw.filter((v) => {
  const d = normalize(v.driver || '');
  return d === me || d.includes(me) || me.includes(d);
});

// Only update state if data actually changed
const key = JSON.stringify(
  filtered.map((v) => `${v.id}|${v.statusMotorista || ''}|${v.status || ''}|${v.statusVoo || ''}|${v.etaChegada || ''}`)
);
const changed = key !== prevViagensKeyRef.current;
if (changed) {
  prevViagensKeyRef.current = key;
  setViagens(filtered);
  setCachedTrips(filtered, dateKey + ':' + normalize(name));
  ...
}
```

> ⚠️ Nota relevante para a camada 2: a chave de mudança (`key`) **não inclui `coordsOrigem`/`coordsDestino`** — se só as coords mudarem no backend, o estado não re-renderiza. Os objetos `HubViagem` completos (incluindo coords) são, contudo, guardados intactos quando há mudança.

Polling por eventos (linhas 247–260) — ping `action=lastChange` a cada 60s, só faz fetch completo se o timestamp mudou:

```typescript
const interval = setInterval(async () => {
  if (!driverNameRef.current || document.visibilityState !== 'visible') return;
  try {
    const pingRes = await fetch(`${gasUrl}?action=lastChange&t=${Date.now()}`, { redirect: 'follow' });
    const pingJson = await pingRes.json();
    const lc = (pingJson?.lastChange || '').toString();
    if (lc && lc === lastChangeRef.current) return;
    lastChangeRef.current = lc;
  } catch { /* fallback: sync completo */ }
  syncViagensSilent();
}, 60_000);
```

Dar baixa (linhas 167–191) — `action=completar&id=...&row=...`, marca localmente `concluida: true, status: 'CONCLUIDA'` se `data.success`.

Cache local via `src/lib/trips-cache.ts` (`getCachedTrips`/`setCachedTrips`), keyed por `data:nomeMotorista`. Também usa `localStorage` (`hub_driver_name`, `hub_driver_last_sync`) e re-sync silencioso no `visibilitychange`.

### 4.3 `src/components/driver/DriverTripCard.tsx` — o que passa ao SwipeBar

Importa o SwipeBar **partilhado**: `import SwipeBar from "@/components/shared/SwipeBar";` (linha 21).

Invocação (linhas 623–636):
```tsx
{/* Swipe bar — both driver and admin modes */}
<SwipeBar
  tripId={cardId}
  rowIndex={viagem.rowIndex ?? ""}
  initialStatus={viagem.statusMotorista || viagem.status}
  origin={viagem.origin}
  destination={viagem.destination}
  coordsOrigem={viagem.coordsOrigem}
  coordsDestino={viagem.coordsDestino}
  onStatusChange={(newStatus) => {
    if (newStatus === "FINALIZADO") onDarBaixa(viagem.id, viagem.rowIndex ?? "", cardId);
    onRefresh?.();
  }}
/>
```

**✅ coordsOrigem/coordsDestino já são passados ao SwipeBar** (commit e9285ec).

Também renderiza `<DriverProgressBar statusMotorista={viagem.statusMotorista} />` em dois sítios: vista colapsada (linha 396) e expandida (linha 522).

Badge de status do motorista no header do card (linhas 315–322): mostra `📍 No local` / `🚗 Em viagem` / `✅ Concluído` quando `statusMotorista !== "AGUARDANDO"`.

Quem usa o DriverTripCard:
- `src/app/admin/trips/page.tsx:6` → `import TripCard from "@/components/driver/DriverTripCard"`
- `src/app/driver/trips/page.tsx:6` → `import DriverTripCard from "@/components/driver/DriverTripCard"`

### 4.4 `src/components/shared/SwipeBar.tsx` — props + máquina de estados

**⚠️ ATENÇÃO: existem DOIS ficheiros SwipeBar:**
- `src/components/shared/SwipeBar.tsx` — **o que está em uso** (único import no projeto é o do DriverTripCard)
- `src/components/driver/SwipeBar.tsx` — **órfão, não é importado por nenhum ficheiro** (versão antiga com emojis 📍🚗🏁; props sem coords; também chama `updateDriverStatus` mas sem `timestamp` no URL)

Interface completa do SwipeBar em uso (linhas 7–18):
```typescript
type TripStatus = "PENDENTE" | "NO_LOCAL" | "EM_VIAGEM" | "FINALIZADO";

interface SwipeBarProps {
  tripId: string;
  rowIndex: string;
  initialStatus?: string;
  origin?: string;
  destination?: string;
  coordsOrigem?: string;
  coordsDestino?: string;
  onStatusChange?: (newStatus: TripStatus) => void;
}
```

Máquina de estados (linhas 33–37) — 3 transições sequenciais; o estado interno arranca em `PENDENTE` (não "AGUARDANDO"):
```typescript
const STEPS: { from: TripStatus; to: TripStatus; label: string; color: string; textColor: string }[] = [
  { from: "PENDENTE",   to: "NO_LOCAL",   label: "Arraste para confirmar chegada",  color: "#D4A017", textColor: "text-gray-400" },
  { from: "NO_LOCAL",   to: "EM_VIAGEM",  label: "Arraste quando o cliente entrar", color: "#3B82F6", textColor: "text-blue-400" },
  { from: "EM_VIAGEM",  to: "FINALIZADO", label: "Arraste ao chegar no destino",    color: "#22C55E", textColor: "text-green-400" },
];
```
**Estados emitidos (via `sendStatus` + `onStatusChange`), por ordem:** `NO_LOCAL` → `EM_VIAGEM` → `FINALIZADO`. O componente nunca emite `AGUARDANDO` nem `A_CAMINHO`.

Normalização do status inicial (linhas 63–69):
```typescript
function mapInitialStatus(s: string): TripStatus {
  const u = (s || "").toUpperCase().replace(/[_\s]+/g, "_");
  if (u === "NO_LOCAL" || u.includes("NO LOCAL") || u.includes("CHEGOU")) return "NO_LOCAL";
  if (u === "EM_VIAGEM" || u.includes("EM VIAGEM") || u.includes("A CAMINHO")) return "EM_VIAGEM";
  if (u === "FINALIZADO" || u === "CONCLUIDA" || u.includes("FINALIZOU")) return "FINALIZADO";
  return "PENDENTE";
}
```
(Nota: por causa do `replace`, `"A CAMINHO"` nunca faz match em `u.includes("A CAMINHO")` — a string já foi convertida para `A_CAMINHO`. Status legado `A_CAMINHO` cai portanto em `PENDENTE`.)

Envio ao GAS (linhas 53–61):
```typescript
async function sendStatus(rowIndex: string, status: string, lat?: number, lng?: number) {
  const timestamp = new Date().toISOString();
  const url = `${HUB_CENTRAL_URL}?action=updateDriverStatus&rowIndex=${encodeURIComponent(rowIndex)}&status=${encodeURIComponent(status)}&lat=${lat ?? ""}&lng=${lng ?? ""}&timestamp=${encodeURIComponent(timestamp)}&t=${Date.now()}`;
  await fetch(url, { redirect: "follow" });
}
```

Fluxo de confirmação (linhas 123–148): vibração 200ms → flash → `getGPS()` (high accuracy, timeout 10s; resolve `null` se falhar — **não bloqueia o envio**) → `sendStatus` → `setStatus(step.to)` → `onStatusChange?.(step.to)`.

**⚠️ Coords recebidas mas NÃO usadas ainda:** o componente recebe `coordsOrigem`/`coordsDestino` e tem `haversine()` (linhas 21–27) e `isAirport()` (linhas 29–31) definidos, e estado `distanceConfirm` declarado (linha 85), mas a validação de distância está explicitamente adiada (linhas 141–145):
```typescript
if (pct >= THRESHOLD) {
  // Distance validation for NO_LOCAL and FINALIZADO
  // (We don't have reference coords from backend, so this is a soft check)
  // For now, proceed directly — distance check requires coords in origin/destination fields
  await doConfirm();
}
```
Ou seja: o pipe de coords (getViagens → HubViagem → DriverTripCard → SwipeBarProps) está completo, mas a **validação cliente-side de distância ainda não foi ligada**. A validação anti-fraude existente acontece só no backend GAS (handler `updateDriverStatus`).

Outros detalhes: `THRESHOLD = 0.85`, `DOT_COUNT = 12` (linha pontilhada), banner "📍 Localização necessária..." se a permissão GPS estiver bloqueada, estado FINALIZADO mostra CheckCircle + Target + "Parabéns pelo seu empenho!".

### 4.5 `src/components/shared/DriverProgressBar.tsx` — fases e fonte do estado

Lê o estado **exclusivamente da prop `statusMotorista`** (string vinda de BD/56 via getViagens). Fases (linhas 7–12):
```typescript
const STEPS = [
  { key: "A_CAMINHO", label: "A caminho" },
  { key: "NO_LOCAL", label: "No local" },
  { key: "EM_VIAGEM", label: "Com cliente" },
  { key: "FINALIZADO", label: "Chegou" },
];
```

Mapeamento status → ponto ativo (linhas 14–20):
```typescript
function statusToStep(s: string): number {
  const u = (s || "").toUpperCase().replace(/[_\s]+/g, "_");
  if (u === "FINALIZADO" || u === "CONCLUIDA" || u.includes("FINALIZOU")) return 4;
  if (u === "EM_VIAGEM" || u.includes("EM VIAGEM")) return 3;
  if (u === "NO_LOCAL" || u.includes("NO LOCAL") || u.includes("CHEGOU")) return 2;
  return 1; // AGUARDANDO or empty → car at first dot
}
```
- AGUARDANDO/vazio → carro no ponto 1 ("A caminho")
- Linha dourada preenche 0% / 33.33% / 66.66% / 100%; tudo verde + 🏁 quando FINALIZADO.
- O `key: "A_CAMINHO"` do ponto 1 é apenas o rótulo visual do estado inicial — **não corresponde a nenhum status real emitido**.

### 4.6 Todos os pontos de chamada ao GAS (URLs e actions)

URL base única em todo o frontend: `HUB_CENTRAL_URL` exportada de `src/lib/trips.ts:100` (formato `{URL}?action=...&t=Date.now()`, sempre `fetch(..., { redirect: 'follow' })`).

| Ficheiro:linha | Action | Uso |
|---|---|---|
| `src/hooks/useDriverStore.ts:102` | `viagens` (+`&data=DD/MM/YYYY` opcional) | Lista viagens do motorista |
| `src/hooks/useDriverStore.ts:170` | `completar&id=&row=` | Dar baixa |
| `src/hooks/useDriverStore.ts:251` | `lastChange` | Ping leve 60s (polling por eventos) |
| `src/hooks/useTripsStore.ts:660,771` | `viagens` | Admin trips |
| `src/hooks/useTripsStore.ts:606` | `completar` | Admin dar baixa |
| `src/hooks/useTripsStore.ts:699` | `motoristas` | Lista de motoristas |
| `src/hooks/useTripsStore.ts:254` | `lastChange` | Ping admin |
| `src/components/shared/SwipeBar.tsx:56` | `updateDriverStatus&rowIndex=&status=&lat=&lng=&timestamp=` | Swipe (EM USO) |
| `src/components/driver/SwipeBar.tsx:38` | `updateDriverStatus` (sem timestamp) | **Órfão — não importado** |
| `src/app/admin/trips/page.tsx:107` | `resetTrip&rowIndex=` | Botão Reactivar |
| `src/components/portal/LiveTab.tsx:71` | `viagens` | Hotel LIVE |
| `src/components/portal/LiveTab.tsx:105` | `lastChange` | Ping LIVE 15s |
| `src/lib/auth.ts:114` | `validateLogin` | Login |
| `src/lib/auth.ts:144,164` | `getHotelUrl` / `updateHotelUrl` | Config GAS URL hotel |
| `src/lib/auth.ts:194` | `getPartners` | Parceiros |
| `src/lib/auth.ts:213` | `updatePassword` | Mudar senha |
| `src/lib/google-sheets.ts:29,93` | `test` / `getAllData` | Conector sheets |
| `src/app/restaurante/page.tsx:441` | `getRestaurantes` | Portal restaurante |
| `src/components/admin/RestaurantsTab.tsx:82,95` | `getRestaurantes` / `getReservasRestaurantes` | Admin restaurantes |

---

## 5. ESTADO "A CAMINHO" — onde aparece

Resultado da busca por `A_CAMINHO` / `ACAMINHO` / `a caminho` em `src/`:

| Ficheiro:linha | Contexto | Emite o estado? |
|---|---|---|
| `src/components/shared/DriverProgressBar.tsx:8` | `{ key: "A_CAMINHO", label: "A caminho" }` — rótulo visual do ponto 1 da barra de progresso | **Não** — puramente visual; o ponto 1 corresponde a AGUARDANDO/vazio |
| `src/components/shared/SwipeBar.tsx:66` | `mapInitialStatus`: `u.includes("A CAMINHO") → EM_VIAGEM` | **Não emite** — só tenta mapear status legado vindo do backend (e o match é inalcançável, ver §4.4) |
| `src/components/driver/SwipeBar.tsx:48` | Idem, no SwipeBar órfão | Não (ficheiro não usado) |
| `src/lib/flightUtils.ts:109,159` | `statusText: "A caminho · Chega em Xmin"` — texto do estado do **voo**, não do motorista | Não |

**Conclusão: nenhum componente emite `A_CAMINHO` hoje.** Os estados emitidos pelo frontend são exclusivamente `NO_LOCAL`, `EM_VIAGEM` e `FINALIZADO` (SwipeBar), consistente com a remoção de A_CAMINHO documentada no CLAUDE.md. "A caminho" sobrevive apenas como rótulo da primeira fase da DriverProgressBar (mapeada a AGUARDANDO) e como texto de progresso de voo.

---

## 6. BUILD (`npm run build`)

**✅ Passa limpo — exit code 0, zero erros TypeScript, zero warnings.**

```
▲ Next.js 16.2.1 (Turbopack)
✓ Compiled successfully in 3.7s
  Finished TypeScript in 5.2s
✓ Generating static pages using 11 workers (13/13) in 425ms

Route (app)
┌ ○ /
├ ○ /_not-found
├ ○ /admin/partners
├ ○ /admin/trips
├ ○ /driver/trips
├ ○ /login
├ ○ /portal
├ ○ /privacidade
├ ○ /reset-password
├ ○ /restaurante
├ ○ /sitemap.xml
└ ○ /termos

○  (Static)  prerendered as static content
```
12 rotas + `_not-found` = 13 páginas estáticas geradas.

---

## RESUMO EXECUTIVO (para a próxima conversa)

1. **Branch ativo:** `camada2-coords-motorista`, local-only, 1 commit (`e9285ec`) à frente de `master`. **Não mergeado, não pushado.**
2. **O pipe de coords está completo no frontend:** `HubViagem.coordsOrigem/coordsDestino` (trips.ts:80-81) → preservados pelo useDriverStore → passados pelo DriverTripCard (linhas 630-631) → recebidos pelo SwipeBar (props linhas 15-16).
3. **MAS o SwipeBar ainda não usa as coords:** `haversine()`, `isAirport()` e `distanceConfirm` estão declarados mas a validação de distância está comentada/adiada em `onEnd` (shared/SwipeBar.tsx:141-145). É o próximo passo natural da camada 2.
4. **Risco de refresh:** a comparação de mudança do useDriverStore (linha 116) não inclui as coords na chave — coords novas sem mudança de status não disparam re-render.
5. **Lixo a limpar:** `src/components/driver/SwipeBar.tsx` é órfão (versão antiga, ninguém importa).
6. **Nenhum componente emite A_CAMINHO**; estados reais: AGUARDANDO (backend) → NO_LOCAL → EM_VIAGEM → FINALIZADO.
7. **Build limpo** em Next.js 16.2.1 / React 19.2 / TS 5.9 / Tailwind 4.2 — 13 páginas estáticas, 0 erros.
