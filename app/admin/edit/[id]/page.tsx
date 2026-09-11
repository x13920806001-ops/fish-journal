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

export default function EditEntryPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const router = useRouter();

  const [categories, setCategories] = useState<Category[]>([]);
  const [aspects, setAspects] = useState<Aspect[]>([]);
  const [ratings, setRatings] = useState<Record<number, RatingDraft>>({});

  const [title, setTitle] = useState('');
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [content, setContent] = useState('');
  const [date, setDate] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // 加载分类 + 条目 + 已有评分
  useEffect(() => {
    async function load() {
      const [{ data: c }, { data: e }, { data: r }] = await Promise.all([
        supabase.from('categories').select('*').order('sort_order'),
        supabase.from('entries').select('*').eq('id', params.id).single(),
        supabase.from('ratings').select('*').eq('entry_id', params.id),
      ]);
      setCategories((c as Category[]) || []);

      if (e) {
        setTitle(e.title || '');
        setCategoryId(e.category_id ?? null);
        setContent(e.content || '');
        setDate(e.date || '');
        setTagsInput((e.tags || []).join(', '));
        setCoverImage(e.cover_image || '');
        setImages(e.images || []);
      }

      // 已有评分转成草稿
      const draft: Record<number, RatingDraft> = {};
      (r || []).forEach((row: any) => {
        draft[row.aspect_id] = { score: Number(row.score), comment: row.comment || '' };
      });
      setRatings(draft);

      setLoading(false);
    }
    load();
  }, [params.id]);

  // 分类变了 → 重新加载该分类的方面（保留已有草稿）
  useEffect(() => {
    if (!categoryId) {
      setAspects([]);
      return;
    }
    supabase
      .from('aspects')
      .select('*')
      .eq('category_id', categoryId)
      .order('sort_order')
      .then(({ data }) => setAspects((data as Aspect[]) || []));
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
    setSaving(true);

    const tags = tagsInput.split(',').map((t) => t.trim()).filter(Boolean);

    // 1. 更新 entry
    const { error } = await supabase
      .from('entries')
      .update({
        title,
        category_id: categoryId,
        content,
        cover_image: coverImage,
        images,
        tags,
        date,
      })
      .eq('id', params.id);

    if (error) {
      setSaving(false);
      return alert('保存失败：' + error.message);
    }

    // 2. 更新评分：先删掉这条记录的所有旧评分，再插入新的
    await supabase.from('ratings').delete().eq('entry_id', params.id);

    const ratingRows = Object.entries(ratings)
      .filter(([, r]) => r.score > 0)
      .map(([aspectId, r]) => ({
        entry_id: Number(params.id),
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

  if (loading) return <p className="text-gray-400">加载中...</p>;

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">编辑条目</h1>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm mb-1">标题 *</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full border rounded px-3 py-2" />
        </div>

        <div>
          <label className="block text-sm mb-1">分类 *</label>
          <CategoryPicker categories={categories} value={categoryId} onChange={setCategoryId} />
        </div>

        {aspects.length > 0 && (
          <div className="border border-amber-200 bg-amber-50/40 rounded-xl p-4">
            <div className="text-sm font-medium text-amber-900 mb-3">评分（可选）</div>
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
          <label className="block text-sm mb-1">标签（英文逗号分隔）</label>
          <input value={tagsInput} onChange={(e) => setTagsInput(e.target.value)} className="w-full border rounded px-3 py-2" />
        </div>

        <div>
          <label className="block text-sm mb-1">封面图 *</label>
          <ImageUploader single onUploaded={(urls) => setCoverImage(urls[0] || '')} />
          {coverImage && <img src={coverImage} alt="封面" className="mt-2 w-40 h-40 object-cover rounded border" />}
        </div>

        <div>
          <label className="block text-sm mb-1">更多图片</label>
          <ImageUploader onUploaded={(urls) => setImages((prev) => [...prev, ...urls])} />
          {images.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {images.map((url, i) => (
                <div key={i} className="relative">
                  <img src={url} alt="" className="w-20 h-20 object-cover rounded border" />
                  <button type="button" onClick={() => setImages(images.filter((_, idx) => idx !== i))} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 text-xs">×</button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm mb-1">正文（Markdown）</label>
          <textarea value={content} onChange={(e) => setContent(e.target.value)} rows={10} className="w-full border rounded px-3 py-2 font-mono text-sm" />
        </div>

        <button type="submit" disabled={saving} className="bg-black text-white px-6 py-2 rounded hover:bg-gray-800 disabled:opacity-50">
          {saving ? '保存中...' : '保存'}
        </button>
      </form>
    </div>
  );
}