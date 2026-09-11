'use client';

type Props = {
  value: string;
  onChange: (v: string) => void;
};

export default function SearchBar({ value, onChange }: Props) {
  return (
    <div className="mt-2">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="搜索标题、内容或标签..."
        className="w-full bg-white border-0 rounded-xl px-5 py-3.5 text-sm shadow-[0_1px_3px_rgba(0,0,0,0.04)] focus:outline-none focus:ring-2 focus:ring-black/5 placeholder:text-black/30"
      />
    </div>
  );
}