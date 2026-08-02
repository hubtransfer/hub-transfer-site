# ESTADO ATUAL — HUB Transfer Site

> Levantamento read-only gerado em 2026-06-09. Nenhuma alteração ao código foi feita.

---

## 1. O que o CLAUDE.md diz ser o estado do projeto

O `CLAUDE.md` é um dossier completo do ecossistema HUB Transfer (concierge digital de Lisboa). Resumo do que declara:

- **Arquitetura**: Backend em Google Apps Script (~89k linhas, 13 ficheiros `.gs`) hospedado no `script.google.com`; frontend Next.js 15 + TS + Tailwind v4 na Vercel; spreadsheet HUB-Central; WhatsApp via Z-API; VPS Hetzner com extensão "HUB Sync v2"; API de voos GoFlightLabs.
- **Design system**: fundo escuro, dourado `#D4A017`, fontes Bodoni Moda + Plus Jakarta Sans. Badges CHEGADA=verde, RECOLHA=azul, TOUR=roxo.
- **Funcionalidades-chave declaradas como implementadas**:
  - **SwipeBar v2.0** — confirmação do motorista em 3 estados (NO_LOCAL → EM_VIAGEM → FINALIZADO) com GPS + vibração.
  - **DriverProgressBar** — barra do carro com 4 pontos.
  - **Sistema LIVE** no portal do hotel (auto-refresh 15s, refresh silencioso).
  - **Flight Tracking v4.1** com proteção de créditos da API.
  - **Anti-fraude GPS** (margens aeroporto 2000m / outros 200m) — declarado IMPLEMENTADO 04/04/2026.
  - **Polling por eventos** via célula CZ1 + handler `lastChange` — declarado IMPLEMENTADO 04/04/2026.
- **Mapeamento de colunas** BD-BJ (status motorista, timestamps, coords) e DL/DM (geocoding) bem documentado.
- **Handlers GAS** documentados: `updateDriverStatus`, `resetTrip`, `getViagens` (action `viagens`), `lastChange`.
- **Regras de negócio**: password motorista `hub2026`; hotel nunca vê localização/nome do motorista nem preços; feedback 30min após FINALIZADO.

> ⚠️ Nota: o CLAUDE.md descreve um backend muito mais amplo do que os 4 handlers que documenta explicitamente. O frontend chama ~25 actions distintas (ver secção 5) — a maioria **não está listada** na secção de handlers do CLAUDE.md.

---

## 2. Estrutura do repositório (relevante)

```
hub-transfer-site/
├─ CLAUDE.md, ESTADO_ATUAL.md
├─ components.json, next.config.ts, postcss.config.mjs, tsconfig.json
├─ package.json / package-lock.json
├─ public/
│  ├─ flags/ (pt,en,es,fr,it .jpg)
│  ├─ images/ (hero, dobras, selos, mercedes, logo…)
│  └─ logos/ (companhias aéreas: tap, iberia, emirates, klm…)
└─ src/
   ├─ app/
   │  ├─ layout.tsx, page.tsx (landing), sitemap.ts
   │  ├─ login/page.tsx
   │  ├─ portal/ (layout.tsx, page.tsx)         ← portal hotel
   │  ├─ admin/
   │  │  ├─ trips/ (layout.tsx, page.tsx)        ← painel admin
   │  │  └─ partners/page.tsx
   │  ├─ driver/trips/ (layout.tsx, page.tsx)    ← painel motorista
   │  ├─ restaurante/page.tsx                    ← portal restaurante
   │  ├─ reset-password/page.tsx
   │  ├─ privacidade/page.tsx
   │  └─ termos/page.tsx
   ├─ components/
   │  ├─ ui/ (button, input, badge, card, dialog, dropdown-menu, separator) — shadcn
   │  ├─ shared/ (SwipeBar, DriverProgressBar, AddressAutocomplete, ForgotPasswordModal, ChangePasswordModal)
   │  ├─ portal/ (TransferForm, TransferTable, KPICards, LiveTab, ConfigPanel, ClearDataPanel, ActionBar, FinancialSummary, StatusToast)
   │  ├─ admin/ (RestaurantsTab)
   │  ├─ driver/ (DriverTripCard, DriverNameplate, SwipeBar, NoShowModal)
   │  ├─ trips/ (TripCard, Nameplate, SkeletonCard)
   │  ├─ PhoneInput.tsx, ThemeToggle.tsx
   ├─ hooks/ (useTripsStore, useDriverStore, useTransferStore, useGoogleMaps)
   └─ lib/ (auth, trips, transfers, google-sheets, constants, flightUtils,
            countryFlags, flight-origins, driver-templates, landing-translations, trips-cache, utils)
```

