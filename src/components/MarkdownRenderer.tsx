import { useMemo } from 'react'

interface MarkdownRendererProps {
  content: string
}

export default function MarkdownRenderer({ content }: MarkdownRendererProps) {
  const renderMarkdown = useMemo(() => {
    // Escape HTML to prevent XSS
    const escapeHtml = (unsafe: string) => {
      return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "'")
    };

    // Convert markdown to HTML
    let html = escapeHtml(content);
    
    // Headers
    html = html.replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold my-4 text-gray-900 dark:text-white">$1</h1>');
    html = html.replace(/^## (.*$)/gim, '<h2 class="text-xl font-bold my-3 text-gray-900 dark:text-white">$1</h2>');
    html = html.replace(/^### (.*$)/gim, '<h3 class="text-lg font-bold my-2 text-gray-900 dark:text-white">$1</h3>');
    
    // Bold and italic
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-gray-900 dark:text-white">$1</strong>');
    html = html.replace(/\*(.*?)\*/g, '<em class="italic text-gray-900 dark:text-white">$1</em>');
    
    // Code blocks with syntax highlighting simulation
    html = html.replace(/```(\w+)?\n([\s\S]*?)\n```/g, (_, lang, code) => {
      return `<pre class=\"bg-gray-800 text-gray-200 p-4 rounded my-2 overflow-x-auto\"><code class=\"language-${lang || 'plaintext'}\">${code}</code><div class=\"text-xs text-gray-400 mt-1\">${lang || 'plaintext'}</div></pre>`;
    });
    
    html = html.replace(/`(.*?)`/g, '<code class="bg-gray-200 dark:bg-gray-700 px-1.5 py-0.5 rounded text-sm font-mono">$1</code>');
    
    // Lists
    html = html.replace(/^\* (.*$)/gim, '<li class="ml-4 list-item">$1</li>');
    html = html.replace(/(<li class="ml-4 list-item">[\s\S]*?<\/li>\n?)+/gm, '<ul class="list-disc my-2 pl-5">$&</ul>');
    
    // Numbered lists
    html = html.replace(/^\d+\. (.*$)/gim, '<li class="ml-4 list-item">$1</li>');
    html = html.replace(/(<li class="ml-4 list-item">[\s\S]*?<\/li>\n?)+/gm, '<ol class="list-decimal my-2 pl-5">$&</ol>');
    
    // Links
    html = html.replace(/\[(.+?)\]\((.*?)\)/g, '<a href="$2" class="text-indigo-600 dark:text-indigo-400 hover:underline" target="_blank" rel="noopener noreferrer">$1</a>');
    
    // Line breaks to paragraphs
    html = html.replace(/\n\n/g, '</p><p class="my-3">');
    html = '<p class="my-3">' + html + '</p>';
    
    // Single line breaks
    html = html.replace(/\n/g, '<br />');

    return { __html: html };
  }, [content]);

  return (
    <div 
      className="markdown-content prose prose-indigo dark:prose-invert max-w-none"
      dangerouslySetInnerHTML={renderMarkdown}
    />
  );
}