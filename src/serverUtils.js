export function removeMarkdown(markdownText) {
    return markdownText
        // Remove headers
        .replace(/^(#{1,6})\s+/gm, '')
        // Remove bold and italic (e.g., **bold**, *italic*, _italic_)
        .replace(/(\*\*|__)(.*?)\1/g, '$2')
        .replace(/(\*|_)(.*?)\1/g, '$2')
        // Remove strikethrough (e.g., ~~strikethrough~~)
        .replace(/~~(.*?)~~/g, '$1')
        // Remove inline code (e.g., `code`)
        .replace(/`(.*?)`/g, '$1')
        // Remove links [text](url)
        .replace(/\[([^\]]+)]\([^)]+\)/g, '$1')
        // Remove images ![alt](url)
        .replace(/!\[([^\]]*)]\([^)]+\)/g, '$1')
        // Remove blockquotes
        .replace(/^\s*>+\s?/gm, '')
        // Remove horizontal rules
        .replace(/^(-{3,}|_{3,}|\*{3,})$/gm, '')
        // Remove unordered lists
        .replace(/^\s*[-*+]\s+/gm, '')
        // Remove ordered lists
        .replace(/^\s*\d+\.\s+/gm, '')
        // Remove extra newlines
        .replace(/\n{2,}/g, '\n')
        // Trim any leading or trailing whitespace
        .trim();
  }