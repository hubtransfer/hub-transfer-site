# Página /inverno — pré-inscrição de motoristas

Página da campanha de inverno: `src/app/inverno/` (página, formulário, aviso de cookies, privacidade) e
`src/app/api/inverno/` (guardar inscrições e API de Conversões da Meta). Nada fora destas pastas foi alterado.

## 1. Folha Google "Candidatos Inverno" (guardar inscrições + avisos)

1. Cria uma folha Google nova chamada **Candidatos Inverno** (separada da HUB Central).
2. Na folha: **Extensões → Apps Script**. Apaga o que lá estiver e cola `docs/inverno/apps-script-candidatos.gs`.
3. **Definições do projeto (roda dentada) → Propriedades do script → Adicionar**:
   - `TOKEN`: um segredo comprido inventado por ti (ex.: 40 letras e números ao acaso).
   - `AVISO_EMAIL`: o e-mail que recebe os avisos.
   - `AVISO_WHATSAPP`: o teu número, só dígitos com indicativo (ex.: `351968698138`).
   - `ZAPI_INSTANCE`, `ZAPI_TOKEN`, `ZAPI_CLIENT_TOKEN`: os da Z-API. Usa os **novos**, depois de os trocares
     (os atuais estão escritos em ficheiros em texto simples e devem ser substituídos).
4. No editor, escolhe a função `testarAviso` e carrega em **Executar**. Autoriza o script quando pedir.
   Deves receber um WhatsApp e um e-mail de teste, e aparece o separador "Inscrições".
5. **Implementar → Nova implementação → Tipo: Aplicação Web**.
   - Executar como: **Eu**. Quem tem acesso: **Qualquer pessoa**.
   - Copia o URL que termina em `/exec`.
   - Abrir esse URL no browser deve mostrar `{"ok":true,"servico":"candidatos-inverno"}`.

## 2. Variáveis de ambiente (Vercel → Settings → Environment Variables, e `.env.local` para testar)

| Variável | O que é |
|---|---|
| `INSCRICOES_WEBAPP_URL` | URL `/exec` do passo 1.5 |
| `INSCRICOES_TOKEN` | o mesmo valor de `TOKEN` do passo 1.3 |
| `NEXT_PUBLIC_META_PIXEL_ID` | ID do pixel (Gestor de Eventos da Meta) |
| `META_CAPI_TOKEN` | token de acesso da API de Conversões (Gestor de Eventos → Definições) |
| `META_TEST_EVENT_CODE` | opcional: código de "Testar eventos", só enquanto testas; apaga depois |
| `META_API_VERSION` | opcional: versão da Graph API (por omissão `v23.0`) |

Sem `INSCRICOES_WEBAPP_URL`, em desenvolvimento a inscrição é simulada (aparece no terminal); em produção dá erro,
para nunca se perder uma inscrição em silêncio. Sem as variáveis da Meta, a página funciona na mesma, só sem medição.

## 3. Eventos da Meta

| Momento | Pixel (browser) | API de Conversões (servidor) |
|---|---|---|
| Abrir a página (depois de aceitar cookies) | `PageView` | `PageView` |
| Passo 1 enviado | `Lead` | `Lead` (+ telefone, primeiro nome e concelho cifrados) |
| Passo 2 completo | `CompleteRegistration` | `CompleteRegistration` |

Browser e servidor usam o mesmo `event_id`, por isso a Meta conta cada evento uma vez.
Nada é carregado nem enviado sem o "Aceitar" do aviso de cookies.

## 4. Antes de publicar
- Rever o texto de `/inverno/privacidade` com quem trata do RGPD (prazo de 12 meses, lista de prestadores).
- Testar uma inscrição real e confirmar a linha na folha, o WhatsApp e o e-mail.
- No Gestor de Eventos da Meta, com `META_TEST_EVENT_CODE`, confirmar os três eventos e a deduplicação.
