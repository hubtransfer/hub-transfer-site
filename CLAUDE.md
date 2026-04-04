# HUB Transfer — Projecto Completo
## Este ficheiro é lido automaticamente pelo Claude Code em cada sessão nova.

---

## QUEM
Junior Gutierez, CEO da HUB Transfer (Jornadas e Possibilidades, Unipessoal Lda). Amadora, Lisboa. Constrói o ecossistema tech inteiro com IA. Workflow: Claude.ai prepara prompts → Junior cola no Claude Code → PowerShell push → Vercel auto-deploy.

---

## STACK TÉCNICO

| Componente | Tecnologia | Localização |
|---|---|---|
| Backend | Google Apps Script (~89k linhas, 13 ficheiros .gs) | script.google.com (projecto 85) |
| Frontend | Next.js 15 + TypeScript + Tailwind CSS v4 | Vercel: hub-transfer-site.vercel.app |
| Repo | GitHub: hubtransfer/hub-transfer-site | Branch: master |
| Spreadsheet | HUB-Central | ID: 1SDQKKo1DerpO9IHnbbOtYLjkfn9s4bK0VTUt7a-dBQQ |
| WhatsApp | Z-API | Instância: 3DC8E250141ED020B95796155CBF9532 |
| VPS | Hetzner 89.167.125.139 | noVNC porta 6080, Chrome + Talixo + World Transfer |
| Extensão | HUB Sync v2 | Monitora booking states 24/7, 0 créditos |
| API Voos | GoFlightLabs | Base URL: goflightlabs.com |

---

## DESIGN SYSTEM
- Fundo: escuro/preto
- Cor principal: dourado #D4A017 / amber
- Logo: barra com 3 pontos/traços + texto "HUB TRANSFER"
- Fontes: Bodoni Moda (display), Plus Jakarta Sans (body)
- Cards: bg-gray-900, border-gray-800
- Badges: CHEGADA=verde, RECOLHA=azul, TOUR=roxo

---

## FRONTEND — PÁGINAS E COMPONENTES CHAVE

### Páginas
- `/admin/trips` — Painel admin com trip cards, flight tracking, SwipeBar
- `/portal` — Portal do hotel (Novo Transfer + Viagens + LIVE)
- `/driver` — Painel motorista com SwipeBar

### Componentes Importantes
- `src/components/shared/SwipeBar.tsx` — Barra arraste estilo Uber (3 estados)
- `src/components/shared/DriverProgressBar.tsx` — Barra progresso carro (4 pontos)
- `src/components/driver/DriverTripCard.tsx` — Card viagem motorista
- `src/lib/flightUtils.ts` — computeFlightState
- `src/lib/countryFlags.ts` — 217 aeroportos → bandeiras
- `src/lib/trips.ts` — Interface HubViagem (com statusMotorista)
- `src/lib/airports.ts` — Dicionário IATA

---

## SWIPEBAR — Sistema de Confirmação do Motorista

### 3 Estados Sequenciais
1. "Estou no local" → status = NO_LOCAL → grava coords GPS + timestamp
2. "Cliente comigo" → status = EM_VIAGEM → grava coords GPS + timestamp
3. "Cheguei ao destino" → status = FINALIZADO → grava coords GPS + timestamp + R=CONCLUIDA

### Design
- Linha pontilhada inspirada na logo HUB (3 pontos)
- Avião SVG arrastável da esquerda para a direita
- Texto descritivo abaixo da barra
- Cores mudam por estado: cinza→azul→verde→dourado
- Vibração do telemóvel ao confirmar
- Aparece no admin E no motorista (componente partilhado)

### Botão Reactivar (admin only)
- Na aba Passadas, botão "🔄 Reactivar" com autenticação por senha admin
- Usa validateLogin(session.name, pwd) — mesma autenticação do login
- Limpa colunas R(18) + BD-BJ(56-62)

---

## MAPEAMENTO DE COLUNAS BD-BJ (SwipeBar v2.0) — ACTUALIZADO 04/04/2026

