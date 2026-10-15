"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { idsMeta, lerConsentimento, novoEventId, registarEvento } from "../_lib/medicao";
import QuizPasso2, { type RespostasPasso2 } from "./QuizPasso2";

/* Pré-inscrição em dois passos.
   Passo 1 guarda logo o contacto (nome, WhatsApp, concelho + consentimento).
   Passo 2 é um quiz de toques (carro, marca, modelo, ano, lugares, regime, turnos), enviado só no fim. Nunca se pergunta idade, nacionalidade, género nem situação de imigração. */

const CONCELHOS = [
  "Lisboa", "Amadora", "Sintra", "Oeiras", "Cascais", "Loures", "Odivelas", "Vila Franca de Xira", "Mafra",
  "Almada", "Seixal", "Barreiro", "Moita", "Montijo", "Alcochete", "Palmela", "Sesimbra", "Setúbal",
];


type Passo = 1 | 2 | 3;
type Erros = Partial<Record<"nome" | "whatsapp" | "concelho" | "consentimento" | "envio", string>>;

function digitos(v: string) {
  return v.replace(/\D/g, "");
}

async function enviar(corpo: Record<string, unknown>) {
  const r = await fetch("/api/inverno/inscricao", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...corpo, url: window.location.href, ...idsMeta() }),
  });
  if (!r.ok) throw new Error(String(r.status));
}

export default function InscricaoForm({ garantias }: { garantias: string[] }) {
  const [passo, setPasso] = useState<Passo>(1);
  const [nome, setNome] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [concelho, setConcelho] = useState("");
  const [consentimento, setConsentimento] = useState(false);
  const [erros, setErros] = useState<Erros>({});
  const [aEnviar, setAEnviar] = useState(false);
  const leadId = useRef<string>("");
  const topo = useRef<HTMLDivElement>(null);

  const primeiroNome = nome.trim().split(/\s+/)[0] || "";

  const irPara = (p: Passo) => {
    setPasso(p);
    requestAnimationFrame(() => topo.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  };

  async function submeterPasso1(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const hp = (e.currentTarget.elements.namedItem("empresa") as HTMLInputElement | null)?.value;
    const novos: Erros = {};
    if (nome.trim().length < 2) novos.nome = "Escreve o teu nome.";
    const d = digitos(whatsapp);
    if (d.length < 9 || d.length > 15) novos.whatsapp = "Escreve o número de WhatsApp completo, com o indicativo se não for português.";
    if (concelho.trim().length < 2) novos.concelho = "Escreve o concelho onde moras.";
    if (!consentimento) novos.consentimento = "Para te contactarmos, precisamos da tua autorização.";
    setErros(novos);
    if (Object.keys(novos).length) return;

    setAEnviar(true);
    leadId.current = leadId.current || novoEventId();
    const eventId = novoEventId();
    try {
      await enviar({
        passo: 1,
        leadId: leadId.current,
        eventId,
        nome: nome.trim(),
        whatsapp: whatsapp.trim(),
        concelho: concelho.trim(),
        consentimentoDados: true,
        consentimentoCookies: lerConsentimento() === "sim",
        empresa: hp || "",
      });
      registarEvento("Lead", eventId);
      irPara(2);
    } catch {
      setErros({ envio: "Não conseguimos guardar os teus dados. Verifica a ligação à internet e tenta outra vez." });
    } finally {
      setAEnviar(false);
    }
  }

  async function concluirPasso2(r: RespostasPasso2) {
    setAEnviar(true);
    const eventId = novoEventId();
    try {
      await enviar({
        passo: 2,
        leadId: leadId.current,
        eventId,
        ...r,
        consentimentoCookies: lerConsentimento() === "sim",
      });
      registarEvento("CompleteRegistration", eventId);
    } catch {
      /* o contacto já ficou guardado no passo 1; seguimos para o fim na mesma */
    } finally {
      setAEnviar(false);
      irPara(3);
    }
  }

  return (
    <div className="inv-form-card" ref={topo}>
      {passo === 1 && (
        <form onSubmit={submeterPasso1} noValidate>
          <div className="inv-field">
            <label htmlFor="inv-nome">Nome</label>
            <input
              id="inv-nome"
              className="inv-input"
              autoComplete="name"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              aria-invalid={!!erros.nome}
              aria-describedby={erros.nome ? "inv-nome-erro" : undefined}
            />
            {erros.nome && <p id="inv-nome-erro" className="inv-error">{erros.nome}</p>}
          </div>

          <div className="inv-field">
            <label htmlFor="inv-whatsapp">WhatsApp</label>
            <input
              id="inv-whatsapp"
              className="inv-input"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="912 345 678"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              aria-invalid={!!erros.whatsapp}
              aria-describedby={erros.whatsapp ? "inv-whatsapp-erro" : undefined}
            />
            {erros.whatsapp && <p id="inv-whatsapp-erro" className="inv-error">{erros.whatsapp}</p>}
          </div>

          <div className="inv-field">
            <label htmlFor="inv-concelho">Concelho onde moras</label>
            <input
              id="inv-concelho"
              className="inv-input"
              list="inv-concelhos"
              autoComplete="address-level2"
              value={concelho}
              onChange={(e) => setConcelho(e.target.value)}
              aria-invalid={!!erros.concelho}
              aria-describedby={erros.concelho ? "inv-concelho-erro" : undefined}
            />
            <datalist id="inv-concelhos">
              {CONCELHOS.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
            {erros.concelho && <p id="inv-concelho-erro" className="inv-error">{erros.concelho}</p>}
          </div>

          {/* armadilha para robôs: invisível para pessoas */}
          <div className="inv-hp" aria-hidden="true">
            <label htmlFor="inv-empresa">Empresa</label>
            <input id="inv-empresa" name="empresa" tabIndex={-1} autoComplete="off" />
          </div>

          <label className="inv-check">
            <input
              type="checkbox"
              checked={consentimento}
              onChange={(e) => setConsentimento(e.target.checked)}
              aria-invalid={!!erros.consentimento}
            />
            <span>
              Autorizo a HUB Transfer a guardar estes dados e a contactar-me por WhatsApp ou telefone sobre esta
              inscrição. Li a <Link href="/inverno/privacidade">política de privacidade</Link>.
            </span>
          </label>
          {erros.consentimento && <p className="inv-error" style={{ marginTop: -10, marginBottom: 14 }}>{erros.consentimento}</p>}

          <ul className="inv-garantias">
            {garantias.map((g) => (
              <li key={g}>{g}</li>
            ))}
          </ul>

          <button type="submit" className="inv-btn" disabled={aEnviar}>
            {aEnviar ? "A guardar…" : "Quero o meu lugar na fila"}
          </button>
          {erros.envio && <p className="inv-error" role="alert">{erros.envio}</p>}
        </form>
      )}

      {passo === 2 && (
        <>
          <p className="inv-form-progress" role="status">
            O teu contacto já está guardado. Agora umas perguntas rápidas, só com toques.
          </p>
          <QuizPasso2 aEnviar={aEnviar} onConcluir={concluirPasso2} onSaltar={() => irPara(3)} />
        </>
      )}

      {passo === 3 && (
        <div className="inv-done" role="status">
          <h3 className="inv-display">Recebemos, {primeiroNome}.</h3>
          <p className="inv-text">Alguém da nossa equipa vai entrar em contacto contigo.</p>
        </div>
      )}
    </div>
  );
}
