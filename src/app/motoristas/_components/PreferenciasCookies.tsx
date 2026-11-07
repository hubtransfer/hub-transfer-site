"use client";

import { EVENTO_ABRIR_COOKIES } from "../_lib/medicao";

/** Link do rodapé para voltar a abrir o aviso e mudar a escolha. */
export default function PreferenciasCookies() {
  return (
    <a
      href="#"
      onClick={(e) => {
        e.preventDefault();
        window.dispatchEvent(new Event(EVENTO_ABRIR_COOKIES));
      }}
    >
      Preferências de cookies
    </a>
  );
}
