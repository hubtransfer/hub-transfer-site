# HUB TRANSFER — PROJETO COMPLETO
## CLAUDE.md — Manual de Regras para Claude Code

---

## 🎯 VISÃO DO PROJETO

A HUB Transfer é uma empresa de transfers aeroporto/hotel baseada em Lisboa (Amadora).
O objetivo é criar um ecossistema digital completo e profissional que inclui:

1. **Website institucional** — Landing page para clientes diretos (multilíngue)
2. **Portal de hotéis** — Interface para hotéis parceiros fazerem reservas
3. **Dashboard operacional** — Painel de gestão para Junior e Roberta
4. **App motoristas** — Interface mobile para os drivers (futuro React Native)
5. **Tracking público** — Página para clientes acompanharem o motorista

---

## 🏗️ STACK TECNOLÓGICA

```
Frontend:  Next.js 15 (App Router) + TypeScript + Tailwind CSS v4 + shadcn/ui
Backend:   Supabase (PostgreSQL + Auth + Realtime + Storage)
Existente: Google Apps Script (~89.000 linhas, "Roberta HUB v2.0")
           Google Sheets (HUB-Central como database operacional)
           GitHub Pages (HUB Transfer OPS)
Deploy:    Vercel (frontend) + Supabase (backend)
Futuro:    React Native (app motoristas iOS/Android)
```

---

## 🎨 DESIGN SYSTEM — "Luxury meets Technology"

### Estilo Visual
- Tom: Premium, luxo, confiável — como marca de carros premium
- Aesthetic: Dark-first, dourado accent, elegância minimalista, animações subtis
- Sensação: Um software que parece ter custado 1 milhão de euros
- NUNCA: Inter/Arial/Roboto, gradientes roxos, cards genéricos, "AI slop"
- NUNCA: Botões coloridos (azul/verde/laranja/vermelho). Usar apenas a paleta da marca.

### Cores da Marca (baseadas no logo oficial)
```
Primary (Dourado HUB):    #F5C518 → #D4A017 → #B8860B (amarelo/dourado do logo)
Dark (Preto Premium):     #000000 → #111111 → #1A1A1A (fundo principal)
Light (Branco):           #FFFFFF → #F5F5F5 → #E5E5E5 (texto e cards)
Neutral (Cinza):          #9CA3AF → #6B7280 → #374151 (texto secundário)
Success:                  #22C55E (confirmado)
Warning:                  #F59E0B (pendente)
Error:                    #EF4444 (cancelado)
```

