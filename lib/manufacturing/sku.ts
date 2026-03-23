import { formatYmdIST } from "@/lib/manufacturing/ist";

/** Three-letter code from A–Z only; never "FAB" (would duplicate the FAB- prefix visually / collide with defaults). */
function spreadLetters(letters: string): string {
  const len = letters.length;
  if (len === 0) return "XXX";
  if (len === 1) return (letters + "XX").slice(0, 3);
  if (len === 2) return (letters[0] + letters[1] + letters[0]).slice(0, 3);
  const i0 = 0;
  const i1 = Math.max(1, Math.floor(len / 3));
  const i2 = Math.max(2, Math.floor((2 * len) / 3));
  let s =
    letters[i0] +
    letters[Math.min(i1, len - 1)] +
    letters[Math.min(i2, len - 1)];
  if (s === "FAB") {
    s = letters[0] + letters[1] + letters[len - 1];
  }
  if (s === "FAB") {
    s = "F" + letters[1] + letters[len - 1];
  }
  return s.slice(0, 3);
}

function initialsFromName(name: string): string {
  const raw = name.trim();
  if (!raw) return "XXX";

  const parts = raw.split(/\s+/).filter(Boolean).slice(0, 3);
  if (parts.length >= 2) {
    let s = parts
      .map((p) => {
        const m = p.match(/[a-zA-Z]/);
        return m ? m[0].toUpperCase() : "";
      })
      .join("");
    if (s.length < 2) {
      const letters = raw.toUpperCase().replace(/[^A-Z]/g, "");
      s = spreadLetters(letters);
    }
    if (!s.replace(/X/g, "")) s = "X";
    return s.slice(0, 3).padEnd(3, "X");
  }

  const letters = parts[0].toUpperCase().replace(/[^A-Z]/g, "");
  if (!letters) return "XXX";
  const s = spreadLetters(letters);
  return s.slice(0, 3).padEnd(3, "X");
}

function randomDigits4(): string {
  return String(Math.floor(1000 + Math.random() * 9000));
}

export function suggestFabricSku(name: string): string {
  return `FAB-${initialsFromName(name)}-${randomDigits4()}`;
}

/** BCH-YYYYMMDD-XXXX (date in IST, XXXX random digits) */
export function suggestBatchCode(): string {
  const ymd = formatYmdIST();
  return `BCH-${ymd}-${randomDigits4()}`;
}
