type NewsArticle = { id: string; headline: string; summary: string; source: string; url?: string; publishedAt: string };

export function NewsPanel({ news }: { news: NewsArticle[] }) {
  return (
    <div className="space-y-3">
      {!news.length && <p className="text-sm text-slate-500">No related news was returned for this window.</p>}
      {news.slice(0, 5).map((article) => (
        <article key={article.id} className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
          <div className="flex items-center justify-between gap-3 text-[11px] uppercase tracking-wider text-slate-500">
            <span>{article.source || "Alpaca news"}</span>
            <time dateTime={article.publishedAt}>{new Date(article.publishedAt).toLocaleDateString()}</time>
          </div>
          {article.url ? <a href={article.url} target="_blank" rel="noreferrer" className="mt-1 block font-medium text-slate-200 hover:text-cyan-300">{article.headline}</a> : <h4 className="mt-1 font-medium text-slate-200">{article.headline}</h4>}
          {article.summary && <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">{article.summary}</p>}
        </article>
      ))}
    </div>
  );
}
