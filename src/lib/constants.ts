// HUB Transfer — Business Constants

export const COMPANY = {
  name: "HUB Transfer",
  slogan: "Transfer and Tourism",
  website: "www.hubtransferencia.com",
  email: "contacto@hubtransfer.pt",
  whatsapp: "+351968698138",
  whatsappFormatted: "+351 968 698 138",
  director: "Junior Gutierez",
  location: "Lisboa, Portugal",
  rnavt: "12529",
  nif: "PT518649903",
  legalName: "Jornadas e Possibilidades, Unipessoal Lda",
  instagram: "https://www.instagram.com/hubtransfer.pt/",
  facebook: "https://www.facebook.com/hubtransferpt",
} as const;

export const ROUTES = {
  lisboaAeroporto: 9,
  cascais: 20,
  sintra: 20,
  tourSintra: 75,
  tourFatima: 95,
} as const;

export const HOTELS = {
  elh: { name: "Empire Lisbon Hotel", code: "elh" },
  emh: { name: "Empire Marques Hotel", code: "emh" },
  lioz: { name: "Lioz", code: "lioz" },
  gda: { name: "Gota d'Água", code: "gda" },
} as const;

export const SERVICE_TYPES = ["Transfer", "Tour", "Privado"] as const;
export type ServiceType = (typeof SERVICE_TYPES)[number];

export const PAYMENT_METHODS = [
  "Dinheiro",
  "Cartão",
  "Transferência",
] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const PAID_TO_OPTIONS = [
  "Recepção",
  "Motorista",
  "Personalizado",
] as const;
export type PaidTo = (typeof PAID_TO_OPTIONS)[number];

export const BOOKING_STATUSES = [
  "Solicitado",
  "Confirmado",
  "Finalizado",
] as const;
export type BookingStatus = (typeof BOOKING_STATUSES)[number];

export const QUICK_PRICES = [25, 35, 45, 60, 75, 100] as const;

export const SUPPORTED_LOCALES = ["pt", "en", "es", "fr", "de"] as const;
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];
