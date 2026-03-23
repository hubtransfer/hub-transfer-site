// =====================================================
// HUB Transfer — Types, Constants & Business Logic
// Extracted from frontend-hotel-atual.html (v9.0)
// =====================================================

// ─── Types ───
export interface Transfer {
  id: number;
  nomeCliente: string;
  referencia: string;
  tipoServico: string;
  tourSelecionado: string;
  tourNome?: string;
  numeroPessoas: number;
  numeroBagagens: number;
  data: string;
  contacto: string;
  numeroVoo: string;
  origem: string;
  destino: string;
  horaPickup: string;
  valorTotal: number;
  valorHotel: number;
  valorHUB: number;
  comissaoRecepcao: number;
  modoPagamento: string;
  pagoParaQuem: string;
  status: string;
  observacoes: string;
  created: string;
}

export interface ActiveFilters {
  dateStart: string | null;
  dateEnd: string | null;
  status: string;
  cliente: string;
  quickPeriod: string;
  tipoServico: string;
}

export interface TourData {
  name: string;
  price?: number;
  priceSmall?: number;
  priceLarge?: number;
  type: "regular" | "private";
}

// ─── Constants ───
export const WEBAPP_URL =
  "https://script.google.com/macros/s/AKfycbwpiWkRZHm0ZDQ7AydqWBWsHXvpiS9VnevS9BpHGYB8sE1Rghy4zYIdwOTvdV2FhLb4rg/exec";
export const TEST_EMAIL = "juniorgutierezbega@gmail.com";
export const SPREADSHEET_ID =
  "15zfdrXZaR49HrVsHzpszLLbqFKCenvMn11IvMkYSMHI";

export const TOURS_DATA: Record<string, TourData> = {
  "tour-sintra-cascais": {
    name: "Sintra e Cascais (8h)",
    price: 67,
    type: "regular",
  },
  "tour-fatima-obidos": {
    name: "Fátima e Óbidos (8h)",
    price: 83,
    type: "regular",
  },
  "tour-combo-2dias": {
    name: "Combo 2 Dias (16h)",
    price: 138,
    type: "regular",
  },
  "private-sintra-palaces": {
    name: "Private Palaces of Sintra",
    priceSmall: 347,
    priceLarge: 492,
    type: "private",
  },
  "private-evora": {
    name: "Private Évora City",
    priceSmall: 347,
    priceLarge: 492,
    type: "private",
  },
  "private-templars": {
    name: "Private Templars",
    priceSmall: 347,
    priceLarge: 492,
    type: "private",
  },
  "private-arrabida": {
    name: "Private Arrábida",
    priceSmall: 347,
    priceLarge: 492,
    type: "private",
  },
};

export const DEFAULT_FILTERS: ActiveFilters = {
  dateStart: null,
  dateEnd: null,
  status: "",
  cliente: "",
  quickPeriod: "",
  tipoServico: "",
};

// ─── Emoji Helpers ───
export function getTimeEmoji(time: string): string {
  if (!time) return "🕐";
  const hour = parseInt(time.split(":")[0]);
  const emojis = [
    "🕛",
    "🕐",
    "🕑",
    "🕒",
    "🕓",
    "🕔",
    "🕕",
    "🕖",
    "🕗",
    "🕘",
    "🕙",
    "🕚",
  ];
  if (hour >= 0 && hour <= 11) return emojis[hour];
  if (hour >= 12 && hour <= 23) return emojis[hour - 12];
  return "🕐";
}

export function getLocationEmoji(location: string): string {
  if (!location) return "📍";
  const loc = location.toLowerCase();
  if (loc.includes("aeroporto") || loc.includes("airport")) return "✈️";
  if (loc.includes("hotel")) return "🏨";
  if (loc.includes("estação") || loc.includes("train")) return "🚂";
  if (loc.includes("porto") || loc.includes("port")) return "🚢";
  return "📍";
}

export function getPeopleEmoji(count: number): string {
  if (count === 1) return "👤";
  if (count === 2) return "👥";
  if (count <= 4) return "👨‍👩‍👧‍👦";
  if (count <= 8) return "👨‍👩‍👧‍👦👨‍👩‍👧‍👦";
  return "🎉";
}

export function getBaggageEmoji(count: number): string {
  if (count === 0) return "🎒";
  if (count === 1) return "🧳";
  if (count <= 3) return "🧳🧳";
  return "🧳🧳🧳";
}

