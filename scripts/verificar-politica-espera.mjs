// Verificação da política de espera (05/11/2026, «(45)»).
// Uso: node scripts/verificar-politica-espera.mjs [http://127.0.0.1:3022]
// Pede as cinco páginas e /termos ao servidor local e confirma, letra a letra, as frases aprovadas;
// confirma que as cinco páginas não têm as palavras da política antiga;
// e lê o src/lib/landing-translations.ts para as cinco chaves do início. Sem bibliotecas.
import { readFileSync } from "node:fs";

const BASE = process.argv[2] || "http://127.0.0.1:3022";
const PAGINAS = {
 "/politica-de-espera": {
  "lang": "pt-PT",
  "frases": [
   "Política de Espera | HUB Transfer",
   "60 minutos de espera nas recolhas no aeroporto, desde a aterragem real do voo, e 15 minutos nas outras recolhas. Cancelamentos e não comparência.",
   "← Voltar",
   "Política de espera",
   "Última atualização: 5 de novembro de 2026.",
   "A recolha acompanha o seu voo. Se o voo se atrasar ou chegar mais cedo, ajustamos a hora da recolha, sem que tenha de nos avisar.",
   "Recolhas no aeroporto",
   "O motorista espera 60 minutos, contados desde a aterragem real do voo.",
   "Se precisar de mais tempo, por exemplo na bagagem ou no controlo de fronteiras, escreva-nos por WhatsApp: combinamos consigo a espera a mais.",
   "Recolhas no hotel ou noutra morada",
   "O motorista espera 15 minutos, contados desde a hora marcada.",
   "Pedimos que esteja pronto à hora marcada, sobretudo quando vai para o aeroporto.",
   "Quando não o encontramos",
   "Durante o tempo de espera, o motorista tenta contactá-lo por vários meios, incluindo mensagens de WhatsApp e chamadas, e a equipa da HUB também. O motorista espera no ponto de encontro combinado e regista que lá esteve.",
   "Se, no fim do tempo de espera, não for possível falar consigo, a viagem conta como não comparência: o motorista pode sair e cobra-se o valor total da viagem.",
   "Cancelamentos",
   "O cancelamento é grátis até 3 horas antes da recolha. Depois disso, cobra-se o valor total da viagem. A mesma regra vale nos termos e condições.",
   "Reservas feitas através de agências, operadores ou hotéis",
   "Valem as regras de espera, de cancelamento e de não comparência combinadas com quem fez a reserva.",
   "Contacto",
   "Para avisar de um atraso ou combinar a espera: o WhatsApp da HUB ou contacto@hubtransfer.pt."
  ]
 },
 "/waiting-policy": {
  "lang": "en",
  "frases": [
   "Waiting Policy | HUB Transfer",
   "60 minutes of waiting at airport pickups, from the actual landing, and 15 minutes at other pickups. Cancellations and no-shows.",
   "← Back",
   "Waiting policy",
   "Last updated: 5 November 2026.",
   "Your pickup follows your flight. If the flight is delayed or lands early, we adjust the pickup time, and you don't need to tell us.",
   "Airport pickups",
   "The driver waits 60 minutes from the actual landing time of the flight.",
   "If you need more time, for example at baggage claim or border control, message us on WhatsApp and we will agree the extra waiting time with you.",
   "Pickups at a hotel or any other address",
   "The driver waits 15 minutes from the booked time.",
   "Please be ready at the booked time, especially when you are going to the airport.",
   "If we can't find you",
   "During the waiting time, the driver tries to reach you in several ways, including WhatsApp messages and phone calls, and so does the HUB team. The driver waits at the agreed meeting point and records being there.",
   "If we cannot reach you by the end of the waiting time, the trip counts as a no-show: the driver may leave and the full trip price is charged.",
   "Cancellations",
   "Cancellation is free up to 3 hours before pickup. After that, the full trip price is charged. The same rule applies in the terms and conditions.",
   "Bookings made through agencies, operators or hotels",
   "The waiting, cancellation and no-show rules agreed with whoever made the booking apply.",
   "Contact",
   "To tell us about a delay or agree the waiting time: HUB's WhatsApp or contacto@hubtransfer.pt."
  ]
 },
 "/es/politica-de-espera": {
  "lang": "es",
  "frases": [
   "Política de Espera | HUB Transfer",
   "60 minutos de espera en las recogidas en el aeropuerto, desde el aterrizaje real, y 15 minutos en las demás recogidas. Cancelaciones y no presentación.",
   "← Volver",
   "Política de espera",
   "Última actualización: 5 de noviembre de 2026.",
   "La recogida sigue su vuelo. Si el vuelo se retrasa o llega antes, ajustamos la hora de recogida, sin que tenga que avisarnos.",
   "Recogidas en el aeropuerto",
   "El conductor espera 60 minutos, contados desde el aterrizaje real del vuelo.",
   "Si necesita más tiempo, por ejemplo en la recogida de equipaje o en el control de fronteras, escríbanos por WhatsApp y acordamos con usted el tiempo de espera adicional.",
   "Recogidas en el hotel o en otra dirección",
   "El conductor espera 15 minutos, contados desde la hora reservada.",
   "Le pedimos que esté listo a la hora reservada, sobre todo si va al aeropuerto.",
   "Si no podemos encontrarle",
   "Durante el tiempo de espera, el conductor intenta contactarle por varios medios, incluidos mensajes de WhatsApp y llamadas, y el equipo de HUB también. El conductor espera en el punto de encuentro acordado y deja constancia de que estuvo allí.",
   "Si al terminar el tiempo de espera no es posible hablar con usted, el viaje se considera una no presentación (no-show): el conductor puede marcharse y se cobra el precio total del viaje.",
   "Cancelaciones",
   "La cancelación es gratuita hasta 3 horas antes de la recogida. Después, se cobra el precio total del viaje. La misma regla se aplica en los términos y condiciones.",
   "Reservas hechas a través de agencias, operadores u hoteles",
   "Se aplican las reglas de espera, de cancelación y de no presentación acordadas con quien hizo la reserva.",
   "Contacto",
   "Para avisarnos de un retraso o acordar la espera: el WhatsApp de HUB o contacto@hubtransfer.pt."
  ]
 },
 "/fr/politique-d-attente": {
  "lang": "fr",
  "frases": [
   "Politique d'Attente | HUB Transfer",
   "60 minutes d'attente pour les prises en charge à l'aéroport, dès l'atterrissage réel, et 15 minutes pour les autres. Annulations et absences.",
   "← Retour",
   "Politique d'attente",
   "Dernière mise à jour : 5 novembre 2026.",
   "La prise en charge suit votre vol. Si le vol est retardé ou arrive en avance, nous ajustons l'heure de prise en charge, sans que vous ayez à nous prévenir.",
   "Prises en charge à l'aéroport",
   "Le chauffeur attend 60 minutes, à compter de l'atterrissage réel du vol.",
   "Si vous avez besoin de plus de temps, par exemple pour récupérer vos bagages ou au contrôle aux frontières, écrivez-nous sur WhatsApp : nous convenons avec vous du temps d'attente supplémentaire.",
   "Prises en charge à l'hôtel ou à une autre adresse",
   "Le chauffeur attend 15 minutes, à compter de l'heure réservée.",
   "Merci d'être prêt à l'heure réservée, surtout si vous allez à l'aéroport.",
   "Si nous ne vous trouvons pas",
   "Pendant le temps d'attente, le chauffeur essaie de vous joindre par plusieurs moyens, notamment par messages WhatsApp et par appels, tout comme l'équipe HUB. Le chauffeur attend au point de rendez-vous convenu et enregistre sa présence.",
   "Si, à la fin du temps d'attente, il n'est pas possible de vous joindre, le trajet est considéré comme une absence (no-show) : le chauffeur peut partir et le prix total du trajet est facturé.",
   "Annulations",
   "L'annulation est gratuite jusqu'à 3 heures avant la prise en charge. Au-delà, le prix total du trajet est facturé. La même règle s'applique dans les conditions générales.",
   "Réservations faites par des agences, des opérateurs ou des hôtels",
   "Les règles d'attente, d'annulation et d'absence convenues avec celui qui a fait la réservation s'appliquent.",
   "Contact",
   "Pour nous signaler un retard ou convenir de l'attente : le WhatsApp de HUB ou contacto@hubtransfer.pt."
  ]
 },
 "/it/politica-di-attesa": {
  "lang": "it",
  "frases": [
   "Politica di Attesa | HUB Transfer",
   "60 minuti di attesa per i ritiri in aeroporto, dall'atterraggio effettivo, e 15 minuti per gli altri ritiri. Cancellazioni e mancata presentazione.",
   "← Indietro",
   "Politica di attesa",
   "Ultimo aggiornamento: 5 novembre 2026.",
   "Il ritiro segue il suo volo. Se il volo è in ritardo o arriva in anticipo, adeguiamo l'orario del ritiro, senza che debba avvisarci.",
   "Ritiri in aeroporto",
   "L'autista attende 60 minuti, a partire dall'atterraggio effettivo del volo.",
   "Se le serve più tempo, ad esempio al ritiro bagagli o al controllo di frontiera, ci scriva su WhatsApp: concordiamo con lei l'attesa aggiuntiva.",
   "Ritiri in hotel o a un altro indirizzo",
   "L'autista attende 15 minuti, a partire dall'orario prenotato.",
   "Le chiediamo di essere pronto all'orario prenotato, soprattutto se va in aeroporto.",
   "Se non riusciamo a trovarla",
   "Durante il tempo di attesa, l'autista cerca di contattarla in diversi modi, compresi messaggi WhatsApp e chiamate, e lo fa anche il team HUB. L'autista attende al punto d'incontro concordato e registra di esserci stato.",
   "Se alla fine del tempo di attesa non è possibile contattarla, il viaggio viene considerato una mancata presentazione (no-show): l'autista può andare via e viene addebitato il prezzo intero del viaggio.",
   "Cancellazioni",
   "La cancellazione è gratuita fino a 3 ore prima del ritiro. Dopo, viene addebitato il prezzo intero del viaggio. La stessa regola vale nei termini e condizioni.",
   "Prenotazioni fatte tramite agenzie, operatori o hotel",
   "Valgono le regole di attesa, di cancellazione e di mancata presentazione concordate con chi ha fatto la prenotazione.",
   "Contatti",
   "Per avvisarci di un ritardo o concordare l'attesa: il WhatsApp di HUB oppure contacto@hubtransfer.pt."
  ]
 },
 "/termos": {
  "lang": "pt",
  "frases": [
   "Última atualização: 5 de novembro de 2026",
   "Gratuito até 3 horas antes da recolha.",
   "Com menos de 3 horas, cobra-se o valor total da viagem.",
   "Não comparência: se, no fim do tempo de espera, não for possível falar com o cliente, cobra-se o valor total da viagem.",
   "Nas reservas feitas através de agências, operadores ou hotéis, valem as regras combinadas com quem fez a reserva.",
   "A HUB Transfer acompanha os voos em tempo real. Se o voo se atrasar, a hora da recolha ajusta-se sem custo. O tempo de espera e o que acontece quando não encontramos o cliente estão na nossa Política de Espera."
  ]
 }
};
const TABELA = {
 "commitTitle": {
  "PT": "A espera conta a partir da aterragem real.",
  "EN": "Waiting starts at the actual landing.",
  "ES": "La espera empieza con el aterrizaje real.",
  "FR": "L'attente commence à l'atterrissage réel.",
  "IT": "L'attesa parte dall'atterraggio effettivo."
 },
 "guaranteeDesc": {
  "PT": "Acompanhamos o seu voo e ajustamos a recolha à hora real de chegada.",
  "EN": "We follow your flight and adjust the pickup to the actual arrival time.",
  "ES": "Seguimos su vuelo y ajustamos la recogida a la hora real de llegada.",
  "FR": "Nous suivons votre vol et ajustons la prise en charge à l'heure réelle d'arrivée.",
  "IT": "Seguiamo il suo volo e adeguiamo il ritiro all'orario effettivo di arrivo."
 },
 "guaranteeBadge": {
  "PT": "Política de espera",
  "EN": "Waiting policy",
  "ES": "Política de espera",
  "FR": "Politique d'attente",
  "IT": "Politica di attesa"
 },
 "navGuarantee": {
  "PT": "Espera",
  "EN": "Waiting",
  "ES": "Espera",
  "FR": "Attente",
  "IT": "Attesa"
 },
 "badgePunctual": {
  "PT": "Um carro por reserva",
  "EN": "One car per booking",
  "ES": "Un coche por reserva",
  "FR": "Une voiture par réservation",
  "IT": "Un'auto per prenotazione"
 },
 "headline": {
  "PT": "O voo atrasou.",
  "EN": "The flight was late.",
  "ES": "El vuelo se retrasó.",
  "FR": "Le vol a eu du retard.",
  "IT": "Il volo era in ritardo."
 },
 "headlineHighlight": {
  "PT": "O motorista já sabia.",
  "EN": "The driver already knew.",
  "ES": "El conductor ya lo sabía.",
  "FR": "Le chauffeur le savait déjà.",
  "IT": "L'autista lo sapeva già."
 },
 "fleetFeature3": {
  "PT": "Suporte por WhatsApp",
  "EN": "WhatsApp support",
  "ES": "Soporte por WhatsApp",
  "FR": "Assistance par WhatsApp",
  "IT": "Assistenza su WhatsApp"
 },
 "heroEyebrow": {
  "PT": "MONITORIZAÇÃO ATIVA · LISBOA E REGIÃO",
  "EN": "LIVE MONITORING · LISBON AREA",
  "ES": "MONITORIZACIÓN ACTIVA · LISBOA Y SU REGIÓN",
  "FR": "SURVEILLANCE ACTIVE · LISBONNE ET SA RÉGION",
  "IT": "MONITORAGGIO ATTIVO · LISBONA E DINTORNI"
 },
 "partnersDesc": {
  "PT": "O nosso Cérebro não olha para a bandeira do avião nem para o aeroporto de onde descolou. Liga-se diretamente ao sinal de radar de cada aeronave que se aproxima de Lisboa. Se está a voar para Lisboa, já está no nosso radar.",
  "EN": "Our Brain doesn't look at the airline logo or where you took off from. It connects directly to the radar signal of every aircraft approaching Lisbon. If you're flying to Lisbon, you're already on our radar.",
  "ES": "Nuestro Cerebro no mira la bandera del avión ni el aeropuerto desde donde despegaste. Se conecta directamente a la señal de radar de cada aeronave que se acerca a Lisboa. Si estás volando a Lisboa, ya estás en nuestro radar.",
  "FR": "Notre Cerveau ne regarde pas le drapeau de l'avion ni l'aéroport d'où vous avez décollé. Il se connecte directement au signal radar de chaque aéronef qui s'approche de Lisbonne. Si vous volez vers Lisbonne, vous êtes déjà sur notre radar.",
  "IT": "Il nostro Cervello non guarda la bandiera dell'aereo o l'aeroporto da cui sei decollato. Si collega direttamente al segnale radar di ogni aeromobile che si avvicina a Lisbona. Se stai volando verso Lisbona, sei già sul nostro radar."
 },
 "fleetDesc": {
  "PT": "O sistema que monitoriza o seu voo é o mesmo que coordena o carro à sua espera.",
  "EN": "The system tracking your flight is the same one coordinating the car waiting for you.",
  "ES": "El sistema que monitoriza su vuelo es el mismo que coordina el coche que le espera.",
  "FR": "Le système qui suit votre vol est le même qui coordonne la voiture qui vous attend.",
  "IT": "Il sistema che monitora il suo volo è lo stesso che coordina l'auto che la aspetta."
 },
 "cat3Line": {
  "PT": "Silencioso e discreto, para viagens de negócios.",
  "EN": "Quiet and discreet, for business travel.",
  "ES": "Silencioso y discreto, para viajes de negocios.",
  "FR": "Silencieux et discret, pour les voyages d'affaires.",
  "IT": "Silenzioso e discreto, per i viaggi di lavoro."
 },
 "fleetFeature1": {
  "PT": "Recolha ajustada à hora real do voo",
  "EN": "Pickup adjusted to the actual flight time",
  "ES": "Recogida ajustada a la hora real del vuelo",
  "FR": "Prise en charge ajustée à l'heure réelle du vol",
  "IT": "Ritiro adeguato all'orario effettivo del volo"
 }
};
const PROIBIDAS = ["90", "reembols", "refund", "rembours", "rimbors", "10 €", "€10", "Garantia", "Guarantee", "Garantía", "Garantie", "Garanzia"];
const NUMERO_WA = " (+351 968 698 138)"; // o número a seguir ao «WhatsApp da HUB», fora da frase aprovada

