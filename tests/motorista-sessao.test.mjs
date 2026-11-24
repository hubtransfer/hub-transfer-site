// Testes de quem está na app do motorista (src/lib/motoristaSessao.ts).
// Só dados inventados: nomes, crachás (assinatura falsa) e viagens.
// Correr: node --test tests/motorista-sessao.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  motoristaDaSessao,
  resolverIdentidade,
  nomeOficial,
  lerCracha,
  apagarDadosMotorista,
  CHAVES_DADOS_MOTORISTA,
  SESSAO_MOTORISTA_MS,
  prazoSessaoNova,
  crachaRecusado,
  SessaoRecusadaErro,
  avisarSeRecusada,
  EVENTO_SESSAO_RECUSADA,
  crachaNovoDaSenha,
  guardarCrachaNovo,
} from "../src/lib/motoristaSessao.ts";

const AGORA = Date.UTC(2026, 10, 23, 10, 0, 0);
const HORA = 3600 * 1000;

/** Um crachá com o formato do backend (corpo base64 web-safe . assinatura) — assinatura inventada. */
function crachaFalso({ q, e = AGORA + 12 * HORA, p = "driver", g = "1" }) {
  const corpo = Buffer.from(JSON.stringify({ q, e, g, p }), "utf8").toString("base64url");
  return `${corpo}.assinatura-inventada`;
}
function sessao(nome, extra = {}) {
  return { name: nome, role: "driver", cracha: crachaFalso({ q: nome }), expiresAt: AGORA + 8 * HORA, ...extra };
}

const LISTA = [{ name: "Tomé Inventado" }, { name: "Xavier Fictício" }, { name: "Úrsula Exemplo" }];

/** Um localStorage de mentira. */
function armazem(inicial = {}) {
  const m = new Map(Object.entries(inicial));
  return {
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => m.set(k, String(v)),
    removeItem: (k) => m.delete(k),
    chaves: () => [...m.keys()].sort(),
  };
}

test("o crachá lê-se: nome, prazo e papel", () => {
  const c = lerCracha(crachaFalso({ q: "Tomé Inventado" }));
  assert.equal(c.quem, "Tomé Inventado");
  assert.equal(c.prazo, AGORA + 12 * HORA);
  assert.equal(c.papel, "driver");
  assert.equal(lerCracha("nada"), null);
  assert.equal(lerCracha(""), null);
  assert.equal(lerCracha(undefined), null);
  assert.equal(lerCracha("@@@.x"), null);
});

test("o motorista vem só do crachá do login", () => {
  const r = motoristaDaSessao(sessao("Tomé Inventado"), AGORA);
  assert.deepEqual(r, { ok: true, nome: "Tomé Inventado", prazo: AGORA + 8 * HORA });
});

test("sem sessão, sem crachá ou com outro papel: volta ao login", () => {
  assert.equal(motoristaDaSessao(null, AGORA).motivo, "sem_sessao");
  assert.equal(motoristaDaSessao({ role: "driver" }, AGORA).motivo, "sem_sessao");
  assert.equal(motoristaDaSessao(sessao("Tomé Inventado", { cracha: undefined }), AGORA).motivo, "sem_cracha");
  assert.equal(motoristaDaSessao(sessao("Tomé Inventado", { cracha: "lixo" }), AGORA).motivo, "cracha_ilegivel");
  assert.equal(motoristaDaSessao(sessao("Tomé Inventado", { role: "admin" }), AGORA).motivo, "nao_e_motorista");
  assert.equal(
    motoristaDaSessao(sessao("Tomé Inventado", { cracha: crachaFalso({ q: "Tomé Inventado", p: "admin" }) }), AGORA).motivo,
    "nao_e_motorista",
  );
});

test("o nome da sessão tem de ser o do crachá (mexer na sessão não muda de motorista)", () => {
  const trocada = { ...sessao("Tomé Inventado"), name: "Xavier Fictício" };
  assert.equal(motoristaDaSessao(trocada, AGORA).motivo, "cracha_de_outro");
  assert.equal(resolverIdentidade(trocada, LISTA, false, AGORA).estado, "login");
});

