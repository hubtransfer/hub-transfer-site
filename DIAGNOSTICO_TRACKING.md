# DIAGNÓSTICO — Sistema de Rastreamento/Tracking do Motorista

> Levantamento read-only gerado em 2026-06-09. Nenhuma alteração de código, commit ou correção foi feita.
> Foco: funcionalidade de "iniciar viagem" + rastreamento GPS em tempo real no painel `/driver/trips`.

---

## TL;DR

Não existe rastreamento GPS em tempo real. O que existe é **captura pontual de coordenadas no momento exato de cada swipe** (3 swipes manuais por viagem). Não há `watchPosition`, não há envio contínuo de localização, não há geofence funcional, e o frontend **nunca recebe as coordenadas de referência** (pickup/destino) do backend — portanto qualquer cálculo de distância no cliente é impossível com os dados atuais. O código de geofence que existe está **comentado e morto**.

---

## 1. RASTREAMENTO GPS — todo o código de geolocalização

| Ficheiro | Linha | Função | O que faz |
|---|---|---|---|
| `components/shared/SwipeBar.tsx` | 40-49 | `getGPS()` | `getCurrentPosition` único, `enableHighAccuracy:true`, timeout 10s, `maximumAge:0`. Resolve `{lat,lng}` ou `null` em erro. |
| `components/shared/SwipeBar.tsx` | 97-105 | `useEffect` on mount | `getCurrentPosition` único só para detetar se o GPS está bloqueado → ativa o banner `gpsBlocked`. |
| `components/shared/SwipeBar.tsx` | 127 | `doConfirm()` | Chama `getGPS()` no instante do swipe, antes de `sendStatus`. |
| `components/driver/SwipeBar.tsx` | 27-34 / 95 | `getGPS()` / `onEnd` | Igual ao acima, mas **este ficheiro está órfão** (ver secção 7). |
| `app/layout.tsx` | 104-105 | metadata JSON-LD | `latitude:38.7223, longitude:-9.1393` — é a geo-localização **da empresa** (Lisboa) para SEO/structured-data. **Não é tracking.** |

**`watchPosition` (rastreio contínuo)?** → **NÃO EXISTE em todo o projeto.** Zero ocorrências de `watchPosition`, `clearWatch`, ou `setInterval` a enviar localização.

**Conclusão**: só há `getCurrentPosition` (posição única), disparado **3 vezes por viagem** — uma por cada confirmação de swipe. Entre swipes, a posição do motorista não é conhecida nem atualizada. Não há "carro a mover-se no mapa em tempo real".

---

## 2. INICIAR VIAGEM — função/botão

**Não existe um botão dedicado de "iniciar viagem" nem de "a caminho".** Todo o fluxo do motorista é o **SwipeBar** (arrastar), com 3 estados sequenciais (`shared/SwipeBar.tsx:31-35`):

| Passo | De → Para | Label | Action enviada |
|---|---|---|---|
| 1 | `PENDENTE` → `NO_LOCAL` | "Arraste para confirmar chegada" | `updateDriverStatus` status=`NO_LOCAL` |
| 2 | `NO_LOCAL` → `EM_VIAGEM` | "Arraste quando o cliente entrar" | `updateDriverStatus` status=`EM_VIAGEM` |
| 3 | `EM_VIAGEM` → `FINALIZADO` | "Arraste ao chegar no destino" | `updateDriverStatus` status=`FINALIZADO` |

O que dispara ao confirmar (`doConfirm`, linhas 121-132):
1. `navigator.vibrate(200)` + flash visual.
2. `getGPS()` — captura coords pontuais.
3. `sendStatus(rowIndex, step.to, lat, lng)` →
   `GET {HUB_CENTRAL_URL}?action=updateDriverStatus&rowIndex=…&status=…&lat=…&lng=…&timestamp=ISO&t=…`
4. Atualiza estado local + callback `onStatusChange`.

⚠️ **Observação importante**: o primeiro estado já é `NO_LOCAL` ("cheguei ao local de pickup"). **Não existe estado "a caminho/em deslocação"** no SwipeBar. A `DriverProgressBar` mostra um ponto rotulado "A caminho" (`DriverProgressBar.tsx:8`, key `A_CAMINHO`), mas **o SwipeBar nunca envia esse estado** — há um descasamento entre o que a barra de progresso desenha e os estados que o sistema realmente regista.

---

## 3. GEOFENCE / DETEÇÃO DE CHEGADA

| Elemento | Onde | Estado |
|---|---|---|
| `haversine(lat1,lon1,lat2,lon2)` | `shared/SwipeBar.tsx:19-25` | **Definida mas NUNCA chamada — código morto.** |
| `isAirport(text)` | `shared/SwipeBar.tsx:27-29` | Regex `aeroporto\|airport\|aeropuerto\|aéroport\|flughafen`. **Definida mas NUNCA chamada — código morto.** |
| `distanceConfirm` state | `shared/SwipeBar.tsx:83` | `useState` declarado, **`setDistanceConfirm` nunca é chamado, valor nunca é lido — morto.** |
| Verificação de distância no swipe | `shared/SwipeBar.tsx:140-143` | **COMENTADA.** Comentário literal: *"We don't have reference coords from backend, so this is a soft check… For now, proceed directly — distance check requires coords in origin/destination fields"*. |

