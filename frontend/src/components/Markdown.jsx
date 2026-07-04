import { marked } from 'marked';

marked.setOptions({ breaks: true });

// Rend du markdown (issu des résumés OpenRouter) en HTML.
// La source est notre propre LLM sur des textes arXiv/news, pas une entrée utilisateur.
export default function Markdown({ children, className }) {
  if (!children) return null;
  return (
    <div
      className={className}
      dangerouslySetInnerHTML={{ __html: marked.parse(String(children)) }}
    />
  );
}
