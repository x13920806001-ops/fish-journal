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

export default function HomePage() {
  const supabase = createClient();

  const [entries, setEntries] = useState<any[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCatId, setSelectedCatId] = useState<number | null>(null);
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(true);
  const [mobileTreeOpen, setMobileTreeOpen] = useState(false);

  useEffect(() => {
    async function load() {
      const [{ data: e }, { data: c }] = await Promise.all([
        supabase.from('entries').select('*').order('date', { ascending: false }),
        supabase.from('categories').select('*'),
      ]);
      setEntries(e || []);
      setCategories((c as Category[]) || []);
      setLoading(false);
    }
    load();
  }, []);

  const tree = useMemo(() => buildTree(categories), [categories]);

  // 分类 id → 路径字符串（"鱼 / 淡水"）
  const catPathMap = useMemo(() => {
    const map = new Map<number, string>();
    categories.forEach((c) => {
      const path = findPath(tree, c.id);
      map.set(c.id, path.map((n) => n.name).join(' / '));
    });
    return map;
  }, [categories, tree]);

  const filtered = useMemo(() => {
    // 选中分类时，包含它的所有后代分类下的内容
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
      {/* 标题区 */}
      <div className="mb-8">
        <h1 className="font-serif text-3xl text-[#1a1a1a] mb-2">记录</h1>
        <p className="text-sm text-black/40">养过的鱼、开过的花、走过的路、陪着的它</p>
      </div>

      <SearchBar value={keyword} onChange={setKeyword} />

      {/* 移动端：分类折叠按钮 */}
      <button
        onClick={() => setMobileTreeOpen(!mobileTreeOpen)}
        className="md:hidden mt-4 w-full text-left px-4 py-2.5 bg-white rounded-xl text-sm shadow-[0_1px_3px_rgba(0,0,0,0.04)]"
      >
        分类筛选 {mobileTreeOpen ? '▲' : '▼'}
      </button>

      <div className="mt-8 md:flex md:gap-8">
        {/* 左侧分类树 */}
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

        {/* 右侧卡片 */}
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
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}