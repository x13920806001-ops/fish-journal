import Link from 'next/link';
import Image from 'next/image';

export default function EntryCard({ entry }: { entry: any }) {
  // 从 content 截取前 80 字当简介
  const excerpt = (entry.content || '').replace(/[#*`>\-]/g, '').slice(0, 80);

  return (
    <Link href={`/entry/${entry.id}`} className="group block border rounded-lg overflow-hidden bg-white hover:shadow-md transition">
      {/* 封面 */}
      <div className="relative aspect-video bg-gray-100">
        {entry.cover_image ? (
          <Image src={entry.cover_image} alt={entry.title} fill className="object-cover group-hover:scale-105 transition" />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-300">无图</div>
        )}
      </div>

      {/* 内容 */}
      <div className="p-4">
        <h3 className="font-semibold text-lg truncate">{entry.title}</h3>
        <p className="text-xs text-gray-400 mt-1">
          {entry.date} · {entry.category}{entry.subcategory ? ` / ${entry.subcategory}` : ''}
        </p>
        <p className="text-sm text-gray-600 mt-2 line-clamp-2">{excerpt}</p>
      </div>
    </Link>
  );
}