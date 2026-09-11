'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase-browser';
import ImageUploader from '@/components/ImageUploader';

export default function NewEntryPage() {
  const supabase = createClient();
  const router = useRouter();

  const [categories, setCategories] = useState<any[]>([]);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [subcategory, setSubcategory] = useState('');
  const [content, setContent] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [tagsInput, setTagsInput] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  // 加载分类
  useEffect(() => {
    supabase.from('categories').select('*').order('sort_order').then(({ data }) => {
      setCategories(data || []);
    });
  }, []);

  // 顶级分类
  const topCategories = categories.filter((c) => !c.parent_id);
  // 当前顶级分类下的子分类
  const currentTop = categories.find((c) => c.name === category);
  const subCategories = categories.filter((c) => c.parent_id === currentTop?.id);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return alert('请填标题');
    if (!category) return alert('请选分类');
    if (!coverImage) return alert('请上传封面图');

    setSaving(true);

    // tags 用逗号分隔，去掉空格和空项
    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const { error } = await supabase.from('entries').insert({
      title,
      category,
      subcategory,
      content,
      cover_image: coverImage,
      images,
      tags,
      date,
    });

    setSaving(false);

    if (error) {
      alert('保存失败：' + error.message);
    } else {
      alert('保存成功');
      router.push('/admin');
      router.refresh();
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">新建条目</h1>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* 标题 */}
        <div>
          <label className="block text-sm mb-1">标题 *</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full border rounded px-3 py-2"
            placeholder="比如：我的第一条孔雀鱼"
          />
        </div>

        {/* 分类 */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm mb-1">分类 *</label>
            <select
              value={category}
              onChange={(e) => { setCategory(e.target.value); setSubcategory(''); }}
              className="w-full border rounded px-3 py-2"
            >
              <option value="">请选择</option>
              {topCategories.map((c) => (
                <option key={c.id} value={c.name}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm mb-1">子分类（可选）</label>
            <select
              value={subcategory}
              onChange={(e) => setSubcategory(e.target.value)}
              disabled={subCategories.length === 0}
              className="w-full border rounded px-3 py-2 disabled:bg-gray-100"
            >
              <option value="">无</option>
              {subCategories.map((c) => (
                <option key={c.id} value={c.name}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* 日期 */}
        <div>
          <label className="block text-sm mb-1">日期</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full border rounded px-3 py-2"
          />
        </div>

        {/* 标签 */}
        <div>
          <label className="block text-sm mb-1">标签（用英文逗号分隔，可留空）</label>
          <input
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            className="w-full border rounded px-3 py-2"
            placeholder="比如：新手, 孔雀鱼"
          />
        </div>

        {/* 封面图 */}
        <div>
          <label className="block text-sm mb-1">封面图 *</label>
          <ImageUploader
            single
            onUploaded={(urls) => setCoverImage(urls[0] || '')}
          />
          {coverImage && (
            <img src={coverImage} alt="封面" className="mt-2 w-40 h-40 object-cover rounded border" />
          )}
        </div>

        {/* 多图 */}
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

        {/* 正文 */}
        <div>
          <label className="block text-sm mb-1">正文（支持 Markdown）</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={10}
            className="w-full border rounded px-3 py-2 font-mono text-sm"
            placeholder="写点什么... 支持 **加粗**、# 标题、- 列表等"
          />
        </div>

        {/* 提交 */}
        <button
          type="submit"
          disabled={saving}
          className="bg-black text-white px-6 py-2 rounded hover:bg-gray-800 disabled:opacity-50"
        >
          {saving ? '保存中...' : '保存'}
        </button>
      </form>
    </div>
  );
}