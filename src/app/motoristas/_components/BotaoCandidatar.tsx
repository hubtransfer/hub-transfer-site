"use client";

import { vibrarDuplo } from "../_lib/vibrar";

/** "Quero candidatar-me à vaga": leva à ficha e, no telemóvel, vibra duas vezes curtas (só com o toque da pessoa). */
export default function BotaoCandidatar() {
  return (
    <a className="mot-cta" href="#ficha" onClick={vibrarDuplo}>
      Quero candidatar-me à vaga
    </a>
  );
}
