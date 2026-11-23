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