**Margens de raio (2000m aeroporto / 200m outros)**: **NÃO existem no frontend.** Não há constantes de raio em lado nenhum do cliente. Segundo o `CLAUDE.md`, essa validação vive no **backend** (handler `updateDriverStatus`, que compara contra DL(116)/DM(117) e grava DN(118)/DO(119)). O frontend tem o `isAirport()` mas nem isso usa.

**Deteção automática de transições?** → **NÃO.** Não há qualquer lógica de proximidade que mude o estado sozinha. **Tudo depende do SwipeBar manual.** O motorista tem de arrastar 3 vezes; o sistema nunca deteta sozinho "o motorista chegou ao pickup" ou "chegou ao destino".

---

## 4. SWIPEBAR — os dois componentes

### `components/shared/SwipeBar.tsx` (O QUE É REALMENTE USADO)
- Importado por `DriverTripCard.tsx:21` (painel motorista). É o único SwipeBar em uso.
- `onEnd` (134-146): se arraste ≥ 85% → `doConfirm()`.
- `doConfirm` (121-132): vibra, `getGPS()`, `sendStatus()` **com `timestamp`** (`new Date().toISOString()`, linha 53).
- Aceita props `origin` e `destination` (strings) — **mas não as usa para nada** (o geofence está comentado).
- Tem banner de GPS bloqueado e estado "Viagem concluída".

### `components/driver/SwipeBar.tsx` (ÓRFÃO)
- `onEnd` (86-102): se ≥ 85% → captura GPS, `sendStatus()` **SEM `timestamp`** (linha 38: o URL não inclui `&timestamp=`).
- **Não é importado em lado nenhum** (grep confirmou: zero imports). É código morto/legado.

### Divergência do timestamp — CONFIRMADA mas inócua na prática
A divergência é real: `driver/SwipeBar` não envia `timestamp`, `shared/SwipeBar` envia. **Porém**, como o `driver/SwipeBar` está órfão e só o `shared` corre, na prática **o timestamp é sempre enviado**. O risco real não é o timestamp — é existirem **dois componentes quase idênticos** a confundir manutenção. (Se algum dia alguém trocar o import para o driver/SwipeBar, perde-se o timestamp silenciosamente.)

---

## 5. COORDENADAS DO PICKUP/DESTINO — o frontend tem acesso?

**NÃO.** Esta é a lacuna central que impede o geofence.

- A interface `HubViagem` (`lib/trips.ts:38-80`) **não tem nenhum campo de coordenadas**. Tem apenas `origin: string` e `destination: string` (moradas em texto). Não há `coordsOrigem`, `coordsDestino`, `latOrigem`, etc.
- O `useDriverStore` (`useDriverStore.ts:100-106`) faz `fetch(...action=viagens...)` e usa o JSON tal-qual; **não há mapeamento de quaisquer campos de coordenadas** porque o backend não os envia neste payload.
- O `CLAUDE.md` afirma que o backend tem geocoding em **DL(116)=Coords Origem** e **DM(117)=Coords Destino**, mas **o `getViagens` não os inclui na resposta** ao frontend.
- `DriverTripCard.tsx:628-629` passa `origin={viagem.origin}` e `destination={viagem.destination}` ao SwipeBar — mas são **strings de morada**, inúteis para `haversine()`.

**De onde viriam as coords?** Existe `AddressAutocomplete` (Google Places) e `useGoogleMaps`, mas são usados nos formulários de **criação** (landing/portal/restaurante), não no painel do motorista. As coords geocodificadas ficam (segundo o doc) na spreadsheet, mas **nunca chegam ao cliente do motorista**.

➡️ **Sem coords de referência no payload `viagens`, o geofence no frontend é impossível como está.**

---

## 6. PERMISSÕES E PWA

| Item | Estado |
|---|---|
| `manifest.json` | **NÃO EXISTE** (não há ficheiros `.json`/`.js` em `public/`; sem `manifest:` no metadata de `layout.tsx`). |
| Service Worker | **NÃO EXISTE** (zero ocorrências de `serviceWorker`/`service-worker`). |
| Wake Lock API (ecrã desperto) | **NÃO EXISTE** (zero ocorrências de `wakeLock`). Crítico: se o ecrã adormecer, o GPS/JS pausa. |
| `navigator.permissions` (query persistente) | **NÃO EXISTE.** |
| Pedido de permissão de localização | Apenas **implícito**: cada `getCurrentPosition` com `maximumAge:0` força nova leitura; o `shared/SwipeBar` testa no mount e mostra banner se bloqueado. **Não é persistente nem em background.** |
| Config PWA / instalável | **Nenhuma.** A app não é instalável nem corre como standalone. |

