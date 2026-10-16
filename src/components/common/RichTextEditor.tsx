import React, { useState, useRef, useEffect } from 'react';
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Code,
  Highlighter,
  Type,
  Palette,
  Eraser,
  Table as TableIcon,
  Code2,
  Check,
} from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  label?: string;
}

/**
 * Converts legacy markdown syntax to clean HTML so the visual editor renders actual
 * formatting (bold, headings, italics, lists) rather than raw symbols.
 */
function markdownToHtml(text: string): string {
  if (!text) return '';
  // If it already has HTML block or formatting tags, return it
  if (/<(h[1-6]|p|div|ul|ol|li|strong|b|em|i|u|mark|table|blockquote|span)/i.test(text)) {
    return text;
  }

  const lines = text.split('\n');
  const result: string[] = [];
  let inList: 'ul' | 'ol' | null = null;

  const closeList = () => {
    if (inList) {
      result.push(inList === 'ul' ? '</ul>' : '</ol>');
      inList = null;
    }
  };

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed.startsWith('# ')) {
      closeList();
      result.push(`<h1>${formatInlineMd(trimmed.substring(2))}</h1>`);
    } else if (trimmed.startsWith('## ')) {
      closeList();
      result.push(`<h2>${formatInlineMd(trimmed.substring(3))}</h2>`);
    } else if (trimmed.startsWith('### ')) {
      closeList();
      result.push(`<h3>${formatInlineMd(trimmed.substring(4))}</h3>`);
    } else if (trimmed.startsWith('> ')) {
      closeList();
      result.push(`<blockquote>${formatInlineMd(trimmed.substring(2))}</blockquote>`);
    } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      if (inList !== 'ul') {
        closeList();
        result.push('<ul>');
        inList = 'ul';
      }
      result.push(`<li>${formatInlineMd(trimmed.substring(2))}</li>`);
    } else if (/^\d+\.\s+/.test(trimmed)) {
      if (inList !== 'ol') {
        closeList();
        result.push('<ol>');
        inList = 'ol';
      }
      const textContent = trimmed.replace(/^\d+\.\s+/, '');
      result.push(`<li>${formatInlineMd(textContent)}</li>`);
    } else if (!trimmed) {
      closeList();
      result.push('<br/>');
    } else {
      closeList();
      result.push(`<p>${formatInlineMd(line)}</p>`);
    }
  }

  closeList();
  return result.join('');
}

function formatInlineMd(text: string): string {
  return text
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/__([^_]+)__/g, '<u>$1</u>')
    .replace(/==([^=]+)==/g, '<mark>$1</mark>')
    .replace(/~~([^~]+)~~/g, '<s>$1</s>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code>$1</code>');
}

/**
 * Cleans pasted HTML from Word, Google Docs, or external websites:
 * Preserves bold, italics, font sizes, headings, lists, colors, highlights and structure.
 * Strips foreign font-families so our standard UI font is used.
 */
