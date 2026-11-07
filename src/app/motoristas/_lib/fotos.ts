/* Reduz a foto no telemóvel antes do envio: lado maior com 1600 px, JPEG com menos de 1 MB.
   Assim o envio não falha com dados móveis. O <img> do browser já aplica a rotação EXIF da câmara. */

const LADO_MAX = 1600;
const LIMITE = 1_000_000; // bytes
const QUALIDADES = [0.85, 0.75, 0.65, 0.55];

function carregar(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("formato"));
    };
    img.src = url;
  });
}

function paraBlob(canvas: HTMLCanvasElement, q: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", q));
}

/** Devolve um JPEG reduzido, ou lança Error("formato") se o browser não conseguir abrir a imagem (ex.: HEIC no Android). */
export async function reduzirFoto(file: File): Promise<Blob> {
  const img = await carregar(file);
  let escala = Math.min(1, LADO_MAX / Math.max(img.naturalWidth, img.naturalHeight));

  for (let tentativa = 0; tentativa < 4; tentativa++) {
    const w = Math.max(1, Math.round(img.naturalWidth * escala));
    const h = Math.max(1, Math.round(img.naturalHeight * escala));
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("formato");
    ctx.fillStyle = "#fff"; // PNG com transparência fica com fundo branco, não preto
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(img, 0, 0, w, h);
    for (const q of QUALIDADES) {
      const blob = await paraBlob(canvas, q);
      if (blob && blob.size < LIMITE) return blob;
    }
    escala *= 0.8;
  }
  throw new Error("tamanho");
}