---

## 3. Stack confirmada (versões reais do package.json)

| Tecnologia | Versão declarada |
|---|---|
| **Next.js** | `^16.2.1` |
| **React / React-DOM** | `^19.2.4` |
| **Tailwind CSS** | `^4.2.2` (via `@tailwindcss/postcss`) |
| **TypeScript** | `^5.9.3` |
| framer-motion | ^12.38.0 |
| lucide-react | ^0.577.0 |
| @base-ui/react | ^1.3.0 |
| shadcn / cva / clsx / tailwind-merge | ^4.1.0 / ^0.7.1 / ^2.1.1 / ^3.5.0 |

> ⚠️ Divergência com o CLAUDE.md: o doc diz **Next.js 15**, mas o package.json declara **Next 16.2.1** e **React 19**. O projeto foi atualizado para além do que o CLAUDE.md regista.

Scripts: `dev` / `build` / `start` / `lint` (next padrão).

---

## 4. Páginas/rotas (App Router) e componentes principais

| Rota | Ficheiro | Componentes / libs principais |
|---|---|---|
| `/` | `app/page.tsx` | Landing multilingue (PT/EN/ES/FR/IT) — `landing-translations`, `AddressAutocomplete`, `PhoneInput`, logos companhias |
| `/login` | `app/login/page.tsx` | Login unificado (hotel + restaurante) — action `validateLoginRestaurante`, `ForgotPasswordModal` |
| `/portal` | `app/portal/page.tsx` (+layout) | Portal hotel: `TransferForm`, `TransferTable`, `KPICards`, `LiveTab`, `ConfigPanel`, `ClearDataPanel`, `ActionBar`, `FinancialSummary`, `StatusToast`, `useTransferStore` |
| `/admin/trips` | `app/admin/trips/page.tsx` (+layout) | `TripCard`, `Nameplate`, `SwipeBar` (shared), `DriverProgressBar`, `RestaurantsTab`, `useTripsStore` |
| `/admin/partners` | `app/admin/partners/page.tsx` | Gestão de parceiros + reset/alterar senha — `getPartners`, `updatePassword` |
| `/driver/trips` | `app/driver/trips/page.tsx` (+layout) | `DriverTripCard`, `DriverNameplate`, `SwipeBar` (driver), `NoShowModal`, `DriverProgressBar`, `useDriverStore` |
| `/restaurante` | `app/restaurante/page.tsx` | Portal restaurante: criar reserva, ver viagens, registar valor de conta, relatório de comissões |
| `/reset-password` | `app/reset-password/page.tsx` | Redefinir senha com token — action `redefinirSenha` |
| `/privacidade` | `app/privacidade/page.tsx` | Página legal estática |
| `/termos` | `app/termos/page.tsx` | Página legal estática |
| `sitemap.ts` | `app/sitemap.ts` | Geração de sitemap |

---

## 5. Integração backend (GAS) — tabela de actions

### Endpoints base (3 URLs distintas)

| Constante | Ficheiro | URL (deploy) | Uso |
|---|---|---|---|
| `HUB_CENTRAL_URL` | `lib/trips.ts:99` | `AKfycbwwr4…` | Central — viagens, motoristas, restaurantes, auth, senhas |
| `WEBAPP_URL` | `lib/transfers.ts:52` | `AKfycbwpiW…` | Transfers do portal (via `google-sheets.ts`, POST no-cors) |
| Hotel-específico | `lib/auth.ts:137-138` | ELH `AKfycbzt67…` / EMH `AKfycbxiEN9…` | URLs por hotel |

