import Image from "next/image";

export default function TermosPage() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#D0D0D0]">
      <header className="border-b border-[#2A2A2A] px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <a href="/"><Image src="/images/logo.png" alt="HUB Transfer" width={140} height={40} className="h-9 w-auto" /></a>
          <a href="/" className="text-xs text-[#888] hover:text-[#D4A017] font-mono transition-colors">← Voltar</a>
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-6 py-12 space-y-8 text-sm leading-relaxed">
        <h1 className="text-2xl font-bold text-white">Termos e Condições</h1>
        <p className="text-[#888] text-xs font-mono">Ultima actualização: Abril 2026</p>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-white">1. Identificação do prestador</h2>
          <p><strong className="text-white">Jornadas e Possibilidades, Unipessoal Lda</strong><br />NIF: PT518649903<br />Registo Nacional de Agentes de Viagens e Turismo: <strong className="text-white">RNAVT 12529</strong><br />Licenciado pelo Turismo de Portugal<br />Lisboa, Portugal</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-white">2. Objecto</h2>
          <p>Os presentes termos regulam a prestação de serviços de transporte privado de passageiros (transfers) e circuitos turísticos pela HUB Transfer, operada pela Jornadas e Possibilidades, Unipessoal Lda.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-white">3. Reservas e confirmação</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>As reservas podem ser efectuadas através do website, WhatsApp, hotéis parceiros ou restaurantes parceiros.</li>
            <li>A reserva é confirmada apos resposta da HUB Transfer (via WhatsApp, email ou sistema do hotel).</li>
            <li>Os preços apresentados são fixos e finais — sem taxas ocultas.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-white">4. Cancelamento</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li><strong className="text-white">Gratuito</strong> ate 3 horas antes da hora de pickup.</li>
            <li>Cancelamentos com menos de 3 horas podem estar sujeitos a cobrança de 50% do valor.</li>
            <li>No-show (não comparência) sem aviso previo: cobrança total.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-white">5. Atrasos de voo</h2>
          <p>A HUB Transfer monitoriza os voos em tempo real. Em caso de atraso, o horario de pickup é automaticamente ajustado sem custo adicional. O motorista aguarda ate 60 minutos apos a aterragem.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-white">6. Pagamento</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>Métodos aceites: dinheiro, cartão (no veiculo) e transferência bancaria.</li>
            <li>O pagamento é efectuado conforme acordado na reserva (ao motorista, na recepção do hotel, ou antecipado).</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-white">7. Responsabilidade</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>Todos os veículos possuem seguro de responsabilidade civil obrigatorio.</li>
            <li>A HUB Transfer não se responsabiliza por atrasos causados por transito, condições meteorologicas adversas ou eventos de forca maior.</li>
            <li>A bagagem transportada e da responsabilidade do passageiro.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-white">8. Reclamações</h2>
          <p>As reclamações podem ser apresentadas por email para <a href="mailto:contacto@hubtransfer.pt" className="text-[#D4A017] hover:underline">contacto@hubtransfer.pt</a> ou atraves do <a href="https://www.livroreclamacoes.pt/" target="_blank" rel="noopener noreferrer" className="text-[#D4A017] hover:underline">Livro de Reclamações Online</a>.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-white">9. Foro competente</h2>
          <p>Para a resolução de litígios emergentes dos presentes termos, sera competente o foro da Comarca de Lisboa, com renuncia a qualquer outro.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-white">10. Legislação aplicavel</h2>
          <p>Os presentes termos são regidos pela legislação portuguesa, nomeadamente o Decreto-Lei n.º 17/2018, de 8 de Março (regime de acesso e exercício da actividade das agências de viagens e turismo).</p>
        </section>
      </main>
    </div>
  );
}