const ENT = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };
function decode(s) {
  return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e) => {
    if (e[0] === "#") return String.fromCodePoint(e[1] === "x" || e[1] === "X" ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10));
    return ENT[e.toLowerCase()] ?? m;
  });
}
function textoVisivel(html) {
  const body = html.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, "").replace(/<head[\s\S]*?<\/head>/i, " ");
  return decode(body.replace(/<[^>]+>/g, "")).replace(/\s+/g, " ");
}
function meta(html) {
  const t = (html.match(/<title>([\s\S]*?)<\/title>/i) || [])[1] || "";
  const d = (html.match(/<meta name="description" content="([^"]*)"/i) || [])[1] || "";
  return decode(t) + " | " + decode(d);
}

let falhas = 0;
for (const [rota, p] of Object.entries(PAGINAS)) {
  const r = await fetch(BASE + rota);
  const html = await r.text();
  const corpo = textoVisivel(html).split(NUMERO_WA).join("");
  const tudo = corpo + " | " + meta(html);
  const faltam = p.frases.filter((f) => !tudo.includes(f));
  const lang = new RegExp(`<div lang="${p.lang}"`).test(html) || rota === "/termos";
  console.log(`\n${rota}  (HTTP ${r.status})  frases: ${p.frases.length - faltam.length}/${p.frases.length}${rota === "/termos" ? "" : `  lang="${p.lang}": ${lang ? "sim" : "NÃO"}`}`);
  for (const f of faltam) console.log("  FALTA: «" + f + "»");
  if (rota !== "/termos") {
    const visto = textoVisivel(html) + " " + meta(html);
    const achadas = PROIBIDAS.filter((w) => visto.includes(w));
    console.log("  palavras antigas: " + (achadas.length ? "ACHADAS " + achadas.join(", ") : "nenhuma"));
    if (achadas.length) falhas++;
    const can = (html.match(/<link rel="canonical" href="([^"]*)"/) || [])[1] || "";
    const alt = [...html.matchAll(/<link rel="alternate" hrefLang="([^"]+)" href="([^"]+)"/gi)].map((m) => m[1]);
    console.log(`  canonical: ${can}  ·  alternates: ${alt.join(", ")}`);
    if (!can.endsWith(rota) || alt.length !== 6) falhas++;
  }
  if (faltam.length || !lang || r.status !== 200) falhas++;
}

