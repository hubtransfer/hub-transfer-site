/**
 * BACKEND_FIX_getViagens_readonly.gs
 * ====================================
 * BUG: Ao abrir /admin/trips, as colunas de flight tracking (AG, BX, CC, etc.)
 * são resetadas para "" ou "AGUARDANDO".
 *
 * CAUSA CONFIRMADA: O frontend NÃO escreve nestas colunas.
 * O problema está no handler getViagens() do GAS que provavelmente
 * faz .setValue() ao iterar as linhas — ex: inicializar colunas vazias.
 *
 * INVESTIGAÇÃO FRONTEND (06/04/2026):
 * - updateDriverStatus: chamado APENAS no SwipeBar após drag do utilizador
 *   (ficheiros: SwipeBar.tsx linhas 128 e 96, dentro de doConfirm/onEnd)
 * - action=completar: chamado APENAS via darBaixa (click do utilizador)
 * - action=resetTrip: chamado APENAS com password de admin
 * - NÃO existe nenhum useEffect que envie dados ao backend ao montar
 * - O polling (15s/30s/60s) usa APENAS action=lastChange e action=viagens (leitura)
 *
 * ═══════════════════════════════════════════════════════════════
 *  CORRECÇÃO NO GAS — Procurar e REMOVER no getViagens():
 * ═══════════════════════════════════════════════════════════════
 *
 *  Procurar dentro de getViagens() qualquer linha que faça .setValue() ou
 *  .setValues() — ex:
 *
 *    ❌ if (!statusVoo) sheet.getRange(row, 33).setValue('AGUARDANDO');
 *    ❌ if (!depIata)   sheet.getRange(row, 76).setValue('');
 *    ❌ sheet.getRange(row, col.statusVoo).setValue(statusVoo || 'AGUARDANDO');
 *
 *  getViagens() deve ser SOMENTE LEITURA. Nunca escrever na folha.
 *
 *  Colunas de flight tracking que NUNCA devem ser escritas fora dos triggers:
 *    AG(33) = Status Voo (AGUARDANDO/MONITORANDO/EN_VOO/ATERRISADO)
 *    AF(32) = Hora Aterragem Real
 *    AH(34) = Atraso (minutos)
 *    BX(76) = dep_iata (aeroporto de origem)
 *    BY(77) = Hora Partida Programada
 *    CC(81) = ETA Chegada
 *    CD(82) = Hora Partida Actual
 *
 *  Estas colunas são geridas EXCLUSIVAMENTE pelos triggers:
 *    - monitorarVoosHoje() → trigger horário
 *    - processarVoo() → chamado pelo trigger
 *    - GoFlightLabs API
 *
 *  Colunas que o frontend PODE escrever (via updateDriverStatus/resetTrip):
 *    BD(56) = Status Motorista
 *    BE(57) = Timestamp No Local
 *    BF(58) = Coords No Local
 *    BG(59) = Timestamp Em Viagem
 *    BH(60) = Coords Em Viagem
 *    BI(61) = Timestamp Entrega
 *    BJ(62) = Coords Entrega
 *    R(18)  = Status Viagem (CONCLUIDA)
 *
 * ═══════════════════════════════════════════════════════════════
 *  VERIFICAÇÃO RÁPIDA:
 * ═══════════════════════════════════════════════════════════════
 *
 *  1. Abrir script.google.com
 *  2. Ctrl+F dentro de getViagens():
 *     Procurar: setValue
 *     Procurar: setValues
 *     Procurar: AGUARDANDO.*setValue
 *  3. Se encontrar qualquer .setValue() dentro de getViagens() → REMOVER
 *  4. getViagens() deve apenas: getRange().getValues() e devolver JSON
 *  5. Ctrl+S → Implantar → Nova versão → Implantar
 *
 * ═══════════════════════════════════════════════════════════════
 *  ALTERNATIVA — Se getViagens() precisa de inicializar statusVoo:
 * ═══════════════════════════════════════════════════════════════
 *
 *  Em vez de escrever na célula, devolver o default apenas no JSON:
 *
 *    ✅ statusVoo: g(col.statusVoo) || 'AGUARDANDO',  // default no JSON, NÃO na célula
 *    ❌ if (!val) sheet.getRange(r, col.statusVoo).setValue('AGUARDANDO');
 */
