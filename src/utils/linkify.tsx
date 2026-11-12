import React from 'react';

const KNOWN_TLDS =
  'com\\.br|net\\.br|org\\.br|gov\\.br|edu\\.br|app\\.br|com|net|org|io|app|me|ly|gl|be|ai|dev|co|tv|info|biz|shop|store|site|online|tech|br';

const URL_REGEX = new RegExp(
  `((?:https?:\\/\\/[^\\s<>"'\\\`]+)|(?:www\\.[^\\s<>"'\\\`]+)|(?:(?:[a-zA-Z0-9-]+\\.)+(?:${KNOWN_TLDS})(?:\\/[^\\s<>"'\\\`]*)?))`,
  'gi'
);

function splitTrailingPunctuation(rawUrl: string): { cleanUrl: string; trailing: string } {
  let cleanUrl = rawUrl;
  let trailing = '';

  while (cleanUrl.length > 0) {
    const lastChar = cleanUrl[cleanUrl.length - 1];
    if (/[.,;:!?]/.test(lastChar)) {
      trailing = lastChar + trailing;
      cleanUrl = cleanUrl.slice(0, -1);
      continue;
    }
    if (lastChar === ')') {
      const openCount = (cleanUrl.match(/\(/g) || []).length;
      const closeCount = (cleanUrl.match(/\)/g) || []).length;
      if (closeCount > openCount) {
        trailing = lastChar + trailing;
        cleanUrl = cleanUrl.slice(0, -1);
        continue;
      }
    }
    if (lastChar === ']') {
      const openCount = (cleanUrl.match(/\[/g) || []).length;
      const closeCount = (cleanUrl.match(/\]/g) || []).length;
      if (closeCount > openCount) {
        trailing = lastChar + trailing;
        cleanUrl = cleanUrl.slice(0, -1);
        continue;
      }
    }
    break;
  }

  return { cleanUrl, trailing };
}

function toSafeHref(url: string): string | null {
  const trimmed = url.trim();
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }
  return `https://${trimmed}`;
}

export const LinkifiedText: React.FC<{
  text: string;
  isFromMe?: boolean;
  className?: string;
}> = ({ text, isFromMe = false, className = '' }) => {
  if (!text) return null;

  const parts: React.ReactNode[] = [];
  let lastIndex = 0;

  URL_REGEX.lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = URL_REGEX.exec(text)) !== null) {
    const matchIndex = match.index;
    const rawMatch = match[0];

    // Skip if preceded by email '@' or word/slash/dot chars (for bare domains), or followed by word/'@'
    const prevChar = matchIndex > 0 ? text[matchIndex - 1] : '';
    const nextChar = text[matchIndex + rawMatch.length] || '';
    const isExplicitProtocol = /^https?:\/\//i.test(rawMatch) || /^www\./i.test(rawMatch);
    if (
      prevChar === '@' ||
      (!isExplicitProtocol && prevChar && /[\w@/.-]/.test(prevChar)) ||
      (!isExplicitProtocol && !rawMatch.includes('/') && nextChar && /[\w@]/.test(nextChar))
    ) {
      continue;
    }

    if (matchIndex > lastIndex) {
      parts.push(text.slice(lastIndex, matchIndex));
    }

    const { cleanUrl, trailing } = splitTrailingPunctuation(rawMatch);
    const href = toSafeHref(cleanUrl);

    if (href && cleanUrl) {
      parts.push(
        <a
          key={`${matchIndex}-${cleanUrl}`}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className={`underline underline-offset-2 [overflow-wrap:anywhere] transition-colors ${
            isFromMe
              ? 'text-white decoration-white/80 hover:text-emerald-100 hover:decoration-white font-semibold'
              : 'text-sky-600 decoration-sky-500/70 hover:text-sky-800 hover:decoration-sky-700 font-medium'
          }`}
          title={`Abrir link: ${href}`}
        >
          {cleanUrl}
        </a>
      );
      if (trailing) {
        parts.push(trailing);
      }
    } else {
      parts.push(rawMatch);
    }

    lastIndex = matchIndex + rawMatch.length;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return (
    <span className={`whitespace-pre-wrap [overflow-wrap:anywhere] ${className}`}>
      {parts.length > 0 ? parts : text}
    </span>
  );
};
