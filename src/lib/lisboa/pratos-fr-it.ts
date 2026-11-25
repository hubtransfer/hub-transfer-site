/* Os 8 pratos, os estilos de jantar, o ambiente dos restaurantes e as legendas das vistas em francês e italiano.
   TRADUÇÃO POR REVER — a rever por um falante nativo antes de dar como final. */

import type { TextoPrato } from "./tipos";

// prettier-ignore
export const PRATOS_FR_IT: Record<number, { fr: TextoPrato; it: TextoPrato; sobre: { fr: string[]; it: string[] } }> = {
  1: {
    fr: ["Riz aux fruits de mer", "Un riz en bouillon, généreux en fruits de mer. Se commande d’habitude pour deux."],
    it: ["Riso ai frutti di mare", "Riso brodoso, ricco di frutti di mare. Di solito si ordina per due."],
    sobre: {
      fr: [
        "Du riz cuit dans un bouillon de fruits de mer et de tomate, avec des palourdes, des crevettes et souvent du tourteau ou de la langouste.",
        "Il arrive à table dans sa marmite, encore fumant, et se mange aussitôt, tant que le riz est moelleux et bien chaud.",
        "On le commande presque toujours pour deux personnes ou plus, et il s’accorde bien avec un vin blanc frais.",
      ],
      it: [
        "Riso cotto in un brodo di frutti di mare e pomodoro, con vongole, gamberi e spesso granchio o aragosta.",
        "Arriva in tavola nella pentola, ancora fumante, e si mangia subito, finché il riso è morbido e ben caldo.",
        "Si ordina quasi sempre per due o più persone e si accompagna bene con un vino bianco fresco.",
      ],
    },
  },
  2: {
    fr: ["Poulpe à la lagareiro", "Poulpe rôti à l’huile d’olive et à l’ail, avec des pommes de terre écrasées."],
    it: ["Polpo alla lagareiro", "Polpo arrosto con olio d’oliva, aglio e patate schiacciate."],
    sobre: {
      fr: [
        "Le poulpe est cuit jusqu’à devenir tendre, puis passe au four, arrosé de beaucoup d’huile d’olive et d’ail.",
        "Le « lagareiro » était celui qui travaillait au moulin à huile : le nom vient de cette huile généreuse.",
        "Il est servi avec de petites pommes de terre rôties dans leur peau et ouvertes d’un coup de poing. Trempez-les dans l’huile du plat.",
      ],
      it: [
        "Il polpo viene lessato finché diventa tenero e poi passa al forno, condito con molto olio d’oliva e aglio.",
        "Il «lagareiro» era chi lavorava al frantoio: il nome viene da quell’olio generoso.",
        "Arriva con patate piccole, arrostite con la buccia e aperte con un pugno. Le intinga nell’olio della teglia.",
      ],
    },
  },
  3: {
    fr: ["Bacalhau à Brás", "Morue effilochée, pommes paille et œuf. On dit qu’il existe plus de 365 recettes de morue."],
    it: ["Bacalhau à Brás", "Baccalà sfilacciato, patate fiammifero e uovo. Si dice che esistano più di 365 ricette di baccalà."],
    sobre: {
      fr: [
        "De la morue effilochée, sautée avec de l’oignon et des pommes paille, puis enrobée d’œufs brouillés.",
        "On la termine avec du persil haché et des olives noires. L’œuf doit rester crémeux, jamais sec.",
        "On dit qu’il est né dans une taverne du Bairro Alto. C’est aujourd’hui l’un des plats de morue les plus commandés à Lisbonne, au déjeuner comme au dîner.",
      ],
      it: [
        "Baccalà sfilacciato, saltato con cipolla e patate fiammifero e avvolto nell’uovo strapazzato.",
        "Si completa con prezzemolo tritato e olive nere. L’uovo deve restare cremoso, mai asciutto.",
        "Si dice che sia nato in una taverna del Bairro Alto. Oggi è uno dei piatti di baccalà più ordinati a Lisbona, a pranzo e a cena.",
      ],
    },
  },
  4: {
    fr: ["Cataplana de fruits de mer", "Cuisinée dans une marmite en cuivre qui se ferme comme un coquillage."],
    it: ["Cataplana di frutti di mare", "Cucinata in una pentola di rame che si chiude come una conchiglia."],
    sobre: {
      fr: [
        "La cataplana est une marmite en cuivre venue de l’Algarve, faite de deux moitiés qui se ferment comme un coquillage.",
        "À l’intérieur, les fruits de mer cuisent dans leur propre vapeur, avec tomate, oignon, poivron et vin blanc.",
        "On l’ouvre à table, devant les convives, et elle est faite pour être partagée. Gardez du pain pour la sauce.",
      ],
      it: [
        "La cataplana è una pentola di rame, originaria dell’Algarve, con due metà che si chiudono come una conchiglia.",
        "All’interno, i frutti di mare cuociono nel loro vapore, con pomodoro, cipolla, peperone e vino bianco.",
        "Si apre a tavola, davanti a chi mangia, ed è fatta per essere condivisa. Tenga un po’ di pane per il sugo.",
      ],
    },
  },
  5: {
    fr: ["Plateau de fruits de mer", "Les fruits de mer de notre côte, à partager à table. Le repas de fête des Lisboètes."],
    it: ["Plateau di frutti di mare", "Frutti di mare della nostra costa, da condividere a tavola. Il pasto di festa dei lisbonesi."],
    sobre: {
      fr: [
        "Un plateau avec les fruits de mer du jour : crevettes, palourdes, tourteau, pouces-pieds et ce que la saison apporte.",
        "Il se mange avec les doigts et sans se presser, en cassant les carapaces au maillet en bois et en tartinant le tourteau sur du pain.",
        "On le commande pour plusieurs personnes, avec une bière fraîche ou un vin blanc. À Lisbonne, certains terminent avec un « prego », un sandwich au steak.",
      ],
      it: [
        "Un vassoio con i frutti di mare del giorno: gamberi, vongole, granchio, percebes e ciò che offre la stagione.",
        "Si mangia con le mani e senza fretta, rompendo i gusci con il martelletto di legno e spalmando il granchio sul pane.",
        "Si ordina per più persone, con una birra fresca o un vino bianco. A Lisbona c’è chi finisce con un «prego», un panino con la bistecca.",
      ],
    },
  },
  6: {
    fr: ["Palourdes à la Bulhão Pato", "À l’ail, à la coriandre et au citron. La sauce appelle le pain."],
    it: ["Vongole alla Bulhão Pato", "Con aglio, coriandolo e limone. Il sugo chiama il pane."],
    sobre: {
      fr: [
        "Des palourdes ouvertes sur le feu dans l’huile d’olive et l’ail, avec de la coriandre fraîche et quelques gouttes de citron.",
        "Le nom rend hommage à Raimundo Bulhão Pato, poète portugais du XIXe siècle.",
        "Elles se servent en entrée ou en petite assiette, au milieu de la table. La sauce qui reste au fond est pour le pain.",
      ],
      it: [
        "Vongole aperte sul fuoco in olio d’oliva e aglio, con coriandolo fresco e qualche goccia di limone.",
        "Il nome rende omaggio a Raimundo Bulhão Pato, poeta portoghese dell’Ottocento.",
        "Si servono come antipasto o stuzzichino, al centro della tavola. Il sugo che resta sul fondo è per il pane.",
      ],
    },
  },
  7: {
    fr: ["Steak à la portugaise", "Steak sauce à l’ail, œuf au plat et frites. Le réconfort à la portugaise."],
    it: ["Bistecca alla portoghese", "Bistecca in salsa all’aglio, uovo all’occhio di bue e patatine fritte. Il comfort alla portoghese."],
    sobre: {
      fr: [
        "Un steak de bœuf poêlé à l’ail et au laurier, servi dans la sauce où il a cuit.",
        "Il est surmonté d’un œuf au plat, l’« ovo a cavalo » (l’œuf à cheval), et souvent d’une tranche de jambon cru.",
        "Il est servi avec des frites, souvent dans un plat en terre cuite. Percez le jaune et mélangez-le à la sauce.",
      ],
      it: [
        "Bistecca di manzo fritta con aglio e alloro, servita nella salsa in cui è stata cucinata.",
        "Sopra ha un uovo all’occhio di bue, l’«ovo a cavalo» (uovo a cavallo), e spesso una fetta di prosciutto crudo.",
        "Arriva con patatine fritte, spesso in un piatto di terracotta. Rompa il tuorlo e lo mescoli alla salsa.",
      ],
    },
  },
  8: {
    fr: ["Dîner avec fado", "Un dîner aux chandelles au son de la guitare portugaise. Lisbonne la nuit, sous son meilleur jour."],
    it: ["Cena con fado", "Cena a lume di candela mentre suona la chitarra portoghese. Lisbona di notte, al suo meglio."],
    sobre: {
      fr: [
        "Le fado est la chanson de Lisbonne et, depuis 2011, il fait partie du Patrimoine culturel immatériel de l’humanité de l’UNESCO.",
        "Il se chante en direct, avec la guitare portugaise et la guitare classique, dans de petites maisons d’Alfama, de la Mouraria et du Bairro Alto.",
        "On dîne entre les séries de fado. Quand la musique commence, les lumières baissent et la salle fait silence.",
      ],
      it: [
        "Il fado è la canzone di Lisbona e, dal 2011, Patrimonio culturale immateriale dell’umanità dell’UNESCO.",
        "Si canta dal vivo, con la chitarra portoghese e la chitarra classica, in piccoli locali di Alfama, della Mouraria e del Bairro Alto.",
        "Si cena tra un set di fado e l’altro. Quando la musica inizia, le luci si abbassano e la sala resta in silenzio.",
      ],
    },
  },
};