const src = readFileSync(new URL("../src/lib/landing-translations.ts", import.meta.url), "utf8");
console.log("\nlanding-translations.ts:");
for (const [chave, porLingua] of Object.entries(TABELA)) {
  const erradas = [];
  for (const [L, texto] of Object.entries(porLingua)) {
    const ini = src.indexOf(`\n  ${L}: {`);
    const fim = src.indexOf("\n  },", ini);
    const bloco = src.slice(ini, fim);
    const m = bloco.match(new RegExp(`\\n    ${chave}:\\s*('((?:[^'\\\\]|\\\\.)*)'|"((?:[^"\\\\]|\\\\.)*)")`));
    const valor = m ? (m[2] ?? m[3]) : null;
    if (valor !== texto) erradas.push(`${L}: ${valor}`);
  }
  console.log(`  ${chave}: ${erradas.length ? "ERRADO " + erradas.join(" · ") : "as cinco certas"}`);
  if (erradas.length) falhas++;
}
// O início, nas cinco línguas (o bloco de cada língua no landing-translations.ts e o início servido, em PT):
// sem «Nós não», «Tesla», «24/7», «24h/24», Porto, Oporto ou Faro (palavras inteiras).
const INICIO_PROIBIDAS = ["Nós não", "We don't", "Nosotros no", "Pas nous", "Tesla", "24/7", "24h/24", "Porto", "Oporto", "Faro"];
const inteira = (w) => new RegExp(`(?<![\\p{L}\\d])${w}(?![\\p{L}\\d])`, "u");
console.log("\ninício, palavras que saíram:");
for (const L of ["PT", "EN", "ES", "FR", "IT"]) {
  const ini = src.indexOf(`\n  ${L}: {`);
  const fim = src.indexOf("\n  },", ini);
  const bloco = src.slice(ini, fim);
  const achadas = INICIO_PROIBIDAS.filter((w) => inteira(w).test(bloco));
  console.log(`  ${L}: ${achadas.length ? "ACHADAS " + achadas.join(", ") : "nenhuma"}`);
  if (achadas.length) falhas++;
}
{
  const r = await fetch(BASE + "/");
  const visto = textoVisivel(await r.text());
  const achadas = INICIO_PROIBIDAS.filter((w) => inteira(w).test(visto));
  console.log(`  / servido (HTTP ${r.status}): ${achadas.length ? "ACHADAS " + achadas.join(", ") : "nenhuma"}`);
  if (achadas.length || r.status !== 200) falhas++;
}
console.log(falhas ? `\n${falhas} falha(s).` : "\nTudo certo.");
process.exit(falhas ? 1 : 0);
