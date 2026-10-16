import React, { useMemo } from 'react';

interface RichTextViewerProps {
  content?: string;
  className?: string;
  truncateLines?: number;
}

/**
 * Parses and renders rich formatted text supporting Markdown, HTML tags,
 * headings, bold, italics, font sizing, lists, callouts, and code blocks.
 */
export const RichTextViewer: React.FC<RichTextViewerProps> = ({
  content,
  className = '',
  truncateLines,
}) => {
  const renderedElements = useMemo(() => {
    if (!content || !content.trim()) return null;

    const raw = content.trim();

    // If it contains HTML block tags, format lines with safe rendering
    const lines = raw.split('\n');
    const elements: React.ReactNode[] = [];
    let inList: 'ul' | 'ol' | null = null;
    let listItems: React.ReactNode[] = [];

    const flushList = (key: string) => {
      if (!inList) return;
      if (inList === 'ul') {
        elements.push(
          <ul key={key} className="list-disc list-inside space-y-1 my-1.5 text-slate-700 dark:text-neutral-300">
            {listItems}
          </ul>
        );
      } else {
        elements.push(
          <ol key={key} className="list-decimal list-inside space-y-1 my-1.5 text-slate-700 dark:text-neutral-300">
            {listItems}
          </ol>
        );
      }
      inList = null;
      listItems = [];
    };

    lines.forEach((line, idx) => {
      const trimmed = line.trim();

      // Heading 1 (# ...)
      if (trimmed.startsWith('# ')) {
        flushList(`list-${idx}`);
        elements.push(
          <h2
            key={`h1-${idx}`}
            className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white mt-3.5 mb-1.5 pb-1 border-b border-slate-200 dark:border-neutral-800 tracking-tight"
          >
            {renderInlineFormatting(trimmed.substring(2))}
          </h2>
        );
        return;
      }

      // Heading 2 (## ...)
      if (trimmed.startsWith('## ')) {
        flushList(`list-${idx}`);
        elements.push(
          <h3
            key={`h2-${idx}`}
            className="text-sm sm:text-base font-bold text-blue-700 dark:text-cyan-400 mt-2.5 mb-1 tracking-tight"
          >
            {renderInlineFormatting(trimmed.substring(3))}
          </h3>
        );
        return;
      }

      // Heading 3 (### ...)
      if (trimmed.startsWith('### ')) {
        flushList(`list-${idx}`);
        elements.push(
          <h4
            key={`h3-${idx}`}
            className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-neutral-200 mt-2 mb-0.5"
          >
            {renderInlineFormatting(trimmed.substring(4))}
          </h4>
        );
        return;
      }

      // Blockquote / Callout (> ...)
      if (trimmed.startsWith('> ')) {
        flushList(`list-${idx}`);
        const calloutText = trimmed.substring(2);
        const isWarning =
          calloutText.toLowerCase().includes('precaución') ||
          calloutText.toLowerCase().includes('advertencia') ||
          calloutText.toLowerCase().includes('atención') ||
          calloutText.toLowerCase().includes('alerta');
        const isSuccess =
          calloutText.toLowerCase().includes('éxito') ||
          calloutText.toLowerCase().includes('correcto') ||
          calloutText.toLowerCase().includes('validado');

        elements.push(
          <blockquote
            key={`quote-${idx}`}
            className={`my-2 p-2.5 rounded-lg border-l-4 text-xs leading-relaxed ${
              isWarning
                ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-500 text-amber-900 dark:text-amber-200'
                : isSuccess
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-900 dark:text-emerald-200'
                : 'bg-blue-50/70 dark:bg-cyan-950/30 border-blue-500 dark:border-cyan-400 text-slate-800 dark:text-neutral-200'
            }`}
          >
            {renderInlineFormatting(calloutText)}
          </blockquote>
        );
        return;
      }

      // Horizontal separator (--- or ***)
      if (trimmed === '---' || trimmed === '***') {
        flushList(`list-${idx}`);
        elements.push(
          <hr key={`hr-${idx}`} className="my-3 border-slate-200 dark:border-neutral-800" />
        );
        return;
      }

      // Unordered list (- ... or * ...)
      if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        if (inList !== 'ul') {
          flushList(`list-${idx}`);
          inList = 'ul';
        }
        listItems.push(
          <li key={`li-${idx}`} className="leading-relaxed">
            {renderInlineFormatting(trimmed.substring(2))}
          </li>
        );
        return;
      }

      // Ordered list (1. ... or 2. ...)
      const orderedMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);
      if (orderedMatch) {
        if (inList !== 'ol') {
          flushList(`list-${idx}`);
          inList = 'ol';
        }
        listItems.push(
          <li key={`li-${idx}`} className="leading-relaxed">
            {renderInlineFormatting(orderedMatch[2])}
          </li>
        );
        return;
      }

      // Empty line
      if (!trimmed) {
        flushList(`list-${idx}`);
        elements.push(<div key={`space-${idx}`} className="h-1.5" />);
        return;
      }

      // Regular paragraph line
      flushList(`list-${idx}`);
      elements.push(
        <p key={`p-${idx}`} className="leading-relaxed text-slate-800 dark:text-neutral-200 my-0.5">
          {renderInlineFormatting(line)}
        </p>
      );
    });

    flushList('list-end');
    return elements;
  }, [content]);

  if (!content || !content.trim()) {
    return null;
  }

  return (
    <div
      className={`rich-text-content text-xs sm:text-sm ${
        truncateLines ? `line-clamp-${truncateLines}` : ''
      } ${className}`}
    >
      {renderedElements}
    </div>
  );
};

