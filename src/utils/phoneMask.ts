/**
 * Helper to format Brazilian telephone numbers
 * Formats:
 * - 10 digits (Landline): (11) 3456-7890
 * - 11 digits (Mobile): (11) 98765-4321
 */
export function formatPhoneBR(value: string | null | undefined): string {
  if (!value) return '';
  
  // Clean all non-digit characters
  let digits = value.replace(/\D/g, '');
  
  // If the user pastes an international number starting with 55 (Brazil country code)
  if (digits.startsWith('55') && digits.length >= 12) {
    digits = digits.slice(2);
  }
  
  // Restrict to max 11 digits
  digits = digits.slice(0, 11);
  
  if (digits.length === 0) {
    return '';
  }
  if (digits.length <= 2) {
    return `(${digits}`;
  }
  if (digits.length <= 6) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  }
  if (digits.length <= 10) {
    // 8-digit landline: (XX) XXXX-XXXX
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  // 9-digit mobile: (XX) XXXXX-XXXX
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
}

/**
 * Strips phone to numbers only (e.g. 11987654321)
 */
export function cleanPhoneDigits(value: string | null | undefined): string {
  if (!value) return '';
  let digits = value.replace(/\D/g, '');
  if (digits.startsWith('55') && digits.length >= 12) {
    digits = digits.slice(2);
  }
  return digits;
}