// ─── Date Formatting ───
export function formatDisplayDate(dateString: string): string {
  if (!dateString) return "";
  try {
    if (dateString.includes("/")) return dateString;
    if (dateString.includes("-")) {
      const [year, month, day] = dateString.split("-");
      return `${day}/${month}/${year}`;
    }
    const date = new Date(dateString);
    const dia = String(date.getDate()).padStart(2, "0");
    const mes = String(date.getMonth() + 1).padStart(2, "0");
    const ano = date.getFullYear();
    return `${dia}/${mes}/${ano}`;
  } catch {
    return dateString;
  }
}

export function formatDateForInput(date: Date | string): string {
  if (date instanceof Date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }
  if (typeof date === "string") {
    if (date.includes("/")) {
      const [day, month, year] = date.split("/");
      return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
    }
    if (date.includes("-")) return date;
  }
  return "";
}

export function parseServiceDate(dateStr: string): Date | null {
  if (!dateStr) return null;
  try {
    let date: Date;
    if (dateStr.includes("/")) {
      const [day, month, year] = dateStr.split("/").map((n) => parseInt(n));
      date = new Date(year, month - 1, day);
    } else if (dateStr.includes("-")) {
      const [year, month, day] = dateStr.split("-").map((n) => parseInt(n));
      date = new Date(year, month - 1, day);
    } else {
      date = new Date(dateStr);
    }
    if (isNaN(date.getTime())) return null;
    return date;
  } catch {
    return null;
  }
}

// ─── Normalize time from backend ───
export function normalizeTime(horaPickup: string | Date | null): string {
  if (!horaPickup) return "";
  if (typeof horaPickup === "object" && "getHours" in horaPickup) {
    const h = (horaPickup as Date).getHours().toString().padStart(2, "0");
    const m = (horaPickup as Date).getMinutes().toString().padStart(2, "0");
    return `${h}:${m}`;
  }
  if (typeof horaPickup === "string") {
    const match = horaPickup.match(/(\d{1,2}):(\d{2})/);
    if (match) {
      return `${match[1].padStart(2, "0")}:${match[2]}`;
    }
  }
  return String(horaPickup);
}

// ─── Price Calculation ───
export function calculatePrices(
  serviceType: string,
  valorTotal: number
): { valorHotel: number; valorHUB: number; comissaoRecepcao: number } {
  const valorHotel = valorTotal * 0.3;
  const comissaoRecepcao =
    serviceType === "tour" || serviceType === "private" ? 5.0 : 2.0;
  const valorHUB = valorTotal - valorHotel - comissaoRecepcao;
  return { valorHotel, valorHUB, comissaoRecepcao };
}

export function getTourPrice(
  tourKey: string,
  pessoas: number,
  serviceType: string
): number {
  const tour = TOURS_DATA[tourKey];
  if (!tour) return 0;
  if (tour.type === "regular" && tour.price) {
    return tour.price * (pessoas > 0 ? pessoas : 1);
  }
  if (tour.type === "private") {
    return pessoas <= 3
      ? tour.priceSmall ?? 0
      : tour.priceLarge ?? 0;
  }
  return 0;
}

export function getTourUnitPrice(
  tourKey: string,
  pessoas: number
): number {
  const tour = TOURS_DATA[tourKey];
  if (!tour) return 0;
  if (tour.type === "regular") return tour.price ?? 0;
  if (tour.type === "private") {
    return pessoas <= 3
      ? tour.priceSmall ?? 0
      : tour.priceLarge ?? 0;
  }
  return 0;
}

