import { notFound } from 'next/navigation';
import Image from 'next/image';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { createClient } from '@/lib/supabase-server';

export default async function EntryPage({ params }: { params: { id: string } }) {
  const supabase = createClient();

  const { data: entry } = await supabase
    .from('entries')
    .select('*')
    .eq('id', params.id)
    .single();

  if (!entry) return notFound();

  return (
    <article className="max-w-3xl mx-auto">
      {/* 返回 */}
      <a href="/" className="text-sm text-gray-500 hover:text-black">← 返回首页</a>

      {/* 标题 */}
      <h1 className="text-3xl font-bold mt-4">{entry.title}</h1>

      {/* 元信息 */}
      <div className="text-sm text-gray-500 mt-2 flex flex-wrap gap-3">
        <span>{entry.date}</span>
        <span>·</span>
        <span>{entry.category}{entry.subcategory ? ` / ${entry.subcategory}` : ''}</span>
        {(entry.tags || []).length > 0 && (
          <>
            <span>·</span>
            <span>{entry.tags.map((t: string) => `#${t}`).join(' ')}</span>
          </>
        )}
      </div>

      {/* 封面图 */}
      {entry.cover_image && (
        <div className="relative w-full aspect-video mt-6 rounded-lg overflow-hidden bg-gray-100">
          <Image src={entry.cover_image} alt={entry.title} fill className="object-cover" />
        </div>
      )}

      {/* 正文（Markdown） */}
      <div className="prose prose-neutral max-w-none mt-6">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{entry.content || ''}</ReactMarkdown>
      </div>

      {/* 更多图片 */}
      {(entry.images || []).length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-8">
          {entry.images.map((url: string, i: number) => (
            <div key={i} className="relative aspect-square rounded-lg overflow-hidden bg-gray-100">
              <Image src={url} alt={`${entry.title}-${i}`} fill className="object-cover" />
            </div>
          ))}
        </div>
      )}
    </article>
  );
}