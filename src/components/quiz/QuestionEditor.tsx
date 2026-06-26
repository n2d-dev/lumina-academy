'use client';

import { useState } from 'react';
import { Plus, X, CheckCircle2, Circle, Square, CheckSquare } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import type { QuestionType, ChoiceOption, ShortAnswerConfig } from '@/types/quiz';

interface QuestionDraft {
  id?: string;
  type: QuestionType;
  text: string;
  explanation: string;
  points: number;
  options: ChoiceOption[] | [ShortAnswerConfig];
}

interface Props {
  initialData?: Partial<QuestionDraft>;
  onSave: (data: QuestionDraft) => Promise<void>;
  onCancel: () => void;
  saving: boolean;
}

const TYPE_LABELS: Record<QuestionType, string> = {
  MULTIPLE_CHOICE: 'Trắc nghiệm 1 đáp án',
  MULTIPLE_SELECT: 'Trắc nghiệm nhiều đáp án',
  TRUE_FALSE: 'Đúng / Sai',
  SHORT_ANSWER: 'Trả lời ngắn',
};

/**
 * Question Editor - hỗ trợ 4 question types
 *
 * Trải nghiệm:
 * - User chọn type → form thay đổi tương ứng
 * - Switch type giữ lại text + explanation, chỉ reset options
 * - Visual feedback rõ ràng với icon (radio, checkbox)
 */
export function QuestionEditor({ initialData, onSave, onCancel, saving }: Props) {
  const [type, setType] = useState<QuestionType>(initialData?.type ?? 'MULTIPLE_CHOICE');
  const [text, setText] = useState(initialData?.text ?? '');
  const [explanation, setExplanation] = useState(initialData?.explanation ?? '');
  const [points, setPoints] = useState(initialData?.points ?? 1);
  const [options, setOptions] = useState<ChoiceOption[] | [ShortAnswerConfig]>(
    initialData?.options ?? getDefaultOptions(type)
  );

  const handleTypeChange = (newType: QuestionType) => {
    setType(newType);
    setOptions(getDefaultOptions(newType));
  };

  const handleSubmit = async () => {
    // Validate trước khi save
    if (text.length < 5) {
      alert('Câu hỏi ít nhất 5 ký tự');
      return;
    }

    if (type !== 'SHORT_ANSWER') {
      const choices = options as ChoiceOption[];
      if (choices.some((c) => !c.text.trim())) {
        alert('Đáp án không được để trống');
        return;
      }

      const correctCount = choices.filter((c) => c.isCorrect).length;
      if (type === 'MULTIPLE_CHOICE' && correctCount !== 1) {
        alert('Cần đúng 1 đáp án đúng');
        return;
      }
      if (type === 'TRUE_FALSE' && correctCount !== 1) {
        alert('Cần chọn 1 đáp án đúng');
        return;
      }
      if (type === 'MULTIPLE_SELECT' && correctCount === 0) {
        alert('Cần ít nhất 1 đáp án đúng');
        return;
      }
    } else {
      const [config] = options as [ShortAnswerConfig];
      if (!config.acceptedAnswers.length || !config.acceptedAnswers[0].trim()) {
        alert('Cần ít nhất 1 đáp án chấp nhận');
        return;
      }
    }

    await onSave({
      id: initialData?.id,
      type,
      text,
      explanation,
      points,
      options,
    });
  };

  return (
    <div className="bg-white rounded-2xl p-6 border-2 border-yellow-400 space-y-5">
      {/* Type selector */}
      <div>
        <label className="text-sm font-bold mb-2 block">Loại câu hỏi</label>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
          {(Object.keys(TYPE_LABELS) as QuestionType[]).map((t) => (
            <button
              key={t}
              onClick={() => handleTypeChange(t)}
              className={`px-3 py-2 text-xs font-bold rounded-lg border-2 transition-all ${
                type === t
                  ? 'border-black bg-black text-white'
                  : 'border-neutral-200 hover:border-neutral-400'
              }`}
            >
              {TYPE_LABELS[t]}
            </button>
          ))}
        </div>
      </div>

      {/* Question text */}
      <div>
        <label className="text-sm font-bold mb-2 block">
          Câu hỏi <span className="text-red-500">*</span>
        </label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={3}
          maxLength={2000}
          className="w-full px-4 py-3 border-2 border-neutral-200 rounded-xl outline-none focus:border-black resize-none"
          placeholder="Nhập câu hỏi..."
        />
      </div>

      {/* Options based on type */}
      <div>
        <label className="text-sm font-bold mb-2 block">Đáp án</label>
        {type === 'SHORT_ANSWER' ? (
          <ShortAnswerEditor
            config={options[0] as ShortAnswerConfig}
            onChange={(c) => setOptions([c])}
          />
        ) : (
          <ChoicesEditor
            type={type}
            choices={options as ChoiceOption[]}
            onChange={(c) => setOptions(c)}
          />
        )}
      </div>

      {/* Explanation */}
      <div>
        <label className="text-sm font-bold mb-2 block">
          Giải thích <span className="text-neutral-400 font-normal">(tùy chọn)</span>
        </label>
        <textarea
          value={explanation}
          onChange={(e) => setExplanation(e.target.value)}
          rows={2}
          maxLength={2000}
          className="w-full px-4 py-3 border-2 border-neutral-200 rounded-xl outline-none focus:border-black resize-none"
          placeholder="Hiển thị cho học viên sau khi submit..."
        />
      </div>

      {/* Points */}
      <div>
        <label className="text-sm font-bold mb-2 block">Điểm</label>
        <Input
          type="number"
          value={points}
          onChange={(e) => setPoints(Math.max(1, Number(e.target.value)))}
          min={1}
          max={100}
          className="w-32"
        />
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-4 border-t border-neutral-100">
        <Button variant="outline" onClick={onCancel} disabled={saving}>
          Hủy
        </Button>
        <Button onClick={handleSubmit} disabled={saving}>
          {saving ? 'Đang lưu...' : 'Lưu câu hỏi'}
        </Button>
      </div>
    </div>
  );
}

