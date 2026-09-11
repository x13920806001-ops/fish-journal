'use client';

import { buildTree, Category, CategoryNode } from '@/lib/categories';

type Props = {
  categories: Category[];
  value: number | null;
  onChange: (id: number | null) => void;
};

export default function CategoryPicker({ categories, value, onChange }: Props) {
  const tree = buildTree(categories);

  // 把树拍平成带缩进的选项列表
  const options: { id: number; label: string }[] = [];
  const walk = (nodes: CategoryNode[], depth: number) => {
    nodes.forEach((n) => {
      options.push({
        id: n.id,
        label: `${'　'.repeat(depth)}${depth > 0 ? '└ ' : ''}${n.name}`,
      });
      walk(n.children, depth + 1);
    });
  };
  walk(tree, 0);

  return (
    <div>
      <select
        value={value ?? ''}
        onChange={(e) => {
          const v = e.target.value;
          onChange(v === '' ? null : Number(v));
        }}
        className="w-full border rounded px-3 py-2 text-sm bg-white"
      >
        <option value="">请选择分类</option>
        {options.map((o) => (
          <option key={o.id} value={o.id}>
            {o.label}
          </option>
        ))}
      </select>
      <p className="text-xs text-black/30 mt-1">
        分类层级在「分类管理」里调整。这里可以选到任意末级。
      </p>
    </div>
  );
}