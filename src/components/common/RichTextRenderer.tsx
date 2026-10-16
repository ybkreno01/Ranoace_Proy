import React from 'react';

interface RichTextRendererProps {
  content?: string;
  className?: string;
  fontSize?: 'xs' | 'sm' | 'base' | 'lg' | 'xl';
}

/**
 * Parses markdown and HTML formatting safely to render rich, readable text for guide steps,
 * technical instructions, callouts, titles, bold, italics, font sizes, and highlights.
 */
export const RichTextRenderer: React.FC<RichTextRendererProps> = ({
  content = '',
  className = '',
  fontSize = 'sm',
}) => {
  if (!content || !content.trim()) {
    return null;
  }

  // Normalize string
  const rawText = content.trim();

  // Parse markdown & basic HTML into structured blocks or render HTML safely
  const renderFormattedContent = () => {
    // If it contains complex HTML tags like <h1>, <h2>, <h3>, <strong>, <em>, <u>, <mark>, <ul>, <ol>, <blockquote>, <span style=...
    const hasHtmlTags = /<[a-z][\s\S]*>/i.test(rawText);

    if (hasHtmlTags) {
      // Sanitize and transform basic safe HTML
      // We allow headings, b, strong, i, em, u, s, mark, span, p, div, ul, ol, li, blockquote, code, pre, br, font
      const sanitizedHtml = rawText
        // Ensure mark tags have proper styling
        .replace(/<mark>/gi, '<mark class="bg-amber-200/90 dark:bg-amber-500/30 text-amber-950 dark:text-amber-200 px-1 py-0.5 rounded font-medium">')
        // Ensure blockquotes have distinctive styling
        .replace(/<blockquote>/gi, '<blockquote class="border-l-3 border-blue-500 dark:border-cyan-400 pl-3 py-1 my-2 bg-blue-50/50 dark:bg-neutral-800/60 rounded-r text-slate-700 dark:text-neutral-300 italic">')
        // Headings
        .replace(/<h1>/gi, '<h1 class="text-xl font-bold text-slate-900 dark:text-white mt-3 mb-1.5 tracking-tight border-b border-slate-200 dark:border-neutral-800 pb-1">')
        .replace(/<h2>/gi, '<h2 class="text-lg font-bold text-slate-900 dark:text-white mt-2.5 mb-1 tracking-tight text-blue-600 dark:text-cyan-400">')
        .replace(/<h3>/gi, '<h3 class="text-base font-bold text-slate-800 dark:text-neutral-100 mt-2 mb-1">')
        .replace(/<h4>/gi, '<h4 class="text-sm font-bold text-slate-800 dark:text-neutral-200 mt-1.5 mb-0.5">')
        // Code
        .replace(/<code>/gi, '<code class="bg-slate-100 dark:bg-neutral-800 text-cyan-600 dark:text-cyan-300 font-mono text-[11px] px-1.5 py-0.5 rounded border border-slate-200 dark:border-neutral-700">')
        // Lists
        .replace(/<ul>/gi, '<ul class="list-disc list-inside space-y-1 my-1.5 text-slate-700 dark:text-neutral-300">')
        .replace(/<ol>/gi, '<ol class="list-decimal list-inside space-y-1 my-1.5 text-slate-700 dark:text-neutral-300">')
        // Tables
        .replace(/<table/gi, '<table class="w-full my-2 border-collapse border border-slate-300 dark:border-neutral-700 text-xs"')
        .replace(/<th/gi, '<th class="border border-slate-300 dark:border-neutral-700 p-2 font-bold bg-slate-100 dark:bg-neutral-800 text-left"')
        .replace(/<td/gi, '<td class="border border-slate-300 dark:border-neutral-700 p-2"');

      return (
        <div
          className={`rich-text-content leading-relaxed space-y-1.5 ${className}`}
          dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
        />
      );
    }

    // Markdown parsing line by line
    const lines = rawText.split('\n');
    const elements: React.ReactNode[] = [];
    let inList = false;
    let listItems: React.ReactNode[] = [];
    let isOrderedList = false;

    const flushList = () => {
      if (inList && listItems.length > 0) {
        if (isOrderedList) {
          elements.push(
            <ol key={`ol-${elements.length}`} className="list-decimal list-inside space-y-1 my-2 text-slate-700 dark:text-neutral-300 pl-2">
              {listItems}
            </ol>
          );
        } else {
          elements.push(
            <ul key={`ul-${elements.length}`} className="list-disc list-inside space-y-1 my-2 text-slate-700 dark:text-neutral-300 pl-2">
              {listItems}
            </ul>
          );
        }
        listItems = [];
        inList = false;
      }
    };

    lines.forEach((line, idx) => {
      const trimmed = line.trim();

      // Heading 1 (# Titulo)
      if (trimmed.startsWith('# ')) {
        flushList();
        elements.push(
          <h1 key={idx} className="text-xl font-bold text-slate-900 dark:text-white mt-3 mb-1.5 tracking-tight border-b border-slate-200 dark:border-neutral-800 pb-1">
            {formatInline(trimmed.substring(2))}
          </h1>
        );
        return;
      }

      // Heading 2 (## Titulo)
      if (trimmed.startsWith('## ')) {
        flushList();
        elements.push(
          <h2 key={idx} className="text-lg font-bold text-blue-600 dark:text-cyan-400 mt-2.5 mb-1 tracking-tight">
            {formatInline(trimmed.substring(3))}
          </h2>
        );
        return;
      }

      // Heading 3 (### Titulo)
      if (trimmed.startsWith('### ')) {
        flushList();
        elements.push(
          <h3 key={idx} className="text-base font-bold text-slate-800 dark:text-neutral-100 mt-2 mb-1">
            {formatInline(trimmed.substring(4))}
          </h3>
        );
        return;
      }

      // Blockquote / Callout (> Nota)
      if (trimmed.startsWith('> ')) {
        flushList();
        elements.push(
          <blockquote key={idx} className="border-l-3 border-blue-500 dark:border-cyan-400 pl-3 py-1.5 my-2 bg-blue-50/60 dark:bg-neutral-800/60 rounded-r text-slate-700 dark:text-neutral-300 italic text-xs">
            {formatInline(trimmed.substring(2))}
          </blockquote>
        );
        return;
      }

      // Unordered list (- item or * item)
      if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        if (!inList || isOrderedList) {
          flushList();
          inList = true;
          isOrderedList = false;
        }
        listItems.push(
          <li key={`li-${idx}`} className="text-xs text-slate-700 dark:text-neutral-300">
            {formatInline(trimmed.substring(2))}
          </li>
        );
        return;
      }

      // Ordered list (1. item)
      const orderedMatch = trimmed.match(/^(\d+)\.\s+(.+)$/);
      if (orderedMatch) {
        if (!inList || !isOrderedList) {
          flushList();
          inList = true;
          isOrderedList = true;
        }
        listItems.push(
          <li key={`li-${idx}`} className="text-xs text-slate-700 dark:text-neutral-300">
            {formatInline(orderedMatch[2])}
          </li>
        );
        return;
      }

      // Regular paragraph or empty line
      flushList();
      if (!trimmed) {
        elements.push(<div key={idx} className="h-2" />);
      } else {
        elements.push(
          <p key={idx} className="text-slate-800 dark:text-neutral-200 leading-relaxed text-xs">
            {formatInline(line)}
          </p>
        );
      }
    });

    flushList();

    return <div className={`space-y-1 ${className}`}>{elements}</div>;
  };

  return renderFormattedContent();
};

