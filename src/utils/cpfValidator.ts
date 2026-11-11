/**
 * Brazilian CPF formatting and modulo 11 validation utilities.
 */

/**
 * Formats a raw number string into CPF format: 000.000.000-00
 */
export function formatCPF(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9, 11)}`;
}

/**
 * Validates a Brazilian CPF using the official modulo 11 checksum algorithm.
 * Returns true if empty or valid (CPF is an optional field).
 */
export function isValidCPF(cpf: string): boolean {
  if (!cpf || cpf.trim() === '') return true; // Optional field

  const clean = cpf.replace(/\D/g, '');
  if (clean.length !== 11) return false;

  // Reject known invalid patterns (all digits equal)
  if (/^(\d)\1{10}$/.test(clean)) return false;

  // First verification digit calculation
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(clean.charAt(i), 10) * (10 - i);
  }
  let remainder = 11 - (sum % 11);
  const digit1 = (remainder === 10 || remainder === 11) ? 0 : remainder;
  if (digit1 !== parseInt(clean.charAt(9), 10)) return false;

  // Second verification digit calculation
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(clean.charAt(i), 10) * (11 - i);
  }
  remainder = 11 - (sum % 11);
  const digit2 = (remainder === 10 || remainder === 11) ? 0 : remainder;
  if (digit2 !== parseInt(clean.charAt(10), 10)) return false;

  return true;
}