| Coluna | Índice | Header | Uso |
|---|---|---|---|
| BD | 56 | Status Motorista | AGUARDANDO / NO_LOCAL / EM_VIAGEM / FINALIZADO |
| BE | 57 | Timestamp No Local | "NO_LOCAL \| 2026-04-04T16:46:43" |
| BF | 58 | Coords No Local | lat,lng do motorista ao chegar |
| BG | 59 | Timestamp Em Viagem | "EM_VIAGEM \| 2026-04-04T16:47:02" |
| BH | 60 | Coords Em Viagem | lat,lng ao iniciar viagem |
| BI | 61 | Timestamp Entrega | "FINALIZADO \| 2026-04-04T16:47:38" |
| BJ | 62 | Coords Entrega | lat,lng ao entregar cliente |

### Geocoding Referência (já existente)
- DL(116) = Coords Origem geocoded
- DM(117) = Coords Destino geocoded

### Status antigos → novos (conversão feita em todos os .gs)
- AGUARDANDO → AGUARDANDO (mantém)
- A_CAMINHO → removido, substituído por NO_LOCAL
- INICIOU → EM_VIAGEM
- FINALIZOU → FINALIZADO
- STATUS_OK → STATUS_MOTORISTA

---

## HANDLERS GAS NO doGet (CONFIG_E_CONSTANTES.gs)

### updateDriverStatus
```
?action=updateDriverStatus&rowIndex=735&status=NO_LOCAL&lat=38.76&lng=-9.22&timestamp=ISO
```
- Grava BD(56)=status, BE-BJ conforme estado, R(18)=CONCLUIDA se FINALIZADO

### resetTrip
```
?action=resetTrip&rowIndex=735
```
- Limpa R(18) + BD-BJ(56-62)

### getViagens
```
?action=viagens&data=04/04/2026
```
- Retorna array de viagens com todos os campos incluindo statusMotorista (BD:56)

---

## FLIGHT TRACKING v4.1

### Colunas de Voo
- AF(32) = Hora Aterragem Real
- AG(33) = Status Voo (AGUARDANDO/MONITORANDO/EN_VOO/APROXIMACAO/ATERRISADO)
- AH(34) = Atraso em Minutos
- BX-CC = Dados avançados de voo

### Campos no getViagens (frontend recebe)
- depIata, depTime, depActual, depDelay, arrOriginal, etaChegada, statusVoo, arrTime, atrasoMin

### Protecção de Créditos API
- analisarDataVoo: HOJE/AMANHA/NAO_PROCESSAR/FUTURO_DISTANTE
- Só processa voos de HOJE
- 4 camadas: AGUARDANDO → MONITORANDO → EN_VOO → APROXIMACAO → ATERRISADO

### GoFlightLabs
- Base URL: goflightlabs.com (NÃO app.goflightlabs.com)
- Campo retorno: flight_iata (NÃO flight.iataNumber)
- /advanced-flights-schedules: requer iataCode + type=arrival + access_key
- /flights: usa arr_iata

---

## DRIVER PROGRESS BAR — Barra do Carro (4 pontos)

Componente: `src/components/shared/DriverProgressBar.tsx`

### Layout Visual
```
🚗 ●─────●─────●─────● 🏁
A caminho  No local  Com cliente  Chegou
```

### Comportamento
- AGUARDANDO: tudo cinza, carro no ponto 1
- NO_LOCAL: linha dourada até ponto 2, carro no ponto 2
- EM_VIAGEM: linha dourada até ponto 3, carro no ponto 3
- FINALIZADO: tudo verde, carro no ponto 4

### Onde Aparece
- Admin trips (card minimizado e expandido)
- Driver panel (DriverTripCard)
- Hotel LIVE (abaixo da barra de voo)

---

## SISTEMA LIVE — Portal do Hotel

### Aba LIVE no /portal
- Botão vermelho pulsante "🔴 LIVE"
- Auto-refresh silencioso a cada 15 segundos
- Refresh silencioso: compara dados novos com anteriores, só re-render se mudou

