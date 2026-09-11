'use client';

import { useEffect, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase-browser';
import EntryCard from '@/components/EntryCard';
import FilterBar from '@/components/FilterBar';
import SearchBar from '@/components/SearchBar';

export default function HomePage() {
  const supabase = createClient();

  const [entries, setEntries] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('全部');
  const [selectedSub, setSelectedSub] = useState<string>('全部');
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [{ data: e }, { data: c }] = await Promise.all([
        supabase.from('entries').select('*').order('date', { ascending: false }),
        supabase.from('categories').select('*').order('sort_order'),
      ]);
      setEntries(e || []);
      setCategories(c || []);
      setLoading(false);
    }
    load();
  }, []);

  const filtered = useMemo(() => {
    return entries.filter((item) => {
      if (selectedCategory !== '全部' && item.category !== selectedCategory) return false;
      if (selectedSub !== '全部' && item.subcategory !== selectedSub) return false;
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
  }, [entries, selectedCategory, selectedSub, keyword]);

  return (
    <div>
      {/* 标题区 */}
      <div className="mb-8">
        <h1 className="font-serif text-3xl text-[#1a1a1a] mb-2">记录</h1>
        <p className="text-sm text-black/40">养过的鱼、开过的花、走过的路、陪着的它</p>
      </div>

      {/* 搜索框 */}
      <SearchBar value={keyword} onChange={setKeyword} />

      {/* 分类筛选 */}
      <FilterBar
        categories={categories}
        selectedCategory={selectedCategory}
        selectedSub={selectedSub}
        onCategoryChange={(c) => { setSelectedCategory(c); setSelectedSub('全部'); }}
        onSubChange={setSelectedSub}
      />

      {/* 卡片网格 */}
      {loading ? (
        <p className="text-black/30 text-center py-20 text-sm">加载中...</p>
      ) : filtered.length === 0 ? (
        <p className="text-black/30 text-center py-20 text-sm">还没有内容</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-10">
          {filtered.map((item) => (
            <EntryCard key={item.id} entry={item} />
          ))}
        </div>
      )}
    </div>
  );
}