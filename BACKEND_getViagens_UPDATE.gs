/**
 * BACKEND_getViagens_UPDATE.gs
 * ============================
 * Linhas a ADICIONAR ao getViagens() no Google Apps Script.
 * NÃO é a função inteira — apenas os campos novos.
 *
 * INSTRUÇÕES:
 * 1. Abrir o Google Apps Script (CONFIG_E_CONSTANTES.gs)
 * 2. Ctrl+F → procurar "col =" ou "var col" dentro de getViagens()
 * 3. Adicionar as linhas do PASSO 1 ao bloco de mapeamento
 * 4. Ctrl+F → procurar "viagens.push" dentro de getViagens()
 * 5. Adicionar as linhas do PASSO 2 ao objecto
 *
 * GERADO EM: 2026-04-01
 */

// ═══════════════════════════════════════════════
// PASSO 1: Adicionar ao bloco col = {...}
// Procurar: "// Flight tracking" ou após os campos existentes
// ═══════════════════════════════════════════════

/*
  // Método A: Se getViagens usa findColWA (pesquisa por header):
  depIata:         findColWA(headers, ['aeroporto origem', 'dep_iata', 'origem voo']),
  horaPartidaProg: findColWA(headers, ['hora partida programada', 'hora decolagem']),

  // Método B: Se getViagens usa índices fixos:
  depIata:         75,  // Coluna BX (76) — Aeroporto de Origem (ex: "CDG", "LHR")
  horaPartidaProg: 76,  // Coluna BY (77) — Hora Partida Programada (ex: "14:30")
*/


// ═══════════════════════════════════════════════
// PASSO 2: Adicionar ao bloco viagens.push({...})
// Procurar: "viagens.push" e adicionar antes do "}"
// ═══════════════════════════════════════════════

/*
  depIata:  col.depIata >= 0 ? g(col.depIata) : '',
  depTime:  col.horaPartidaProg >= 0 ? gHora(col.horaPartidaProg) : '',
*/


// ═══════════════════════════════════════════════
// NOTAS:
// - g() é a função que já existe para ler células como string
// - gHora() é a função que formata horas (se não existir, usar g())
// - Verificar se as colunas BX e BY correspondem aos dados de flight tracking
// - O campo statusVoo e atrasoMin já devem estar mapeados (verificar)
// - Se statusVoo não está mapeado, adicionar:
//   statusVoo:  col.statusVoo >= 0 ? g(col.statusVoo) : '',
//   atrasoMin:  col.atrasoMin >= 0 ? g(col.atrasoMin) : '',
// ═══════════════════════════════════════════════
