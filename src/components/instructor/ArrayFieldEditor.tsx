'use client';

import { Plus, X } from 'lucide-react';
import { Input } from '@/components/ui/Input';

interface Props {
  label: string;
  hint?: string;
  values: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  minItems?: number;
  maxItems?: number;
}

/**
 * Editor cho array of strings
 * Dùng cho: "Bạn sẽ học được", "Yêu cầu", "Đối tượng học"
 */
export function ArrayFieldEditor({
  label,
  hint,
  values,
  onChange,
  placeholder = 'Nhập...',
  minItems = 0,
  maxItems = 20,
}: Props) {
  const handleChange = (index: number, value: string) => {
    const newValues = [...values];
    newValues[index] = value;
    onChange(newValues);
  };

  const handleAdd = () => {
    if (values.length >= maxItems) return;
    onChange([...values, '']);
  };

  const handleRemove = (index: number) => {
    onChange(values.filter((_, i) => i !== index));
  };

  return (
    <div>
      <div className="flex items-baseline justify-between mb-2">
        <label className="text-sm font-bold">
          {label}
          {minItems > 0 && (
            <span className="text-red-500 ml-1">*</span>
          )}
        </label>
        <span className="text-xs text-neutral-500">
          {values.length}/{maxItems}
        </span>
      </div>
      {hint && <p className="text-xs text-neutral-500 mb-3">{hint}</p>}

      <div className="space-y-2">
        {values.map((value, idx) => (
          <div key={idx} className="flex gap-2">
            <Input
              value={value}
              onChange={(e) => handleChange(idx, e.target.value)}
              placeholder={placeholder}
              className="flex-1"
            />
            <button
              type="button"
              onClick={() => handleRemove(idx)}
              className="p-2 text-neutral-400 hover:text-red-500 hover:bg-red-50 rounded-lg"
              aria-label="Xóa"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}

        {values.length < maxItems && (
          <button
            type="button"
            onClick={handleAdd}
            className="w-full py-2.5 border-2 border-dashed border-neutral-300 rounded-xl text-sm font-medium text-neutral-500 hover:border-black hover:text-black flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Thêm mục
          </button>
        )}
      </div>

      {minItems > 0 && values.length < minItems && (
        <p className="text-xs text-red-500 mt-2">
          Cần ít nhất {minItems} mục
        </p>
      )}
    </div>
  );
}