// ─── Normalize transfer from backend ───
export function normalizeTransfer(
  transfer: Record<string, unknown>
): Transfer {
  return {
    id: (transfer.ID as number) || (transfer.id as number) || 0,
    nomeCliente:
      (transfer.Cliente as string) ||
      (transfer.nomeCliente as string) ||
      "",
    referencia:
      (transfer["Referência"] as string) ||
      (transfer.referencia as string) ||
      "",
    tipoServico:
      (transfer["Tipo Serviço"] as string) ||
      (transfer.tipoServico as string) ||
      "Transfer",
    tourSelecionado: (transfer.tourSelecionado as string) || "",
    numeroPessoas:
      parseInt(
        String(transfer.Pessoas || transfer.numeroPessoas)
      ) || 0,
    numeroBagagens:
      parseInt(
        String(transfer.Bagagens || transfer.numeroBagagens)
      ) || 0,
    data:
      (transfer.Data as string) || (transfer.data as string) || "",
    contacto:
      (transfer.Contacto as string) ||
      (transfer.contacto as string) ||
      "",
    numeroVoo:
      (transfer.Voo as string) ||
      (transfer.numeroVoo as string) ||
      "",
    origem:
      (transfer.Origem as string) ||
      (transfer.origem as string) ||
      "",
    destino:
      (transfer.Destino as string) ||
      (transfer.destino as string) ||
      "",
    horaPickup: normalizeTime(
      (transfer["Hora Pick-up"] as string) ||
        (transfer.horaPickup as string) ||
        ""
    ),
    valorTotal:
      parseFloat(
        String(
          transfer["Preço Cliente (€)"] ||
            transfer.precoCliente ||
            transfer.valorTotal
        )
      ) || 0,
    valorHotel:
      parseFloat(
        String(
          transfer["Valor Impire Marques Hotel (€)"] ||
            transfer.valorHotel
        )
      ) || 0,
    valorHUB:
      parseFloat(
        String(
          transfer["Valor HUB Transfer (€)"] ||
            transfer.valorHub ||
            transfer.valorHUB
        )
      ) || 0,
    comissaoRecepcao:
      parseFloat(
        String(
          transfer["Comissão Recepção (€)"] ||
            transfer.comissaoRecepcao
        )
      ) || 0,
    modoPagamento:
      (transfer["Forma Pagamento"] as string) ||
      (transfer.modoPagamento as string) ||
      "",
    pagoParaQuem:
      (transfer["Pago Para"] as string) ||
      (transfer.pagoParaQuem as string) ||
      "",
    status:
      (transfer.Status as string) ||
      (transfer.status as string) ||
      "Solicitado",
    observacoes:
      (transfer["Observações"] as string) ||
      (transfer.observacoes as string) ||
      "",
    created:
      (transfer["Data Criação"] as string) ||
      (transfer.created as string) ||
      "",
  };
}

// ─── Filter logic ───
export function applyFilters(
  services: Transfer[],
  filters: ActiveFilters
): Transfer[] {
  let filtered = [...services];

  if (filters.dateStart || filters.dateEnd) {
    filtered = filtered.filter((service) => {
      const serviceDate = parseServiceDate(service.data);
      if (!serviceDate) return true;
      let include = true;
      if (filters.dateStart) {
        const startDate = new Date(filters.dateStart);
        include = include && serviceDate >= startDate;
      }
      if (filters.dateEnd) {
        const endDate = new Date(filters.dateEnd);
        endDate.setHours(23, 59, 59, 999);
        include = include && serviceDate <= endDate;
      }
      return include;
    });
  }

  if (filters.status) {
    filtered = filtered.filter((s) => s.status === filters.status);
  }

  if (filters.cliente) {
    const term = filters.cliente.toLowerCase();
    filtered = filtered.filter((s) =>
      s.nomeCliente.toLowerCase().includes(term)
    );
  }

  if (filters.tipoServico) {
    filtered = filtered.filter(
      (s) => s.tipoServico === filters.tipoServico
    );
  }

  return filtered;
}

// ─── Summary calculations ───
export function calculateSummary(services: Transfer[]) {
  const total = services.length;
  const pending = services.filter(
    (s) => s.status === "Solicitado"
  ).length;
  const confirmed = services.filter(
    (s) => s.status === "Confirmado"
  ).length;
  const completed = services.filter(
    (s) => s.status === "Finalizado"
  ).length;

  const totalRevenue = services.reduce(
    (sum, s) => sum + (s.valorTotal || 0),
    0
  );
  const pendingRevenue = services
    .filter((s) => s.status === "Solicitado")
    .reduce((sum, s) => sum + (s.valorTotal || 0), 0);
  const confirmedRevenue = services
    .filter((s) => s.status === "Confirmado")
    .reduce((sum, s) => sum + (s.valorTotal || 0), 0);
  const completedRevenue = services
    .filter((s) => s.status === "Finalizado")
    .reduce((sum, s) => sum + (s.valorTotal || 0), 0);

  return {
    total,
    pending,
    confirmed,
    completed,
    totalRevenue,
    pendingRevenue,
    confirmedRevenue,
    completedRevenue,
  };
}