// prettier-ignore
export const ESTILOS_FR_IT: Record<string, { fr: TextoPrato; it: TextoPrato }> = {
  equipa: {
    fr: ["Laissez-nous faire", "Nous vous suggérons le restaurant qui correspond à vos goûts."],
    it: ["Lasci fare a noi", "Le suggeriamo il ristorante giusto per i suoi gusti."],
  },
  peixe: {
    fr: ["Poissons et fruits de mer", "Riz aux fruits de mer, poulpe, palourdes."],
    it: ["Pesce e frutti di mare", "Riso ai frutti di mare, polpo, vongole."],
  },
  tradicional: {
    fr: ["Cuisine traditionnelle", "Morue, porc, tavernes typiques."],
    it: ["Cucina tradizionale", "Baccalà, maiale, taverne tipiche."],
  },
  fado: {
    fr: ["Dîner avec fado", "Fado en direct, à Alfama ou au Bairro Alto."],
    it: ["Cena con fado", "Fado dal vivo, ad Alfama o nel Bairro Alto."],
  },
};

// prettier-ignore
export const AMBIENTE_FR_IT: Record<string, { fr: string; it: string }> = {
  R01: { fr: "Une petite adresse toujours pleine, dédiée au riz aux fruits de mer.", it: "Un piccolo locale sempre pieno, dedicato al riso ai frutti di mare." },
  R02: { fr: "Une terrasse sur la plus grande place de Lisbonne, avec des fruits de mer frais.", it: "Una terrazza sulla piazza più grande di Lisbona, con frutti di mare freschi." },
  R03: { fr: "Une salle chaleureuse, connue pour son poulpe.", it: "Una sala accogliente, nota per il polpo." },
  R04: { fr: "Une vieille taverne où les clients laissent leur cravate au plafond, célèbre pour son poulpe à la lagareiro.", it: "Una vecchia taverna dove i clienti lasciano la cravatta sul soffitto, famosa per il polpo alla lagareiro." },
  R05: { fr: "Un bel espace, dédié à la morue et à ses nombreuses recettes.", it: "Un bel locale, dedicato al baccalà e alle sue tante ricette." },
  R06: { fr: "Des cataplanas à partager, au cœur de la Baixa.", it: "Cataplane da condividere, nel cuore della Baixa." },
  R07: { fr: "La maison de fruits de mer la plus célèbre de Lisbonne.", it: "La casa di frutti di mare più famosa di Lisbona." },
  R08: { fr: "Une petite salle, avec du fado en direct pendant le dîner.", it: "Una piccola sala, con fado dal vivo durante la cena." },
  R09: { fr: "Du fado en direct dans la Mouraria, l’un des berceaux du fado.", it: "Fado dal vivo nella Mouraria, una delle culle del fado." },
  R10: { fr: "Une terrasse avec vue sur le château, le fleuve et Alfama.", it: "Una terrazza con vista sul castello, sul fiume e su Alfama." },
  R11: { fr: "Une terrasse au bord du fleuve, avec le coucher de soleil et le pont.", it: "Una terrazza sul fiume, con il tramonto e il ponte." },
};

export const VISTAS_FR_IT: Record<string, { fr: string; it: string }> = {
  R10: { fr: "Vue depuis Graça", it: "Vista da Graça" },
  R11: { fr: "Vue depuis Belém", it: "Vista da Belém" },
};
