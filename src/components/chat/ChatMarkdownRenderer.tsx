'use client';

import { useMemo } from 'react';

const CODE_LANGS: Record<string, string> = {
  js: 'JavaScript',
  ts: 'TypeScript',
  tsx: 'TSX',
  jsx: 'JSX',
  py: 'Python',
  go: 'Go',
  rs: 'Rust',
  sql: 'SQL',
  bash: 'Bash',
  sh: 'Shell',
  json: 'JSON',
  yaml: 'YAML',
  html: 'HTML',
  css: 'CSS',
  md: 'Markdown'
};

function highlightCode(code: string, lang: string): string {
  // Simple syntax highlighting
  const keywords = /\b(function|const|let|var|return|if|else|for|while|class|import|export|async|await|from|as|default)\b/g;
  const strings = /(['"`])(?:(?=(\\?))\2.)*?\1/g;
  const comments = /(\/\/.*$|\/\*[\s\S]*?\*\/)/gm;
  const numbers = /\b(\d+)\b/g;

  let highlighted = code
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  highlighted = highlighted
    .replace(comments, '<span style="color: #64748b;">$1</span>')
    .replace(keywords, '<span style="color: #a78bfa;">$1</span>')
    .replace(strings, '<span style="color: #86efac;">$1</span>')
    .replace(numbers, '<span style="color: #fbbf24;">$1</span>');

  return highlighted;
}

export function ChatMarkdownRenderer({ children }: { children: string }) {
  const rendered = useMemo(() => {
    let html = children;

    // Bold
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong style="font-weight: 600; color: var(--t1);">$1</strong>');

    // Italic
    html = html.replace(/\*(.+?)\*/g, '<em style="font-style: italic;">$1</em>');

    // Code blocks
    html = html.replace(/```([\w]*)\n([\s\S]*?)```/g, (match, lang, code) => {
      const language = lang.trim() || 'plaintext';
      const highlighted = highlightCode(code.trim(), language);
      const langName = CODE_LANGS[language] || language;
      return `<div style="background: rgba(0,0,0,0.5); border-radius: 6px; margin: 8px 0; overflow: hidden; border: 0.5px solid rgba(139, 92, 246, 0.15);">
        <div style="padding: 8px 12px; background: rgba(139, 92, 246, 0.1); border-bottom: 0.5px solid rgba(139, 92, 246, 0.15); font-size: 10px; color: var(--t3); font-family: var(--mono); font-weight: 500;">${langName}</div>
        <pre style="margin: 0; padding: 12px; font-size: 11px; font-family: var(--mono); color: var(--t2); overflow-x: auto; line-height: 1.4;"><code>${highlighted}</code></pre>
      </div>`;
    });

    // Inline code
    html = html.replace(/`([^`]+)`/g, '<code style="background: rgba(139, 92, 246, 0.12); padding: 2px 6px; border-radius: 3px; font-family: var(--mono); font-size: 11px; color: #a78bfa;">$1</code>');

    // Links
    html = html.replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" style="color: var(--acc); text-decoration: underline; cursor: pointer;">$1</a>');

    // Headings
    html = html.replace(/### (.+?)(\n|$)/g, '<div style="font-weight: 600; margin-top: 8px; color: var(--t1); font-size: 12px;">$1</div>');
    html = html.replace(/## (.+?)(\n|$)/g, '<div style="font-weight: 600; margin-top: 10px; color: var(--t1); font-size: 13px;">$1</div>');
    html = html.replace(/# (.+?)(\n|$)/g, '<div style="font-weight: 600; margin-top: 12px; color: var(--t1); font-size: 14px;">$1</div>');

    // Lists
    html = html.replace(/\n- (.+?)(?=\n|$)/g, '<div style="margin-left: 12px; margin-top: 4px;">• $1</div>');

    // Line breaks
    html = html.replace(/\n\n/g, '<div style="height: 8px;"></div>');
    html = html.replace(/\n/g, '<br/>');

    return html;
  }, [children]);

  return (
    <div
      dangerouslySetInnerHTML={{ __html: rendered }}
      style={{ whiteSpace: 'normal', overflowWrap: 'break-word' }}
    />
  );
}