function cleanPastedHtml(rawHtml: string): string {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(rawHtml, 'text/html');

    // Remove dangerous and non-visual elements
    const unwanted = doc.querySelectorAll('script, style, meta, link, object, embed, iframe, applet');
    unwanted.forEach((el) => el.remove());

    const all = doc.body.querySelectorAll('*');
    all.forEach((el) => {
      const htmlEl = el as HTMLElement;

      // Remove foreign font-family to guarantee standard UI font
      htmlEl.style.removeProperty('font-family');

      // Strip Word-specific XML tags or Mso classes
      const styleAttr = htmlEl.getAttribute('style') || '';
      if (styleAttr) {
        const cleanedStyle = styleAttr
          .split(';')
          .map((s) => s.trim())
          .filter((rule) => {
            if (!rule) return false;
            const lower = rule.toLowerCase();
            return (
              !lower.startsWith('mso-') &&
              !lower.startsWith('font-family') &&
              !lower.startsWith('line-height') &&
              !lower.startsWith('page-break') &&
              !lower.startsWith('margin-')
            );
          })
          .join('; ');

        if (cleanedStyle.trim()) {
          htmlEl.setAttribute('style', cleanedStyle);
        } else {
          htmlEl.removeAttribute('style');
        }
      }

      if (htmlEl.className && typeof htmlEl.className === 'string') {
        const cleanedClass = htmlEl.className
          .split(' ')
          .filter((c) => !c.toLowerCase().startsWith('mso'))
          .join(' ');
        if (cleanedClass.trim()) {
          htmlEl.className = cleanedClass;
        } else {
          htmlEl.removeAttribute('class');
        }
      }
    });

    return doc.body.innerHTML;
  } catch (err) {
    console.warn('Error cleaning pasted HTML:', err);
    return rawHtml;
  }
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = 'Escribe las instrucciones detalladas del paso...',
  rows = 7,
  label,
}) => {
  const [showColorMenu, setShowColorMenu] = useState(false);
  const [showSizeMenu, setShowSizeMenu] = useState(false);
  const [showHtmlSource, setShowHtmlSource] = useState(false);
  const editorRef = useRef<HTMLDivElement | null>(null);
  const lastHtmlRef = useRef<string>('');

  // Initial setup and sync from external value changes
  useEffect(() => {
    const formattedHtml = markdownToHtml(value || '');
    if (editorRef.current && editorRef.current.innerHTML !== formattedHtml) {
      if (formattedHtml !== lastHtmlRef.current) {
        editorRef.current.innerHTML = formattedHtml;
        lastHtmlRef.current = formattedHtml;
      }
    }
  }, [value]);

  const emitChange = () => {
    if (!editorRef.current) return;
    const currentHtml = editorRef.current.innerHTML;
    lastHtmlRef.current = currentHtml;
    onChange(currentHtml);
  };

  const executeCommand = (command: string, arg: string | undefined = undefined) => {
    if (editorRef.current) {
      editorRef.current.focus();
    }
    document.execCommand(command, false, arg);
    emitChange();
  };

  // Font size applicator using visual inline style on current selection
  const applyFontSize = (fontSizePx: string, labelText: string) => {
    setShowSizeMenu(false);
    if (!editorRef.current) return;
    editorRef.current.focus();

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
      // If no text selected, format block or insert styled span
      document.execCommand('fontSize', false, '3');
      const fontTags = editorRef.current.querySelectorAll('font[size="3"]');
      fontTags.forEach((tag) => {
        const span = document.createElement('span');
        span.style.fontSize = fontSizePx;
        span.innerHTML = tag.innerHTML || `Texto ${labelText}`;
        tag.replaceWith(span);
      });
    } else {
      const range = selection.getRangeAt(0);
      const span = document.createElement('span');
      span.style.fontSize = fontSizePx;
      try {
        span.appendChild(range.extractContents());
        range.insertNode(span);
      } catch {
        document.execCommand('fontSize', false, '3');
      }
    }
    emitChange();
  };

  // Color applicator
  const applyColor = (colorHex: string) => {
    setShowColorMenu(false);
    executeCommand('foreColor', colorHex);
  };

  // Highlight applicator
  const applyHighlight = () => {
    executeCommand('hiliteColor', '#fef08a');
  };

  // Heading applicator
  const applyHeading = (headingTag: string) => {
    executeCommand('formatBlock', headingTag);
  };

  // Clear format
  const clearFormatting = () => {
    executeCommand('removeFormat');
    executeCommand('formatBlock', '<p>');
  };

  // Insert Table
  const insertTable = () => {
    const tableHtml = `
      <table class="w-full my-2 border-collapse border border-slate-300 dark:border-neutral-700 text-xs">
        <thead>
          <tr class="bg-slate-100 dark:bg-neutral-800">
            <th class="border border-slate-300 dark:border-neutral-700 p-2 font-bold text-left">Encabezado 1</th>
            <th class="border border-slate-300 dark:border-neutral-700 p-2 font-bold text-left">Encabezado 2</th>
            <th class="border border-slate-300 dark:border-neutral-700 p-2 font-bold text-left">Encabezado 3</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td class="border border-slate-300 dark:border-neutral-700 p-2">Dato A1</td>
            <td class="border border-slate-300 dark:border-neutral-700 p-2">Dato B1</td>
            <td class="border border-slate-300 dark:border-neutral-700 p-2">Dato C1</td>
          </tr>
          <tr>
            <td class="border border-slate-300 dark:border-neutral-700 p-2">Dato A2</td>
            <td class="border border-slate-300 dark:border-neutral-700 p-2">Dato B2</td>
            <td class="border border-slate-300 dark:border-neutral-700 p-2">Dato C2</td>
          </tr>
        </tbody>
      </table><p><br/></p>
    `;
    executeCommand('insertHTML', tableHtml);
  };

  // Insert Code Block
  const insertCodeBlock = () => {
    const codeHtml = `<code class="bg-slate-100 dark:bg-neutral-800 text-cyan-600 dark:text-cyan-300 font-mono text-[11px] px-1.5 py-0.5 rounded border border-slate-200 dark:border-neutral-700">comando_o_variable</code> `;
    executeCommand('insertHTML', codeHtml);
  };

  // Handle Paste event: preserve formatting, clean foreign fonts to our standard font
  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault();
    const htmlData = e.clipboardData.getData('text/html');
    const plainText = e.clipboardData.getData('text/plain');

    if (htmlData && htmlData.trim()) {
      const cleaned = cleanPastedHtml(htmlData);
      document.execCommand('insertHTML', false, cleaned);
    } else if (plainText) {
      // Preserve line breaks and paragraph spacing
      const escaped = plainText
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/\n\n/g, '</p><p>')
        .replace(/\n/g, '<br/>');
      document.execCommand('insertHTML', false, `<p>${escaped}</p>`);
    }

    emitChange();
  };

  const minHeightStyle = { minHeight: `${Math.max(140, rows * 24)}px` };

  return (
    <div className="space-y-1.5 w-full">
      {label && (
        <div className="flex items-center justify-between">
          <label className="text-slate-800 dark:text-neutral-200 block font-semibold text-xs tracking-tight">
            {label}
          </label>
          <span className="text-[10px] text-slate-500 dark:text-neutral-400 font-medium">
            Editor Visual WYSIWYG · Conserva formato pegado
          </span>
        </div>
      )}

      {/* Editor Main Container */}
      <div className="border border-slate-300 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-900 overflow-hidden shadow-2xs transition-colors ring-1 ring-black/5 dark:ring-white/5">
        {/* Visual Formatting Toolbar */}
        <div className="flex items-center justify-between flex-wrap gap-1 p-2 bg-slate-50/90 dark:bg-neutral-800/80 border-b border-slate-200 dark:border-neutral-700/80 text-xs select-none">
          <div className="flex items-center flex-wrap gap-0.5">
            {/* Heading 1 */}
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                applyHeading('<h1>');
              }}
              className="p-1.5 rounded-md hover:bg-slate-200 dark:hover:bg-neutral-700 text-slate-700 dark:text-neutral-300 font-bold hover:text-blue-600 dark:hover:text-cyan-400 transition-colors"
              title="Título 1 (Principal)"
            >
              <Heading1 className="w-4 h-4" />
            </button>

            {/* Heading 2 */}
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                applyHeading('<h2>');
              }}
              className="p-1.5 rounded-md hover:bg-slate-200 dark:hover:bg-neutral-700 text-slate-700 dark:text-neutral-300 font-bold hover:text-blue-600 dark:hover:text-cyan-400 transition-colors"
              title="Título 2 (Subtítulo)"
            >
              <Heading2 className="w-4 h-4" />
            </button>

            {/* Heading 3 */}
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                applyHeading('<h3>');
              }}
              className="p-1.5 rounded-md hover:bg-slate-200 dark:hover:bg-neutral-700 text-slate-700 dark:text-neutral-300 font-bold hover:text-blue-600 dark:hover:text-cyan-400 transition-colors"
              title="Título 3 (Encabezado menor)"
            >
              <Heading3 className="w-4 h-4" />
            </button>

            <div className="w-[1px] h-4 bg-slate-300 dark:bg-neutral-700 mx-1" />

            {/* Font Size Dropdown */}
            <div className="relative">
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  setShowSizeMenu(!showSizeMenu);
                  setShowColorMenu(false);
                }}
                className={`flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-semibold transition-colors ${
                  showSizeMenu
                    ? 'bg-blue-100 dark:bg-neutral-700 text-blue-700 dark:text-cyan-300'
                    : 'hover:bg-slate-200 dark:hover:bg-neutral-700 text-slate-700 dark:text-neutral-300'
                }`}
                title="Cambiar tamaño de letra del texto seleccionado"
              >
                <Type className="w-3.5 h-3.5 text-blue-600 dark:text-cyan-400" />
                <span>Tamaño</span>
              </button>

              {showSizeMenu && (
                <div className="absolute left-0 top-full mt-1 w-44 bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-700 rounded-lg shadow-xl p-1 z-50 space-y-0.5 text-xs">
                  <button
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      applyFontSize('1.25rem', 'Grande');
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded hover:bg-slate-100 dark:hover:bg-neutral-800 text-slate-900 dark:text-white font-bold text-sm"
                  >
                    Grande (20px)
                  </button>
                  <button
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      applyFontSize('1.05rem', 'Destacado');
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded hover:bg-slate-100 dark:hover:bg-neutral-800 text-slate-900 dark:text-white font-semibold text-xs"
                  >
                    Destacado (17px)
                  </button>
                  <button
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      applyFontSize('0.875rem', 'Normal');
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded hover:bg-slate-100 dark:hover:bg-neutral-800 text-slate-800 dark:text-neutral-200 text-xs"
                  >
                    Normal (14px)
                  </button>
                  <button
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      applyFontSize('0.75rem', 'Pequeño');
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded hover:bg-slate-100 dark:hover:bg-neutral-800 text-slate-600 dark:text-neutral-400 text-[11px]"
                  >
                    Pequeño (12px)
                  </button>
                </div>
              )}
            </div>

            {/* Bold */}
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                executeCommand('bold');
              }}
              className="p-1.5 rounded-md hover:bg-slate-200 dark:hover:bg-neutral-700 text-slate-800 dark:text-neutral-200 font-bold hover:text-blue-600 dark:hover:text-cyan-400 transition-colors"
              title="Negrita (Ctrl+B)"
            >
              <Bold className="w-3.5 h-3.5" />
            </button>

            {/* Italic */}
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                executeCommand('italic');
              }}
              className="p-1.5 rounded-md hover:bg-slate-200 dark:hover:bg-neutral-700 text-slate-800 dark:text-neutral-200 italic hover:text-blue-600 dark:hover:text-cyan-400 transition-colors"
              title="Cursiva (Ctrl+I)"
            >
              <Italic className="w-3.5 h-3.5" />
            </button>

            {/* Underline */}
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                executeCommand('underline');
              }}
              className="p-1.5 rounded-md hover:bg-slate-200 dark:hover:bg-neutral-700 text-slate-800 dark:text-neutral-200 underline hover:text-blue-600 dark:hover:text-cyan-400 transition-colors"
              title="Subrayado (Ctrl+U)"
            >
              <Underline className="w-3.5 h-3.5" />
            </button>

            {/* Strikethrough */}
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                executeCommand('strikeThrough');
              }}
              className="p-1.5 rounded-md hover:bg-slate-200 dark:hover:bg-neutral-700 text-slate-800 dark:text-neutral-200 hover:text-blue-600 dark:hover:text-cyan-400 transition-colors"
              title="Tachado"
            >
              <Strikethrough className="w-3.5 h-3.5" />
            </button>

            {/* Highlight */}
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                applyHighlight();
              }}
              className="p-1.5 rounded-md hover:bg-amber-100 dark:hover:bg-amber-950/60 text-amber-600 dark:text-amber-400 transition-colors"
              title="Resaltador luminoso (amarillo)"
            >
              <Highlighter className="w-3.5 h-3.5" />
            </button>

            <div className="w-[1px] h-4 bg-slate-300 dark:bg-neutral-700 mx-1" />

            {/* Color Palette Menu */}
            <div className="relative">
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  setShowColorMenu(!showColorMenu);
                  setShowSizeMenu(false);
                }}
                className={`flex items-center gap-1 px-1.5 py-1 rounded-md text-[11px] font-semibold transition-colors ${
                  showColorMenu
                    ? 'bg-blue-100 dark:bg-neutral-700 text-blue-700 dark:text-cyan-300'
                    : 'hover:bg-slate-200 dark:hover:bg-neutral-700 text-slate-700 dark:text-neutral-300'
                }`}
                title="Color del texto seleccionado"
              >
                <Palette className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                <span>Color</span>
              </button>

              {showColorMenu && (
                <div className="absolute left-0 top-full mt-1 w-36 bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-700 rounded-lg shadow-xl p-1.5 z-50 space-y-1 text-xs">
                  <button
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      applyColor('#2563eb');
                    }}
                    className="w-full flex items-center gap-2 px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-neutral-800 text-blue-600 font-semibold"
                  >
                    <span className="w-3 h-3 rounded-full bg-blue-600 shrink-0" />
                    <span>Azul Técnico</span>
                  </button>
                  <button
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      applyColor('#059669');
                    }}
                    className="w-full flex items-center gap-2 px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-neutral-800 text-emerald-600 font-semibold"
                  >
                    <span className="w-3 h-3 rounded-full bg-emerald-600 shrink-0" />
                    <span>Verde Éxito</span>
                  </button>
                  <button
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      applyColor('#d97706');
                    }}
                    className="w-full flex items-center gap-2 px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-neutral-800 text-amber-600 font-semibold"
                  >
                    <span className="w-3 h-3 rounded-full bg-amber-600 shrink-0" />
                    <span>Ámbar Alerta</span>
                  </button>
                  <button
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      applyColor('#dc2626');
                    }}
                    className="w-full flex items-center gap-2 px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-neutral-800 text-rose-600 font-semibold"
                  >
                    <span className="w-3 h-3 rounded-full bg-rose-600 shrink-0" />
                    <span>Rojo Crítico</span>
                  </button>
                  <button
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      applyColor('#7c3aed');
                    }}
                    className="w-full flex items-center gap-2 px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-neutral-800 text-violet-600 font-semibold"
                  >
                    <span className="w-3 h-3 rounded-full bg-violet-600 shrink-0" />
                    <span>Violeta Info</span>
                  </button>
                  <button
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      applyColor('#0f172a');
                    }}
                    className="w-full flex items-center gap-2 px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-neutral-800 text-slate-900 dark:text-neutral-100 font-semibold"
                  >
                    <span className="w-3 h-3 rounded-full bg-slate-900 dark:bg-white shrink-0" />
                    <span>Estándar</span>
                  </button>
                </div>
              )}
            </div>

            {/* Bullet List */}
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                executeCommand('insertUnorderedList');
              }}
              className="p-1.5 rounded-md hover:bg-slate-200 dark:hover:bg-neutral-700 text-slate-700 dark:text-neutral-300 hover:text-blue-600 dark:hover:text-cyan-400 transition-colors"
              title="Lista con viñetas"
            >
              <List className="w-3.5 h-3.5" />
            </button>

            {/* Numbered List */}
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                executeCommand('insertOrderedList');
              }}
              className="p-1.5 rounded-md hover:bg-slate-200 dark:hover:bg-neutral-700 text-slate-700 dark:text-neutral-300 hover:text-blue-600 dark:hover:text-cyan-400 transition-colors"
              title="Lista numerada"
            >
              <ListOrdered className="w-3.5 h-3.5" />
            </button>

            {/* Quote / Callout */}
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                executeCommand('formatBlock', '<blockquote>');
              }}
              className="p-1.5 rounded-md hover:bg-slate-200 dark:hover:bg-neutral-700 text-slate-700 dark:text-neutral-300 hover:text-blue-600 dark:hover:text-cyan-400 transition-colors"
              title="Cita o nota destacada"
            >
              <Quote className="w-3.5 h-3.5" />
            </button>

            {/* Code Tag */}
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                insertCodeBlock();
              }}
              className="p-1.5 rounded-md hover:bg-slate-200 dark:hover:bg-neutral-700 text-cyan-600 dark:text-cyan-400 transition-colors"
              title="Comando o código en línea"
            >
              <Code className="w-3.5 h-3.5" />
            </button>

            {/* Table */}
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                insertTable();
              }}
              className="p-1.5 rounded-md hover:bg-slate-200 dark:hover:bg-neutral-700 text-indigo-600 dark:text-indigo-400 transition-colors"
              title="Insertar tabla"
            >
              <TableIcon className="w-3.5 h-3.5" />
            </button>

            {/* Clear formatting */}
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                clearFormatting();
              }}
              className="p-1.5 rounded-md hover:bg-slate-200 dark:hover:bg-neutral-700 text-slate-500 hover:text-rose-500 transition-colors"
              title="Limpiar formato"
            >
              <Eraser className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Toggle between visual editor and raw source */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setShowHtmlSource(!showHtmlSource)}
              className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                showHtmlSource
                  ? 'bg-blue-600 text-white font-semibold'
                  : 'text-slate-500 dark:text-neutral-400 hover:bg-slate-200 dark:hover:bg-neutral-700'
              }`}
              title={showHtmlSource ? 'Volver a edición visual' : 'Ver código HTML'}
            >
              <Code2 className="w-3 h-3" />
              <span>{showHtmlSource ? 'Modo Visual' : 'Código HTML'}</span>
            </button>
          </div>
        </div>

        {/* Visual WYSIWYG Editable Area (No code tags, visual formatting directly in UI) */}
        {!showHtmlSource ? (
          <div
            ref={editorRef}
            contentEditable
            suppressContentEditableWarning
            onInput={emitChange}
            onBlur={emitChange}
            onPaste={handlePaste}
            data-placeholder={placeholder}
            style={minHeightStyle}
            className="p-3.5 focus:outline-hidden text-slate-900 dark:text-neutral-100 text-sm leading-relaxed overflow-y-auto max-h-[380px] font-sans transition-colors empty:before:content-[attr(data-placeholder)] empty:before:text-slate-400 empty:before:dark:text-neutral-500 empty:before:pointer-events-none [&_h1]:text-xl [&_h1]:font-bold [&_h1]:text-slate-900 [&_h1]:dark:text-white [&_h1]:mt-3 [&_h1]:mb-1.5 [&_h1]:border-b [&_h1]:border-slate-200 [&_h1]:dark:border-neutral-800 [&_h1]:pb-1 [&_h2]:text-lg [&_h2]:font-bold [&_h2]:text-blue-600 [&_h2]:dark:text-cyan-400 [&_h2]:mt-2.5 [&_h2]:mb-1 [&_h3]:text-base [&_h3]:font-bold [&_h3]:text-slate-800 [&_h3]:dark:text-neutral-100 [&_h3]:mt-2 [&_h3]:mb-1 [&_p]:my-1.5 [&_ul]:list-disc [&_ul]:list-inside [&_ul]:my-1.5 [&_ul]:pl-2 [&_ol]:list-decimal [&_ol]:list-inside [&_ol]:my-1.5 [&_ol]:pl-2 [&_blockquote]:border-l-3 [&_blockquote]:border-blue-500 [&_blockquote]:dark:border-cyan-400 [&_blockquote]:pl-3 [&_blockquote]:py-1.5 [&_blockquote]:my-2 [&_blockquote]:bg-blue-50/60 [&_blockquote]:dark:bg-neutral-800/60 [&_blockquote]:rounded-r [&_blockquote]:italic [&_blockquote]:text-xs [&_code]:bg-slate-100 [&_code]:dark:bg-neutral-800 [&_code]:text-cyan-600 [&_code]:dark:text-cyan-300 [&_code]:font-mono [&_code]:text-[11px] [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:border [&_code]:border-slate-200 [&_code]:dark:border-neutral-700 [&_mark]:bg-amber-200/90 [&_mark]:dark:bg-amber-500/30 [&_mark]:text-amber-950 [&_mark]:dark:text-amber-200 [&_mark]:px-1 [&_mark]:py-0.5 [&_mark]:rounded [&_mark]:font-medium [&_table]:w-full [&_table]:my-2 [&_table]:border-collapse [&_td]:border [&_td]:border-slate-300 [&_td]:dark:border-neutral-700 [&_td]:p-2 [&_th]:border [&_th]:border-slate-300 [&_th]:dark:border-neutral-700 [&_th]:p-2 [&_th]:bg-slate-100 [&_th]:dark:bg-neutral-800"
          />
        ) : (
          <textarea
            rows={rows}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full p-3.5 bg-slate-950 text-cyan-300 font-mono text-xs focus:outline-hidden resize-y leading-relaxed"
            placeholder="Código HTML directo..."
          />
        )}
      </div>
    </div>
  );
};
