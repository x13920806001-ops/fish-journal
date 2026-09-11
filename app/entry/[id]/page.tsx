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
    <article className="max-w-2xl mx-auto">
      <a href="/" className="text-xs tracking-widest text-black/40 hover:text-black transition">
        ← 返回
      </a>

      <h1 className="font-serif text-3xl md:text-4xl text-[#1a1a1a] mt-6 leading-tight">
        {entry.title}
      </h1>

      <div className="text-xs tracking-widest text-black/40 mt-4 flex flex-wrap gap-3">
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

      {entry.cover_image && (
        <div className="relative w-full aspect-[4/3] mt-8 rounded-2xl overflow-hidden bg-[#ecebe7]">
          <Image src={entry.cover_image} alt={entry.title} fill className="object-cover" />
        </div>
      )}

      <div className="prose mt-10">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{entry.content || ''}</ReactMarkdown>
      </div>

      {(entry.images || []).length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-12">
          {entry.images.map((url: string, i: number) => (
            <div key={i} className="relative aspect-square rounded-xl overflow-hidden bg-[#ecebe7]">
              <Image src={url} alt={`${entry.title}-${i}`} fill className="object-cover" />
            </div>
          ))}
        </div>
      )}
    </article>
  );
}