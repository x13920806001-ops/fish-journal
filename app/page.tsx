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

  // 加载数据
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

  // 根据筛选条件过滤
  const filtered = useMemo(() => {
    return entries.filter((item) => {
      // 分类筛选
      if (selectedCategory !== '全部' && item.category !== selectedCategory) return false;
      if (selectedSub !== '全部' && item.subcategory !== selectedSub) return false;
      // 搜索：标题 + 内容 + 标签
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
        <p className="text-gray-400 text-center py-12">加载中...</p>
      ) : filtered.length === 0 ? (
        <p className="text-gray-400 text-center py-12">还没有内容</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-6">
          {filtered.map((item) => (
            <EntryCard key={item.id} entry={item} />
          ))}
        </div>
      )}
    </div>
  );
}