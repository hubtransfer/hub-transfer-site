export type LandingLang = 'PT' | 'EN' | 'ES' | 'FR' | 'IT';

export interface LandingTranslations {
  // Hero
  heroEyebrow: string;
  headline: string;
  headlineHighlight: string;
  subheadline: string;
  ctaBook: string;
  ctaSupport: string;
  heroRadarState1: string;
  heroRadarState2: string;
  heroRadarState3: string;

  // Partners
  partnersTitle: string;
  partnersDesc: string;

  // Pain
  painTitle: string;
  painDesc: string;
  painSubtext: string;

  // Algorithm / How it works
  algoTitle: string;
  algoDesc: string;
  algoFeature1: string;
  algoFeature2: string;
  algoFeature3: string;

  // Fleet
  fleetEyebrow: string;
  fleetTitle: string;
  fleetDesc: string;
  fleetFeature1: string;
  fleetFeature2: string;
  fleetFeature3: string;
  // Service categories (Fase 4)
  catLabel: string;
  cat1Title: string;
  cat1Line: string;
  cat1Cap: string;
  cat2Title: string;
  cat2Line: string;
  cat2Cap: string;
  cat3Title: string;
  cat3Line: string;
  cat3Cap: string;
  toursLine: string;
  fleetFootnote: string;
  pax7Marker: string;

  // Why it works (4 reasons)
  whyTitle: string;
  whyDesc: string;
  whyReason1Title: string;
  whyReason1Desc: string;
  whyReason2Title: string;
  whyReason2Desc: string;
  whyReason3Title: string;
  whyReason3Desc: string;
  whyReason4Title: string;
  whyReason4Desc: string;

  // Commitment block
  commitTitle: string;
  commitSub: string;

  // Guarantee
  guaranteeTitle: string;
  guaranteeDesc: string;
  guaranteeBadge: string;

  // CTA Final
  ctaFinalTitle: string;
  ctaFinalDesc: string;

  // Footer
  footer: string;

  // Partners carousel
  partnersLabel: string;

  // Section labels
  labelTech: string;
  techTitle: string;
  labelProblem: string;
  labelFleet: string;
  labelHow: string;
  labelWhyUs: string;

  // Steps
  step1Title: string;
  step1Desc: string;
  step2Title: string;
  step2Desc: string;
  step3Title: string;
  step3Desc: string;

  // Stats strip (legacy)
  statClients: string;
  statPunctuality: string;
  statWait: string;
  statSupport: string;

  // Reviews section (real Google reviews)
  reviewsEyebrow: string;
  reviewsTitle: string;
  reviewsAggregate: string;      // "5,0 no Google"
  reviewsSeeAll: string;         // "Ver todas as avaliações →"
  reviewsFootnote: string;
  reviewTranslationLabel: string; // "Tradução"
  reviewStarsAria: string;        // "5 de 5 estrelas"
  reviewWrittenIn: string;        // prefixo "Avaliação escrita em"
  factsBar: string;               // faixa fina de factos verificáveis

  // Review objection labels (eyebrow dourado)
  reviewObjFeatured: string;
  reviewObjAirport: string;
  reviewObjRoundtrip: string;
  reviewObjSafe: string;
  reviewObjPunctual: string;

  // Guarantee badges
  badgePrice: string;
  badgePunctual: string;
  badgeCancel: string;
  badgeFlight: string;

  // Nav
  navHow: string;
  navWhy: string;
  navGuarantee: string;
  navBook: string;
}