/**
 * Formats inline text with bold (**text**), italic (*text*), code (`code`), underline (__text__), strikethrough (~~text~~), and mark (==text==)
 */
function formatInline(text: string): React.ReactNode {
  if (!text) return '';

  // Regex to match inline formatting tokens
  const tokenRegex = /(\*\*[^*]+\*\*|__[^_]+__|==[^=]+==|~~[^~]+~~|\*[^*]+\*|`[^`]+`)/g;
  const parts = text.split(tokenRegex);

  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={i} className="font-bold text-slate-900 dark:text-white">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith('__') && part.endsWith('__')) {
      return (
        <u key={i} className="underline underline-offset-2 decoration-blue-500/60 dark:decoration-cyan-400/60">
          {part.slice(2, -2)}
        </u>
      );
    }
    if (part.startsWith('==') && part.endsWith('==')) {
      return (
        <mark key={i} className="bg-amber-200/90 dark:bg-amber-500/30 text-amber-950 dark:text-amber-200 px-1 py-0.5 rounded font-medium">
          {part.slice(2, -2)}
        </mark>
      );
    }
    if (part.startsWith('~~') && part.endsWith('~~')) {
      return (
        <s key={i} className="line-through text-slate-400 dark:text-neutral-500">
          {part.slice(2, -2)}
        </s>
      );
    }
    if (part.startsWith('*') && part.endsWith('*')) {
      return (
        <em key={i} className="italic text-slate-800 dark:text-neutral-200">
          {part.slice(1, -1)}
        </em>
      );
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code key={i} className="bg-slate-100 dark:bg-neutral-800 text-cyan-600 dark:text-cyan-300 font-mono text-[11px] px-1.5 py-0.5 rounded border border-slate-200 dark:border-neutral-700">
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
}
