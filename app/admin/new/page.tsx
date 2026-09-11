'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase-browser';
import ImageUploader from '@/components/ImageUploader';
import CategoryPicker from '@/components/CategoryPicker';
import StarRating from '@/components/StarRating';
import { Category } from '@/lib/categories';

type Aspect = { id: number; category_id: number; name: string; sort_order: number };
type RatingDraft = { score: number; comment: string };

export default function NewEntryPage() {
  const supabase = createClient();
  const router = useRouter();

  const [categories, setCategories] = useState<Category[]>([]);
  const [aspects, setAspects] = useState<Aspect[]>([]);          // 当前分类下的方面
  const [ratings, setRatings] = useState<Record<number, RatingDraft>>({}); // aspect_id → 草稿

  const [title, setTitle] = useState('');
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [content, setContent] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [tagsInput, setTagsInput] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  // 加载分类
  useEffect(() => {
    supabase.from('categories').select('*').order('sort_order').then(({ data }) => {
      setCategories((data as Category[]) || []);
    });
  }, []);

  // 选了分类 → 加载它的评分方面，重置评分草稿
  useEffect(() => {
    if (!categoryId) {
      setAspects([]);
      setRatings({});
      return;
    }
    supabase
      .from('aspects')
      .select('*')
      .eq('category_id', categoryId)
      .order('sort_order')
      .then(({ data }) => {
        setAspects((data as Aspect[]) || []);
        setRatings({});
      });
  }, [categoryId]);

  function setScore(aspectId: number, score: number) {
    setRatings((prev) => ({
      ...prev,
      [aspectId]: { score, comment: prev[aspectId]?.comment || '' },
    }));
  }

  function setComment(aspectId: number, comment: string) {
    setRatings((prev) => ({
      ...prev,
      [aspectId]: { score: prev[aspectId]?.score || 0, comment },
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return alert('请填标题');
    if (!categoryId) return alert('请选分类');
    if (!coverImage) return alert('请上传封面图');

    setSaving(true);

    const tags = tagsInput.split(',').map((t) => t.trim()).filter(Boolean);

    // 1. 插入 entry
    const { data: inserted, error } = await supabase
      .from('entries')
      .insert({
        title,
        category_id: categoryId,
        content,
        cover_image: coverImage,
        images,
        tags,
        date,
      })
      .select()
      .single();

    if (error || !inserted) {
      setSaving(false);
      return alert('保存失败：' + (error?.message || '未知错误'));
    }

    // 2. 插入评分（只保存打了分的，score > 0）
    const ratingRows = Object.entries(ratings)
      .filter(([, r]) => r.score > 0)
      .map(([aspectId, r]) => ({
        entry_id: inserted.id,
        aspect_id: Number(aspectId),
        score: r.score,
        comment: r.comment.trim() || null,
      }));

    if (ratingRows.length > 0) {
      const { error: rErr } = await supabase.from('ratings').insert(ratingRows);
      if (rErr) {
        setSaving(false);
        return alert('条目已保存，但评分保存失败：' + rErr.message);
      }
    }

    setSaving(false);
    alert('保存成功');
    router.push('/admin');
    router.refresh();
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">新建条目</h1>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm mb-1">标题 *</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full border rounded px-3 py-2" placeholder="比如：我的第一条孔雀鱼" />
        </div>

        <div>
          <label className="block text-sm mb-1">分类 *</label>
          <CategoryPicker categories={categories} value={categoryId} onChange={setCategoryId} />
        </div>

        {/* 评分区：选了分类且该分类有方面时显示 */}
        {aspects.length > 0 && (
          <div className="border border-amber-200 bg-amber-50/40 rounded-xl p-4">
            <div className="text-sm font-medium text-amber-900 mb-3">评分（可选，不打分就留空）</div>
            <div className="space-y-4">
              {aspects.map((a) => (
                <div key={a.id}>
                  <div className="text-sm text-black/70 mb-1">{a.name}</div>
                  <StarRating
                    value={ratings[a.id]?.score || 0}
                    onChange={(v) => setScore(a.id, v)}
                  />
                  <input
                    value={ratings[a.id]?.comment || ''}
                    onChange={(e) => setComment(a.id, e.target.value)}
                    placeholder="这一项的评论（可选）"
                    className="w-full mt-2 border rounded px-2 py-1.5 text-sm"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        <div>
          <label className="block text-sm mb-1">日期</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full border rounded px-3 py-2" />
        </div>

        <div>
          <label className="block text-sm mb-1">标签（英文逗号分隔，可留空）</label>
          <input value={tagsInput} onChange={(e) => setTagsInput(e.target.value)} className="w-full border rounded px-3 py-2" placeholder="比如：新手, 孔雀鱼" />
        </div>

        <div>
          <label className="block text-sm mb-1">封面图 *</label>
          <ImageUploader single onUploaded={(urls) => setCoverImage(urls[0] || '')} />
          {coverImage && <img src={coverImage} alt="封面" className="mt-2 w-40 h-40 object-cover rounded border" />}
        </div>

        <div>
          <label className="block text-sm mb-1">更多图片（可多选）</label>
          <ImageUploader onUploaded={(urls) => setImages((prev) => [...prev, ...urls])} />
          {images.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {images.map((url) => (
                <img key={url} src={url} alt="" className="w-20 h-20 object-cover rounded border" />
              ))}
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm mb-1">正文（支持 Markdown）</label>
          <textarea value={content} onChange={(e) => setContent(e.target.value)} rows={10} className="w-full border rounded px-3 py-2 font-mono text-sm" placeholder="写点什么... 支持 **加粗**、# 标题、- 列表等" />
        </div>

        <button type="submit" disabled={saving} className="bg-black text-white px-6 py-2 rounded hover:bg-gray-800 disabled:opacity-50">
          {saving ? '保存中...' : '保存'}
        </button>
      </form>
    </div>
  );
}