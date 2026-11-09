/* Vibração real do telemóvel: duas vibrações curtas (80 ms, pausa de 60 ms, 80 ms).
   Só é chamada a partir de um toque da pessoa (o botão "Quero candidatar-me à vaga" e o envio da ficha), nunca sozinha.
   No iPhone (Safari não tem navigator.vibrate) e nos computadores não faz nada nem dá erro. */
export function vibrarDuplo() {
  try {
    if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") navigator.vibrate([80, 60, 80]);
  } catch {
    /* sem vibração: não faz mal */
  }
}
