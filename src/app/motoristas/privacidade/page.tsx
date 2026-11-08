import type { Metadata } from "next";
import Link from "next/link";
import PreferenciasCookies from "../_components/PreferenciasCookies";

/* Aviso de privacidade da candidatura de motoristas (/motoristas), feito a partir do da /inverno.
   A política geral do site (/privacidade) não muda. Texto a rever por quem trata do RGPD na HUB antes de publicar.
   ATENÇÃO: o prazo das fotos está por preencher (marcado a amarelo) — não publicar assim. */

export const metadata: Metadata = {
  title: "Privacidade — candidatura de motoristas | HUB Transfer",
  robots: { index: false },
};

export default function PrivacidadeMotoristas() {
  return (
    <main className="mot-wrap mot-legal">
      <p>
        <Link href="/motoristas" className="mot-legal-voltar">
          ← Voltar à candidatura
        </Link>
      </p>
      <h1>Privacidade na candidatura de motoristas</h1>
      <p>Última atualização: novembro de 2026.</p>

      <h2>Quem trata os teus dados</h2>
      <p>
        Jornadas e Possibilidades, Unipessoal Lda (HUB Transfer), NIF PT518649903, Lisboa, Portugal. Contacto:{" "}
        <a href="mailto:contacto@hubtransfer.pt">contacto@hubtransfer.pt</a>.
      </p>

      <h2>Que dados pedimos</h2>
      <ul>
        <li>Passo 1: nome, número de WhatsApp e concelho onde moras.</li>
        <li>
          Passo 2: em que aeroporto queres trabalhar (Lisboa, Porto ou Faro); se tens carro (próprio, alugado ou de frota), a marca, o modelo, o ano e os lugares; se tens carta há mais
          de um ano; se já fazes transfers ou trabalhas no aeroporto; se tens outro trabalho ou negócio; se falas inglês; se
          procuras part-time ou full-time e os turnos em que estás livre.
        </li>
        <li>Duas fotos do carro: o carro inteiro, de lado, e a bagageira aberta.</li>
      </ul>
      <p>Não pedimos idade, nacionalidade, origem, género nem situação de imigração.</p>

      <h2>Para que servem</h2>
      <p>
        Só para analisarmos a tua candidatura, te contactarmos sobre ela e, se fores selecionado, marcarmos uma entrevista.
        Não vendemos nem cedemos os teus dados a ninguém para fins comerciais.
      </p>

      <h2>As fotos do carro</h2>
      <ul>
        <li>
          <strong>Para que servem:</strong> para vermos o estado do carro e o espaço da bagageira, que tem de levar as malas
          dos clientes. Não as usamos para mais nada nem as publicamos.
        </li>
        <li>
          <strong>Quem as vê:</strong> só a equipa da HUB Transfer que trata das contratações. Ficam numa pasta privada do
          Google Drive da HUB, sem link público.
        </li>
        <li>
          <strong>Quanto tempo ficam guardadas:</strong> As fotos e os dados de quem não for contratado são apagados ao
          fim de 12 meses. De quem entrar na equipa, guardam-se enquanto trabalhar com a HUB Transfer. Se pedires,
          apagamo-los antes.
        </li>
      </ul>

      <h2>Com que fundamento</h2>
      <p>
        O teu consentimento, dado na caixa do formulário, e as diligências que pedes antes de uma eventual colaboração.
        Podes retirar o consentimento a qualquer momento, sem afetar o que já foi feito antes.
      </p>

      <h2>Quanto tempo guardamos os outros dados</h2>
      <p>
        Até 12 meses depois da candidatura, ou menos se pedires para os apagarmos. Se ficares em lista de espera, é durante
        esse tempo que te podemos voltar a contactar. Se passares a colaborar connosco, os dados passam a seguir as regras
        dessa colaboração.
      </p>

      <h2>Quem mais tem acesso</h2>
      <ul>
        <li>Google (folha de cálculo, Google Drive onde ficam as fotos, e e-mail).</li>
        <li>Vercel (alojamento deste site).</li>
        <li>Z-API (serviço que nos envia o aviso de cada candidatura por WhatsApp).</li>
        <li>Meta (Facebook e Instagram), só se aceitares os cookies; ver abaixo.</li>
      </ul>
      <p>
        Alguns destes prestadores podem tratar dados fora do Espaço Económico Europeu, com as garantias previstas no
        RGPD.
      </p>

      <h2>Cookies desta página</h2>
      <p>
        Se aceitares, usamos o pixel da Meta e a API de Conversões para saber que anúncios trazem motoristas até aqui:
        regista a visita à página, o envio do passo 1 e o envio da candidatura completa. Quando envias o passo 1, o teu
        telefone, o primeiro nome e o concelho são enviados à Meta de forma cifrada (hash), só para ligar a candidatura ao
        anúncio. As fotos e as respostas da ficha nunca são enviadas à Meta. Se recusares, nada disto é carregado nem
        enviado, e a candidatura funciona igual.
      </p>
      <p>
        Guardamos a tua escolha no teu navegador. Podes mudá-la quando quiseres: <PreferenciasCookies />.
      </p>

      <h2>Os teus direitos</h2>
      <p>
        Podes pedir para ver, corrigir ou apagar os teus dados e as fotos, limitar ou opor-te ao tratamento, ou receber uma
        cópia, escrevendo para <a href="mailto:contacto@hubtransfer.pt">contacto@hubtransfer.pt</a>. Se achares que os teus
        dados não foram bem tratados, podes apresentar reclamação à Comissão Nacional de Proteção de Dados (
        <a href="https://www.cnpd.pt" target="_blank" rel="noopener noreferrer">
          www.cnpd.pt
        </a>
        ).
      </p>

      <p style={{ marginTop: 32 }}>
        A política de privacidade geral do site está em <Link href="/privacidade">hubtransfer.pt/privacidade</Link>.
      </p>
      <div style={{ height: 120 }} />
    </main>
  );
}