### Secções
1. VOOS — Cards com barra progresso voo (bandeiras) + barra carro (4 pontos)
2. Card expandível com: ID, Referência, Cliente, Data, Hora, Pax, Bags, Contacto, Voo, Rota
3. Botão WhatsApp (SVG real, verde #25D366)
4. Rodapé: X hóspedes | Y voos | Z transfers

### Segurança
- Hotel NUNCA vê localização do motorista
- Hotel NUNCA vê nome do motorista
- Hotel NUNCA vê preços/comissões

---

## SISTEMA ANTI-FRAUDE GPS (em implementação)

### Regras de Margem
- Origem é aeroporto (detecta por "aeroporto/airport/aeropuerto/aéroport/flughafen"): raio 2000m
- Qualquer outro local de origem: raio 200m
- Destino: sempre 200m

### Colunas Propostas
- DN(118) = Distância Swipe 1 vs Origem (ex: "150m ✅")
- DO(119) = Distância Swipe 3 vs Destino (ex: "85m ✅")
- DP(120) = Flag Fraude (OK / ⚠️ FORA_MARGEM)

### Geocoding na Criação
- Quando viagem é criada, geocodificar origem e destino
- Gravar em DL(116) e DM(117)
- Já existe função geocodificarEndereco() no Tracking_automatico_motoristas.gs

---

## REFRESH SILENCIOSO (implementado/em implementação)

- useRef para guardar dados anteriores
- Compara JSON.stringify antes de setState
- Frequências: Hotel LIVE 15s, Admin 30s, Driver 60s
- Refresh imediato após swipe via callback onStatusChange
- Indicador: dot verde pulsante discreto, sem spinner

---

## SINCRONIZAÇÃO HOTEL ↔ HUB

### Hotels Activos
- Empire Lisbon Hotel (ELH) — GAS URL: AKfycbzt67...
- Empire Marques Hotel (EMH) — GAS URL: AKfycbxiEN9...
- Gota d'Água (GDA) — pendente
- Teste Sistema Validado — para testes

### Arquitectura
- Cada hotel: spreadsheet própria + Codigo.gs + Sincronizacao.gs + Conector.gs
- Sincronização bidirecional v5.0 com anti-loop
- HUB Central GAS URL: AKfycbwwr4...

---

## WHATSAPP (Z-API)

### Templates Multilingues (PT/EN/ES/FR/IT)
- Confirmação de viagem
- Alerta de atraso
- Notificação de aterragem
- Follow-up + feedback

### Detecção Idioma
- Por DDI do telefone: +351/+55=PT, +44/+1=EN, +34=ES, +33=FR, +39=IT

### Feedback Inteligente
- 30min após FINALIZADO → pedido avaliação 1-5
- Se 5★ → link Google Reviews
- Se 1-4★ → pergunta como melhorar

---

## COL_TRACKING_AUTO (Tracking_automatico_motoristas.gs) — ACTUALIZADO

```javascript
STATUS_MOTORISTA: 56,         // BD (56)
TIMESTAMP_NO_LOCAL: 57,       // BE (57)
COORDS_NO_LOCAL: 58,          // BF (58)
TIMESTAMP_EM_VIAGEM: 59,      // BG (59)
COORDS_EM_VIAGEM: 60,         // BH (60)
TIMESTAMP_ENTREGA: 61,        // BI (61)
COORDS_ENTREGA: 62,           // BJ (62)
COORDS_ORIGEM: 116,           // DL (116)
COORDS_DESTINO: 117,          // DM (117)
```

---

## FICHEIROS GAS DO HUB CENTRAL

| Ficheiro | Linhas | Responsabilidade Principal |
|---|---|---|
| CONFIG_E_CONSTANTES.gs | ~35k | Core: CONFIG, doGet, doPost, getViagens, processarFlightTrackingLinha |
| FLIGHT_TRACKING_COMPLETO.gs | ~10.7k | obterLinhasHojeAmanha, flight tracking helpers |
| LOGISTICA_E_ECOSSISTEMA.gs | ~10k | GPS tracking, detecção automática, viabilidade |
| NOTIFICACOES_E_COMUNICACAO.gs | ~9.4k | Alertas atraso, notificações WhatsApp |
| TEMPLATES_MULTILINGUES.gs | ~7.5k | Templates PT/EN/ES/FR/IT |
| SETUP_E_MANUTENCAO.gs | ~5.1k | Setup colunas, triggers |
| Tracking_automatico_motoristas.gs | ~4.3k | Tracking GPS, geofencing, COL_TRACKING_AUTO |
| DASHBOARD_E_MONITORAMENTO.gs | ~540 | Dashboard web |

---

## VISÃO ESTRATÉGICA — HUB CONCIERGE

A HUB Transfer transforma-se em plataforma de concierge digital de Lisboa.
Transfer = produto de entrada. Restaurantes + tours + mapa interactivo = receita recorrente.

### Triângulo de Ouro
- Hotel → dependente do sistema LIVE
- Restaurante → paga comissão por cliente
- Cliente → experiência completa via WhatsApp/QR

### Sistema Multi-Agentes (6 agentes, todos aparecem como "Roberta HUB")
- ROBERTA HUB — Central, routing, 5 idiomas
- LAURA — Logística, distribuição motoristas
- MATEUS — Turismo, 500 pontos turísticos
- PEDRO — Vendedor, pricing, upsell, restaurantes
- ASAFE — Relatórios, KPIs
- OSÉIAS — Gerente CEO, estratégia

---

## REGRAS DE NEGÓCIO IMPORTANTES

1. Driver default password: hub2026
2. Admin usa localStorage bridge para autenticação
3. Motorista NUNCA deve ter localização exposta ao hotel/cliente
4. Viagem concluída: SwipeBar mostra "Parabéns pelo seu empenho!" + ícones CheckCircle + Target (lucide-react)
5. GPS: aeroporto 2km margem, outros locais 200m margem
6. Feedback: 30min após FINALIZADO
7. O hotel portal tem campo Config GAS URL configurável

---

## NOTAS PARA CLAUDE CODE

- Sempre usar `view` no SKILL.md relevante antes de criar ficheiros
- Frontend: criar em /home/claude, mover para /mnt/user-data/outputs/ quando pronto
- GAS: preparar código aqui, Junior cola manualmente no script.google.com
- Após cada alteração GAS: Ctrl+S → Implantar → Nova versão → Implantar
- Commits: mensagens em português, descritivas
- Push: git push origin master

---

## ACTUALIZAÇÕES 04/04/2026

---

## SWIPEBAR v2.0 — Sistema de Confirmação do Motorista

Componente: src/components/shared/SwipeBar.tsx
Aparece no admin E no motorista. Design com linha pontilhada (inspirada na logo HUB) + avião SVG arrastável.

3 Estados: "Estou no local" (NO_LOCAL) → "Cliente comigo" (EM_VIAGEM) → "Cheguei ao destino" (FINALIZADO)
Estado concluído: CheckCircle + Target (lucide-react) + "Parabéns pelo seu empenho!"
Vibração do telemóvel ao confirmar. GPS obrigatório antes de cada swipe.

Botão Reactivar na aba Passadas do admin com autenticação validateLogin(session.name, pwd).

---

## MAPEAMENTO COLUNAS BD-BJ (SwipeBar) — ACTUALIZADO 04/04/2026

COLUNAS ANTIGAS (removidas): BD=MsgID Template, BE=MsgID Dados, BF=Lacuna, BG=Status OK

COLUNAS NOVAS:
- BD(56) = Status Motorista: AGUARDANDO/NO_LOCAL/EM_VIAGEM/FINALIZADO
- BE(57) = Timestamp No Local: "NO_LOCAL | 2026-04-04T16:46:43"
- BF(58) = Coords No Local: lat,lng
- BG(59) = Timestamp Em Viagem: "EM_VIAGEM | 2026-04-04T16:47:02"
- BH(60) = Coords Em Viagem: lat,lng
- BI(61) = Timestamp Entrega: "FINALIZADO | 2026-04-04T16:47:38"
- BJ(62) = Coords Entrega: lat,lng

Geocoding referência: DL(116)=Coords Origem, DM(117)=Coords Destino (já existente)

Status antigos convertidos: A_CAMINHO→removido, INICIOU→EM_VIAGEM, FINALIZOU→FINALIZADO, STATUS_OK→STATUS_MOTORISTA

---

## HANDLERS GAS NO doGet

updateDriverStatus: ?action=updateDriverStatus&rowIndex=X&status=NO_LOCAL&lat=X&lng=X&timestamp=ISO
- Grava BD(56)=status, BE-BJ conforme estado, R(18)=CONCLUIDA se FINALIZADO

resetTrip: ?action=resetTrip&rowIndex=X
- Limpa R(18) + BD-BJ(56-62)

getViagens retorna campo statusMotorista de BD(56).

---

## DRIVER PROGRESS BAR — Barra do Carro

Componente: src/components/shared/DriverProgressBar.tsx
4 pontos: "A caminho" → "No local" → "Com cliente" → "Chegou"
Linha dourada preenche conforme status. Carro SVG move-se entre pontos.
Aparece em: admin trips, driver panel, hotel LIVE.

---

## SISTEMA LIVE — Portal do Hotel

Aba LIVE no /portal com botão vermelho pulsante.
Cards expandíveis com: ID, Referência, Cliente, Data, Hora, Pax, Bags, Contacto, Voo, Rota.
Barra voo (bandeiras LHR→LIS) + barra carro (4 pontos) por viagem.
Botão WhatsApp com SVG real verde.
Hotel NUNCA vê: localização motorista, nome motorista, preços/comissões.

---

## ANTI-FRAUDE GPS

Margem aeroporto (detecta "aeroporto/airport/aeropuerto/aéroport/flughafen"): 2000m
Margem outros locais: 200m
Margem destino: sempre 200m
Colunas propostas: DN(118)=distância swipe vs origem, DO(119)=distância vs destino, DP(120)=flag fraude

---

## FLIGHT TRACKING v4.1

analisarDataVoo retorna: HOJE/AMANHA/NAO_PROCESSAR/FUTURO_DISTANTE
getViagens envia: depIata, depTime, depActual, depDelay, arrOriginal, etaChegada, statusVoo, statusMotorista
GoFlightLabs: base URL goflightlabs.com, campo flight_iata, /advanced-flights-schedules com iataCode+type=arrival
217 aeroportos mapeados para bandeiras em src/lib/countryFlags.ts

---

## COL_TRACKING_AUTO (Tracking_automatico_motoristas.gs)

STATUS_MOTORISTA: 56 (BD), TIMESTAMP_NO_LOCAL: 57 (BE), COORDS_NO_LOCAL: 58 (BF),
TIMESTAMP_EM_VIAGEM: 59 (BG), COORDS_EM_VIAGEM: 60 (BH), TIMESTAMP_ENTREGA: 61 (BI),
COORDS_ENTREGA: 62 (BJ), COORDS_ORIGEM: 116 (DL), COORDS_DESTINO: 117 (DM)

---

## REFRESH SILENCIOSO (a implementar)

useRef para dados anteriores, compara JSON.stringify, só setState se mudou.
Frequências: Hotel LIVE 15s, Admin 30s, Driver 60s.
Refresh imediato após swipe via callback onStatusChange.
Indicador: dot verde pulsante discreto.

---

## REGRAS IMPORTANTES

- Driver default password: hub2026
- Admin: localStorage bridge para autenticação
- Feedback: 30min após FINALIZADO → avaliação 1-5 → se 5★ Google Reviews
- Commits: mensagens em português
- GAS: Junior cola manualmente no script.google.com, depois Ctrl+S → Implantar → Nova versão