test("o crachá leva só 40 caracteres do nome", () => {
  const longo = "Maximiliano Inventado de Exemplo Fictício Teste";
  const s = { name: longo, role: "driver", cracha: crachaFalso({ q: longo.substring(0, 40) }), expiresAt: AGORA + HORA };
  assert.equal(motoristaDaSessao(s, AGORA).ok, true);
});

test("crachá ou sessão fora do prazo: pede outra vez a senha", () => {
  const s1 = sessao("Tomé Inventado", { cracha: crachaFalso({ q: "Tomé Inventado", e: AGORA - 1 }) });
  assert.equal(motoristaDaSessao(s1, AGORA).motivo, "expirou");
  const s2 = sessao("Tomé Inventado", { expiresAt: AGORA - 1 });
  assert.equal(motoristaDaSessao(s2, AGORA).motivo, "expirou");
  // o prazo é o mais curto dos dois
  const s3 = sessao("Tomé Inventado", { cracha: crachaFalso({ q: "Tomé Inventado", e: AGORA + HORA }) });
  assert.equal(motoristaDaSessao(s3, AGORA).prazo, AGORA + HORA);
  assert.equal(resolverIdentidade(s3, LISTA, false, AGORA + HORA).estado, "login");
  assert.equal(resolverIdentidade(s3, LISTA, false, AGORA + HORA - 1).estado, "ok");
});

test("o nome guardado de outro motorista é ignorado", () => {
  // No telemóvel ficou o Xavier (antigo hub_driver_identity e hub_driver_name);
  // o Tomé entra com a senha dele: a app é do Tomé.
  const ls = armazem({ hub_driver_identity: "Xavier Fictício", hub_driver_name: "Xavier Fictício" });
  const r = resolverIdentidade(sessao("Tomé Inventado"), LISTA, false, AGORA);
  assert.equal(r.estado, "ok");
  assert.equal(r.nome, "Tomé Inventado");
  // e a resolução nem recebe o armazém: não há caminho para ele decidir
  assert.equal(resolverIdentidade.length, 4);
  assert.equal(ls.getItem("hub_driver_identity"), "Xavier Fictício");
});

test("entrar e sair apagam o nome guardado e as viagens guardadas", () => {
  const ls = armazem({
    hub_session: "{}",
    hub_driver_identity: "Xavier Fictício",
    hub_driver_name: "Xavier Fictício",
    hub_trips_cache: JSON.stringify({ data: [{ id: "VIAGEM-INVENTADA-1", client: "Cliente Fictício" }], timestamp: AGORA, date: "today:xavier ficticio" }),
    hub_driver_last_sync: "09:59",
    hub_admin_email: "gestao@exemplo.invalid",
  });
  apagarDadosMotorista(ls);
  for (const k of CHAVES_DADOS_MOTORISTA) assert.equal(ls.getItem(k), null, k);
  // não toca no resto (a sessão é o auth.ts que a gere)
  assert.deepEqual(ls.chaves(), ["hub_admin_email", "hub_session"]);
  // nunca falha, mesmo sem armazém ou com um que dá erro
  apagarDadosMotorista(null);
  apagarDadosMotorista({ removeItem() { throw new Error("bloqueado"); } });
});

test("nome do login fora da lista: «Peça ajuda à gestão», nunca outro nome", () => {
  const r = resolverIdentidade(sessao("Rui Desconhecido"), LISTA, false, AGORA);
  assert.deepEqual(r, { estado: "pede_ajuda", nome: "Rui Desconhecido" });
  // não há nenhum estado que deixe escolher: os estados possíveis são estes
  const estados = new Set([
    resolverIdentidade(null, LISTA, false, AGORA).estado,
    resolverIdentidade(sessao("Tomé Inventado"), null, false, AGORA).estado,
    resolverIdentidade(sessao("Tomé Inventado"), null, true, AGORA).estado,
    resolverIdentidade(sessao("Rui Desconhecido"), LISTA, false, AGORA).estado,
    resolverIdentidade(sessao("Tomé Inventado"), LISTA, false, AGORA).estado,
  ]);
  assert.deepEqual([...estados].sort(), ["a_confirmar", "login", "ok", "pede_ajuda", "sem_ligacao"]);
});

