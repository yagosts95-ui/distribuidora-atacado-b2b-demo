export type CategoryId = "grill" | "dianteiro" | "traseiro" | "congelados";

export type Product = {
  code: string;
  name: string;
  category: CategoryId;
  price: number;
};

export const categories = [
  { id: "grill" as const, label: "Linha Grill", short: "Grill" },
  { id: "dianteiro" as const, label: "Dianteiro Resfriado", short: "Dianteiro" },
  { id: "traseiro" as const, label: "Traseiro Resfriado", short: "Traseiro" },
  { id: "congelados" as const, label: "Cortes Congelados", short: "Congelados" }
];

export const products: Product[] = [
  { code: "5517", name: "Alcatra (Coração) Grill", category: "grill", price: 39 },
  { code: "5305", name: "Contra Filé Grill", category: "grill", price: 51 },
  { code: "5317", name: "Bife Chorizo", category: "grill", price: 51 },
  { code: "6605", name: "Cupim Grill", category: "grill", price: 50 },
  { code: "6105", name: "Fralda Grill", category: "grill", price: 45 },
  { code: "5803", name: "Picanha Grill", category: "grill", price: 89 },

  { code: "6301", name: "Acém com Pescoço", category: "dianteiro", price: 29 },
  { code: "6601", name: "Cupim (A)", category: "dianteiro", price: 40 },
  { code: "6603", name: "Cupim (B)", category: "dianteiro", price: 32 },
  { code: "5903", name: "Músculo do Dianteiro", category: "dianteiro", price: 27 },
  { code: "6405", name: "Paleta sem Músculo", category: "dianteiro", price: 29 },
  { code: "6201", name: "Peito", category: "dianteiro", price: 29 },

  { code: "5505", name: "Alcatra (Coração)", category: "traseiro", price: 39 },
  { code: "5501", name: "Alcatra com Maminha", category: "traseiro", price: 38 },
  { code: "5513", name: "Aranha", category: "traseiro", price: 32 },
  { code: "5307", name: "Bife Ancho", category: "traseiro", price: 44 },
  { code: "3000", name: "Bife do Vazio", category: "traseiro", price: 38 },
  { code: "5309", name: "Capa de Filé", category: "traseiro", price: 31 },
  { code: "5303", name: "Contra Filé com Noix", category: "traseiro", price: 40 },
  { code: "5209", name: "Cordão do Filé Mignon", category: "traseiro", price: 31 },
  { code: "5001", name: "Coxão Duro", category: "traseiro", price: 34 },
  { code: "5701", name: "Coxão Mole", category: "traseiro", price: 36 },
  { code: "5211", name: "Filé Mignon sem Cordão", category: "traseiro", price: 73 },
  { code: "5203", name: "Filé Mignon sem Cordão 3/4", category: "traseiro", price: 73 },
  { code: "5205", name: "Filé Mignon sem Cordão 4/5", category: "traseiro", price: 74 },
  { code: "5207", name: "Filé Mignon sem Cordão 5 UP", category: "traseiro", price: 76 },
  { code: "6101", name: "Fralda", category: "traseiro", price: 38 },
  { code: "5401", name: "Lagarto", category: "traseiro", price: 35 },
  { code: "5601", name: "Maminha da Alcatra", category: "traseiro", price: 39 },
  { code: "5901", name: "Músculo (Duro/Mole)", category: "traseiro", price: 28 },
  { code: "5101", name: "Patinho", category: "traseiro", price: 35 },
  { code: "5805", name: "Picanha", category: "traseiro", price: 50 },
  { code: "5801", name: "Picanha (A)", category: "traseiro", price: 75 },
  { code: "5807", name: "Picanha Fatiada", category: "traseiro", price: 46 },

  { code: "5314", name: "Bananinha do Contra Filé", category: "congelados", price: 37 },
  { code: "6606", name: "Costela Desossada", category: "congelados", price: 26 },
  { code: "6502", name: "Costela em Tiras", category: "congelados", price: 25 },
  { code: "6600", name: "Cupim A", category: "congelados", price: 40 },
  { code: "6602", name: "Cupim B", category: "congelados", price: 40 },
  { code: "6604", name: "Cupim Grill", category: "congelados", price: 50 },
  { code: "6002", name: "Recorte do Dianteiro", category: "congelados", price: 19 },
  { code: "6000", name: "Recorte do Traseiro", category: "congelados", price: 19 }
];

export const featuredCodes = ["6605", "5803", "5211", "5305", "5307", "6606"];
