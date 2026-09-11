'use client';

import { useState } from 'react';
import { CategoryNode } from '@/lib/categories';

type Props = {
  tree: CategoryNode[];
  selectedId: number | null;
  onSelect: (id: number | null) => void;
};

export default function CategoryTree({ tree, selectedId, onSelect }: Props) {
  return (
    <div className="space-y-0.5">
      <button
        onClick={() => onSelect(null)}
        className={`w-full text-left px-3 py-1.5 rounded-lg text-sm transition ${
          selectedId === null
            ? 'bg-[#1a1a1a] text-white'
            : 'text-black/60 hover:bg-black/5 hover:text-black'
        }`}
      >
        全部
      </button>
      {tree.map((node) => (
        <TreeNode
          key={node.id}
          node={node}
          depth={0}
          selectedId={selectedId}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}

function TreeNode({
  node,
  depth,
  selectedId,
  onSelect,
}: {
  node: CategoryNode;
  depth: number;
  selectedId: number | null;
  onSelect: (id: number | null) => void;
}) {
  const [open, setOpen] = useState(true);
  const hasChildren = node.children.length > 0;
  const active = selectedId === node.id;

  return (
    <div>
      <div
        className="flex items-center"
        style={{ paddingLeft: `${depth * 14}px` }}
      >
        {/* 展开/收起箭头 */}
        {hasChildren ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setOpen(!open);
            }}
            className="w-5 h-5 flex items-center justify-center text-black/30 hover:text-black text-xs"
          >
            <span className={`transition-transform ${open ? 'rotate-90' : ''}`}>
              ▶
            </span>
          </button>
        ) : (
          <span className="w-5" />
        )}

        {/* 分类名，点击筛选 */}
        <button
          onClick={() => onSelect(node.id)}
          className={`flex-1 text-left px-2 py-1.5 rounded-lg text-sm transition ${
            active
              ? 'bg-[#1a1a1a] text-white'
              : 'text-black/60 hover:bg-black/5 hover:text-black'
          }`}
        >
          {node.name}
        </button>
      </div>

      {/* 子分类 */}
      {hasChildren && open && (
        <div>
          {node.children.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              depth={depth + 1}
              selectedId={selectedId}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
}