test("a lista só confirma o próprio nome (acentos e maiúsculas à parte)", () => {
  assert.equal(nomeOficial("tome  INVENTADO", LISTA), "Tomé Inventado");
  assert.equal(nomeOficial("Úrsula exemplo", LISTA), "Úrsula Exemplo");
  assert.equal(nomeOficial("Tomé", LISTA), null);
  assert.equal(nomeOficial("", LISTA), null);
  assert.equal(nomeOficial("Tomé Inventado", []), null);
  const r = resolverIdentidade(sessao("tome inventado"), LISTA, false, AGORA);
  assert.equal(r.nome, "Tomé Inventado");
});

test("lista indisponível: nunca mostra viagens", () => {
  assert.equal(resolverIdentidade(sessao("Tomé Inventado"), null, true, AGORA).estado, "sem_ligacao");
  assert.equal(resolverIdentidade(sessao("Tomé Inventado"), null, false, AGORA).estado, "a_confirmar");
});

test("sessão nova: 7 dias para o motorista; gestão, hotéis e restaurantes como hoje", () => {
  const OITO_HORAS = 8 * HORA; // o SESSION_TTL do auth.ts
  assert.equal(SESSAO_MOTORISTA_MS, 7 * 24 * HORA);
  assert.equal(prazoSessaoNova("driver", AGORA, OITO_HORAS), AGORA + 7 * 24 * HORA);
  for (const papel of ["admin", "hotel", "restaurante", "", undefined]) {
    assert.equal(prazoSessaoNova(papel, AGORA, OITO_HORAS), AGORA + OITO_HORAS, String(papel));
  }
});

test("sessão de 7 dias com crachá de 12 h: vale o prazo mais curto; com crachá de 7 dias, os 7 dias", () => {
  const s12 = sessao("Tomé Inventado", { expiresAt: prazoSessaoNova("driver", AGORA, 8 * HORA) });
  assert.equal(motoristaDaSessao(s12, AGORA).prazo, AGORA + 12 * HORA);
  assert.equal(resolverIdentidade(s12, LISTA, false, AGORA + 12 * HORA).estado, "login");
  const s7d = sessao("Tomé Inventado", {
    expiresAt: prazoSessaoNova("driver", AGORA, 8 * HORA),
    cracha: crachaFalso({ q: "Tomé Inventado", e: AGORA + 7 * 24 * HORA }),
  });
  assert.equal(resolverIdentidade(s7d, LISTA, false, AGORA + 6 * 24 * HORA).estado, "ok");
  assert.equal(resolverIdentidade(s7d, LISTA, false, AGORA + 7 * 24 * HORA).estado, "login");
});

test("o HUB-Central recusa o crachá: { ok: false, motivo: \"sessao\" }", () => {
  assert.equal(crachaRecusado({ ok: false, motivo: "sessao" }), true);
  // tudo o resto não é recusa da sessão
  assert.equal(crachaRecusado({ ok: false, motivo: "erro ao ler as viagens" }), false);
  assert.equal(crachaRecusado({ ok: true, motivo: "sessao" }), false);
  assert.equal(crachaRecusado({ viagens: [{ id: "VIAGEM-INVENTADA-2" }] }), false);
  assert.equal(crachaRecusado([{ ok: false, motivo: "sessao" }]), false);
  assert.equal(crachaRecusado(null), false);
  assert.equal(crachaRecusado("sessao"), false);
  const e = new SessaoRecusadaErro();
  assert.ok(e instanceof Error);
  assert.equal(e.name, "SessaoRecusadaErro");
});

test("crachá recusado: a sessão e os dados do motorista apagam-se e a app volta à senha", () => {
  // o que a página faz ao receber a recusa: clearSession (sessão + dados) → /login
  const ls = armazem({ hub_session: JSON.stringify(sessao("Tomé Inventado")), hub_trips_cache: "{}", hub_driver_last_sync: "10:00" });
  assert.equal(crachaRecusado({ ok: false, motivo: "sessao" }), true);
  ls.removeItem("hub_session");
  apagarDadosMotorista(ls);
  assert.deepEqual(ls.chaves(), []);
  // e sem sessão o estado é «login»
  assert.equal(resolverIdentidade(null, LISTA, false, AGORA).estado, "login");
});

// ── 23/11 (tarde): os botões e a mudança de senha ──

/** Um alvo de eventos que conta quantas vezes a recusa foi avisada. */
function alvoQueConta() {
  const t = new EventTarget();
  let n = 0;
  t.addEventListener(EVENTO_SESSAO_RECUSADA, () => { n++; });
  return { t, vezes: () => n };
}

