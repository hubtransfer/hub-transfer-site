/* Marcas e modelos mais comuns em Portugal, para o passo 2 da pré-inscrição.
   Lista fixa dentro do projeto (sem serviço externo). "Outra"/"Outro" abre um campo para escrever.
   Para acrescentar um modelo, basta pô-lo na lista da marca. */

export const MARCAS: Record<string, string[]> = {
  Toyota: ["Aygo X", "Yaris", "Yaris Cross", "Corolla", "Corolla Touring Sports", "C-HR", "RAV4", "Prius", "Camry", "bZ4X", "Auris", "Proace City Verso"],
  Tesla: ["Model 3", "Model Y", "Model S", "Model X"],
  Kia: ["Picanto", "Rio", "Ceed", "Ceed SW", "XCeed", "Stonic", "Niro", "Sportage", "Sorento", "EV3", "EV6", "EV9"],
  Hyundai: ["i10", "i20", "i30", "i30 SW", "Bayon", "Kona", "Tucson", "Santa Fe", "Ioniq", "Ioniq 5", "Ioniq 6", "Elantra"],
  Peugeot: ["108", "208", "2008", "308", "308 SW", "3008", "408", "508", "5008", "Rifter", "Traveller"],
  Renault: ["Clio", "Captur", "Mégane", "Mégane E-Tech", "Arkana", "Austral", "Kadjar", "Scénic", "Espace", "Zoe", "Talisman", "Kangoo", "Trafic"],
  Dacia: ["Sandero", "Sandero Stepway", "Logan", "Duster", "Jogger", "Spring", "Bigster"],
  Nissan: ["Micra", "Note", "Juke", "Qashqai", "X-Trail", "Leaf", "Ariya", "Pulsar"],
  "Mercedes-Benz": ["Classe A", "Classe B", "Classe C", "Classe E", "Classe S", "CLA", "GLA", "GLB", "GLC", "GLE", "EQA", "EQB", "EQC", "EQE", "Classe V", "Vito"],
  BMW: ["Série 1", "Série 2", "Série 3", "Série 4", "Série 5", "Série 7", "X1", "X2", "X3", "X5", "iX1", "iX3", "i4", "i5", "iX"],
  Volkswagen: ["Polo", "Golf", "Golf Variant", "T-Cross", "T-Roc", "Taigo", "Tiguan", "Tiguan Allspace", "Passat", "Passat Variant", "Arteon", "Touran", "Sharan", "ID.3", "ID.4", "ID.7", "ID. Buzz", "Caddy", "Multivan"],
  Skoda: ["Fabia", "Scala", "Kamiq", "Octavia", "Octavia Break", "Karoq", "Kodiaq", "Superb", "Superb Break", "Enyaq", "Elroq"],
  Seat: ["Ibiza", "Arona", "Leon", "Leon ST", "Ateca", "Tarraco", "Alhambra"],
  Cupra: ["Born", "Formentor", "Leon", "Ateca", "Tavascan"],
  MG: ["MG3", "MG4", "MG5", "ZS", "HS", "Marvel R"],
  BYD: ["Dolphin", "Dolphin Surf", "Atto 2", "Atto 3", "Seal", "Seal U", "Han", "Tang"],
  "Citroën": ["C1", "C3", "C3 Aircross", "C4", "C4 X", "C5 Aircross", "C5 X", "Berlingo", "SpaceTourer"],
  Ford: ["Fiesta", "Focus", "Puma", "EcoSport", "Kuga", "Mondeo", "Mustang Mach-E", "S-Max", "Galaxy", "Tourneo Connect", "Tourneo Custom"],
  Opel: ["Corsa", "Astra", "Astra Sports Tourer", "Mokka", "Crossland", "Grandland", "Insignia", "Combo Life", "Zafira", "Zafira Life"],
  Fiat: ["Panda", "500", "500e", "500X", "600", "Tipo", "Tipo Station Wagon", "Doblò"],
  Honda: ["Jazz", "Civic", "HR-V", "ZR-V", "CR-V", "e:Ny1"],
  Volvo: ["EX30", "XC40", "EX40", "XC60", "XC90", "S60", "S90", "V60", "V90"],
  Lexus: ["LBX", "CT", "UX", "NX", "RX", "ES", "RZ"],
  Mitsubishi: ["Space Star", "ASX", "Eclipse Cross", "Outlander"],
};

export const LISTA_MARCAS = Object.keys(MARCAS);
export const OUTRA_MARCA = "Outra";
export const OUTRO_MODELO = "Outro";
export const ANO_MINIMO = 2012;
export const MAIS_ANTIGO = "Mais antigo";

/** Anos de hoje até 2012, mais "Mais antigo". */
export function listaAnos(anoAtual = new Date().getFullYear()): string[] {
  const anos: string[] = [];
  for (let a = anoAtual; a >= ANO_MINIMO; a--) anos.push(String(a));
  anos.push(MAIS_ANTIGO);
  return anos;
}

/** Comparação sem acentos nem maiúsculas, para a pesquisa de marcas. */
export function normalizar(t: string): string {
  return t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
}
