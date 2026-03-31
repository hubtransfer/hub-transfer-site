/**
 * BACKEND_getViagens_UPDATE.gs
 * ============================
 * Linhas a ADICIONAR ao getViagens() no Google Apps Script.
 * NÃO é a função inteira — apenas os campos novos.
 *
 * INSTRUÇÕES:
 * 1. Abrir o Google Apps Script
 * 2. Localizar a função getViagens() (aprox. linha 5200)
 * 3. No bloco de mapeamento de colunas (col = {...}), adicionar:
 * 4. No bloco viagens.push({...}), adicionar:
 *
 * GERADO EM: 2026-03-31
 */

// ═══════════════════════════════════════════════
// PASSO 1: Adicionar ao bloco col = {...}
// (procurar "// Flight tracking" — aprox. linha 5258)
// Adicionar DEPOIS dos campos existentes de flight tracking:
// ═══════════════════════════════════════════════

/*
  depIata:      75,  // BX (76) — Aeroporto de origem IATA (ex: "BEG", "LHR")
  depTimeProg:  76,  // BY (77) — Hora descolagem programada (ex: "12:00")
  etaChegada:   80,  // CC (81) — ETA chegada estimada (ex: "15:55")
  statusVoo:    81,  // CD (82) — Status do voo (AGUARDANDO, MONITORANDO, EN_VOO, ATERRISADO)
  atrasoMin:    82,  // CE (83) — Minutos de atraso (ex: "25")
*/


// ═══════════════════════════════════════════════
// PASSO 2: Adicionar ao bloco viagens.push({...})
// (procurar "// Flight tracking" — aprox. linha 5356)
// Adicionar DEPOIS dos campos existentes:
// ═══════════════════════════════════════════════

/*
  depIata:     col.depIata >= 0 ? g(col.depIata) : '',
  depTimeProg: col.depTimeProg >= 0 ? g(col.depTimeProg) : '',
  etaChegada:  col.etaChegada >= 0 ? g(col.etaChegada) : '',
  statusVoo:   col.statusVoo >= 0 ? g(col.statusVoo) : '',
  atrasoMin:   col.atrasoMin >= 0 ? g(col.atrasoMin) : '',
*/


// ═══════════════════════════════════════════════
// NOTAS:
// - Os índices de coluna (75, 76, 80, 81, 82) são baseados na
//   estrutura actual do HUB Central. Verificar se as colunas
//   BX, BY, CC, CD, CE correspondem aos dados de flight tracking v6.0.
// - Se as colunas forem diferentes, ajustar os índices.
// - g() é a função helper que já existe no GAS para ler células.
// - Estes campos são opcionais — se a coluna não existir, retorna ''.
// ═══════════════════════════════════════════════
