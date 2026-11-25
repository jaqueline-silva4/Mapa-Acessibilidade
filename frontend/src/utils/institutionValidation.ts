export function onlyDigits(value: string): string {
  return value.replace(/\D/g, "");
}

export function formatCnpjInput(value: string): string {
  const digits = onlyDigits(value).slice(0, 14);
  if (digits.length <= 2) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 2)}.${digits.slice(2)}`;
  if (digits.length <= 8) {
    return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`;
  }
  if (digits.length <= 12) {
    return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`;
  }
  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`;
}

export function isValidCnpj(value: string): boolean {
  const digits = onlyDigits(value);
  if (digits.length !== 14) return false;
  if (/^(\d)\1{13}$/.test(digits)) return false;

  const calcDigit = (base: string, weights: number[]): number => {
    let sum = 0;
    for (let i = 0; i < weights.length; i += 1) {
      sum += Number(base[i]) * weights[i];
    }
    const remainder = sum % 11;
    return remainder < 2 ? 0 : 11 - remainder;
  };

  const first = calcDigit(
    digits.slice(0, 12),
    [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
  );
  if (first !== Number(digits[12])) return false;

  const second = calcDigit(
    digits.slice(0, 13),
    [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
  );
  return second === Number(digits[13]);
}

export function formatPhoneInput(value: string): string {
  const digits = onlyDigits(value).slice(0, 11);
  if (digits.length === 0) return "";
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 6) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  }
  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

export function isValidPhone(value: string): boolean {
  const digits = onlyDigits(value);
  if (digits.length !== 10 && digits.length !== 11) return false;
  if (/^(\d)\1+$/.test(digits)) return false;
  const ddd = Number(digits.slice(0, 2));
  return ddd >= 11 && ddd <= 99;
}

export function isValidEmail(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > 254) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(trimmed);
}

const DOMAIN_REGEX =
  /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/;

export function normalizeDomainInput(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .split("/")[0]
    .split(":")[0]
    .replace(/\.+$/, "");
}

export function isValidCustomDomain(value: string): boolean {
  const normalized = normalizeDomainInput(value);
  if (!normalized) return true;
  return normalized.length <= 253 && DOMAIN_REGEX.test(normalized);
}

export interface InstitutionFieldErrors {
  cnpj?: string;
  phone?: string;
  email?: string;
  customDomain?: string;
}

export function validateInstitutionContactFields(values: {
  cnpj: string;
  phone: string;
  email: string;
  customDomain?: string;
}): InstitutionFieldErrors {
  const errors: InstitutionFieldErrors = {};

  if (!isValidCnpj(values.cnpj)) {
    errors.cnpj = "CNPJ inválido. Verifique os 14 dígitos informados.";
  }

  if (!isValidPhone(values.phone)) {
    errors.phone = "Telefone inválido. Informe DDD + 8 ou 9 dígitos.";
  }

  if (!isValidEmail(values.email)) {
    errors.email = "E-mail inválido. Ex.: contato@instituicao.org.br";
  }

  if (
    values.customDomain !== undefined &&
    !isValidCustomDomain(values.customDomain)
  ) {
    errors.customDomain =
      "Domínio inválido. Ex.: acessibilidade.ifce.edu.br";
  }

  return errors;
}

export function extractCoordinatesFromGoogleMapsUrl(
  rawUrl: string
): { latitude: number; longitude: number } | null {
  const url = rawUrl.trim();
  if (!url) return null;

  const patterns = [
    /@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/,
    /!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/,
    /[?&](?:q|ll|query)=(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      const latitude = Number(match[1]);
      const longitude = Number(match[2]);
      if (
        Number.isFinite(latitude) &&
        latitude >= -90 &&
        latitude <= 90 &&
        Number.isFinite(longitude) &&
        longitude >= -180 &&
        longitude <= 180
      ) {
        return { latitude, longitude };
      }
    }
  }

  return null;
}
