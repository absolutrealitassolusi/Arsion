const ONES = [
  "",
  "satu",
  "dua",
  "tiga",
  "empat",
  "lima",
  "enam",
  "tujuh",
  "delapan",
  "sembilan",
];

const GROUP_UNITS = ["", "ribu", "juta", "miliar", "triliun"];

/** Ubah angka 0-999 jadi kata (tanpa nama grup ribuan/jutaan/dst). */
function threeDigitsToWords(n: number): string {
  const hundreds = Math.floor(n / 100);
  const remainder = n % 100;
  const parts: string[] = [];

  if (hundreds > 0) {
    parts.push(hundreds === 1 ? "seratus" : `${ONES[hundreds]} ratus`);
  }

  if (remainder > 0) {
    if (remainder < 10) {
      parts.push(ONES[remainder]!);
    } else if (remainder === 10) {
      parts.push("sepuluh");
    } else if (remainder === 11) {
      parts.push("sebelas");
    } else if (remainder < 20) {
      parts.push(`${ONES[remainder - 10]} belas`);
    } else {
      const tens = Math.floor(remainder / 10);
      const ones = remainder % 10;
      parts.push(ones > 0 ? `${ONES[tens]} puluh ${ONES[ones]}` : `${ONES[tens]} puluh`);
    }
  }

  return parts.join(" ");
}

/** Ubah angka bulat jadi kata dalam Bahasa Indonesia, huruf kecil semua. */
export function angkaKeKata(value: number): string {
  const n = Math.floor(Math.abs(value));
  if (n === 0) return "nol";

  const groups: number[] = [];
  let remaining = n;
  while (remaining > 0) {
    groups.push(remaining % 1000);
    remaining = Math.floor(remaining / 1000);
  }

  const parts: string[] = [];
  for (let i = groups.length - 1; i >= 0; i--) {
    const group = groups[i]!;
    if (group === 0) continue;

    if (i === 1 && group === 1) {
      // 1.000 dibaca "seribu", bukan "satu ribu".
      parts.push("seribu");
      continue;
    }

    const groupWords = threeDigitsToWords(group);
    parts.push(GROUP_UNITS[i] ? `${groupWords} ${GROUP_UNITS[i]}` : groupWords);
  }

  return parts.join(" ");
}

/** Format Rupiah standar dokumen: "Tujuh Juta ... Rupiah" (Title Case + akhiran "Rupiah"). */
export function terbilangRupiah(value: number): string {
  const words = angkaKeKata(value)
    .split(" ")
    .map((word) => (word ? word[0]!.toUpperCase() + word.slice(1) : word))
    .join(" ");
  return `${words} Rupiah`;
}