// ─── CSV Export ───
export function exportToCSV(services: Transfer[]): void {
  if (services.length === 0) return;

  const headers = [
    "ID",
    "Cliente",
    "Referência",
    "Tipo Serviço",
    "Tour Selecionado",
    "Pessoas",
    "Bagagens",
    "Data",
    "Contacto",
    "Voo",
    "Origem",
    "Destino",
    "Hora Pick-up",
    "Valor Total",
    "Valor Hotel",
    "Valor HUB",
    "Comissão Recepção",
    "Pagamento",
    "Pago Para",
    "Status",
    "Observações",
    "Data Criação",
  ];

  let csvContent = headers.join(",") + "\n";

  services.forEach((s) => {
    const row = [
      s.id,
      `"${s.nomeCliente}"`,
      `"${s.referencia || ""}"`,
      `"${s.tipoServico || "Transfer"}"`,
      `"${s.tourSelecionado || ""}"`,
      s.numeroPessoas,
      s.numeroBagagens,
      s.data,
      `"${s.contacto}"`,
      `"${s.numeroVoo || ""}"`,
      `"${s.origem}"`,
      `"${s.destino}"`,
      s.horaPickup,
      s.valorTotal,
      s.valorHotel || 0,
      s.valorHUB || 0,
      s.comissaoRecepcao || 0,
      `"${s.modoPagamento}"`,
      `"${s.pagoParaQuem}"`,
      s.status,
      `"${s.observacoes || ""}"`,
      `"${s.created || ""}"`,
    ];
    csvContent += row.join(",") + "\n";
  });

  const blob = new Blob([csvContent], {
    type: "text/csv;charset=utf-8;",
  });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute(
    "download",
    `transfers_HUB_${new Date().toISOString().split("T")[0]}.csv`
  );
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// ─── Quick period date calculation ───
export function getQuickPeriodDates(
  period: string
): { start: string; end: string } | null {
  const today = new Date();
  let startDate: Date;
  let endDate: Date;

  switch (period) {
    case "today":
      startDate = endDate = new Date(today);
      break;
    case "yesterday":
      startDate = endDate = new Date(
        today.getTime() - 24 * 60 * 60 * 1000
      );
      break;
    case "thisWeek": {
      const dayOfWeek = today.getDay();
      const diff =
        today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
      startDate = new Date(today);
      startDate.setDate(diff);
      endDate = new Date();
      break;
    }
    case "lastWeek": {
      const lws = new Date();
      lws.setDate(today.getDate() - today.getDay() - 6);
      const lwe = new Date();
      lwe.setDate(today.getDate() - today.getDay());
      startDate = lws;
      endDate = lwe;
      break;
    }
    case "thisMonth":
      startDate = new Date(today.getFullYear(), today.getMonth(), 1);
      endDate = new Date();
      break;
    case "lastMonth": {
      const lm = new Date();
      lm.setMonth(today.getMonth() - 1);
      startDate = new Date(lm.getFullYear(), lm.getMonth(), 1);
      endDate = new Date(today.getFullYear(), today.getMonth(), 0);
      break;
    }
    case "last7days":
      startDate = new Date(
        today.getTime() - 7 * 24 * 60 * 60 * 1000
      );
      endDate = new Date();
      break;
    case "last30days":
      startDate = new Date(
        today.getTime() - 30 * 24 * 60 * 60 * 1000
      );
      endDate = new Date();
      break;
    default:
      return null;
  }

  return {
    start: formatDateForInput(startDate),
    end: formatDateForInput(endDate),
  };
}

// ─── Country code detection ───
export const COUNTRY_CODES_MAP: Record<string, string> = {
  "+351": "pt",
  "+34": "es",
  "+33": "fr",
  "+49": "de",
  "+55": "br",
  "+1": "us",
  "+44": "gb",
  "+39": "it",
  "+31": "nl",
  "+32": "be",
  "+41": "ch",
  "+43": "at",
  "+45": "dk",
  "+46": "se",
  "+47": "no",
};

export function detectCountryFromNumber(
  number: string
): string | null {
  for (let i = 4; i >= 2; i--) {
    const code = number.substring(0, i);
    if (COUNTRY_CODES_MAP[code]) return COUNTRY_CODES_MAP[code];
  }
  return null;
}
