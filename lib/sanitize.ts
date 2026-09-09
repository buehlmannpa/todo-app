const ALLOWED_TAGS = new Set([
  "P", "DIV", "BR", "B", "STRONG", "I", "EM", "U", "S", "STRIKE", "SPAN",
  "UL", "OL", "LI", "H1", "H2", "H3", "BLOCKQUOTE", "CODE", "PRE", "A",
]);

const ALLOWED_ATTRS: Record<string, Set<string>> = {
  A: new Set(["href", "target", "rel"]),
};

/**
 * Entfernt alles, was nicht zur Formatierung gehört. Läuft im Browser,
 * bevor Notizen gespeichert werden, und schützt vor eingefügtem Markup.
 */
export function sanitizeHtml(html: string): string {
  if (typeof document === "undefined") return html;

  const template = document.createElement("template");
  template.innerHTML = html;

  const walk = (node: Element) => {
    for (const child of Array.from(node.children)) {
      if (!ALLOWED_TAGS.has(child.tagName)) {
        const text = document.createTextNode(child.textContent ?? "");
        child.replaceWith(text);
        continue;
      }

      const allowed = ALLOWED_ATTRS[child.tagName] ?? new Set<string>();
      for (const attribute of Array.from(child.attributes)) {
        if (!allowed.has(attribute.name.toLowerCase())) {
          child.removeAttribute(attribute.name);
        }
      }

      if (child.tagName === "A") {
        const href = child.getAttribute("href") ?? "";
        if (!/^https?:\/\//i.test(href) && !/^mailto:/i.test(href)) {
          child.removeAttribute("href");
        } else {
          child.setAttribute("target", "_blank");
          child.setAttribute("rel", "noopener noreferrer");
        }
      }

      walk(child);
    }
  };

  walk(template.content as unknown as Element);
  return template.innerHTML;
}