➡️ Sem PWA + sem Wake Lock, mesmo que se construísse `watchPosition`, **o tracking morreria assim que o ecrã do telemóvel adormecesse** ou o browser fosse para segundo plano.

---

## 7. O QUE ESTÁ PARTIDO (e porquê)

1. **Geofence morto** — `haversine()`, `isAirport()` e `distanceConfirm` em `shared/SwipeBar.tsx` estão definidos mas nunca executados; a verificação está comentada (linhas 140-143). **Porquê não funciona**: faltam as coords de referência no payload (secção 5), então o autor desativou e deixou um comentário a admiti-lo.

2. **Coords de referência ausentes no payload** — `HubViagem` não tem campos de coordenadas e `action=viagens` não os devolve. **Porquê não funciona**: o frontend literalmente não tem com o quê comparar a posição GPS do motorista.

3. **Componente SwipeBar duplicado e órfão** — `components/driver/SwipeBar.tsx` não é importado por ninguém. **Porquê é problema**: código morto que diverge do real (sem timestamp), risco de manutenção e confusão.

4. **Sem rastreamento contínuo** — só `getCurrentPosition` em 3 momentos. **Porquê não funciona como "tempo real"**: entre swipes a localização é desconhecida; não há `watchPosition` nem envio periódico. O "rastreamento em tempo real" prometido não existe no cliente.

5. **Sem Wake Lock / PWA / background** — **Porquê é fatal para tracking**: em uso real (motorista a conduzir com o ecrã apagado), qualquer tentativa de tracking contínuo seria suspensa pelo browser/OS.

6. **Descasamento de estados** — `DriverProgressBar` desenha um ponto "A caminho" (`A_CAMINHO`) que o SwipeBar nunca emite (o 1º estado já é `NO_LOCAL`). **Porquê confunde**: a barra de progresso sugere uma fase de deslocação que o sistema não regista.

7. **`mapInitialStatus` mapeia "A CAMINHO" → `EM_VIAGEM`** (`shared/SwipeBar.tsx:64`) — se o backend alguma vez devolver "A_CAMINHO", o swipe interpreta-o como "cliente já a bordo", saltando o estado de chegada. Inconsistência latente com a `DriverProgressBar`.

---

## RESUMO ESTRUTURADO

### ✅ O QUE EXISTE
- Captura de GPS pontual (`getCurrentPosition`) no momento de cada um dos 3 swipes.
- SwipeBar funcional (`shared/SwipeBar.tsx`) com 3 estados manuais → `action=updateDriverStatus` (com lat/lng/timestamp).
- Banner de "GPS bloqueado" e vibração ao confirmar.
- Funções `haversine()` e `isAirport()` escritas (prontas a usar, mas inativas).
- Validação de raio/anti-fraude — **só no backend** (segundo CLAUDE.md), não no cliente.

### ❌ O QUE FALTA
- `watchPosition` / rastreamento GPS contínuo (não existe).
- Envio periódico de localização ao backend entre swipes.
- Coordenadas de pickup/destino no payload `viagens` (campos não existem em `HubViagem`).
- Geofence / deteção automática de chegada no frontend (impossível sem coords).
- Botão/estado explícito de "a caminho" (só há os 3 swipes, começando já em "no local").
- PWA: `manifest.json`, service worker.
- Wake Lock API (manter ecrã desperto durante a viagem).
- Pedido de permissão de localização persistente / em background.

### 🔧 O QUE ESTÁ PARTIDO
- Geofence comentado e morto em `shared/SwipeBar.tsx:140-143` (+ `haversine`/`isAirport`/`distanceConfirm` mortos) — porque faltam coords de referência.
- `components/driver/SwipeBar.tsx` órfão e divergente (não envia timestamp; não é usado).
- `DriverProgressBar` mostra fase "A caminho" que o SwipeBar nunca regista (descasamento de estados).
- `mapInitialStatus` traduz "A CAMINHO"→`EM_VIAGEM`, inconsistente com a barra de progresso.

### ➡️ CAMINHO MÍNIMO PARA O TRACKING FUNCIONAR (não implementado — apenas diagnóstico)
1. Backend devolver `coordsOrigem`/`coordsDestino` (DL/DM) no `action=viagens`.
2. Adicionar esses campos a `HubViagem` e passá-los ao SwipeBar.
3. Reativar o geofence (descomentar + usar `haversine`/`isAirport` com raios 2000m/200m).
4. Para "tempo real": `watchPosition` + envio periódico + Wake Lock + PWA/manifest.
5. Eliminar `driver/SwipeBar.tsx` órfão e alinhar estados com a `DriverProgressBar`.

---

*Fim do diagnóstico. Read-only.*