A interface deve ser DARK-FIRST: fundo preto/cinza escuro com acentos dourados.
O dourado (#F5C518) é a cor principal de destaque — botões, links, badges, hover.
Cards em cinza escuro (#1A1A1A / #222222) sobre fundo preto.
Texto principal em branco, secundário em cinza claro.

### Dados da empresa (usar no site)
```
Nome: HUB Transfer
Slogan: "Transfer and Tourism"
Site: www.hubtransferencia.com
Email: juniorguitierez@hubtransferencia.com
WhatsApp: +351 968 698 138
Diretor: Junior Gutierez
Localização: Amadora, Lisboa, Portugal
Logo: Preto e dourado (ficheiro: Assinatura_digital_Hub_Transfer.jpg)
```

### Tipografia
NÃO usar fontes genéricas (Inter, Roboto, Arial, system-ui, Geist).
USAR a skill frontend-design instalada para escolher tipografia premium.
A skill deve selecionar fontes que sejam:
- Distintivas e memoráveis (não as mesmas que todos os sites AI usam)
- Premium e sofisticadas (combinar com estética preto + dourado)
- Um display font impactante para headings (bold, luxo)
- Um body font elegante e legível para texto
- Um mono font para IDs, códigos e dados operacionais
Importar via Google Fonts ou Fontsource. Nunca system fonts como fallback primário.

### Princípios
- Dark-first design (fundo escuro com accent dourado)
- Light mode como alternativa (inversão clean)
- Mobile-first SEMPRE
- Framer Motion para animações (subtis mas premium)
- Cards com bordas subtis e sombras suaves sobre fundo escuro
- Botões em dourado (#F5C518) com hover para dourado mais escuro
- rounded-2xl cards, rounded-xl inputs

---

## 📂 ESTRUTURA DO PROJETO

```
hub-transfer-site/
├── CLAUDE.md
├── src/
│   ├── app/
│   │   ├── (site)/               ← Website público
│   │   │   ├── page.tsx          ← Landing page
│   │   │   ├── booking/          ← Reserva direta
│   │   │   ├── tracking/[id]/    ← Tracking público
│   │   │   └── about/
│   │   ├── (portal)/             ← Portal hotéis (auth)
│   │   │   ├── dashboard/
│   │   │   ├── new-booking/
│   │   │   ├── bookings/
│   │   │   └── history/
│   │   ├── (admin)/              ← Dashboard operacional (auth)
│   │   │   ├── dashboard/
│   │   │   ├── trips/
│   │   │   ├── drivers/
│   │   │   ├── hotels/
│   │   │   ├── finance/
│   │   │   └── settings/
│   │   └── api/
│   ├── components/
│   │   ├── ui/                   ← shadcn/ui + premium
│   │   ├── layout/
│   │   ├── booking/
│   │   ├── dashboard/
│   │   └── tracking/
│   ├── lib/
│   │   ├── supabase/
│   │   ├── utils.ts
│   │   └── constants.ts
│   ├── hooks/
│   ├── styles/globals.css
│   └── i18n/ (pt, en, es, fr, de)
├── public/
├── tailwind.config.ts
└── next.config.ts
```

---

## 🔗 INTEGRAÇÃO COM SISTEMA EXISTENTE

### Backend GAS ativo (~89.000 linhas):
- Flight tracking (GoFlightLabs API)
- GPS tracking motoristas (v2.1)
- WhatsApp automático (Z-API, 5 idiomas)
- Sincronização bilateral hotel↔HUB Central
- Comissões por motorista
- Dashboard monitoramento

### Estratégia:
```
FASE 1: Frontend novo ↔ Google Sheets (via Apps Script API)
FASE 2: Migrar dados para Supabase
FASE 3: Frontend ↔ Supabase direto
```

### Dados do negócio:
- Hotéis: Empire Lisbon (elh), Empire Marques (emh), Lioz, Gota d'Água (gda)
- Motoristas: Victor/Igor (€9), Gustavo/Henrique/Danielle/Éder (€10)
- Rotas: Lisboa↔Aeroporto €9, Cascais/Sintra €20, Tour Sintra €75, Tour Fátima €95

---

## 🌍 i18n — 5 idiomas: PT, EN, ES, FR, DE

Usar next-intl. Detecção por DDI do telefone.
Landing: idioma do browser. Portal hotel: PT default.

---

## 📋 REGRAS DE CÓDIGO

1. TypeScript strict — sem `any`
2. Componentes funcionais com hooks
3. Código inglês, conteúdo PT + i18n
4. Imports absolutos (@/components, @/lib)
5. Tailwind — NUNCA CSS inline
6. Framer Motion para animações
7. shadcn/ui customizado
8. Zod + React Hook Form
9. Mobile-first todos os componentes
10. WCAG 2.1 AA
11. Core Web Vitals: LCP <2.5s, INP <200ms, CLS <0.1

---

## 🚀 FASES DE IMPLEMENTAÇÃO

### Fase 1 — Fundação (Semana 1)
Setup Next.js, design system, layout master, landing page

### Fase 2 — Portal Hotéis (Semana 2-3)
Auth hotel, formulário reserva premium, lista reservas, sync GSheets

### Fase 3 — Dashboard Admin (Semana 3-4)
KPIs, gestão viagens, motoristas, finanças

### Fase 4 — Avançado (Semana 5-6)
Tracking público, flight tracking visual, realtime, Supabase

### Fase 5 — App Motoristas (Semana 7-11)
React Native, GPS nativo, placa digital, navegação Waze/Google Maps

---

## 📐 PORTAL HOTÉIS — SPEC EXACTA (MANTER NOMES E ORGANIZAÇÃO)

O frontend atual funciona bem em lógica. Manter TODA a organização e nomes.
Apenas elevar o visual para premium.

### Secção 1: "📝 Solicitar Novo Transfer" (formulário)

Campos na ordem exacta:
1. 👤 Nome do Cliente * (text)
2. 📋 Referência da Reserva (text, ex: Booking.com)
3. 🚗 Tipo de Serviço (3 toggle buttons: Transfer / Tour / Privado)
4. 🎯 Selecione o Tour (dropdown, só se tipo=Tour)
5. 👥 Número de Pessoas * (botões: 👤1, 👥2, 3, 4, 5, 6, 7, 8+)
6. 🧳 Número de Bagagens (botões: 🎒0, 🧳1, 2, 3, 4, 5, 6+)
7. 📅 Data do Transfer * (date picker + botões: 📅Hoje, 🗓️Amanhã)
8. 🕐 Hora de Pick-up * (botões rápidos 06:00-18:00 com emoji + input manual)
9. 📱 Contacto do Cliente * (tel internacional com DDI)
10. ✈️ Número do Voo (text, ex: TP1234)
11. 📍 Local de Origem * (Google Maps autocomplete + botões: Aeroporto, Hotel)
12. 🎯 Local de Destino * (Google Maps autocomplete + botões: Aeroporto, Hotel)
13. 💰 Valor do Serviço € * (botões rápidos: €25, €35, €45, €60, €75, €100 + manual)
14. 💳 Forma de Pagamento * (select: Dinheiro, Cartão, Transferência)
15. 👨‍💼 Pago Para * (select: Recepção, Motorista, Personalizado)
16. 📝 Observações (textarea)

Campos Admin (visíveis apenas em modo Admin):
- 🏨 Valor Hotel (30%) — calculado automaticamente
- 🚗 Valor HUB Transfer — calculado automaticamente
- 👨‍💼 Comissão Recepção — calculado automaticamente

Botões de ação do formulário: 📋 Solicitar Transfer (botão dourado primary) + 🧹 Limpar (botão outline)

### Barra de acções globais (topo da página)

5 botões em linha (usar paleta da marca — dourado para primary, outline para secundários):
- 📋 **SOLICITAR TRANSFER** (dourado, destaque) — scroll para o formulário
- 🧹 **LIMPAR** (outline) — reset do formulário
- 📊 **EXPORTAR CSV** (outline) — exporta tabela filtrada
- ⚙️ **CONFIGURAR** (outline) — abre painel de configuração da URL do GAS
- 🗑️ **LIMPAR DADOS** (outline com hover vermelho) — limpa dados locais (com confirmação)

### Secção 2: KPIs de Status (4 cards em linha)

- 📊 **TOTAL DE SERVIÇOS** (número: 291)
- ⏳ **SOLICITADOS** (número: 288)
- ✅ **CONFIRMADOS** (número: 3)
- 🏁 **FINALIZADOS** (número: 0)

### Secção 3: "💰 Resumo Financeiro" (4 cards em fundo azul gradiente)

- 💵 **Receita Total** (€6061.32)
- ⏳ **Valor Pendente** (€5986.32)
- ✅ **Valor Confirmado** (€75.00)
- 🏁 **Valor Finalizado** (€0.00)

### Secção 4: "🚗 Serviços de Transfer" (tabela com filtros)

**Barra de filtros:**
- 📅 Data Início (date picker)
- 📅 Data Fim (date picker)
- ⚡ Períodos Rápidos (dropdown: Personalizado, Hoje, Ontem, Esta Semana, Semana Passada, Este Mês, Mês Passado, Últimos 7 Dias)
- 🏷️ Status (dropdown: Todos, Solicitado, Confirmado, Finalizado)
- 🔍 Cliente (text search)
- 🚗 Tipo Serviço (dropdown: Todos, Transfer, Tour, Privado)

**Botões de filtro:**
- 🔍 **APLICAR FILTROS** (verde)
- 🧹 **LIMPAR FILTROS** (cinza)
- 🚗 **CARREGAR TRANSFERS** (laranja) — sincroniza com Google Sheets
- 🔧 **TESTAR CONEXÃO** (verde escuro) — testa API do GAS

**Colunas da tabela (16 colunas visíveis + admin):**
🆔ID, 📋Ref, 👤Cliente, 🚗Tipo, 👥Pessoas, 🧳Bagagens,
📅Data, 🕐Hora Pick-up, 📱Contacto, ✈️Voo, 🗺️Rota,
💰Valor Total, 💳Pagamento, 👨‍💼Pago Para, 🏷️Status, ⚙️Ações

Colunas admin (visíveis só em modo admin):
🏨Valor Hotel, 🚗Valor HUB, 👨‍💼Comissão Recepção

**Links clicáveis na tabela (CRÍTICO — manter):**
- 📱 Número de telefone → abre WhatsApp (wa.me/{numero})
- ✈️ Número do voo → abre Google Search (google.com/search?q=flight+{voo})

**Acções por linha (3 botões):**
- ✏️ Editar — carrega dados no formulário para edição
- 🔄 Alterar Status — cicla: Solicitado → Confirmado → Finalizado
- 🗑️ Excluir — pede password do hotel (elh/emh/gda/hubtransfer)

**Paginação:** Items por página + navegação de páginas

### Botão flutuante: 👨‍💻 Admin (canto inferior direito)
Toggle que mostra/esconde campos e colunas admin (valores hotel, HUB, comissão)
