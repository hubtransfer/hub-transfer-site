// Testes do rótulo do cartão (src/lib/rotuloViagem.ts). Dados inventados.
// Correr: node --test tests/rotulo-viagem.test.mjs
// (o Node 24 lê o .ts directamente; não precisa de build nem de bibliotecas)
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  rotuloMotorista,
  rotuloGestor,
  tipoNoCartao,
  categoriaVisivel,
} from "../src/lib/rotuloViagem.ts";

// Códigos (sourceLabel / platformCode) e nomes das operadoras
const OPERADORAS = [
  { codigo: "HEY", nome: "Heycars", ref: "HEY - 7731" },
  { codigo: "TLX", nome: "Talixo", ref: "Talixo - 48931" },
  { codigo: "TALIXO", nome: "Talixo", ref: "TLX-48931" },
  { codigo: "WT", nome: "World Transfer", ref: "WT - 5520" },
  { codigo: "LIOZ", nome: "Lioz", ref: "LIOZ - 118" },
  { codigo: "ELH", nome: "Empire Lisbon", ref: "ELH-0042" },
  { codigo: "EMH", nome: "Empire Marques", ref: "EMH-0007" },
  { codigo: "GDA", nome: "Gota d'Água", ref: "GDA-0003" },
  { codigo: "HUB", nome: "HUB", ref: "HUB-0101" },
];

test("chegada, partida e sem aeroporto — motorista", () => {
  assert.equal(rotuloMotorista({ tipo: "CHEGADA", categoriaNome: "MPV" }), "CHEGADA · MPV");
  assert.equal(rotuloMotorista({ tipo: "RECOLHA", categoriaNome: "Sedan" }), "PARTIDA · Sedan");
  assert.equal(rotuloMotorista({ tipo: "TRANSFER", categoriaNome: "Sedan" }), "TRANSFER · Sedan");
  assert.equal(rotuloMotorista({ tipo: "CHEGADA", categoriaNome: "Business" }), "CHEGADA · Business");
  assert.equal(rotuloMotorista({ tipo: "RECOLHA", categoriaNome: "Luxo" }), "PARTIDA · Luxo");
});

test("chegada, partida e sem aeroporto — gestor", () => {
  assert.equal(rotuloGestor({ tipo: "CHEGADA", categoriaNome: "MPV", operadora: "HEY" }), "HEY · CHEGADA · MPV");
  assert.equal(rotuloGestor({ tipo: "RECOLHA", categoriaNome: "Sedan", operadora: "TLX" }), "TLX · PARTIDA · Sedan");
  assert.equal(rotuloGestor({ tipo: "TRANSFER", categoriaNome: "Sedan", operadora: "wt" }), "WT · TRANSFER · Sedan");
});

test("sem categoriaNome: motorista só o tipo, gestor operadora e tipo", () => {
  for (const vazio of [undefined, null, "", "   "]) {
    assert.equal(rotuloMotorista({ tipo: "CHEGADA", categoriaNome: vazio }), "CHEGADA");
    assert.equal(rotuloGestor({ tipo: "CHEGADA", categoriaNome: vazio, operadora: "HEY" }), "HEY · CHEGADA");
  }
  assert.equal(rotuloMotorista({ tipo: "RECOLHA" }), "PARTIDA");
  assert.equal(rotuloGestor({ tipo: "RECOLHA", operadora: "" }), "PARTIDA");
});

test("tipo no cartão: só a RECOLHA muda", () => {
  assert.equal(tipoNoCartao("RECOLHA"), "PARTIDA");
  assert.equal(tipoNoCartao("recolha"), "PARTIDA");
  for (const t of ["CHEGADA", "TRANSFER", "TOUR", "RESTAURANTE"]) assert.equal(tipoNoCartao(t), t);
});

test("categoria: nomes conhecidos, escrita normalizada, valores estranhos fora", () => {
  assert.equal(categoriaVisivel("mpv"), "MPV");
  assert.equal(categoriaVisivel(" sedan "), "Sedan");
  assert.equal(categoriaVisivel("NORMAL"), "");   // o código não é o nome a mostrar
  assert.equal(categoriaVisivel("Talixo"), "");
  assert.equal(categoriaVisivel("HEY - 7731"), "");
});

test("cada operadora: o rótulo do motorista nunca tem código, nome nem referência", () => {
  const tipos = ["CHEGADA", "RECOLHA", "TRANSFER", "TOUR", "RESTAURANTE"];
  const cats = ["Sedan", "MPV", "Business", "Luxo", "", undefined];
  for (const op of OPERADORAS) {
    // Até com a categoria estragada pelo backend (a operadora ou a referência no campo)
    for (const cat of [...cats, op.codigo, op.nome, op.ref]) {
      for (const tipo of tipos) {
        const r = rotuloMotorista({ tipo, categoriaNome: cat, operadora: op.codigo });
        const palavras = r.split(/[\s·]+/).filter(Boolean);
        assert.ok(!palavras.includes(op.codigo), `«${r}» tem o código ${op.codigo}`);
        assert.ok(!r.toLowerCase().includes(op.nome.toLowerCase()), `«${r}» tem o nome ${op.nome}`);
        assert.ok(!r.includes(op.ref), `«${r}» tem a referência ${op.ref}`);
      }
    }
    // O gestor vê-a
    const g = rotuloGestor({ tipo: "CHEGADA", categoriaNome: "MPV", operadora: op.codigo });
    assert.equal(g, `${op.codigo} · CHEGADA · MPV`);
  }
});