test("cada botão com a sessão recusada avisa a página (e não pode dizer que deu certo)", () => {
  // respostas inventadas dos pedidos: estados da viagem, no-show, dar baixa,
  // mensagem enviada, registerNoShow e alterarSenha
  const botoes = ["updateDriverStatus", "marcarNoShow", "completar", "motoristaMandouMsg", "registerNoShow", "alterarSenha"];
  for (const acao of botoes) {
    const a = alvoQueConta();
    const recusa = { ok: false, success: false, motivo: "sessao", message: "sessão inválida (" + acao + ")" };
    assert.equal(avisarSeRecusada(recusa, a.t), true, acao);
    assert.equal(a.vezes(), 1, acao);
  }
});

test("as respostas normais e os outros erros não fazem voltar à senha", () => {
  const a = alvoQueConta();
  for (const r of [
    { success: true },
    { success: false, error: "Senha actual incorrecta" },
    { ok: false, success: false, motivo: "outro_motorista" },
    { ok: false, motivo: "so_gestao" },
    null,
    undefined,
    "texto",
    [],
  ]) {
    assert.equal(avisarSeRecusada(r, a.t), false);
  }
  assert.equal(a.vezes(), 0);
  // sem window nem alvo (como no servidor), também não falha
  assert.equal(avisarSeRecusada({ ok: false, motivo: "sessao" }, null), true);
});

test("alterarSenha: o crachá novo só vem com a senha mudada e de um motorista", () => {
  const novo = crachaFalso({ q: "Tomé Inventado", e: AGORA + 7 * 24 * HORA });
  assert.equal(crachaNovoDaSenha({ success: true, message: "ok", cracha: novo }), novo);
  assert.equal(crachaNovoDaSenha({ success: true, message: "ok" }), null);          // sem crachá: fica o antigo
  assert.equal(crachaNovoDaSenha({ success: false, cracha: novo }), null);          // a senha não mudou
  assert.equal(crachaNovoDaSenha({ success: true, cracha: "ilegivel" }), null);
  assert.equal(crachaNovoDaSenha({ success: true, cracha: crachaFalso({ q: "Hotel Inventado", p: "hotel" }) }), null);
  assert.equal(crachaNovoDaSenha(null), null);
});

test("alterarSenha: o crachá novo fica na sessão e o motorista continua dentro", () => {
  const antiga = sessao("Tomé Inventado", { expiresAt: AGORA + 7 * 24 * HORA });
  const ls = armazem({ hub_session: JSON.stringify(antiga) });
  const novo = crachaFalso({ q: "Tomé Inventado", e: AGORA + 7 * 24 * HORA, g: "2" });
  assert.equal(guardarCrachaNovo(ls, novo), true);
  const s = JSON.parse(ls.getItem("hub_session"));
  assert.equal(s.cracha, novo);
  assert.equal(s.name, "Tomé Inventado");
  assert.equal(s.role, "driver");
  assert.equal(s.expiresAt, antiga.expiresAt);        // o prazo da sessão não muda
  assert.equal(resolverIdentidade(s, LISTA, false, AGORA + 3 * 24 * HORA).estado, "ok");
});

test("alterarSenha: nunca guarda o crachá de outro nem numa sessão que não é de motorista", () => {
  const ls = armazem({ hub_session: JSON.stringify(sessao("Tomé Inventado")) });
  const antes = ls.getItem("hub_session");
  assert.equal(guardarCrachaNovo(ls, crachaFalso({ q: "Xavier Fictício" })), false);
  assert.equal(guardarCrachaNovo(ls, "ilegivel"), false);
  assert.equal(ls.getItem("hub_session"), antes);
  const gestao = armazem({ hub_session: JSON.stringify({ name: "Gestão Inventada", role: "admin", cracha: "x.y" }) });
  assert.equal(guardarCrachaNovo(gestao, crachaFalso({ q: "Gestão Inventada" })), false);
  assert.equal(guardarCrachaNovo(armazem({}), crachaFalso({ q: "Tomé Inventado" })), false);
  assert.equal(guardarCrachaNovo(null, crachaFalso({ q: "Tomé Inventado" })), false);
});
