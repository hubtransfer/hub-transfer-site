import type { Metadata } from "next";
import Link from "next/link";
import PreferenciasCookies from "../_components/PreferenciasCookies";

/* Aviso de privacidade próprio da pré-inscrição de motoristas e dos cookies desta campanha.
   A política geral do site (/privacidade) não muda. Texto a rever por quem trata do RGPD na HUB antes de publicar. */

export const metadata: Metadata = {
  title: "Privacidade — inscrição de motoristas | HUB Transfer",
  robots: { index: false },
};

export default function PrivacidadeInverno() {
  return (
    <main className="inv-wrap inv-narrow inv-legal">
      <p>
        <Link href="/inverno">← Voltar à inscrição</Link>
      </p>
      <h1 className="inv-display">Privacidade na inscrição de motoristas</h1>
      <p>Última atualização: outubro de 2026.</p>

      <h2 className="inv-display">Quem trata os teus dados</h2>
      <p>
        Jornadas e Possibilidades, Unipessoal Lda (HUB Transfer), NIF PT518649903, Lisboa, Portugal. Contacto:{" "}
        <a href="mailto:contacto@hubtransfer.pt">contacto@hubtransfer.pt</a>.
      </p>

      <h2 className="inv-display">Que dados pedimos</h2>
      <ul>
        <li>Passo 1: nome, número de WhatsApp e concelho onde moras.</li>
        <li>Passo 2 (opcional): se preferes part-time ou full-time, se tens carro próprio, de frota ou nenhum, e os turnos em que estás livre.</li>
      </ul>
      <p>Não pedimos idade, nacionalidade, género nem situação de imigração.</p>

      <h2 className="inv-display">Para que servem</h2>
      <p>
        Só para te contactarmos sobre esta inscrição e para uma conversa sobre trabalhares connosco como motorista. Não
        vendemos nem cedemos os teus dados a ninguém para fins comerciais.
      </p>

      <h2 className="inv-display">Com que fundamento</h2>
      <p>
        O teu consentimento, dado na caixa do formulário, e as diligências que pedes antes de uma eventual colaboração.
        Podes retirar o consentimento a qualquer momento, sem afetar o que já foi feito antes.
      </p>

      <h2 className="inv-display">Quanto tempo os guardamos</h2>
      <p>
        Até 12 meses depois da inscrição, ou menos se pedires para os apagarmos. Se passares a colaborar connosco, os dados
        passam a seguir as regras dessa colaboração.
      </p>

      <h2 className="inv-display">Quem mais tem acesso</h2>
      <ul>
        <li>Google (folha de cálculo e e-mail onde as inscrições ficam guardadas).</li>
        <li>Vercel (alojamento deste site).</li>
        <li>Z-API (serviço que nos envia o aviso de cada inscrição por WhatsApp).</li>
        <li>Meta (Facebook e Instagram), só se aceitares os cookies; ver abaixo.</li>
      </ul>
      <p>
        Alguns destes prestadores podem tratar dados fora do Espaço Económico Europeu, com as garantias previstas no
        RGPD.
      </p>

      <h2 className="inv-display">Cookies desta página</h2>
      <p>
        Se aceitares, usamos o pixel da Meta e a API de Conversões para saber que anúncios trazem motoristas até aqui:
        regista a visita à página e se concluíste a inscrição. Quando envias o formulário, o teu telefone, o primeiro
        nome e o concelho são enviados à Meta de forma cifrada (hash), só para ligar a inscrição ao anúncio. Se recusares,
        nada disto é carregado nem enviado, e a inscrição funciona igual.
      </p>
      <p>
        Guardamos a tua escolha no teu navegador. Podes mudá-la quando quiseres: <PreferenciasCookies />.
      </p>

      <h2 className="inv-display">Os teus direitos</h2>
      <p>
        Podes pedir para ver, corrigir ou apagar os teus dados, limitar ou opor-te ao tratamento, ou receber uma cópia,
        escrevendo para <a href="mailto:contacto@hubtransfer.pt">contacto@hubtransfer.pt</a>. Se achares que os teus
        dados não foram bem tratados, podes apresentar reclamação à Comissão Nacional de Proteção de Dados (
        <a href="https://www.cnpd.pt" target="_blank" rel="noopener noreferrer">www.cnpd.pt</a>).
      </p>

      <p style={{ marginTop: 32 }}>
        A política de privacidade geral do site está em <Link href="/privacidade">hubtransfer.pt/privacidade</Link>.
      </p>
      <div style={{ height: 120 }} />
    </main>
  );
}
