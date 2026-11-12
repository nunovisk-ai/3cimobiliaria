/**
 * Utilitários para formatação e conversão de moeda brasileira (BRL).
 */

/**
 * Formata um número para moeda brasileira (ex: 123343 -> "R$ 123.343,00" ou "123.343,00")
 */
export function formatCurrencyBRL(
  val: number | '' | null | undefined,
  includePrefix: boolean = true,
  showDecimals: boolean = true
): string {
  if (val === '' || val === null || val === undefined || isNaN(Number(val))) {
    return '';
  }
  const num = Number(val);
  const formatted = num.toLocaleString('pt-BR', {
    minimumFractionDigits: showDecimals ? 2 : 0,
    maximumFractionDigits: 2,
  });
  return includePrefix ? `R$ ${formatted}` : formatted;
}

/**
 * Converte uma string de moeda digitada pelo usuário em um número puro (ex: "123.343,00" -> 123343)
 */
export function parseCurrencyBRL(input: string | number): number {
  if (typeof input === 'number') return isNaN(input) ? 0 : input;
  if (!input) return 0;
  
  let clean = input.replace(/[^\d.,]/g, '').trim();
  if (!clean) return 0;

  if (clean.includes('.') && clean.includes(',')) {
    // Ex: 1.234,56
    clean = clean.replace(/\./g, '').replace(',', '.');
  } else if (clean.includes(',')) {
    // Ex: 1234,56
    clean = clean.replace(',', '.');
  } else if (clean.includes('.')) {
    const parts = clean.split('.');
    if (parts.length > 2 || (parts[1] && parts[1].length === 3)) {
      // Ex: 1.500 ou 1.000.000
      clean = clean.replace(/\./g, '');
    }
  }

  const num = parseFloat(clean);
  return isNaN(num) ? 0 : num;
}

/**
 * Formata a digitação em tempo real permitindo inteiros e decimais sem zeros à esquerda indesejados.
 */
export function formatTypingBRL(rawText: string): string {
  // Limpa tudo exceto dígitos e vírgula
  let val = rawText.replace(/[^\d,]/g, '');
  if (!val) return '';

  const parts = val.split(',');
  // Remove zeros à esquerda (ex: "0123343" -> "123343"), a menos que seja apenas "0"
  let intPart = parts[0].replace(/^0+(?=\d)/, '');
  if (!intPart && parts.length > 1) intPart = '0';
  
  // Adiciona separador de milhar (.)
  intPart = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

  if (parts.length > 1) {
    // Limita decimais a 2 dígitos
    const decPart = parts.slice(1).join('').slice(0, 2);
    return `${intPart},${decPart}`;
  }

  return intPart;
}