/**
 * Handles inline formatting tags:
 * - Bold: **text** or <b>text</b> or <strong>text</strong>
 * - Italic: *text* or _text_ or <i>text</i> or <em>text</em>
 * - Underline: <u>text</u>
 * - Strikethrough: ~~text~~ or <del>text</del> or <s>text</s>
 * - Code: `code`
 * - Highlight: <mark>text</mark> or ==text==
 * - Sizes: [size=lg]text[/size] or <big>text</big> or <small>text</small>
 * - Color tags: [color=red]text[/color], [color=blue]text[/color], etc.
 */
function renderInlineFormatting(text: string): React.ReactNode[] {
  // Regex pattern to catch inline elements
  const tokenRegex =
    /(\*\*.*?\*\*|<b>.*?<\/b>|<strong>.*?<\/strong>|\*.*?\*|_.*?_|<i>.*?<\/i>|<em>.*?<\/em>|~~.*?~~|<del>.*?<\/del>|<s>.*?<\/s>|<u>.*?<\/u>|`.*?`|==.*?==|<mark>.*?<\/mark>|<big>.*?<\/big>|<small>.*?<\/small>|\[size=(.*?)\](.*?)\[\/size\]|\[color=(.*?)\](.*?)\[\/color\])/g;

  const parts = text.split(tokenRegex);
  const result: React.ReactNode[] = [];

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    if (!part) continue;

    // Bold (**text** or <b> or <strong>)
    if (part.startsWith('**') && part.endsWith('**')) {
      result.push(
        <strong key={i} className="font-bold text-slate-900 dark:text-white">
          {part.slice(2, -2)}
        </strong>
      );
    } else if (part.startsWith('<b>') && part.endsWith('</b>')) {
      result.push(
        <strong key={i} className="font-bold text-slate-900 dark:text-white">
          {part.slice(3, -4)}
        </strong>
      );
    } else if (part.startsWith('<strong>') && part.endsWith('</strong>')) {
      result.push(
        <strong key={i} className="font-bold text-slate-900 dark:text-white">
          {part.slice(8, -9)}
        </strong>
      );
    }
    // Italic (*text* or _text_ or <i> or <em>)
    else if ((part.startsWith('*') && part.endsWith('*')) || (part.startsWith('_') && part.endsWith('_'))) {
      result.push(
        <em key={i} className="italic text-slate-800 dark:text-neutral-200">
          {part.slice(1, -1)}
        </em>
      );
    } else if (part.startsWith('<i>') && part.endsWith('</i>')) {
      result.push(
        <em key={i} className="italic text-slate-800 dark:text-neutral-200">
          {part.slice(3, -4)}
        </em>
      );
    } else if (part.startsWith('<em>') && part.endsWith('</em>')) {
      result.push(
        <em key={i} className="italic text-slate-800 dark:text-neutral-200">
          {part.slice(4, -5)}
        </em>
      );
    }
    // Underline (<u>text</u>)
    else if (part.startsWith('<u>') && part.endsWith('</u>')) {
      result.push(
        <span key={i} className="underline decoration-cyan-500 underline-offset-2">
          {part.slice(3, -4)}
        </span>
      );
    }
    // Strikethrough (~~text~~ or <del> or <s>)
    else if (part.startsWith('~~') && part.endsWith('~~')) {
      result.push(
        <span key={i} className="line-through text-slate-400 dark:text-neutral-500">
          {part.slice(2, -2)}
        </span>
      );
    } else if (part.startsWith('<del>') && part.endsWith('</del>')) {
      result.push(
        <span key={i} className="line-through text-slate-400 dark:text-neutral-500">
          {part.slice(5, -6)}
        </span>
      );
    } else if (part.startsWith('<s>') && part.endsWith('</s>')) {
      result.push(
        <span key={i} className="line-through text-slate-400 dark:text-neutral-500">
          {part.slice(3, -4)}
        </span>
      );
    }
    // Inline code (`code`)
    else if (part.startsWith('`') && part.endsWith('`')) {
      result.push(
        <code
          key={i}
          className="px-1.5 py-0.5 mx-0.5 rounded bg-slate-100 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 text-cyan-600 dark:text-cyan-400 font-mono text-[11px] font-semibold"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    // Highlight (<mark> or ==text==)
    else if ((part.startsWith('==') && part.endsWith('==')) || (part.startsWith('<mark>') && part.endsWith('</mark>'))) {
      const inner = part.startsWith('==') ? part.slice(2, -2) : part.slice(6, -7);
      result.push(
        <mark
          key={i}
          className="bg-amber-200/80 dark:bg-amber-900/60 text-amber-950 dark:text-amber-200 px-1 py-0.2 rounded font-medium"
        >
          {inner}
        </mark>
      );
    }
    // Big / Small
    else if (part.startsWith('<big>') && part.endsWith('</big>')) {
      result.push(
        <span key={i} className="text-base font-semibold text-slate-900 dark:text-white">
          {part.slice(5, -6)}
        </span>
      );
    } else if (part.startsWith('<small>') && part.endsWith('</small>')) {
      result.push(
        <span key={i} className="text-[11px] text-slate-500 dark:text-neutral-400">
          {part.slice(7, -8)}
        </span>
      );
    }
    // [size=...]...[/size]
    else if (part.startsWith('[size=') && part.includes(']')) {
      const sizeMatch = part.match(/\[size=(.*?)\](.*?)\[\/size\]/);
      if (sizeMatch) {
        const sizeClass =
          sizeMatch[1] === 'xl'
            ? 'text-lg font-bold'
            : sizeMatch[1] === 'lg'
            ? 'text-base font-semibold'
            : sizeMatch[1] === 'sm'
            ? 'text-xs'
            : sizeMatch[1] === 'xs'
            ? 'text-[11px]'
            : 'text-sm';
        result.push(
          <span key={i} className={sizeClass}>
            {sizeMatch[2]}
          </span>
        );
      } else {
        result.push(part);
      }
    }
    // [color=...]...[/color]
    else if (part.startsWith('[color=') && part.includes(']')) {
      const colorMatch = part.match(/\[color=(.*?)\](.*?)\[\/color\]/);
      if (colorMatch) {
        const color = colorMatch[1];
        const colorClass =
          color === 'red' || color === 'alerta'
            ? 'text-rose-600 dark:text-rose-400 font-semibold'
            : color === 'green' || color === 'exito'
            ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
            : color === 'blue' || color === 'cyan'
            ? 'text-blue-600 dark:text-cyan-400 font-semibold'
            : color === 'amber' || color === 'aviso'
            ? 'text-amber-600 dark:text-amber-400 font-semibold'
            : 'text-slate-800 dark:text-neutral-200';
        result.push(
          <span key={i} className={colorClass}>
            {colorMatch[2]}
          </span>
        );
      } else {
        result.push(part);
      }
    } else {
      result.push(part);
    }
  }

  return result;
}
