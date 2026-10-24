export function normalizeCnpj(value: string): string {
  return value.replace(/\D/g, "");
}

export function isValidCnpj(value: string): boolean {
  const cnpj = normalizeCnpj(value);
  if (cnpj.length !== 14 || /^(\d)\1{13}$/.test(cnpj)) return false;

  const calcDigit = (base: string): number => {
    let factor = base.length - 7;
    let sum = 0;
    for (const char of base) {
      sum += Number(char) * factor--;
      if (factor < 2) factor = 9;
    }
    const rest = sum % 11;
    return rest < 2 ? 0 : 11 - rest;
  };

  const first = calcDigit(cnpj.slice(0, 12));
  const second = calcDigit(cnpj.slice(0, 12) + first);
  return cnpj.endsWith(`${first}${second}`);
}

// Instituição entra com o CNPJ (só dígitos). Admin usa um identificador próprio.
export function normalizeLogin(value: string): string {
  const trimmed = value.trim();
  const digits = normalizeCnpj(trimmed);
  return digits.length === 14 ? digits : trimmed.toLowerCase();
}