### Tabela action → onde é chamada → o que espera

| action | Ficheiro:função | Params enviados | Retorno esperado |
|---|---|---|---|
| `viagens` | `useTripsStore` (660,771), `useDriverStore:102`, `LiveTab:71` | `data` (dd/mm/aaaa), `t` | Array de viagens (campos incl. `statusMotorista`, dados de voo) |
| `lastChange` | `useTripsStore:254`, `useDriverStore:251`, `LiveTab:105` | `t` | Timestamp da última alteração (CZ1) — ping de polling |
| `motoristas` | `useTripsStore:699` | `t` | Lista de motoristas |
| `completar` | `useTripsStore:606`, `useDriverStore:170` | `id`, `row`, `t` | Confirmação de conclusão |
| `updateDriverStatus` | `shared/SwipeBar:54`, `driver/SwipeBar:38` | `rowIndex`, `status`, `lat`, `lng`, `timestamp`*, `t` | Grava BD-BJ + R=CONCLUIDA |
| `resetTrip` | `admin/trips/page.tsx:107` | `rowIndex`, `t` | Limpa R + BD-BJ |
| `apagarViagem` | `admin/trips/page.tsx:138` | `ref`, `senha`, `t` | Apaga linha (autenticada) |
| `registerNoShow` | `driver/NoShowModal:132` (POST) | `tripId`, `clientName`, `driverName`, `date`, slots, notes | Registo de no-show |
| `validateLogin` | `lib/auth.ts:114` | `name`, `password` | Login admin/hotel/motorista |
| `validateLoginRestaurante` | `login/page.tsx:42` | (action) + credenciais | Sessão restaurante |
| `getHotelUrl` | `lib/auth.ts:144` | `code`, `t` | URL GAS do hotel |
| `updateHotelUrl` | `lib/auth.ts:164` | `code`, `url`, `t` | Atualiza URL hotel |
| `getPartners` | `lib/auth.ts:194` | `t` | Lista de parceiros |
| `updatePassword` | `lib/auth.ts:213` | `type`, `rowIndex`, `newPassword` | Atualiza senha |
| `alterarSenha` | `shared/ChangePasswordModal:32` | senha atual + nova | Confirmação |
| `recuperarSenha` | `shared/ForgotPasswordModal:25` | email | Envia link/token |
| `redefinirSenha` | `reset-password/page.tsx:31` | token + nova senha | Confirmação |
| `getRestaurantes` | `admin/RestaurantsTab:82`, `restaurante/page.tsx:441` | `t` | Lista restaurantes |
| `getReservasRestaurantes` | `admin/RestaurantsTab:95` | `t` | Lista reservas |
| `criarReservaRestaurante` | `restaurante/page.tsx:466`, `RestaurantsTab:289` | `cliente, telefone, idioma, restauranteId, data, hora, pessoas, origem, destino, hotel, fonte, observacoes, t` | `{success, horaPickup}` |
| `getViagensRestaurante` | `restaurante/page.tsx:235` | (action) + filtros | Viagens do restaurante |
| `registarValorConta` | `restaurante/page.tsx:269` | valor da conta | Confirmação |
| `getRelatorioComissoes` | `restaurante/page.tsx:623` | (action) | Relatório de comissões |
| `addTransfer` | `google-sheets.ts:sendToSheets` (POST no-cors) | objeto Transfer + `emailDestino` | — (fire-and-forget) |
| `getAllData` | `google-sheets.ts:loadTransfersFromSheets` | `_t` | `{success/sucesso, data/dados[]}` |
| `clearAllData` / `clearTestData` | `google-sheets.ts` | `timestamp` | `{status:"success"}` |
| `test` / `ping` | `google-sheets.ts` | — | Teste de conectividade |

\* O `driver/SwipeBar.tsx` **não** envia `timestamp`; o `shared/SwipeBar.tsx` envia (ver dívida técnica).

---

## 6. Estado de implementação (LIVE vs incompleto)

