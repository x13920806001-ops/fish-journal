'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase-browser';

type Props = {
  single?: boolean;               // 是否只传一张（封面用）
  onUploaded: (urls: string[]) => void;
};

export default function ImageUploader({ single = false, onUploaded }: Props) {
  const supabase = createClient();
  const [uploading, setUploading] = useState(false);

  async function handleSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    const urls: string[] = [];

    for (const file of Array.from(files)) {
      // 生成一个不会重名的文件名：时间戳-随机数.原后缀
      const ext = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

      // 上传到 images 桶
      const { error } = await supabase.storage
        .from('images')
        .upload(fileName, file, { cacheControl: '3600', upsert: false });

      if (error) {
        alert('上传失败：' + error.message);
        continue;
      }

      // 获取公开访问 URL
      const { data: urlData } = supabase.storage.from('images').getPublicUrl(fileName);
      urls.push(urlData.publicUrl);
    }

    setUploading(false);
    onUploaded(urls);

    // 清空 input，方便再次选同一张图
    e.target.value = '';
  }

  return (
    <div>
      <label className="inline-block cursor-pointer border rounded px-4 py-2 text-sm hover:bg-gray-50">
        {uploading ? '上传中...' : single ? '选择封面图' : '选择图片（可多选）'}
        <input
          type="file"
          accept="image/*"
          multiple={!single}
          onChange={handleSelect}
          disabled={uploading}
          className="hidden"
        />
      </label>
    </div>
  );
}