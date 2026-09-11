import { notFound } from 'next/navigation';
import Image from 'next/image';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { createClient } from '@/lib/supabase-server';
import { buildTree, findPath, Category } from '@/lib/categories';
import StarDisplay from '@/components/StarDisplay';

export default async function EntryPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();

  const { data: entry } = await supabase
    .from('entries')
    .select('*')
    .eq('id', params.id)
    .single();

  if (!entry) return notFound();

  // 分类路径
  let categoryPath = '';
  if (entry.category_id) {
    const { data: cats } = await supabase.from('categories').select('*');
    if (cats) {
      const tree = buildTree(cats as Category[]);
      const path = findPath(tree, entry.category_id);
      categoryPath = path.map((n) => n.name).join(' / ');
    }
  }

  // 加载评分（连带方面名）
  const { data: ratings } = await supabase
    .from('ratings')
    .select('*, aspects(id, name, sort_order)')
    .eq('entry_id', params.id);

  // 按方面的 sort_order 排序
  const sortedRatings = (ratings || []).sort((a: any, b: any) => {
    const aspectA = Array.isArray(a.aspects) ? a.aspects[0] : a.aspects;
    const aspectB = Array.isArray(b.aspects) ? b.aspects[0] : b.aspects;
    const ao = aspectA?.sort_order ?? 0;
    const bo = aspectB?.sort_order ?? 0;
    return ao - bo;
  });

  return (
    <article className="max-w-2xl mx-auto">
      <a
        href="/"
        className="text-xs tracking-widest text-black/40 hover:text-black transition"
      >
        ← 返回
      </a>

      <h1 className="font-serif text-3xl md:text-4xl text-[#1a1a1a] mt-6 leading-tight">
        {entry.title}
      </h1>

      <div className="text-xs tracking-widest text-black/40 mt-4 flex flex-wrap gap-3">
        <span>{entry.date}</span>
        {categoryPath && (
          <>
            <span>·</span>
            <span>{categoryPath}</span>
          </>
        )}
        {(entry.tags || []).length > 0 && (
          <>
            <span>·</span>
            <span>{entry.tags.map((t: string) => `#${t}`).join(' ')}</span>
          </>
        )}
      </div>

      {entry.cover_image && (
        <div className="relative w-full aspect-[4/3] mt-8 rounded-2xl overflow-hidden bg-[#ecebe7]">
          <Image
            src={entry.cover_image}
            alt={entry.title}
            fill
            className="object-cover"
          />
        </div>
      )}

      {/* 评分区 */}
      {sortedRatings.length > 0 && (
        <div className="mt-10 border border-amber-200 bg-amber-50/40 rounded-2xl p-5">
          <div className="text-sm font-medium text-amber-900 mb-4">评分</div>
          <div className="space-y-4">
            {sortedRatings.map((r: any) => {
              const aspect = Array.isArray(r.aspects)
                ? r.aspects[0]
                : r.aspects;
              return (
                <div key={r.id}>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-black/70 min-w-20">
                      {aspect?.name || '—'}
                    </span>
                    <StarDisplay value={Number(r.score)} size={18} showNumber />
                  </div>
                  {r.comment && (
                    <p className="text-sm text-black/50 mt-1 pl-1">
                      {r.comment}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="prose mt-10">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {entry.content || ''}
        </ReactMarkdown>
      </div>

      {(entry.images || []).length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-12">
          {entry.images.map((url: string, i: number) => (
            <div
              key={i}
              className="relative aspect-square rounded-xl overflow-hidden bg-[#ecebe7]"
            >
              <Image
                src={url}
                alt={`${entry.title}-${i}`}
                fill
                className="object-cover"
              />
            </div>
          ))}
        </div>
      )}
    </article>
  );
}