# HUB 2.0 — Direção de Arte e Design

## Conceito
O site é a extensão pública da sala de controlo da HUB. Não vendemos carros bonitos; mostramos a operação que garante a chegada. Tudo no design deve parecer: precisão, monitorização, calma de quem controla. Referências de postura: Blacklane (sobriedade), Uber/Bolt (produto como imagem), Flighty (dados de voo como estética).

## Princípio inegociável
Mostrar, não afirmar. Prova social real ou nenhuma. Números reais ou nenhum número. Imagens: produto real, gráficos de marca, ou atmosfera — nunca stock como prova de frota, equipa ou clientes.

## Tokens (fonte única de verdade — CSS variables em globals.css)
--hub-black: #0A0A0A (fundo base)
--hub-graphite: #141414 (cards/superfícies)
--hub-line: #2A2A2A (bordas/divisores)
--hub-gold: #F0D030 (ação, destaque — valor atual de produção; NUNCA hardcodar dourado fora do token)
--hub-white: #EDEDED (texto principal)
--hub-muted: #9A9A9A (texto secundário)
--hub-dim: #7A7A7A (notas/rodapés)
Regra: zero hex hardcoded em componentes; tudo via token.

## Tipografia (papéis fixos)
- Display (Bodoni Moda): títulos de secção e momentos de marca. Com protagonismo — tamanhos generosos, tracking apertado.
- Corpo (Plus Jakarta Sans): tudo o resto.
- Mono (JetBrains Mono): EXCLUSIVO para dados operacionais — códigos de voo, horas, estados (ex: "TP 1234 · 14:35 · ATERROU"). O mono é a assinatura tipográfica da "sala de controlo": aparece pequeno, dourado ou muted, sempre que houver dado vivo.

## Assinatura visual
O FIO DE ROTA: uma linha dourada fina que representa voo→aeroporto→carro→destino. Vive no radar do hero e pode reaparecer discretamente como divisor temático entre secções-chave. É O elemento memorável; tudo o resto mantém-se quieto e disciplinado.

## Voz
PT-PT integral na versão portuguesa (norma do guia da empresa): connosco, stress, terminal, monitorizamos, "o seu". Proibido: você/a gente/estresse/saguão/monitoramos. Conceitos mantêm-se, registo muda — ex. hero: "O seu voo atrasa. Nós não."
Sem autoelogio, sem atacar concorrentes. Factos e provas.

## Sistema de imagem (sem fotografia própria)
1. PRODUTO REAL: capturas/recriações fiéis da interface do sistema (radar, ProgressBar de voo, SwipeBar) com DADOS DE DEMONSTRAÇÃO claramente fictícios — nomes inventados, voos genéricos. PROIBIDO usar dados, nomes ou viagens de clientes reais em qualquer imagem.
2. GRÁFICOS DE MARCA: SVG próprios — mapa estilizado de Lisboa, rotas, radar. Linha fina, dourado sobre escuro.
3. ATMOSFERA: stock/IA apenas para ambiente (Lisboa, aeroporto genérico), nunca em contexto que afirme "isto é nosso". Sempre WebP/AVIF otimizado.
4. FROTA: veículos apresentados como CATEGORIAS de serviço (Familiar/Executivo), com nota "veículo conforme disponibilidade da categoria". A Mercedes existe na operação e pode ilustrar a categoria Executivo.
5. OG IMAGE (a cara do site no WhatsApp): cartão de marca — fundo hub-black, logo HUB, tagline, "★ 5,0 no Google". Nunca foto de carro stock.

## Componentes — regras
- Cards: altura natural (items-start), não esticar ao mais alto da fila; cantos 2xl; borda --hub-line; fundo --hub-graphite.
- Animação: um reveal orquestrado por secção (padrão ScrollReveal existente), respeitando prefers-reduced-motion. Nada de efeitos espalhados.
- A11y como piso: contraste AA, focus-visible, aria-labels localizados.
- Formatação de dados sempre em mono.

## Fases da reforma (uma branch por fase; build+screenshots+revisão antes de merge)
F1 Fundação: tokens, voz PT-PT, limpeza de assets, OG de marca, alturas dos review-cards
F2 Hero: tipográfico + radar refinado como assinatura
F3 Tecnologia: secção com produto real (demo)
F4 Frota honesta por categorias
F5 Como funciona + Garantia (polish)
F6 FAQ anti-objeção + footer
