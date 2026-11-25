/* «Monte a sua Lisboa»: os 21 lugares em francês e italiano.
   TRADUÇÃO POR REVER — feita a partir do português e do inglês; a rever por um falante nativo antes de dar como final. */

import type { TextoLugar } from "./tipos";

// prettier-ignore
export const LUGARES_FR_IT: Record<number, { fr: TextoLugar; it: TextoLugar }> = {
  1: {
    fr: { nome: "Praça do Comércio", txt: "La grande place ouverte sur le fleuve.", hist: "Ici se dressait le palais royal, jusqu'à ce que le tremblement de terre de 1755 le détruise. La place que vous voyez aujourd'hui est née de la reconstruction du marquis de Pombal, l'une des premières villes planifiées d'Europe." },
    it: { nome: "Praça do Comércio", txt: "La grande piazza aperta sul fiume.", hist: "Qui sorgeva il palazzo reale, finché il terremoto del 1755 non lo distrusse. La piazza che vede oggi è nata dalla ricostruzione del Marchese di Pombal, una delle prime città pianificate d'Europa." },
  },
  2: {
    fr: { nome: "Arc de la Rua Augusta", txt: "Montez au sommet de l'arc : toute la Baixa à vos pieds.", hist: "L'arc a mis plus de cent ans à être achevé : commencé après le tremblement de terre, il n'a été terminé qu'en 1875. Là-haut, le belvédère se trouve juste à côté de l'horloge." },
    it: { nome: "Arco di Rua Augusta", txt: "Salga in cima all'arco: tutta la Baixa ai suoi piedi.", hist: "L'arco richiese più di cento anni per essere completato: iniziato dopo il terremoto, fu terminato solo nel 1875. Lassù, il belvedere si trova proprio accanto all'orologio." },
  },
  3: {
    fr: { nome: "Ascenseur de Santa Justa", txt: "Du fer forgé et une vue sur la Baixa.", hist: "Beaucoup jurent qu'il est l'œuvre d'Eiffel, mais son auteur est l'un de ses disciples, Raoul Mesnier du Ponsard. Il fonctionne depuis 1902 et relie la Baixa au Largo do Carmo." },
    it: { nome: "Elevador de Santa Justa", txt: "Ferro battuto e una vista sulla Baixa.", hist: "Molti giurano che sia opera di Eiffel, ma l'autore fu un suo allievo, Raoul Mesnier du Ponsard. Funziona dal 1902 e collega la Baixa al Largo do Carmo." },
  },
  4: {
    fr: { nome: "Cathédrale de Lisbonne", txt: "La plus ancienne église de la ville.", hist: "Sa construction a commencé peu après 1147, lorsque le roi Afonso Henriques a conquis Lisbonne. Le tram 28 passe devant sa porte, sur la photo la plus classique de la ville." },
    it: { nome: "Cattedrale di Lisbona", txt: "La chiesa più antica della città.", hist: "La costruzione iniziò subito dopo il 1147, quando il re Afonso Henriques conquistò Lisbona. Davanti alla porta passa il tram 28, nella foto più classica della città." },
  },
  5: {
    fr: { nome: "Belvédère de Santa Luzia", txt: "Azulejos, bougainvilliers et les toits d'Alfama.", hist: "Observez les panneaux d'azulejos du mur : l'un d'eux montre la Praça do Comércio telle qu'elle était avant le tremblement de terre de 1755." },
    it: { nome: "Belvedere di Santa Luzia", txt: "Azulejos, buganvillee e i tetti di Alfama.", hist: "Osservi i pannelli di azulejos sul muro: uno di essi mostra la Praça do Comércio com'era prima del terremoto del 1755." },
  },
  6: {
    fr: { nome: "Château de São Jorge", txt: "Des remparts maures et la plus belle vue sur le fleuve.", hist: "Il a été pris aux Maures en 1147. Aujourd'hui, ce sont les paons qui règnent sur les jardins, et ils se promènent librement parmi les visiteurs." },
    it: { nome: "Castello di São Jorge", txt: "Mura moresche e la vista più bella sul fiume.", hist: "Fu conquistato ai mori nel 1147. Oggi i padroni dei giardini sono i pavoni, che passeggiano liberamente tra i visitatori." },
  },
  7: {
    fr: { nome: "Belvédère de la Senhora do Monte", txt: "Le plus haut belvédère de Lisbonne.", hist: "C'est le point le plus élevé parmi les belvédères de la ville. Au coucher du soleil, on voit le château, la Baixa et le pont 25 de Abril d'un seul coup d'œil." },
    it: { nome: "Belvedere della Senhora do Monte", txt: "Il belvedere più alto di Lisbona.", hist: "È il punto più alto tra i belvedere della città. Al tramonto si vedono il castello, la Baixa e il ponte 25 de Abril tutti insieme." },
  },
  8: {
    fr: { nome: "Chiado et A Brasileira", txt: "Des librairies, des cafés anciens et un poète à la porte.", hist: "Devant le café A Brasileira est assis, en bronze, Fernando Pessoa, le plus grand poète portugais, qui écrivait dans le quartier. Il y a toujours une chaise libre à côté de lui pour la photo." },
    it: { nome: "Chiado e A Brasileira", txt: "Librerie, caffè storici e un poeta sulla porta.", hist: "Davanti al caffè A Brasileira siede, in bronzo, Fernando Pessoa, il più grande poeta portoghese, che scriveva da queste parti. C'è sempre una sedia libera accanto a lui per la foto." },
  },
  9: {
    fr: { nome: "Belvédère de São Pedro de Alcântara", txt: "Le château de l'autre côté de la vallée.", hist: "Juste à côté monte et descend l'Ascensor da Glória, l'un des funiculaires qui aident les Lisboètes à vaincre les sept collines depuis le XIXe siècle." },
    it: { nome: "Belvedere di São Pedro de Alcântara", txt: "Il castello dall'altra parte della valle.", hist: "Proprio accanto sale e scende l'Ascensor da Glória, una delle funicolari che aiutano i lisbonesi a superare i sette colli dal XIX secolo." },
  },
  10: {
    fr: { nome: "Time Out Market", txt: "De nombreux chefs sous un même toit.", hist: "Il se trouve à l'intérieur du Mercado da Ribeira, qui vend du poisson et des légumes depuis plus d'un siècle. Le matin, il y a encore des étals traditionnels à côté." },
    it: { nome: "Time Out Market", txt: "Tanti chef sotto lo stesso tetto.", hist: "Si trova all'interno del Mercado da Ribeira, che vende pesce e verdura da oltre un secolo. Al mattino ci sono ancora i banchi tradizionali accanto." },
  },
  11: {
    fr: { nome: "LX Factory", txt: "Une ancienne usine pleine de vie.", hist: "C'était un complexe industriel du XIXe siècle. Aujourd'hui, on y trouve des boutiques, des restaurants et la librairie Ler Devagar, avec des étagères jusqu'au plafond et un vélo volant." },
    it: { nome: "LX Factory", txt: "Una vecchia fabbrica piena di vita.", hist: "Era un complesso industriale del XIX secolo. Oggi ospita negozi, ristoranti e la libreria Ler Devagar, con scaffali fino al soffitto e una bicicletta volante." },
  },
  12: {
    fr: { nome: "Cristo Rei", txt: "Tout Lisbonne vu depuis l'autre rive.", hist: "Inauguré en 1959, il s'inspire du Christ Rédempteur de Rio de Janeiro. C'est un vœu de reconnaissance : le Portugal est resté à l'écart de la Seconde Guerre mondiale." },
    it: { nome: "Cristo Rei", txt: "Tutta Lisbona vista dall'altra sponda.", hist: "Inaugurato nel 1959, si ispira al Cristo Redentore di Rio de Janeiro. È un voto di ringraziamento perché il Portogallo non entrò nella Seconda guerra mondiale." },
  },
  13: {
    fr: { nome: "Monastère des Hiéronymites", txt: "Le style manuélin dans toute sa splendeur.", hist: "Il a été financé par le commerce des épices qui arrivaient d'Inde. À l'intérieur se trouve le tombeau de Vasco de Gama. Fermé le lundi." },
    it: { nome: "Monastero dos Jerónimos", txt: "Lo stile manuelino in tutto il suo splendore.", hist: "Fu pagato con il commercio delle spezie che arrivavano dall'India. All'interno si trova la tomba di Vasco da Gama. Chiuso il lunedì." },
  },
  14: {
    fr: { nome: "Pastéis de Belém", txt: "Le pastel de nata là où il est né.", hist: "La recette vient des moines du monastère voisin et elle est vendue ici depuis 1837. Aujourd'hui encore, elle reste secrète, gardée par quelques maîtres pâtissiers." },
    it: { nome: "Pastéis de Belém", txt: "Il pastel de nata dove è nato.", hist: "La ricetta arrivò dai monaci del vicino monastero e qui si vende dal 1837. Ancora oggi è segreta, custodita da pochi maestri pasticcieri." },
  },
  15: {
    fr: { nome: "Monument des Découvertes", txt: "Les navigateurs de pierre face au fleuve.", hist: "Au sol, devant, s'étend une immense rose des vents avec une mappemonde, offerte par l'Afrique du Sud, qui montre les routes des navigateurs portugais." },
    it: { nome: "Monumento alle Scoperte", txt: "I navigatori di pietra sul fiume.", hist: "Sul pavimento, davanti, c'è un'enorme rosa dei venti con un mappamondo, dono del Sudafrica, che mostra le rotte dei navigatori portoghesi." },
  },
  16: {
    fr: { nome: "Tour de Belém", txt: "La sentinelle du Tage.", hist: "Construite au début du XVIe siècle pour défendre l'entrée du fleuve. Cherchez, sur l'un des murs, une tête de rhinocéros sculptée dans la pierre : elle rappelle le rhinocéros arrivé à Lisbonne en 1515." },
    it: { nome: "Torre di Belém", txt: "La sentinella del Tago.", hist: "Costruita all'inizio del XVI secolo per difendere l'ingresso del fiume. Cerchi, su una delle pareti, la testa di un rinoceronte scolpita nella pietra: ricorda il rinoceronte arrivato a Lisbona nel 1515." },
  },
  17: {
    fr: { nome: "Océanarium de Lisbonne", txt: "Tout un océan dans un seul bassin.", hist: "Il a été construit pour l'Expo 98 et possède un immense bassin central visible depuis plusieurs étages, comme si l'océan vous entourait. Idéal avec des enfants et les jours de pluie." },
    it: { nome: "Oceanario di Lisbona", txt: "Un oceano intero in una sola vasca.", hist: "Fu costruito per l'Expo 98 e ha un'enorme vasca centrale visibile da più piani, come se ci si trovasse in mezzo all'oceano. Ottimo con i bambini e nei giorni di pioggia." },
  },
  18: {
    fr: { nome: "Palais de Pena", txt: "Le palais de conte de fées, à Sintra.", hist: "Construit au XIXe siècle à la demande du roi Ferdinand II, il mêle les styles comme dans un rêve romantique. Les billets sont à horaire fixe : achetez-les en ligne à l'avance." },
    it: { nome: "Palazzo di Pena", txt: "Il palazzo da fiaba, a Sintra.", hist: "Fatto costruire nel XIX secolo dal re Ferdinando II, mescola stili come in un sogno romantico. I biglietti hanno un orario prestabilito: li acquisti online in anticipo." },
  },
  19: {
    fr: { nome: "Quinta da Regaleira", txt: "Des jardins, des grottes et un puits mystérieux.", hist: "Le célèbre Puits initiatique descend en spirale à environ 27 mètres sous terre, relié à des tunnels et à des grottes. Personne ne sait vraiment tout ce que son constructeur a voulu exprimer à travers lui." },
    it: { nome: "Quinta da Regaleira", txt: "Giardini, grotte e un pozzo misterioso.", hist: "Il famoso Pozzo Iniziatico scende a spirale per circa 27 metri nel sottosuolo, collegato a tunnel e grotte. Nessuno sa con certezza tutto ciò che il costruttore abbia voluto dire con esso." },
  },
  20: {
    fr: { nome: "Cabo da Roca", txt: "Là où l'Europe s'arrête.", hist: "C'est le point le plus occidental de l'Europe continentale. Un monument cite Camões : « Où la terre s'achève et où la mer commence »." },
    it: { nome: "Cabo da Roca", txt: "Dove finisce l'Europa.", hist: "È il punto più occidentale dell'Europa continentale. Un monumento cita Camões: «Dove la terra finisce e il mare comincia»." },
  },
  21: {
    fr: { nome: "Cascais", txt: "La station balnéaire des rois.", hist: "À la fin du XIXe siècle, la famille royale a pris l'habitude de passer l'été à Cascais, et le village de pêcheurs est devenu l'élégante station balnéaire d'aujourd'hui." },
    it: { nome: "Cascais", txt: "Il borgo di mare dei re.", hist: "Alla fine del XIX secolo la famiglia reale iniziò a trascorrere l'estate a Cascais, e il villaggio di pescatori diventò l'elegante località balneare che è oggi." },
  },
};
