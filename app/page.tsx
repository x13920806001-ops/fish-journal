'use client';

import { useEffect, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase-browser';
import EntryCard from '@/components/EntryCard';
import SearchBar from '@/components/SearchBar';
import CategoryTree from '@/components/CategoryTree';
import {
  buildTree,
  getDescendantIds,
  findPath,
  Category,
} from '@/lib/categories';

type RatingRow = {
  entry_id: number;
  score: number;
  aspects: { id: number; name: string; sort_order: number }[] | null;
};

export default function HomePage() {
  const supabase = createClient();

  const [entries, setEntries] = useState<any[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [ratingsByEntry, setRatingsByEntry] = useState<
    Record<number, { aspectName: string; score: number }[]>
  >({});
  const [selectedCatId, setSelectedCatId] = useState<number | null>(null);
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(true);
  const [mobileTreeOpen, setMobileTreeOpen] = useState(false);

  useEffect(() => {
    async function load() {
      const [{ data: e }, { data: c }, { data: r }] = await Promise.all([
        supabase.from('entries').select('*').order('date', { ascending: false }),
        supabase.from('categories').select('*'),
        supabase
          .from('ratings')
          .select('entry_id, score, aspects(id, name, sort_order)'),
      ]);
      setEntries(e || []);
      setCategories((c as Category[]) || []);

      const grouped: Record<
        number,
        { aspectName: string; score: number; sort: number }[]
      > = {};

      ((r || []) as unknown as RatingRow[]).forEach((row) => {
        const aspect = Array.isArray(row.aspects) ? row.aspects[0] : row.aspects;
        if (!aspect) return;
        if (!grouped[row.entry_id]) grouped[row.entry_id] = [];
        grouped[row.entry_id].push({
          aspectName: aspect.name,
          score: Number(row.score),
          sort: aspect.sort_order,
        });
      });

      const final: Record<number, { aspectName: string; score: number }[]> = {};
      Object.entries(grouped).forEach(([id, arr]) => {
        final[Number(id)] = arr
          .sort((a, b) => a.sort - b.sort)
          .map(({ aspectName, score }) => ({ aspectName, score }));
      });
      setRatingsByEntry(final);

      setLoading(false);
    }
    load();
  }, []);

  const tree = useMemo(() => buildTree(categories), [categories]);

  const catPathMap = useMemo(() => {
    const map = new Map<number, string>();
    categories.forEach((c) => {
      const path = findPath(tree, c.id);
      map.set(c.id, path.map((n) => n.name).join(' / '));
    });
    return map;
  }, [categories, tree]);

  const filtered = useMemo(() => {
    let allowedIds: number[] | null = null;
    if (selectedCatId !== null) {
      allowedIds = getDescendantIds(tree, selectedCatId);
    }

    return entries.filter((item) => {
      if (allowedIds && !allowedIds.includes(item.category_id)) return false;
      if (keyword.trim()) {
        const kw = keyword.toLowerCase();
        const hit =
          item.title?.toLowerCase().includes(kw) ||
          item.content?.toLowerCase().includes(kw) ||
          (item.tags || []).some((t: string) => t.toLowerCase().includes(kw));
        if (!hit) return false;
      }
      return true;
    });
  }, [entries, selectedCatId, keyword, tree]);

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-serif text-3xl text-[#1a1a1a] mb-2">瞎记</h1>
        <p className="text-sm text-black/40">养点儿鱼，盘点儿串儿</p>
      </div>

      <SearchBar value={keyword} onChange={setKeyword} />

      <button
        onClick={() => setMobileTreeOpen(!mobileTreeOpen)}
        className="md:hidden mt-4 w-full text-left px-4 py-2.5 bg-white rounded-xl text-sm shadow-[0_1px_3px_rgba(0,0,0,0.04)]"
      >
        分类筛选 {mobileTreeOpen ? '▲' : '▼'}
      </button>

      <div className="mt-8 md:flex md:gap-8">
        <aside
          className={`md:w-48 md:flex-shrink-0 ${
            mobileTreeOpen ? 'block' : 'hidden md:block'
          }`}
        >
          <div className="md:sticky md:top-24">
            <div className="text-[11px] tracking-widest text-black/30 mb-3 px-3">
              分类
            </div>
            <CategoryTree
              tree={tree}
              selectedId={selectedCatId}
              onSelect={(id) => {
                setSelectedCatId(id);
                setMobileTreeOpen(false);
              }}
            />
          </div>
        </aside>

        <div className="flex-1 mt-8 md:mt-0">
          {loading ? (
            <p className="text-black/30 text-center py-20 text-sm">加载中...</p>
          ) : filtered.length === 0 ? (
            <p className="text-black/30 text-center py-20 text-sm">还没有内容</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((item) => (
                <EntryCard
                  key={item.id}
                  entry={item}
                  categoryPath={catPathMap.get(item.category_id)}
                  ratings={ratingsByEntry[item.id] || []}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}