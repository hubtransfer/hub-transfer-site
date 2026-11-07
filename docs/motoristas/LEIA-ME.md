# Página /motoristas — candidatura de motoristas

Código: `src/app/motoristas/` (página, ficha, cookies, privacidade, contacto .vcf) e `src/app/api/motoristas/`
(candidatura, fotos, API de Conversões). A /inverno não foi alterada; a /motoristas só lê a lista de carros dela
(`src/app/inverno/_lib/carros.ts`).

Visual: versão clara, à risca do protótipo `docs/motoristas/motoristas-prototipo-claro.html`.

## 1. Folha e Apps Script "Candidatos Motoristas" (só dos motoristas)

A /motoristas tem folha própria, **Candidatos Motoristas**
(<https://docs.google.com/spreadsheets/d/1EkRnToNGdN51lWkQDxja-SXxPJgbLweU6mbLLDFSbRo/edit>), com o Apps Script ligado a ela.
Já não usa a folha **Candidatos Inverno** nem o script da /inverno, que ficam intactos.

1. Na folha **Candidatos Motoristas**: **Extensões → Apps Script**. Dá ao projeto o nome **Candidatos Motoristas**.
2. Apaga o que lá estiver e cola `docs/motoristas/apps-script-motoristas.gs`. Guarda (Ctrl+S).
3. Fuso horário **Europe/Lisbon** no projeto: **Definições do projeto (roda dentada)** → marca
   **Mostrar ficheiro de manifesto "appsscript.json" no editor** → no `appsscript.json`, `"timeZone": "Europe/Lisbon"` → guarda.
   O da folha (**Ficheiro → Definições → Fuso horário**) o script acerta-o sozinho na primeira vez.
4. **Definições do projeto → Propriedades do script → Adicionar**:
   - `TOKEN`: um segredo comprido novo (diferente do da /inverno); o mesmo valor vai para `MOTORISTAS_TOKEN`.
   - `FOLHA_ID`: `1EkRnToNGdN51lWkQDxja-SXxPJgbLweU6mbLLDFSbRo` (obrigatório, mesmo com o script ligado à folha).
   - `AVISO_EMAIL`: `juniorgutierezbega@gmail.com`. `AVISO_WHATSAPP`: `351963705509` (o da contratação, +351 963 705 509; só dígitos).
   - `ZAPI_INSTANCE`, `ZAPI_TOKEN`, `ZAPI_CLIENT_TOKEN`: a instância da HUB, gravados como o TOKEN (ficheiro temporário `_segredos.gs`, fora do git, retirado logo a seguir). Sem eles, o aviso vai só por e-mail.
5. No editor, escolhe a função `testarTudo` e carrega em **Executar**. Autoriza o script quando pedir
   (folha, Google Drive, e-mail e pedidos externos). Deves ver:
   - o separador **Candidatos Motoristas** na folha, com uma ficha "Teste HUB" em "Em análise" e Prioridade "Sim";
   - a pasta **Candidaturas Motoristas · Fotos** no teu Drive, com a subpasta **AAAA-MM-DD — Teste HUB — HUB-XXXX**,
     as duas fotos (`lado.jpg`, `bagageira.jpg`) e a **FICHA.txt**;
   - o aviso por e-mail (e por WhatsApp, se a Z-API estiver preenchida).
   Depois apaga a linha de teste e a subpasta de teste.
6. **Implementar → Nova implementação → Tipo: Aplicação Web**. Executar como: **Eu**. Quem tem acesso: **Qualquer pessoa**.
   Copia o URL que termina em `/exec`. Abri-lo no browser deve mostrar `{"ok":true,"servico":"candidatos-motoristas"}`.

As fotos ficam privadas no teu Drive (só tu e quem tu partilhares as vê). Os links na folha só abrem para essas contas.
Cada ficha tem uma pasta **AAAA-MM-DD — Nome — HUB-XXXX** (data do passo 1, hora de Lisboa) com as duas fotos e a
**FICHA.txt**, escrita quando a candidatura fica completa. Se a pessoa corrigir o nome, a pasta muda de nome.

## 2. Variáveis de ambiente (Vercel → Settings → Environment Variables, e `.env.local` para testar)

| Variável | O que é |
|---|---|
| `MOTORISTAS_WEBAPP_URL` | URL `/exec` do passo 1.6 |
| `MOTORISTAS_TOKEN` | o mesmo valor de `TOKEN` do passo 1.4 |
| `MOTORISTAS_WHATSAPP_CONTRATACAO` | número que aparece no ecrã final e no contacto a guardar, ex.: `+351 963 705 509` |
| `NEXT_PUBLIC_META_PIXEL_ID`, `META_CAPI_TOKEN` | os que já existem (mesmo pixel da /inverno) |
| `MOTORISTAS_SIMULAR` | só em local: `1` para testar sem escrever na folha (nunca funciona em produção) |

Sem `MOTORISTAS_WEBAPP_URL` (e sem simular), a candidatura dá erro em vez de se perder em silêncio.
Sem `MOTORISTAS_WHATSAPP_CONTRATACAO`, o ecrã final omite o número e o botão de guardar o contacto.
O número é lido no build: depois de o mudares no Vercel, faz um novo deploy.

## 3. A folha

Folha **Candidatos Motoristas**, separador **Candidatos Motoristas**: Data, Código, Nome, WhatsApp, Concelho, todas as respostas, links das duas fotos e da
pasta, **Estado**, **Prioridade**, consentimento, página, utm (origem do anúncio). As três últimas colunas estão escondidas:
servem ao script.

Estado automático (o candidato nunca o vê):

| Estado | Quando |
|---|---|
| Não avança | sem carro, carro anterior a 2010, carta há menos de 1 ano, ou já faz transfers / trabalha no aeroporto |
| Ficha incompleta | faltam as fotos (é o estado logo a seguir ao passo 1) |
| Ver com atenção | carro alugado ou de frota |
| Em análise | todos os outros casos |

Prioridade "Sim" quando tem outro trabalho ou negócio. O script só muda o Estado enquanto ninguém lhe mexeu à mão.
O aviso (WhatsApp + e-mail) chega só quando uma ficha fica completa, com o nome, o carro, o estado e o link das fotos.

## 4. Eventos da Meta (todos com `content_category: "motoristas"`)

| Momento | Pixel | API de Conversões |
|---|---|---|
| Abrir a página (depois de aceitar cookies) | `PageView` | `PageView` |
| Passo 1 enviado | `Lead` | `Lead` (+ telefone, primeiro nome e concelho cifrados) |
| Candidatura enviada, com as duas fotos | `CompleteRegistration` | `CompleteRegistration` |

## 5. Antes de publicar

- Preencher o prazo das fotos em `/motoristas/privacidade` (está a amarelo, «[PRAZO POR PREENCHER]») e rever o texto.
- Fazer uma candidatura real a partir do telemóvel e confirmar a linha, a pasta no Drive (as duas fotos e a FICHA.txt), o WhatsApp e o e-mail.
- No Gestor de Eventos, com `META_TEST_EVENT_CODE`, confirmar os três eventos e a deduplicação.
