import React, { useState, useEffect } from 'react';
import { formatCurrencyBRL, parseCurrencyBRL, formatTypingBRL } from '../../utils/currencyFormatter';

export interface CurrencyInputProps {
  value: number | '' | null | undefined;
  onChange: (value: number) => void;
  placeholder?: string;
  className?: string;
  prefixColor?: string;
  textColor?: string;
  disabled?: boolean;
  id?: string;
  name?: string;
}

export const CurrencyInput: React.FC<CurrencyInputProps> = ({
  value,
  onChange,
  placeholder = '0,00',
  className = '',
  prefixColor = 'text-slate-400',
  textColor = 'text-slate-900',
  disabled = false,
  id,
  name,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [displayValue, setDisplayValue] = useState<string>('');

  // Sincroniza valor externo quando o input não está em foco
  useEffect(() => {
    if (!isFocused) {
      if (value === '' || value === null || value === undefined || (value === 0 && placeholder)) {
        if (value === 0) {
          setDisplayValue('0,00');
        } else {
          setDisplayValue('');
        }
      } else {
        setDisplayValue(formatCurrencyBRL(value, false, true));
      }
    }
  }, [value, isFocused, placeholder]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    if (!raw.trim()) {
      setDisplayValue('');
      onChange(0);
      return;
    }

    const formatted = formatTypingBRL(raw);
    setDisplayValue(formatted);
    const parsed = parseCurrencyBRL(formatted);
    onChange(parsed);
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(true);
    // Se tiver valor formatado com ,00 mas for número inteiro, podemos facilitar a edição
    if (value && value > 0) {
      const hasCents = Number(value) % 1 !== 0;
      setDisplayValue(formatCurrencyBRL(value, false, hasCents));
    }
    // Seleciona todo o conteúdo ao clicar para facilitar substituição direta
    setTimeout(() => {
      e.target.select();
    }, 10);
  };

  const handleBlur = () => {
    setIsFocused(false);
    if (!displayValue || displayValue === '0') {
      if (value === '' || value === undefined || value === null) {
        setDisplayValue('');
      } else {
        setDisplayValue(value > 0 ? formatCurrencyBRL(value, false, true) : '0,00');
      }
    } else {
      const parsed = parseCurrencyBRL(displayValue);
      onChange(parsed);
      setDisplayValue(parsed > 0 ? formatCurrencyBRL(parsed, false, true) : '0,00');
    }
  };

  return (
    <div className="relative flex items-center w-full">
      <span
        className={`absolute left-3 font-bold text-xs pointer-events-none select-none ${prefixColor}`}
      >
        R$
      </span>
      <input
        type="text"
        inputMode="decimal"
        id={id}
        name={name}
        disabled={disabled}
        value={displayValue}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder={placeholder}
        className={`w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all ${textColor} ${className}`}
      />
    </div>
  );
};