**LIVE e funcional** (com integração GAS real):
- Portal hotel (`/portal`): criar transfer, tabela, KPIs, aba LIVE com polling.
- Admin (`/admin/trips`): viagens, SwipeBar, progress bar, reset/apagar viagem, aba restaurantes.
- Motorista (`/driver/trips`): cards, SwipeBar, no-show.
- Restaurante (`/restaurante`): reservas, comissões, valor de conta.
- Auth completo: login, recuperar/redefinir/alterar senha, parceiros.
- Landing multilingue, páginas legais (privacidade/termos), sitemap.

**Placeholders / fallbacks graciosos (não são features incompletas)**:
- `flightUtils.ts:97,102` → `"Monitoramento em breve"` quando não há dados de voo.
- `DriverTripCard.tsx:349,441` → `"Dados em breve"` / `"Acompanhamento do voo activa em breve"` quando sem dados.

**Sinais de "esboço"**: não foram encontrados `TODO`/`FIXME`/`mock`/`not implemented` reais no código — as ocorrências de "placeholder" são todas atributos `placeholder=` de inputs HTML (legítimos). Não há páginas vazias.

---

## 7. Dívida técnica e riscos visíveis

1. **Dois `SwipeBar` divergentes** — `components/driver/SwipeBar.tsx` e `components/shared/SwipeBar.tsx` são duplicados; o do driver **não envia `timestamp`** na action `updateDriverStatus`, o shared envia. Risco de inconsistência nos timestamps gravados (BE/BG/BI) consoante a origem do swipe.
2. **`mode: "no-cors"` em `google-sheets.ts`** (`addTransfer`, `test`, `ping`) — a resposta **não pode ser lida**; escritas são fire-and-forget sem confirmação real de sucesso. `submitTransfer` faz `.catch(()=>{})` silencioso.
3. **Handlers chamados mas NÃO documentados no CLAUDE.md** — o CLAUDE.md só documenta 4 handlers (`updateDriverStatus`, `resetTrip`, `viagens`/`getViagens`, `lastChange`). O frontend depende de ~20 outros (`validateLoginRestaurante`, `getViagensRestaurante`, `registarValorConta`, `getRelatorioComissoes`, `criarReservaRestaurante`, `getRestaurantes`, `getReservasRestaurantes`, `registerNoShow`, `alterarSenha`, `recuperarSenha`, `redefinirSenha`, `apagarViagem`, `getPartners`, `updatePassword`, `getHotelUrl`, `updateHotelUrl`, `motoristas`, `completar`, `getAllData`, `clearAllData`, `clearTestData`). **Verificar no GAS que todos existem** — qualquer um em falta falha silenciosamente.
4. **Formatação de datas/horas manual e frágil**:
   - `restaurante/page.tsx:463` → `data.split("-").reverse().join("/")` (converte ISO→dd/mm/aaaa por string, sem validação).
   - `flightUtils.ts` → parsing manual de horas com `split(':')` e conversão de timezone via `toLocaleString('en-US',{timeZone:'Europe/Lisbon'})` — sensível a formatos inesperados do GAS.
5. **Tratamento de erros de fetch inconsistente** — muitas chamadas fazem `try/catch` com mensagem genérica ou silêncio; `redirect: "follow"` em todas (necessário para GAS), mas sem timeout nem retry.
6. **3 endpoints GAS hard-coded** em ficheiros diferentes (`trips.ts`, `transfers.ts`, `auth.ts`) — risco de drift quando um deploy muda de URL. Há override por `localStorage` (`webappUrl`) e `ConfigPanel`, mas o default fica espalhado.
7. **`updatePassword` envia `newPassword` em query string (GET)** — senha em texto claro no URL/logs do GAS. Mesmo padrão em vários fluxos de auth.

---

## 8. Estado do Git

- **Branch atual**: `master`
- **Working tree**: NÃO limpa — 1 ficheiro modificado: `M .claude/settings.local.json` (config local, não código de app).
- **Últimos 10 commits**:
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
- Tema dos commits recentes: footer/legal, melhorias no restaurante, fluxo completo de senhas, autocomplete de moradas.

---

*Fim do levantamento. Read-only — nenhuma alteração de código, commit ou correção foi feita.*
