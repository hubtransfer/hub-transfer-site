import Image from "next/image";

export default function PrivacidadePage() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#D0D0D0]">
      <header className="border-b border-[#2A2A2A] px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <a href="/"><Image src="/images/logo.png" alt="HUB Transfer" width={140} height={40} className="h-9 w-auto" /></a>
          <a href="/" className="text-xs text-[#888] hover:text-[#D4A017] font-mono transition-colors">← Voltar</a>
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-6 py-12 space-y-8 text-sm leading-relaxed">
        <h1 className="text-2xl font-bold text-white">Politica de Privacidade</h1>
        <p className="text-[#888] text-xs font-mono">Ultima actualização: Abril 2026</p>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-white">1. Responsavel pelo tratamento</h2>
          <p><strong className="text-white">Jornadas e Possibilidades, Unipessoal Lda</strong><br />NIF: PT518649903<br />Email: <a href="mailto:contacto@hubtransfer.pt" className="text-[#D4A017] hover:underline">contacto@hubtransfer.pt</a><br />Lisboa, Portugal</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-white">2. Dados recolhidos</h2>
          <p>No ambito da prestação dos nossos serviços de transfer, recolhemos os seguintes dados pessoais:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Nome completo</li>
            <li>Endereço de email</li>
            <li>Numero de telefone</li>
            <li>Dados de viagem (origem, destino, data, hora, numero de voo)</li>
            <li>Dados de pagamento (método seleccionado, sem dados de cartão)</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-white">3. Finalidade do tratamento</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>Gestão e execução de reservas de transfers</li>
            <li>Comunicação relativa ao serviço (confirmações, alterações, atrasos de voo)</li>
            <li>Facturação e contabilidade</li>
            <li>Cumprimento de obrigações legais (RNAVT, Turismo de Portugal)</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-white">4. Base legal</h2>
          <p>O tratamento de dados é efectuado com base na execução de contrato de prestação de serviços de transporte, no cumprimento de obrigações legais e, quando aplicavel, no consentimento do titular.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-white">5. Partilha de dados</h2>
          <p>Os dados pessoais podem ser partilhados com:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Motoristas parceiros (apenas nome, telefone e dados da viagem)</li>
            <li>Hotéis parceiros (quando a reserva é originada pelo hotel)</li>
            <li>Autoridades competentes (quando legalmente exigido)</li>
          </ul>
          <p>Não vendemos nem cedemos dados pessoais a terceiros para fins de marketing.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-white">6. Conservação dos dados</h2>
          <p>Os dados são conservados pelo período necessário à execução do serviço e cumprimento de obrigações legais, nomeadamente fiscais (mínimo 10 anos para dados de facturação).</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-white">7. Direitos do titular</h2>
          <p>Nos termos do Regulamento Geral sobre a Protecção de Dados (RGPD), o titular dos dados tem direito a:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li><strong className="text-white">Acesso</strong> aos seus dados pessoais</li>
            <li><strong className="text-white">Rectificação</strong> de dados incorrectos ou incompletos</li>
            <li><strong className="text-white">Eliminação</strong> dos dados (direito ao esquecimento)</li>
            <li><strong className="text-white">Limitação</strong> do tratamento</li>
            <li><strong className="text-white">Portabilidade</strong> dos dados</li>
            <li><strong className="text-white">Oposição</strong> ao tratamento</li>
          </ul>
          <p>Para exercer os seus direitos, contacte-nos através de <a href="mailto:contacto@hubtransfer.pt" className="text-[#D4A017] hover:underline">contacto@hubtransfer.pt</a>.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-white">8. Reclamações</h2>
          <p>Se considerar que o tratamento dos seus dados viola a legislação aplicavel, pode apresentar reclamação junto da Comissão Nacional de Protecção de Dados (CNPD) — <a href="https://www.cnpd.pt" target="_blank" rel="noopener noreferrer" className="text-[#D4A017] hover:underline">www.cnpd.pt</a>.</p>
        </section>
      </main>
    </div>
  );
}
