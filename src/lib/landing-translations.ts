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

  // Commitment block
  commitTitle: string;

  // Guarantee
  guaranteeDesc: string;
  guaranteeBadge: string;
  policyLink: string;

  // CTA Final
  ctaFinalTitle: string;
  ctaFinalDesc: string;

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
    heroEyebrow: 'MONITORIZAÇÃO ATIVA · LISBOA E REGIÃO',
    headline: 'O voo atrasou.',
    headlineHighlight: 'O motorista já sabia.',
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
      'O nosso Cérebro não olha para a bandeira do avião nem para o aeroporto de onde descolou. Liga-se diretamente ao sinal de radar de cada aeronave que se aproxima de Lisboa. Se está a voar para Lisboa, já está no nosso radar.',

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
      'O sistema que monitoriza o seu voo é o mesmo que coordena o carro à sua espera.',
    fleetFeature1: 'Recolha ajustada à hora real do voo',
    fleetFeature2: 'Monitorização de voo em tempo real',
    fleetFeature3: 'Suporte por WhatsApp',
    catLabel: 'CATEGORIA',
    cat1Title: 'MPV',
    cat1Line: 'Espaço para a família e para as malas, do aeroporto ao destino.',
    cat1Cap: 'Até 4 passageiros + bagagem',
    cat2Title: 'Sedan',
    cat2Line: 'Conforto direto e discreto para viagens a dois ou três.',
    cat2Cap: 'Até 3 passageiros + bagagem',
    cat3Title: 'Sedan Executivo',
    cat3Line: 'Silencioso e discreto, para viagens de negócios.',
    cat3Cap: 'Até 3 passageiros',
    toursLine: 'Tours Privados — Sintra e arredores de Lisboa ao seu ritmo, com motorista dedicado. Roteiro personalizado.',
    fleetFootnote: 'Veículo atribuído conforme a categoria reservada.',
    pax7Marker: '👥 Grupo de 7+ passageiros — pedido de orçamento',

    // Commitment block
    commitTitle: 'A espera conta a partir da aterragem real.',

    // Guarantee
    guaranteeDesc:
      'Acompanhamos o seu voo e ajustamos a recolha à hora real de chegada.',
    guaranteeBadge: 'Política de espera',
    policyLink: 'Consultar a Política de Espera →',

    // CTA Final
    ctaFinalTitle:
      'O único passo entre o caos do aeroporto e o conforto do seu hotel.',
    ctaFinalDesc: 'Reserve em 2 minutos e deixe o resto com o nosso algoritmo.',

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
    badgePunctual: 'Um carro por reserva',
    badgeCancel: 'Cancelamento grátis até 3h antes',
    badgeFlight: 'Voo monitorizado',

    // Nav
    navHow: 'Como Funciona',
    navWhy: 'Porquê Nós',
    navGuarantee: 'Espera',
    navBook: 'Reservar',
  },

  EN: {
    // Hero
    heroEyebrow: 'LIVE MONITORING · LISBON AREA',
    headline: 'The flight was late.',
    headlineHighlight: 'The driver already knew.',
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
      "Our Brain doesn't look at the airline logo or where you took off from. It connects directly to the radar signal of every aircraft approaching Lisbon. If you're flying to Lisbon, you're already on our radar.",

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
      'The system tracking your flight is the same one coordinating the car waiting for you.',
    fleetFeature1: 'Pickup adjusted to the actual flight time',
    fleetFeature2: 'Real-time flight monitoring',
    fleetFeature3: 'WhatsApp support',
    catLabel: 'CATEGORY',
    cat1Title: 'MPV',
    cat1Line: 'Room for the family and the luggage, from airport to destination.',
    cat1Cap: 'Up to 4 passengers + luggage',
    cat2Title: 'Sedan',
    cat2Line: 'Straightforward, discreet comfort for two or three.',
    cat2Cap: 'Up to 3 passengers + luggage',
    cat3Title: 'Executive Sedan',
    cat3Line: 'Quiet and discreet, for business travel.',
    cat3Cap: 'Up to 3 passengers',
    toursLine: 'Private Tours — Sintra and the Lisbon area at your own pace, with a dedicated driver. Custom itinerary.',
    fleetFootnote: 'Vehicle assigned according to the booked category.',
    pax7Marker: '👥 Group of 7+ passengers — quote request',

    // Commitment block
    commitTitle: 'Waiting starts at the actual landing.',

    // Guarantee
    guaranteeDesc:
      'We follow your flight and adjust the pickup to the actual arrival time.',
    guaranteeBadge: 'Waiting policy',
    policyLink: 'Read our Waiting Policy →',

    // CTA Final
    ctaFinalTitle:
      'The only step between airport chaos and the comfort of your hotel.',
    ctaFinalDesc: 'Book in 2 minutes and let our algorithm handle the rest.',

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
    badgePunctual: 'One car per booking',
    badgeCancel: 'Free cancellation up to 3h before',
    badgeFlight: 'Flight tracked',

    // Nav
    navHow: 'How It Works',
    navWhy: 'Why Us',
    navGuarantee: 'Waiting',
    navBook: 'Book Now',
  },

  ES: {
    // Hero
    heroEyebrow: 'MONITORIZACIÓN ACTIVA · LISBOA Y SU REGIÓN',
    headline: 'El vuelo se retrasó.',
    headlineHighlight: 'El conductor ya lo sabía.',
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
      'Nuestro Cerebro no mira la bandera del avión ni el aeropuerto desde donde despegaste. Se conecta directamente a la señal de radar de cada aeronave que se acerca a Lisboa. Si estás volando a Lisboa, ya estás en nuestro radar.',

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
      'El sistema que monitoriza su vuelo es el mismo que coordina el coche que le espera.',
    fleetFeature1: 'Recogida ajustada a la hora real del vuelo',
    fleetFeature2: 'Monitorización de vuelo en tiempo real',
    fleetFeature3: 'Soporte por WhatsApp',
    catLabel: 'CATEGORÍA',
    cat1Title: 'MPV',
    cat1Line: 'Espacio para la familia y el equipaje, del aeropuerto al destino.',
    cat1Cap: 'Hasta 4 pasajeros + equipaje',
    cat2Title: 'Sedán',
    cat2Line: 'Confort directo y discreto para dos o tres.',
    cat2Cap: 'Hasta 3 pasajeros + equipaje',
    cat3Title: 'Sedán Ejecutivo',
    cat3Line: 'Silencioso y discreto, para viajes de negocios.',
    cat3Cap: 'Hasta 3 pasajeros',
    toursLine: 'Tours Privados — Sintra y los alrededores de Lisboa a su ritmo, con conductor dedicado. Itinerario personalizado.',
    fleetFootnote: 'Vehículo asignado según la categoría reservada.',
    pax7Marker: '👥 Grupo de 7+ pasajeros — solicitud de presupuesto',

    // Commitment block
    commitTitle: 'La espera empieza con el aterrizaje real.',

    // Guarantee
    guaranteeDesc:
      'Seguimos su vuelo y ajustamos la recogida a la hora real de llegada.',
    guaranteeBadge: 'Política de espera',
    policyLink: 'Consultar la Política de Espera →',

    // CTA Final
    ctaFinalTitle:
      'El único paso entre el caos del aeropuerto y la comodidad de tu hotel.',
    ctaFinalDesc: 'Reserva en 2 minutos y deja el resto a nuestro algoritmo.',

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
    badgePunctual: 'Un coche por reserva',
    badgeCancel: 'Cancelación gratis hasta 3h antes',
    badgeFlight: 'Vuelo monitorizado',

    // Nav
    navHow: 'Cómo Funciona',
    navWhy: 'Por Qué Nosotros',
    navGuarantee: 'Espera',
    navBook: 'Reservar',
  },

  FR: {
    // Hero
    heroEyebrow: 'SURVEILLANCE ACTIVE · LISBONNE ET SA RÉGION',
    headline: 'Le vol a eu du retard.',
    headlineHighlight: 'Le chauffeur le savait déjà.',
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
      "Notre Cerveau ne regarde pas le drapeau de l'avion ni l'aéroport d'où vous avez décollé. Il se connecte directement au signal radar de chaque aéronef qui s'approche de Lisbonne. Si vous volez vers Lisbonne, vous êtes déjà sur notre radar.",

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
      'Le système qui suit votre vol est le même qui coordonne la voiture qui vous attend.',
    fleetFeature1: "Prise en charge ajustée à l'heure réelle du vol",
    fleetFeature2: 'Surveillance de vol en temps réel',
    fleetFeature3: 'Assistance par WhatsApp',
    catLabel: 'CATÉGORIE',
    cat1Title: 'Monospace',
    cat1Line: "De la place pour la famille et les bagages, de l'aéroport à destination.",
    cat1Cap: "Jusqu'à 4 passagers + bagages",
    cat2Title: 'Berline',
    cat2Line: 'Un confort simple et discret pour deux ou trois.',
    cat2Cap: "Jusqu'à 3 passagers + bagages",
    cat3Title: 'Berline Executive',
    cat3Line: "Silencieux et discret, pour les voyages d'affaires.",
    cat3Cap: "Jusqu'à 3 passagers",
    toursLine: 'Excursions Privées — Sintra et les environs de Lisbonne à votre rythme, avec chauffeur dédié. Itinéraire personnalisé.',
    fleetFootnote: 'Véhicule attribué selon la catégorie réservée.',
    pax7Marker: '👥 Groupe de 7+ passagers — demande de devis',

    // Commitment block
    commitTitle: "L'attente commence à l'atterrissage réel.",

    // Guarantee
    guaranteeDesc:
      "Nous suivons votre vol et ajustons la prise en charge à l'heure réelle d'arrivée.",
    guaranteeBadge: "Politique d'attente",
    policyLink: "Consulter la Politique d'Attente →",

    // CTA Final
    ctaFinalTitle:
      "La seule étape entre le chaos de l'aéroport et le confort de votre hôtel.",
    ctaFinalDesc: 'Réservez en 2 minutes et laissez notre algorithme faire le reste.',

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
    badgePunctual: 'Une voiture par réservation',
    badgeCancel: 'Annulation gratuite jusqu\'à 3h avant',
    badgeFlight: 'Vol surveillé',

    // Nav
    navHow: 'Comment Ça Marche',
    navWhy: 'Pourquoi Nous',
    navGuarantee: 'Attente',
    navBook: 'Réserver',
  },

  IT: {
    // Hero
    heroEyebrow: 'MONITORAGGIO ATTIVO · LISBONA E DINTORNI',
    headline: 'Il volo era in ritardo.',
    headlineHighlight: "L'autista lo sapeva già.",
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
      "Il nostro Cervello non guarda la bandiera dell'aereo o l'aeroporto da cui sei decollato. Si collega direttamente al segnale radar di ogni aeromobile che si avvicina a Lisbona. Se stai volando verso Lisbona, sei già sul nostro radar.",

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
      "Il sistema che monitora il suo volo è lo stesso che coordina l'auto che la aspetta.",
    fleetFeature1: "Ritiro adeguato all'orario effettivo del volo",
    fleetFeature2: 'Monitoraggio del volo in tempo reale',
    fleetFeature3: 'Assistenza su WhatsApp',
    catLabel: 'CATEGORIA',
    cat1Title: 'Monovolume',
    cat1Line: "Spazio per la famiglia e i bagagli, dall'aeroporto a destinazione.",
    cat1Cap: 'Fino a 4 passeggeri + bagagli',
    cat2Title: 'Berlina',
    cat2Line: 'Comfort diretto e discreto per due o tre.',
    cat2Cap: 'Fino a 3 passeggeri + bagagli',
    cat3Title: 'Berlina Executive',
    cat3Line: 'Silenzioso e discreto, per i viaggi di lavoro.',
    cat3Cap: 'Fino a 3 passeggeri',
    toursLine: 'Tour Privati — Sintra e i dintorni di Lisbona al suo ritmo, con autista dedicato. Itinerario personalizzato.',
    fleetFootnote: 'Veicolo assegnato in base alla categoria prenotata.',
    pax7Marker: '👥 Gruppo di 7+ passeggeri — richiesta di preventivo',

    // Commitment block
    commitTitle: "L'attesa parte dall'atterraggio effettivo.",

    // Guarantee
    guaranteeDesc:
      "Seguiamo il suo volo e adeguiamo il ritiro all'orario effettivo di arrivo.",
    guaranteeBadge: 'Politica di attesa',
    policyLink: 'Consultare la Politica di Attesa →',

    // CTA Final
    ctaFinalTitle:
      "L'unico passo tra il caos dell'aeroporto e il comfort del tuo hotel.",
    ctaFinalDesc: 'Prenota in 2 minuti e lascia il resto al nostro algoritmo.',

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
    badgePunctual: "Un'auto per prenotazione",
    badgeCancel: 'Cancellazione gratuita fino a 3h prima',
    badgeFlight: 'Volo monitorato',

    // Nav
    navHow: 'Come Funziona',
    navWhy: 'Perché Noi',
    navGuarantee: 'Attesa',
    navBook: 'Prenota',
  },
};

export function getLandingT(lang: LandingLang): LandingTranslations {
  return LANDING_TRANSLATIONS[lang] ?? LANDING_TRANSLATIONS.EN;
}
