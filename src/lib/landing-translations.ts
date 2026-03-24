export type LandingLang = 'PT' | 'EN' | 'ES' | 'FR' | 'IT';

export interface LandingTranslations {
  // Hero
  headline: string;
  headlineHighlight: string;
  subheadline: string;
  ctaBook: string;
  ctaSupport: string;

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
  fleetTitle: string;
  fleetDesc: string;
  fleetFeature1: string;
  fleetFeature2: string;
  fleetFeature3: string;

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

  // Guarantee
  guaranteeTitle: string;
  guaranteeDesc: string;
  guaranteeBadge: string;

  // CTA Final
  ctaFinalTitle: string;
  ctaFinalDesc: string;

  // Footer
  footer: string;

  // Nav
  navHow: string;
  navWhy: string;
  navGuarantee: string;
  navBook: string;
}

export const LANDING_TRANSLATIONS: Record<LandingLang, LandingTranslations> = {
  PT: {
    // Hero
    headline: 'Seu voo atrasa.',
    headlineHighlight: 'A gente não.',
    subheadline:
      'Enquanto outras empresas esperam você avisar do atraso, nosso sistema já reagendou seu motorista. Você desembarca, a gente já está lá. Sem estresse, sem esperas.',
    ctaBook: 'GARANTIR MEU TRANSFER AGORA',
    ctaSupport: 'Leva menos de 2 minutos e você já fica tranquilo.',

    // Partners
    partnersTitle: 'Conectados a todos os sinais que cruzam o céu de Portugal.',
    partnersDesc:
      'Nosso Cérebro não olha para a bandeira do avião ou para o aeroporto de onde você decolou. Ele se conecta diretamente ao sinal de radar de cada aeronave que se aproxima de Lisboa, Porto ou Faro. Se você está voando para Portugal, você já está no nosso radar.',

    // Pain
    painTitle: 'Chegar em Lisboa não deveria ser uma prova de resistência.',
    painDesc:
      "Você cruzou fronteiras e só quer o conforto do seu destino. Não caia na 'Loteria do Desembarque': aquele momento em que você descobre que seu transfer foi embora e sua única opção é uma fila de táxi sob a chuva.",
    painSubtext:
      'Na HUB, sua paz de espírito não depende da sorte. Depende de tecnologia.',

    // Algorithm
    algoTitle: 'Não é mágica, é monitoramento.',
    algoDesc:
      'Nosso sistema conversa com o radar a cada 30 segundos. Enquanto você está no ar, nós estamos trabalhando para garantir que sua recepção seja impecável, sem que você precise enviar uma única mensagem.',
    algoFeature1: 'Sincronização Aérea a cada 30 segundos',
    algoFeature2: 'Motorista notificado automaticamente',
    algoFeature3: 'Zero necessidade de você enviar mensagens',

    // Fleet
    fleetTitle: 'Onde investimos cada centavo da HUB?',
    fleetDesc:
      'Muitas empresas gastam fortunas em carros de ostentação. Nós decidimos investir em Sincronização Aérea Profunda. Porque entendemos que luxo de verdade não é um banco de couro em um carro que não chega. Luxo mesmo é o seu voo atrasar 4 horas e quando você pisa no saguão de Lisboa, seu motorista está lá.',
    fleetFeature1: '99.8% de Pontualidade',
    fleetFeature2: 'Sedans Mercedes e BMW',
    fleetFeature3: 'Motoristas Profissionais',

    // Why
    whyTitle: 'Ou apertamos sua mão, ou pagamos a conta.',
    whyDesc: 'Nossa confiança no algoritmo é absoluta.',
    whyReason1Title: 'Sincronização Aérea Profunda',
    whyReason1Desc:
      'Monitora 47 variáveis do seu voo em tempo real. Atrasos, mudanças de gate, tudo é rastreado automaticamente.',
    whyReason2Title: 'Motoristas Concierge',
    whyReason2Desc:
      'Não são apenas motoristas. São profissionais treinados para acolher. Conhecem cada rua de Lisboa, Porto e Faro.',
    whyReason3Title: 'Garantia HUB',
    whyReason3Desc:
      'Se falharmos, você não paga. Nós devolvemos seu dinheiro e pagamos seu Uber.',
    whyReason4Title: 'Concierges Digitais 24/7',
    whyReason4Desc:
      'Tecnologia para garantir, humanos para acolher. Nossa central não é um bot gelado; é uma equipe pronta para ajudar em segundos.',

    // Guarantee
    guaranteeTitle: 'Garantia HUB: Risco Zero',
    guaranteeDesc:
      'Ou apertamos sua mão, ou pagamos o seu Uber e devolvemos seu dinheiro.',
    guaranteeBadge: 'Garantia 100%',

    // CTA Final
    ctaFinalTitle:
      'O único passo entre o caos do aeroporto e o conforto do seu hotel.',
    ctaFinalDesc: 'Reserve em 2 minutos e deixe o resto com o nosso algoritmo.',

    // Footer
    footer: '© 2025 HUB Transfer. Tecnologia que garante.',

    // Nav
    navHow: 'Como Funciona',
    navWhy: 'Porquê Nós',
    navGuarantee: 'Garantia',
    navBook: 'Reservar',
  },

  EN: {
    // Hero
    headline: 'Flights delay.',
    headlineHighlight: "We don't.",
    subheadline:
      'Our system tracks your flight in real-time. If the schedule changes, we handle everything automatically. You land, and we\'re already there waiting.',
    ctaBook: 'Book my stress-free ride',
    ctaSupport: 'Instant confirmation. We track your flight.',

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
    algoFeature1: 'Real-Time Radar',
    algoFeature2: 'Update Every 30s',
    algoFeature3: 'Driver Always Ready',

    // Fleet
    fleetTitle: 'Premium Black Sedans',
    fleetDesc:
      'Efficiency, comfort and punctuality. Every detail was designed for your experience.',
    fleetFeature1: '99.8% Punctuality',
    fleetFeature2: 'Mercedes and BMW Sedans',
    fleetFeature3: 'Professional Drivers',

    // Why
    whyTitle: 'Why It Works',
    whyDesc:
      'It\'s not magic. It\'s technology, precision and commitment to you.',
    whyReason1Title: 'Smart Algorithm',
    whyReason1Desc:
      'Monitors 47 variables of your flight in real-time. Delays, gate changes, everything is tracked.',
    whyReason2Title: 'Trained Drivers',
    whyReason2Desc:
      'Every driver receives premium training. They know every street in Lisbon, Porto and Faro.',
    whyReason3Title: 'Trust Guarantee',
    whyReason3Desc:
      'If we fail, you don\'t pay. Simple. Your satisfaction is our commitment.',
    whyReason4Title: '24/7 Support',
    whyReason4Desc:
      'Team available anytime. Problem? We solve it in minutes, not hours.',

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

    // Nav
    navHow: 'How It Works',
    navWhy: 'Why Us',
    navGuarantee: 'Guarantee',
    navBook: 'Book Now',
  },

  ES: {
    // Hero
    headline: 'Tu vuelo se atrasa.',
    headlineHighlight: 'Nosotros no.',
    subheadline:
      'Nuestro sistema vigila tu vuelo en tiempo real. Si el horario cambia, ajustamos todo automáticamente para que nunca te quedes tirado. Tú aterrizas y nosotros ya estamos ahí.',
    ctaBook: 'Reservar mi transfer ahora',
    ctaSupport: 'Confirmación inmediata y sin esperas.',

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
    algoFeature1: 'Radar en Tiempo Real',
    algoFeature2: 'Actualización Cada 30s',
    algoFeature3: 'Conductor Siempre Listo',

    // Fleet
    fleetTitle: 'Sedanes Negros Premium',
    fleetDesc:
      'Eficiencia, comodidad y puntualidad. Cada detalle fue diseñado para tu experiencia.',
    fleetFeature1: '99.8% de Puntualidad',
    fleetFeature2: 'Sedanes Mercedes y BMW',
    fleetFeature3: 'Conductores Profesionales',

    // Why
    whyTitle: 'Por Qué Funciona',
    whyDesc:
      'No es magia. Es tecnología, precisión y compromiso contigo.',
    whyReason1Title: 'Algoritmo Inteligente',
    whyReason1Desc:
      'Monitorea 47 variables de tu vuelo en tiempo real. Retrasos, cambios de puerta, todo se rastrea.',
    whyReason2Title: 'Conductores Entrenados',
    whyReason2Desc:
      'Cada conductor recibe entrenamiento premium. Conocen cada calle de Lisboa, Oporto y Faro.',
    whyReason3Title: 'Garantía de Confianza',
    whyReason3Desc:
      'Si fallamos, no pagas. Así de simple. Tu satisfacción es nuestro compromiso.',
    whyReason4Title: 'Soporte 24/7',
    whyReason4Desc:
      'Equipo disponible en cualquier momento. ¿Problema? Lo resolvemos en minutos, no en horas.',

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

    // Nav
    navHow: 'Cómo Funciona',
    navWhy: 'Por Qué Nosotros',
    navGuarantee: 'Garantía',
    navBook: 'Reservar',
  },

  FR: {
    // Hero
    headline: 'Votre vol est en retard.',
    headlineHighlight: 'Pas nous.',
    subheadline:
      "Notre système surveille votre vol en temps réel. Si l'horaire change, on ajuste tout automatiquement pour vous éviter l'attente. Vous atterrissez, on est déjà là.",
    ctaBook: 'Réserver mon transfert maintenant',
    ctaSupport: 'Confirmation immédiate. Sans stress.',

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
    algoFeature1: 'Radar en Temps Réel',
    algoFeature2: 'Mise à Jour Toutes les 30s',
    algoFeature3: 'Conducteur Toujours Prêt',

    // Fleet
    fleetTitle: 'Berlines Noires Premium',
    fleetDesc:
      'Efficacité, confort et ponctualité. Chaque détail a été pensé pour votre expérience.',
    fleetFeature1: '99.8% de Ponctualité',
    fleetFeature2: 'Berlines Mercedes et BMW',
    fleetFeature3: 'Conducteurs Professionnels',

    // Why
    whyTitle: 'Pourquoi Ça Marche',
    whyDesc:
      "Ce n'est pas de la magie. C'est de la technologie, de la précision et un engagement envers vous.",
    whyReason1Title: 'Algorithme Intelligent',
    whyReason1Desc:
      'Surveille 47 variables de votre vol en temps réel. Retards, changements de porte, tout est suivi.',
    whyReason2Title: 'Conducteurs Formés',
    whyReason2Desc:
      'Chaque conducteur reçoit une formation premium. Ils connaissent chaque rue de Lisbonne, Porto et Faro.',
    whyReason3Title: 'Garantie de Confiance',
    whyReason3Desc:
      "Si nous échouons, vous ne payez pas. C'est aussi simple. Votre satisfaction est notre engagement.",
    whyReason4Title: 'Support 24/7',
    whyReason4Desc:
      'Équipe disponible à tout moment. Problème? On le résout en minutes, pas en heures.',

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

    // Nav
    navHow: 'Comment Ça Marche',
    navWhy: 'Pourquoi Nous',
    navGuarantee: 'Garantie',
    navBook: 'Réserver',
  },

  IT: {
    // Hero
    headline: 'Il tuo volo ritarda.',
    headlineHighlight: 'Noi no.',
    subheadline:
      'Il nostro sistema monitora il tuo volo in tempo reale. Se l\'orario cambia, riorganizziamo tutto noi. Tu atterri e noi siamo già lì ad aspettarti.',
    ctaBook: 'Prenota il mio transfer ora',
    ctaSupport: 'Nessuna attesa, monitoraggio incluso.',

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
    algoFeature1: 'Radar in Tempo Reale',
    algoFeature2: 'Aggiornamento Ogni 30s',
    algoFeature3: 'Conducente Sempre Pronto',

    // Fleet
    fleetTitle: 'Berlina Nere Premium',
    fleetDesc:
      'Efficienza, comfort e puntualità. Ogni dettaglio è stato pensato per la tua esperienza.',
    fleetFeature1: '99.8% di Puntualità',
    fleetFeature2: 'Berline Mercedes e BMW',
    fleetFeature3: 'Conducenti Professionisti',

    // Why
    whyTitle: 'Perché Funziona',
    whyDesc:
      'Non è magia. È tecnologia, precisione e impegno verso di te.',
    whyReason1Title: 'Algoritmo Intelligente',
    whyReason1Desc:
      'Monitora 47 variabili del tuo volo in tempo reale. Ritardi, cambi di gate, tutto è tracciato.',
    whyReason2Title: 'Conducenti Addestrati',
    whyReason2Desc:
      'Ogni conducente riceve formazione premium. Conoscono ogni strada di Lisbona, Porto e Faro.',
    whyReason3Title: 'Garanzia di Fiducia',
    whyReason3Desc:
      'Se falliamo, non paghi. Semplice. La tua soddisfazione è il nostro impegno.',
    whyReason4Title: 'Supporto 24/7',
    whyReason4Desc:
      'Team disponibile in qualsiasi momento. Problema? Lo risolviamo in minuti, non in ore.',

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