export const LANDING_TRANSLATIONS: Record<LandingLang, LandingTranslations> = {
  PT: {
    // Hero
    heroEyebrow: 'MONITORIZAÇÃO ATIVA · LISBOA · PORTO · FARO',
    headline: 'O seu voo atrasa.',
    headlineHighlight: 'Nós não.',
    subheadline:
      'Enquanto outras empresas esperam que avise do atraso, o nosso sistema já reagendou o seu motorista. Desembarca e já lá estamos. Sem stress, sem esperas.',
    ctaBook: 'GARANTIR O MEU TRANSFER AGORA',
    ctaSupport: 'Leva menos de 2 minutos e fica logo tranquilo.',
    heroRadarState1: 'TP 1234 · GRU→LIS · A MONITORIZAR',
    heroRadarState2: 'ATERRAGEM PREVISTA · 14:35',
    heroRadarState3: 'MOTORISTA NOTIFICADO ✓',

    // Partners
    partnersTitle: 'Conectados a todos os sinais que cruzam o céu de Portugal.',
    partnersDesc:
      'O nosso Cérebro não olha para a bandeira do avião nem para o aeroporto de onde descolou. Liga-se diretamente ao sinal de radar de cada aeronave que se aproxima de Lisboa, Porto ou Faro. Se está a voar para Portugal, já está no nosso radar.',

    // Pain
    painTitle: 'Chegar a Lisboa não devia ser uma prova de resistência.',
    painDesc:
      'Cruzou fronteiras e só quer o conforto do seu destino. Não caia na "Lotaria do Desembarque": aquele momento em que descobre que o seu transfer foi embora e a sua única opção é uma fila de táxi à chuva.',
    painSubtext:
      'Na HUB, a sua paz de espírito não depende da sorte. Depende de tecnologia.',

    // Algorithm
    algoTitle: 'Não é magia, é monitorização.',
    algoDesc:
      'O nosso sistema comunica com o radar a cada 30 segundos. Enquanto está no ar, trabalhamos para garantir que a sua receção seja impecável, sem que precise de enviar uma única mensagem.',
    algoFeature1: 'Sincronização Aérea a cada 30 segundos',
    algoFeature2: 'Motorista notificado automaticamente',
    algoFeature3: 'Zero necessidade de enviar mensagens',

    // Fleet
    fleetEyebrow: 'O SERVIÇO',
    fleetTitle: 'A mesma tecnologia, do radar à estrada.',
    fleetDesc:
      'O sistema que monitoriza o seu voo é o mesmo que coordena o carro à sua espera. E no serviço executivo, a tecnologia entra no próprio carro: Tesla 100% elétrico — silencioso, confortável, sem emissões.',
    fleetFeature1: 'Pontualidade com garantia real',
    fleetFeature2: 'Monitorização de voo em tempo real',
    fleetFeature3: 'Suporte 24/7',
    catLabel: 'CATEGORIA',
    cat1Title: 'MPV',
    cat1Line: 'Espaço para a família e para as malas, do aeroporto ao destino.',
    cat1Cap: 'Até 4 passageiros + bagagem',
    cat2Title: 'Sedan',
    cat2Line: 'Conforto direto e discreto para viagens a dois ou três.',
    cat2Cap: 'Até 3 passageiros + bagagem',
    cat3Title: 'Sedan Executivo',
    cat3Line: 'Tesla 100% elétrico. Silencioso, pontual, discreto.',
    cat3Cap: 'Até 3 passageiros',
    toursLine: 'Tours Privados — Sintra e arredores de Lisboa ao seu ritmo, com motorista dedicado. Roteiro personalizado.',
    fleetFootnote: 'Veículo atribuído conforme a categoria reservada.',
    pax7Marker: '👥 Grupo de 7+ passageiros — pedido de orçamento',

    // Why
    whyTitle: 'Ou apertamos a sua mão, ou pagamos a conta.',
    whyDesc: 'A nossa confiança no algoritmo é absoluta.',
    whyReason1Title: 'Sincronização Aérea Profunda',
    whyReason1Desc:
      'Monitoriza o seu voo em tempo real: atrasos, mudanças de porta de embarque, aterragens antecipadas — tudo seguido automaticamente.',
    whyReason2Title: 'Motoristas Concierge',
    whyReason2Desc:
      'Não são apenas motoristas. São profissionais treinados para acolher. Conhecem cada rua de Lisboa, Porto e Faro.',
    whyReason3Title: 'Garantia HUB',
    whyReason3Desc:
      'Se falharmos, não paga. Devolvemos o seu dinheiro e pagamos o seu Uber.',
    whyReason4Title: 'Concierges Digitais 24/7',
    whyReason4Desc:
      'Tecnologia para garantir, humanos para acolher. A nossa central não é um bot frio; é uma equipa pronta a ajudar em segundos.',

    // Commitment block
    commitTitle: 'Ou apertamos a sua mão, ou pagamos a conta.',
    commitSub: 'O nosso compromisso, carimbado.',

    // Guarantee
    guaranteeTitle: 'Garantia HUB: Risco Zero',
    guaranteeDesc:
      'Ou apertamos a sua mão, ou pagamos o seu Uber e devolvemos o seu dinheiro.',
    guaranteeBadge: 'Garantia 100%',

    // CTA Final
    ctaFinalTitle:
      'O único passo entre o caos do aeroporto e o conforto do seu hotel.',
    ctaFinalDesc: 'Reserve em 2 minutos e deixe o resto com o nosso algoritmo.',

    // Footer
    footer: '© 2025 HUB Transfer. Tecnologia que garante.',

    // Partners carousel
    partnersLabel: 'Os nossos clientes chegam diariamente em voos de:',

    // Section labels
    labelTech: 'Tecnologia',
    techTitle: 'Sincronização aérea a cada 30 segundos.',
    labelProblem: 'O problema',
    labelFleet: 'Porquê nós',
    labelHow: 'Como funciona',
    labelWhyUs: 'Porquê nós',

    // Steps
    step1Title: 'Reserve em 2 minutos',
    step1Desc: 'Informe o seu voo e destino. Nós tratamos do resto.',
    step2Title: 'Monitorizamos o seu voo',
    step2Desc: 'O nosso sistema acompanha o seu voo em tempo real. Atrasos? Já sabemos.',
    step3Title: 'Motorista à sua espera',
    step3Desc: 'Desembarca e o seu motorista já está lá. Sem filas. Sem stress.',

    // Stats strip
    statClients: 'Clientes satisfeitos',
    statPunctuality: 'Pontualidade',
    statWait: 'Tempo de espera',
    statSupport: 'Suporte disponível',

    // Reviews section
    reviewsEyebrow: 'AVALIAÇÕES REAIS',
    reviewsTitle: 'Clientes que já chegaram connosco',
    reviewsAggregate: '5,0 no Google',
    reviewsSeeAll: 'Ver todas as avaliações →',
    reviewsFootnote: 'Avaliações verificadas, publicadas no Google. Exibidas na língua original do cliente.',
    reviewTranslationLabel: 'Tradução',
    reviewStarsAria: '5 de 5 estrelas',
    reviewWrittenIn: 'Avaliação escrita em',
    factsBar: '★ 5,0 no Google · Licença RNAVT 12529 · Seguro de passageiros',

    // Review objection labels
    reviewObjFeatured: 'O VOO ATRASOU. O MOTORISTA ESTAVA LÁ.',
    reviewObjAirport: 'ENCONTRO NO AEROPORTO',
    reviewObjRoundtrip: 'IDA E VOLTA, SEM STRESS',
    reviewObjSafe: 'CONDUÇÃO SEGURA',
    reviewObjPunctual: 'PONTUALIDADE',

    // Guarantee badges
    badgePrice: 'Preço fixo',
    badgePunctual: 'Sempre pontual',
    badgeCancel: 'Cancelamento grátis até 3h antes',
    badgeFlight: 'Voo monitorizado',

    // Nav
    navHow: 'Como Funciona',
    navWhy: 'Porquê Nós',
    navGuarantee: 'Garantia',
    navBook: 'Reservar',
  },

  EN: {
    // Hero
    heroEyebrow: 'LIVE MONITORING · LISBON · PORTO · FARO',
    headline: 'Flights delay.',
    headlineHighlight: "We don't.",
    subheadline:
      'Our system tracks your flight in real-time. If the schedule changes, we handle everything automatically. You land, and we\'re already there waiting.',
    ctaBook: 'Book my stress-free ride',
    ctaSupport: 'Instant confirmation. We track your flight.',
    heroRadarState1: 'TP 1234 · GRU→LIS · MONITORING',
    heroRadarState2: 'LANDING EXPECTED · 14:35',
    heroRadarState3: 'DRIVER NOTIFIED ✓',

    // Partners
    partnersTitle: 'Connected to every signal crossing Portugal\'s skies.',
    partnersDesc:
      'Our Brain doesn\'t look at the airline logo or where you took off from. It connects directly to the radar signal of every aircraft approaching Lisbon, Porto or Faro. If you\'re flying to Portugal, you\'re already on our radar.',

    // Pain
    painTitle: 'The Chaos of Taxi Queues',
    painDesc:
      'You just landed. You\'re tired. You want to go home. But there are 200 people in the taxi queue waiting 45 minutes.',
    painSubtext: 'This doesn\'t happen with HUB Transfer.',

    // Algorithm
    algoTitle: 'HUB Brain: Technology that Guarantees',
    algoDesc:
      'Our system tracks your flight in real-time. If the schedule changes, we handle everything automatically. You land, and we\'re already there waiting.',
    algoFeature1: 'Flight synchronisation every 30 seconds',
    algoFeature2: 'Driver notified automatically',
    algoFeature3: 'Zero need for you to send messages',

    // Fleet
    fleetEyebrow: 'THE SERVICE',
    fleetTitle: 'The same technology, from radar to road.',
    fleetDesc:
      'The system tracking your flight is the same one coordinating the car waiting for you. And in our executive service, the technology extends to the car itself: a 100% electric Tesla — quiet, comfortable, zero emissions.',
    fleetFeature1: 'Punctuality with a real guarantee',
    fleetFeature2: 'Real-time flight monitoring',
    fleetFeature3: '24/7 Support',
    catLabel: 'CATEGORY',
    cat1Title: 'MPV',
    cat1Line: 'Room for the family and the luggage, from airport to destination.',
    cat1Cap: 'Up to 4 passengers + luggage',
    cat2Title: 'Sedan',
    cat2Line: 'Straightforward, discreet comfort for two or three.',
    cat2Cap: 'Up to 3 passengers + luggage',
    cat3Title: 'Executive Sedan',
    cat3Line: '100% electric Tesla. Quiet, punctual, discreet.',
    cat3Cap: 'Up to 3 passengers',
    toursLine: 'Private Tours — Sintra and the Lisbon area at your own pace, with a dedicated driver. Custom itinerary.',
    fleetFootnote: 'Vehicle assigned according to the booked category.',
    pax7Marker: '👥 Group of 7+ passengers — quote request',

    // Why
    whyTitle: 'Why It Works',
    whyDesc:
      'It\'s not magic. It\'s technology, precision and commitment to you.',
    whyReason1Title: 'Smart Algorithm',
    whyReason1Desc:
      'Tracks your flight in real time: delays, gate changes, early landings — everything followed automatically.',
    whyReason2Title: 'Trained Drivers',
    whyReason2Desc:
      'Every driver receives premium training. They know every street in Lisbon, Porto and Faro.',
    whyReason3Title: 'Trust Guarantee',
    whyReason3Desc:
      'If we fail, you don\'t pay. Simple. Your satisfaction is our commitment.',
    whyReason4Title: '24/7 Support',
    whyReason4Desc:
      'Team available anytime. Problem? We solve it in minutes, not hours.',

    // Commitment block
    commitTitle: 'We shake your hand, or we pay the bill.',
    commitSub: 'Our commitment, stamped.',

    // Guarantee
    guaranteeTitle: 'HUB Guarantee: Zero Risk',
    guaranteeDesc:
      'If the driver is more than 10 minutes late, the transfer is free and we pay your Uber.',
    guaranteeBadge: '100% Guarantee',

    // CTA Final
    ctaFinalTitle:
      'The only step between airport chaos and the comfort of your hotel.',
    ctaFinalDesc: 'Book in 2 minutes and let our algorithm handle the rest.',

    // Footer
    footer: '© 2025 HUB Transfer. Technology that guarantees.',

    // Partners carousel
    partnersLabel: 'Our guests arrive daily on flights with:',

    // Section labels
    labelTech: 'Technology',
    techTitle: 'Flight sync every 30 seconds.',
    labelProblem: 'The problem',
    labelFleet: 'Why us',
    labelHow: 'How it works',
    labelWhyUs: 'Why us',

    // Steps
    step1Title: 'Book in 2 minutes',
    step1Desc: 'Enter your flight and destination. We handle the rest.',
    step2Title: 'We track your flight',
    step2Desc: 'Our system follows your flight in real-time. Delays? We already know.',
    step3Title: 'Driver waiting for you',
    step3Desc: 'You land and your driver is already there. No queues. No stress.',

    // Stats strip
    statClients: 'Happy clients',
    statPunctuality: 'Punctuality',
    statWait: 'Wait time',
    statSupport: 'Support available',

    // Reviews section
    reviewsEyebrow: 'REAL REVIEWS',
    reviewsTitle: "Guests who've already arrived with us",
    reviewsAggregate: '5.0 on Google',
    reviewsSeeAll: 'See all reviews →',
    reviewsFootnote: "Verified reviews published on Google. Shown in each guest's original language.",
    reviewTranslationLabel: 'Translation',
    reviewStarsAria: '5 out of 5 stars',
    reviewWrittenIn: 'Review written in',
    factsBar: '★ 5.0 on Google · RNAVT License 12529 · Passenger insurance',

    // Review objection labels
    reviewObjFeatured: 'THE FLIGHT WAS DELAYED. THE DRIVER WAS THERE.',
    reviewObjAirport: 'MEETING AT THE AIRPORT',
    reviewObjRoundtrip: 'ROUND TRIP, STRESS-FREE',
    reviewObjSafe: 'SAFE DRIVING',
    reviewObjPunctual: 'PUNCTUALITY',

    // Guarantee badges
    badgePrice: 'Fixed price',
    badgePunctual: 'Always on time',
    badgeCancel: 'Free cancellation up to 3h before',
    badgeFlight: 'Flight tracked',

    // Nav
    navHow: 'How It Works',
    navWhy: 'Why Us',
    navGuarantee: 'Guarantee',
    navBook: 'Book Now',
  },

  ES: {
    // Hero
    heroEyebrow: 'MONITORIZACIÓN ACTIVA · LISBOA · OPORTO · FARO',
    headline: 'Tu vuelo se atrasa.',
    headlineHighlight: 'Nosotros no.',
    subheadline:
      'Nuestro sistema vigila tu vuelo en tiempo real. Si el horario cambia, ajustamos todo automáticamente para que nunca te quedes tirado. Tú aterrizas y nosotros ya estamos ahí.',
    ctaBook: 'Reservar mi transfer ahora',
    ctaSupport: 'Confirmación inmediata y sin esperas.',
    heroRadarState1: 'TP 1234 · GRU→LIS · MONITORIZANDO',
    heroRadarState2: 'ATERRIZAJE PREVISTO · 14:35',
    heroRadarState3: 'CONDUCTOR NOTIFICADO ✓',

    // Partners
    partnersTitle: 'Conectados a todas las señales que cruzan el cielo de Portugal.',
    partnersDesc:
      'Nuestro Cerebro no mira la bandera del avión ni el aeropuerto desde donde despegaste. Se conecta directamente a la señal de radar de cada aeronave que se acerca a Lisboa, Oporto o Faro. Si estás volando a Portugal, ya estás en nuestro radar.',

    // Pain
    painTitle: 'El Caos de las Colas de Taxis',
    painDesc:
      'Acabas de desembarcar. Estás cansado. Quieres ir a casa. Pero hay 200 personas en la cola de taxis esperando 45 minutos.',
    painSubtext: 'Esto no sucede con HUB Transfer.',

    // Algorithm
    algoTitle: 'Cerebro HUB: Tecnología que Garantiza',
    algoDesc:
      'Nuestro sistema vigila tu vuelo en tiempo real. Si el horario cambia, ajustamos todo automáticamente. Tú aterrizas y nosotros ya estamos ahí.',
    algoFeature1: 'Sincronización aérea cada 30 segundos',
    algoFeature2: 'Conductor notificado automáticamente',
    algoFeature3: 'Cero necesidad de enviar mensajes',

    // Fleet
    fleetEyebrow: 'EL SERVICIO',
    fleetTitle: 'La misma tecnología, del radar a la carretera.',
    fleetDesc:
      'El sistema que monitoriza su vuelo es el mismo que coordina el coche que le espera. Y en el servicio ejecutivo, la tecnología llega al propio coche: Tesla 100% eléctrico — silencioso, cómodo, sin emisiones.',
    fleetFeature1: 'Puntualidad con garantía real',
    fleetFeature2: 'Monitorización de vuelo en tiempo real',
    fleetFeature3: 'Soporte 24/7',
    catLabel: 'CATEGORÍA',
    cat1Title: 'MPV',
    cat1Line: 'Espacio para la familia y el equipaje, del aeropuerto al destino.',
    cat1Cap: 'Hasta 4 pasajeros + equipaje',
    cat2Title: 'Sedán',
    cat2Line: 'Confort directo y discreto para dos o tres.',
    cat2Cap: 'Hasta 3 pasajeros + equipaje',
    cat3Title: 'Sedán Ejecutivo',
    cat3Line: 'Tesla 100% eléctrico. Silencioso, puntual, discreto.',
    cat3Cap: 'Hasta 3 pasajeros',
    toursLine: 'Tours Privados — Sintra y los alrededores de Lisboa a su ritmo, con conductor dedicado. Itinerario personalizado.',
    fleetFootnote: 'Vehículo asignado según la categoría reservada.',
    pax7Marker: '👥 Grupo de 7+ pasajeros — solicitud de presupuesto',

    // Why
    whyTitle: 'Por Qué Funciona',
    whyDesc:
      'No es magia. Es tecnología, precisión y compromiso contigo.',
    whyReason1Title: 'Algoritmo Inteligente',
    whyReason1Desc:
      'Monitoriza su vuelo en tiempo real: retrasos, cambios de puerta de embarque, aterrizajes anticipados — todo seguido automáticamente.',
    whyReason2Title: 'Conductores Entrenados',
    whyReason2Desc:
      'Cada conductor recibe entrenamiento premium. Conocen cada calle de Lisboa, Oporto y Faro.',
    whyReason3Title: 'Garantía de Confianza',
    whyReason3Desc:
      'Si fallamos, no pagas. Así de simple. Tu satisfacción es nuestro compromiso.',
    whyReason4Title: 'Soporte 24/7',
    whyReason4Desc:
      'Equipo disponible en cualquier momento. ¿Problema? Lo resolvemos en minutos, no en horas.',

    // Commitment block
    commitTitle: 'O le damos la mano, o pagamos la cuenta.',
    commitSub: 'Nuestro compromiso, sellado.',

    // Guarantee
    guaranteeTitle: 'Garantía HUB: Riesgo Cero',
    guaranteeDesc:
      'Si el conductor se retrasa más de 10 minutos, el traslado es gratis y pagamos tu Uber.',
    guaranteeBadge: 'Garantía 100%',

    // CTA Final
    ctaFinalTitle:
      'El único paso entre el caos del aeropuerto y la comodidad de tu hotel.',
    ctaFinalDesc: 'Reserva en 2 minutos y deja el resto a nuestro algoritmo.',

    // Footer
    footer: '© 2025 HUB Transfer. Tecnología que garantiza.',

    // Partners carousel
    partnersLabel: 'Nuestros clientes llegan a diario en vuelos de:',

    // Section labels
    labelTech: 'Tecnología',
    techTitle: 'Sincronización aérea cada 30 segundos.',
    labelProblem: 'El problema',
    labelFleet: 'Por qué nosotros',
    labelHow: 'Cómo funciona',
    labelWhyUs: 'Por qué nosotros',

    // Steps
    step1Title: 'Reserva en 2 minutos',
    step1Desc: 'Indica tu vuelo y destino. Nosotros nos encargamos del resto.',
    step2Title: 'Monitorizamos tu vuelo',
    step2Desc: 'Nuestro sistema sigue tu vuelo en tiempo real. ¿Retrasos? Ya lo sabemos.',
    step3Title: 'Conductor esperándote',
    step3Desc: 'Aterrizas y tu conductor ya está ahí. Sin colas. Sin estrés.',

    // Stats strip
    statClients: 'Clientes satisfechos',
    statPunctuality: 'Puntualidad',
    statWait: 'Tiempo de espera',
    statSupport: 'Soporte disponible',

    // Reviews section
    reviewsEyebrow: 'RESEÑAS REALES',
    reviewsTitle: 'Clientes que ya llegaron con nosotros',
    reviewsAggregate: '5,0 en Google',
    reviewsSeeAll: 'Ver todas las reseñas →',
    reviewsFootnote: 'Reseñas verificadas publicadas en Google. Mostradas en el idioma original del cliente.',
    reviewTranslationLabel: 'Traducción',
    reviewStarsAria: '5 de 5 estrellas',
    reviewWrittenIn: 'Reseña escrita en',
    factsBar: '★ 5,0 en Google · Licencia RNAVT 12529 · Seguro de pasajeros',

    // Review objection labels
    reviewObjFeatured: 'EL VUELO SE RETRASÓ. EL CONDUCTOR ESTABA ALLÍ.',
    reviewObjAirport: 'ENCUENTRO EN EL AEROPUERTO',
    reviewObjRoundtrip: 'IDA Y VUELTA, SIN ESTRÉS',
    reviewObjSafe: 'CONDUCCIÓN SEGURA',
    reviewObjPunctual: 'PUNTUALIDAD',

    // Guarantee badges
    badgePrice: 'Precio fijo',
    badgePunctual: 'Siempre puntual',
    badgeCancel: 'Cancelación gratis hasta 3h antes',
    badgeFlight: 'Vuelo monitorizado',

    // Nav
    navHow: 'Cómo Funciona',
    navWhy: 'Por Qué Nosotros',
    navGuarantee: 'Garantía',
    navBook: 'Reservar',
  },

  FR: {
    // Hero
    heroEyebrow: 'SURVEILLANCE ACTIVE · LISBONNE · PORTO · FARO',
    headline: 'Votre vol est en retard.',
    headlineHighlight: 'Pas nous.',
    subheadline:
      "Notre système surveille votre vol en temps réel. Si l'horaire change, on ajuste tout automatiquement pour vous éviter l'attente. Vous atterrissez, on est déjà là.",
    ctaBook: 'Réserver mon transfert maintenant',
    ctaSupport: 'Confirmation immédiate. Sans stress.',
    heroRadarState1: 'TP 1234 · GRU→LIS · SURVEILLANCE',
    heroRadarState2: 'ATTERRISSAGE PRÉVU · 14:35',
    heroRadarState3: 'CHAUFFEUR NOTIFIÉ ✓',

    // Partners
    partnersTitle: 'Connectés à tous les signaux qui traversent le ciel du Portugal.',
    partnersDesc:
      "Notre Cerveau ne regarde pas le drapeau de l'avion ni l'aéroport d'où vous avez décollé. Il se connecte directement au signal radar de chaque aéronef qui s'approche de Lisbonne, Porto ou Faro. Si vous volez vers le Portugal, vous êtes déjà sur notre radar.",

    // Pain
    painTitle: 'Le Chaos des Files de Taxis',
    painDesc:
      'Vous venez de débarquer. Vous êtes fatigué. Vous voulez rentrer à la maison. Mais il y a 200 personnes dans la file de taxis attendant 45 minutes.',
    painSubtext: 'Cela ne se produit pas avec HUB Transfer.',

    // Algorithm
    algoTitle: 'Cerveau HUB: Technologie qui Garantit',
    algoDesc:
      "Notre système surveille votre vol en temps réel. Si l'horaire change, on ajuste tout automatiquement. Vous atterrissez, on est déjà là.",
    algoFeature1: 'Synchronisation aérienne toutes les 30 secondes',
    algoFeature2: 'Chauffeur notifié automatiquement',
    algoFeature3: 'Aucun besoin d\'envoyer des messages',

    // Fleet
    fleetEyebrow: 'LE SERVICE',
    fleetTitle: 'La même technologie, du radar à la route.',
    fleetDesc:
      "Le système qui suit votre vol est le même qui coordonne la voiture qui vous attend. Et pour le service executive, la technologie s'étend à la voiture elle-même : Tesla 100 % électrique — silencieuse, confortable, zéro émission.",
    fleetFeature1: 'Ponctualité avec une vraie garantie',
    fleetFeature2: 'Surveillance de vol en temps réel',
    fleetFeature3: 'Assistance 24h/24',
    catLabel: 'CATÉGORIE',
    cat1Title: 'Monospace',
    cat1Line: "De la place pour la famille et les bagages, de l'aéroport à destination.",
    cat1Cap: "Jusqu'à 4 passagers + bagages",
    cat2Title: 'Berline',
    cat2Line: 'Un confort simple et discret pour deux ou trois.',
    cat2Cap: "Jusqu'à 3 passagers + bagages",
    cat3Title: 'Berline Executive',
    cat3Line: 'Tesla 100 % électrique. Silencieuse, ponctuelle, discrète.',
    cat3Cap: "Jusqu'à 3 passagers",
    toursLine: 'Excursions Privées — Sintra et les environs de Lisbonne à votre rythme, avec chauffeur dédié. Itinéraire personnalisé.',
    fleetFootnote: 'Véhicule attribué selon la catégorie réservée.',
    pax7Marker: '👥 Groupe de 7+ passagers — demande de devis',

    // Why
    whyTitle: 'Pourquoi Ça Marche',
    whyDesc:
      "Ce n'est pas de la magie. C'est de la technologie, de la précision et un engagement envers vous.",
    whyReason1Title: 'Algorithme Intelligent',
    whyReason1Desc:
      'Suit votre vol en temps réel : retards, changements de porte d\'embarquement, atterrissages anticipés — tout est suivi automatiquement.',
    whyReason2Title: 'Conducteurs Formés',
    whyReason2Desc:
      'Chaque conducteur reçoit une formation premium. Ils connaissent chaque rue de Lisbonne, Porto et Faro.',
    whyReason3Title: 'Garantie de Confiance',
    whyReason3Desc:
      "Si nous échouons, vous ne payez pas. C'est aussi simple. Votre satisfaction est notre engagement.",
    whyReason4Title: 'Support 24/7',
    whyReason4Desc:
      'Équipe disponible à tout moment. Problème? On le résout en minutes, pas en heures.',

    // Commitment block
    commitTitle: "On vous serre la main, ou on paie l'addition.",
    commitSub: 'Notre engagement, tamponné.',

    // Guarantee
    guaranteeTitle: 'Garantie HUB: Zéro Risque',
    guaranteeDesc:
      'Si le conducteur a plus de 10 minutes de retard, le transfert est gratuit et nous payons votre Uber.',
    guaranteeBadge: 'Garantie 100%',

    // CTA Final
    ctaFinalTitle:
      "La seule étape entre le chaos de l'aéroport et le confort de votre hôtel.",
    ctaFinalDesc: 'Réservez en 2 minutes et laissez notre algorithme faire le reste.',

    // Footer
    footer: '© 2025 HUB Transfer. Technologie qui garantit.',

    // Partners carousel
    partnersLabel: 'Nos clients arrivent chaque jour sur des vols de :',

    // Section labels
    labelTech: 'Technologie',
    techTitle: 'Synchronisation aérienne toutes les 30 secondes.',
    labelProblem: 'Le problème',
    labelFleet: 'Pourquoi nous',
    labelHow: 'Comment ça marche',
    labelWhyUs: 'Pourquoi nous',

    // Steps
    step1Title: 'Réservez en 2 minutes',
    step1Desc: 'Indiquez votre vol et destination. Nous nous occupons du reste.',
    step2Title: 'Nous suivons votre vol',
    step2Desc: 'Notre système suit votre vol en temps réel. Retard ? Nous le savons déjà.',
    step3Title: 'Chauffeur à votre arrivée',
    step3Desc: 'Vous atterrissez et votre chauffeur est déjà là. Sans file. Sans stress.',

    // Stats strip
    statClients: 'Clients satisfaits',
    statPunctuality: 'Ponctualité',
    statWait: "Temps d'attente",
    statSupport: 'Support disponible',

    // Reviews section
    reviewsEyebrow: 'AVIS RÉELS',
    reviewsTitle: 'Des clients déjà arrivés avec nous',
    reviewsAggregate: '5,0 sur Google',
    reviewsSeeAll: 'Voir tous les avis →',
    reviewsFootnote: "Avis vérifiés publiés sur Google. Affichés dans la langue d'origine du client.",
    reviewTranslationLabel: 'Traduction',
    reviewStarsAria: '5 étoiles sur 5',
    reviewWrittenIn: 'Avis rédigé en',
    factsBar: '★ 5,0 sur Google · Licence RNAVT 12529 · Assurance passagers',

    // Review objection labels
    reviewObjFeatured: 'LE VOL A ÉTÉ RETARDÉ. LE CHAUFFEUR ÉTAIT LÀ.',
    reviewObjAirport: "RENCONTRE À L'AÉROPORT",
    reviewObjRoundtrip: 'ALLER-RETOUR, SANS STRESS',
    reviewObjSafe: 'CONDUITE SÛRE',
    reviewObjPunctual: 'PONCTUALITÉ',

    // Guarantee badges
    badgePrice: 'Prix fixe',
    badgePunctual: 'Toujours ponctuel',
    badgeCancel: 'Annulation gratuite jusqu\'à 3h avant',
    badgeFlight: 'Vol surveillé',

    // Nav
    navHow: 'Comment Ça Marche',
    navWhy: 'Pourquoi Nous',
    navGuarantee: 'Garantie',
    navBook: 'Réserver',
  },

  IT: {
    // Hero
    heroEyebrow: 'MONITORAGGIO ATTIVO · LISBONA · PORTO · FARO',
    headline: 'Il tuo volo ritarda.',
    headlineHighlight: 'Noi no.',
    subheadline:
      'Il nostro sistema monitora il tuo volo in tempo reale. Se l\'orario cambia, riorganizziamo tutto noi. Tu atterri e noi siamo già lì ad aspettarti.',
    ctaBook: 'Prenota il mio transfer ora',
    ctaSupport: 'Nessuna attesa, monitoraggio incluso.',
    heroRadarState1: 'TP 1234 · GRU→LIS · MONITORAGGIO',
    heroRadarState2: 'ATTERRAGGIO PREVISTO · 14:35',
    heroRadarState3: 'AUTISTA NOTIFICATO ✓',

    // Partners
    partnersTitle: 'Connessi a tutti i segnali che attraversano il cielo del Portogallo.',
    partnersDesc:
      "Il nostro Cervello non guarda la bandiera dell'aereo o l'aeroporto da cui sei decollato. Si collega direttamente al segnale radar di ogni aeromobile che si avvicina a Lisbona, Porto o Faro. Se stai volando verso il Portogallo, sei già sul nostro radar.",

    // Pain
    painTitle: 'Il Caos delle Code dei Taxi',
    painDesc:
      'Sei appena sceso. Sei stanco. Vuoi andare a casa. Ma ci sono 200 persone in coda ai taxi che aspettano 45 minuti.',
    painSubtext: 'Questo non accade con HUB Transfer.',

    // Algorithm
    algoTitle: 'Cervello HUB: Tecnologia che Garantisce',
    algoDesc:
      'Il nostro sistema traccia il tuo volo in tempo reale. Se ritardato, il nostro conducente lo sa già. Tu atterri e noi siamo già lì.',
    algoFeature1: 'Sincronizzazione aerea ogni 30 secondi',
    algoFeature2: 'Autista notificato automaticamente',
    algoFeature3: 'Zero necessità di inviare messaggi',

    // Fleet
    fleetEyebrow: 'IL SERVIZIO',
    fleetTitle: 'La stessa tecnologia, dal radar alla strada.',
    fleetDesc:
      "Il sistema che monitora il suo volo è lo stesso che coordina l'auto che la aspetta. E nel servizio executive, la tecnologia arriva fino all'auto: Tesla 100% elettrica — silenziosa, confortevole, a zero emissioni.",
    fleetFeature1: 'Puntualità con garanzia reale',
    fleetFeature2: 'Monitoraggio del volo in tempo reale',
    fleetFeature3: 'Supporto 24/7',
    catLabel: 'CATEGORIA',
    cat1Title: 'Monovolume',
    cat1Line: "Spazio per la famiglia e i bagagli, dall'aeroporto a destinazione.",
    cat1Cap: 'Fino a 4 passeggeri + bagagli',
    cat2Title: 'Berlina',
    cat2Line: 'Comfort diretto e discreto per due o tre.',
    cat2Cap: 'Fino a 3 passeggeri + bagagli',
    cat3Title: 'Berlina Executive',
    cat3Line: 'Tesla 100% elettrica. Silenziosa, puntuale, discreta.',
    cat3Cap: 'Fino a 3 passeggeri',
    toursLine: 'Tour Privati — Sintra e i dintorni di Lisbona al suo ritmo, con autista dedicato. Itinerario personalizzato.',
    fleetFootnote: 'Veicolo assegnato in base alla categoria prenotata.',
    pax7Marker: '👥 Gruppo di 7+ passeggeri — richiesta di preventivo',

    // Why
    whyTitle: 'Perché Funziona',
    whyDesc:
      'Non è magia. È tecnologia, precisione e impegno verso di te.',
    whyReason1Title: 'Algoritmo Intelligente',
    whyReason1Desc:
      'Monitora il suo volo in tempo reale: ritardi, cambi di gate, atterraggi anticipati — tutto seguito automaticamente.',
    whyReason2Title: 'Conducenti Addestrati',
    whyReason2Desc:
      'Ogni conducente riceve formazione premium. Conoscono ogni strada di Lisbona, Porto e Faro.',
    whyReason3Title: 'Garanzia di Fiducia',
    whyReason3Desc:
      'Se falliamo, non paghi. Semplice. La tua soddisfazione è il nostro impegno.',
    whyReason4Title: 'Supporto 24/7',
    whyReason4Desc:
      'Team disponibile in qualsiasi momento. Problema? Lo risolviamo in minuti, non in ore.',

    // Commitment block
    commitTitle: 'O vi stringiamo la mano, o paghiamo il conto.',
    commitSub: 'Il nostro impegno, timbrato.',

    // Guarantee
    guaranteeTitle: 'Garanzia HUB: Zero Rischi',
    guaranteeDesc:
      'Se il conducente è in ritardo di più di 10 minuti, il trasferimento è gratuito e paghiamo il tuo Uber.',
    guaranteeBadge: 'Garanzia 100%',

    // CTA Final
    ctaFinalTitle:
      "L'unico passo tra il caos dell'aeroporto e il comfort del tuo hotel.",
    ctaFinalDesc: 'Prenota in 2 minuti e lascia il resto al nostro algoritmo.',

    // Footer
    footer: '© 2025 HUB Transfer. Tecnologia che garantisce.',

    // Partners carousel
    partnersLabel: 'I nostri clienti arrivano ogni giorno con voli di:',

    // Section labels
    labelTech: 'Tecnologia',
    techTitle: 'Sincronizzazione aerea ogni 30 secondi.',
    labelProblem: 'Il problema',
    labelFleet: 'Perché noi',
    labelHow: 'Come funziona',
    labelWhyUs: 'Perché noi',

    // Steps
    step1Title: 'Prenota in 2 minuti',
    step1Desc: 'Inserisci il tuo volo e la destinazione. Ci pensiamo noi.',
    step2Title: 'Monitoriamo il tuo volo',
    step2Desc: 'Il nostro sistema segue il tuo volo in tempo reale. Ritardi? Lo sappiamo già.',
    step3Title: 'Autista ad aspettarti',
    step3Desc: 'Atterri e il tuo autista è già lì. Senza code. Senza stress.',

    // Stats strip
    statClients: 'Clienti soddisfatti',
    statPunctuality: 'Puntualità',
    statWait: 'Tempo di attesa',
    statSupport: 'Supporto disponibile',

    // Reviews section
    reviewsEyebrow: 'RECENSIONI REALI',
    reviewsTitle: 'Clienti già arrivati con noi',
    reviewsAggregate: '5,0 su Google',
    reviewsSeeAll: 'Vedi tutte le recensioni →',
    reviewsFootnote: 'Recensioni verificate pubblicate su Google. Mostrate nella lingua originale del cliente.',
    reviewTranslationLabel: 'Traduzione',
    reviewStarsAria: '5 stelle su 5',
    reviewWrittenIn: 'Recensione scritta in',
    factsBar: '★ 5,0 su Google · Licenza RNAVT 12529 · Assicurazione passeggeri',

    // Review objection labels
    reviewObjFeatured: "IL VOLO ERA IN RITARDO. L'AUTISTA ERA LÌ.",
    reviewObjAirport: 'INCONTRO IN AEROPORTO',
    reviewObjRoundtrip: 'ANDATA E RITORNO, SENZA STRESS',
    reviewObjSafe: 'GUIDA SICURA',
    reviewObjPunctual: 'PUNTUALITÀ',

    // Guarantee badges
    badgePrice: 'Prezzo fisso',
    badgePunctual: 'Sempre puntuale',
    badgeCancel: 'Cancellazione gratuita fino a 3h prima',
    badgeFlight: 'Volo monitorato',

    // Nav
    navHow: 'Come Funziona',
    navWhy: 'Perché Noi',
    navGuarantee: 'Garanzia',
    navBook: 'Prenota',
  },
};

export function getLandingT(lang: LandingLang): LandingTranslations {
  return LANDING_TRANSLATIONS[lang] ?? LANDING_TRANSLATIONS.EN;
}
