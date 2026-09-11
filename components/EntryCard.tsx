import Link from 'next/link';
import Image from 'next/image';

export default function EntryCard({
  entry,
  categoryPath,
}: {
  entry: any;
  categoryPath?: string;
}) {
  const excerpt = (entry.content || '').replace(/[#*`>\-]/g, '').slice(0, 70);

  return (
    <Link
      href={`/entry/${entry.id}`}
      className="group block bg-white rounded-2xl overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-300"
    >
      <div className="relative aspect-[4/3] bg-[#ecebe7] overflow-hidden">
        {entry.cover_image ? (
          <Image
            src={entry.cover_image}
            alt={entry.title}
            fill
            className="object-cover group-hover:scale-[1.03] transition-transform duration-500"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-black/20 text-sm">
            暂无图片
          </div>
        )}
      </div>

      <div className="p-5">
        <div className="text-[11px] tracking-widest text-black/40 mb-2">
          {entry.date}
          {categoryPath ? ` · ${categoryPath}` : ''}
        </div>
        <h3 className="font-serif text-lg text-[#1a1a1a] leading-snug mb-2 line-clamp-1">
          {entry.title}
        </h3>
        <p className="text-sm text-black/50 leading-relaxed line-clamp-2">
          {excerpt}
        </p>
      </div>
    </Link>
  );
}