/* ================== CHOICES EDITOR ================== */

function ChoicesEditor({
  type,
  choices,
  onChange,
}: {
  type: QuestionType;
  choices: ChoiceOption[];
  onChange: (c: ChoiceOption[]) => void;
}) {
  const isSingle = type === 'MULTIPLE_CHOICE' || type === 'TRUE_FALSE';
  const isFixed = type === 'TRUE_FALSE';

  const handleTextChange = (idx: number, text: string) => {
    onChange(choices.map((c, i) => (i === idx ? { ...c, text } : c)));
  };

  const handleToggleCorrect = (idx: number) => {
    if (isSingle) {
      // Chỉ 1 correct
      onChange(choices.map((c, i) => ({ ...c, isCorrect: i === idx })));
    } else {
      // Multiple correct
      onChange(choices.map((c, i) => (i === idx ? { ...c, isCorrect: !c.isCorrect } : c)));
    }
  };

  const handleAdd = () => {
    onChange([
      ...choices,
      { id: `opt_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`, text: '', isCorrect: false },
    ]);
  };

  const handleRemove = (idx: number) => {
    if (choices.length <= 2) {
      alert('Cần ít nhất 2 đáp án');
      return;
    }
    onChange(choices.filter((_, i) => i !== idx));
  };

  return (
    <div className="space-y-2">
      <p className="text-xs text-neutral-500 mb-2">
        {isSingle
          ? '👆 Click vào ô tròn để chọn đáp án đúng'
          : '👆 Click vào ô vuông để chọn các đáp án đúng (có thể chọn nhiều)'}
      </p>

      {choices.map((choice, idx) => (
        <div
          key={choice.id}
          className={`flex items-center gap-2 p-2 rounded-lg border-2 transition-all ${
            choice.isCorrect ? 'border-green-300 bg-green-50' : 'border-neutral-200'
          }`}
        >
          <button
            onClick={() => handleToggleCorrect(idx)}
            className="flex-shrink-0 p-1"
            aria-label="Toggle correct"
          >
            {isSingle ? (
              choice.isCorrect ? (
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              ) : (
                <Circle className="w-5 h-5 text-neutral-400" />
              )
            ) : choice.isCorrect ? (
              <CheckSquare className="w-5 h-5 text-green-600" />
            ) : (
              <Square className="w-5 h-5 text-neutral-400" />
            )}
          </button>

          <Input
            value={choice.text}
            onChange={(e) => handleTextChange(idx, e.target.value)}
            placeholder={`Đáp án ${idx + 1}`}
            disabled={isFixed}
            className="flex-1"
          />

          {!isFixed && (
            <button
              onClick={() => handleRemove(idx)}
              className="p-2 text-neutral-400 hover:text-red-500"
              aria-label="Remove"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      ))}

      {!isFixed && choices.length < 6 && (
        <button
          onClick={handleAdd}
          className="w-full py-2 border-2 border-dashed border-neutral-300 rounded-lg text-sm font-medium text-neutral-500 hover:border-black hover:text-black flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Thêm đáp án
        </button>
      )}
    </div>
  );
}

/* ================== SHORT ANSWER EDITOR ================== */

function ShortAnswerEditor({
  config,
  onChange,
}: {
  config: ShortAnswerConfig;
  onChange: (c: ShortAnswerConfig) => void;
}) {
  const handleAddAnswer = () => {
    onChange({ ...config, acceptedAnswers: [...config.acceptedAnswers, ''] });
  };

  const handleRemoveAnswer = (idx: number) => {
    if (config.acceptedAnswers.length <= 1) return;
    onChange({
      ...config,
      acceptedAnswers: config.acceptedAnswers.filter((_, i) => i !== idx),
    });
  };

  const handleAnswerChange = (idx: number, value: string) => {
    onChange({
      ...config,
      acceptedAnswers: config.acceptedAnswers.map((a, i) => (i === idx ? value : a)),
    });
  };

  return (
    <div className="space-y-3">
      <p className="text-xs text-neutral-500 mb-2">
        Nhập các đáp án được chấp nhận. Học viên sẽ pass nếu trả lời khớp với một trong các đáp án này.
      </p>

      {config.acceptedAnswers.map((answer, idx) => (
        <div key={idx} className="flex gap-2">
          <Input
            value={answer}
            onChange={(e) => handleAnswerChange(idx, e.target.value)}
            placeholder={`Đáp án chấp nhận ${idx + 1}`}
            className="flex-1"
          />
          {config.acceptedAnswers.length > 1 && (
            <button
              onClick={() => handleRemoveAnswer(idx)}
              className="p-2 text-neutral-400 hover:text-red-500"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      ))}

      <button
        onClick={handleAddAnswer}
        className="w-full py-2 border-2 border-dashed border-neutral-300 rounded-lg text-sm font-medium text-neutral-500 hover:border-black hover:text-black flex items-center justify-center gap-2"
      >
        <Plus className="w-4 h-4" />
        Thêm đáp án chấp nhận
      </button>

      <label className="flex items-center gap-2 mt-3 cursor-pointer">
        <input
          type="checkbox"
          checked={config.caseSensitive}
          onChange={(e) =>
            onChange({ ...config, caseSensitive: e.target.checked })
          }
          className="w-4 h-4"
        />
        <span className="text-sm">Phân biệt chữ hoa / chữ thường</span>
      </label>
    </div>
  );
}

/* ================== HELPERS ================== */

function getDefaultOptions(
  type: QuestionType
): ChoiceOption[] | [ShortAnswerConfig] {
  const newId = () => `opt_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

  switch (type) {
    case 'MULTIPLE_CHOICE':
      return [
        { id: newId(), text: '', isCorrect: false },
        { id: newId(), text: '', isCorrect: false },
        { id: newId(), text: '', isCorrect: false },
        { id: newId(), text: '', isCorrect: false },
      ];
    case 'MULTIPLE_SELECT':
      return [
        { id: newId(), text: '', isCorrect: false },
        { id: newId(), text: '', isCorrect: false },
        { id: newId(), text: '', isCorrect: false },
        { id: newId(), text: '', isCorrect: false },
      ];
    case 'TRUE_FALSE':
      return [
        { id: 'true', text: 'Đúng', isCorrect: true },
        { id: 'false', text: 'Sai', isCorrect: false },
      ];
    case 'SHORT_ANSWER':
      return [{ acceptedAnswers: [''], caseSensitive: false }];
  }
}
