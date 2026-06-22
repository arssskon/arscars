export function formatPhone(raw: string): string {
  let digits = raw.replace(/\D/g, "");
  if (digits.startsWith("7") || digits.startsWith("8")) digits = digits.slice(1);
  digits = digits.slice(0, 10);

  if (!digits) return "";

  let r = "+7 (";
  r += digits.slice(0, 3);
  if (digits.length > 3) r += ") " + digits.slice(3, 6);
  if (digits.length > 6) r += "-" + digits.slice(6, 8);
  if (digits.length > 8) r += "-" + digits.slice(8, 10);

  return r;
}
