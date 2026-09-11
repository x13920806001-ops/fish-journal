'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase-browser';
import ImageUploader from '@/components/ImageUploader';
import CategoryPicker from '@/components/CategoryPicker';
import { Category } from '@/lib/categories';

export default function EditEntryPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const router = useRouter();

  const [categories, setCategories] = useState<Category[]>([]);
  const [title, setTitle] = useState('');
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [content, setContent] = useState('');
  const [date, setDate] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      const [{ data: c }, { data: e }] = await Promise.all([
        supabase.from('categories').select('*').order('sort_order'),
        supabase.from('entries').select('*').eq('id', params.id).single(),
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
      setLoading(false);
    }
    load();
  }, [params.id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const tags = tagsInput.split(',').map((t) => t.trim()).filter(Boolean);

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

    setSaving(false);

    if (error) {
      alert('保存失败：' + error.message);
    } else {
      alert('保存成功');
      router.push('/admin');
      router.refresh();
    }
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
          <CategoryPicker
            categories={categories}
            value={categoryId}
            onChange={setCategoryId}
          />
        </div>

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
                  <button
                    type="button"
                    onClick={() => setImages(images.filter((_, idx) => idx !== i))}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 text-xs"
                  >
                    ×
                  </button>
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