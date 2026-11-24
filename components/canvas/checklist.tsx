"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { Check, Plus, X } from "lucide-react";
import { newItem, type RequirementItem } from "@/lib/canvas-types";

type Props = {
  items: RequirementItem[];
  onChange: (items: RequirementItem[]) => void;
  firstPlaceholder: string;
  /** Allow zero items (blocks); requirements always keep one row */
  allowEmpty?: boolean;
  /** Show the "Add item" button (blocks show it only on hover/select) */
  showAdd?: boolean;
};

/** Checklist used inside cards: Enter adds, Backspace on empty removes, ↑/↓ move. */
export function Checklist({ items, onChange, firstPlaceholder, allowEmpty = false, showAdd = true }: Props) {
  const [focusId, setFocusId] = useState<string | null>(null);
  const refs = useRef(new Map<string, HTMLTextAreaElement>());

  useEffect(() => {
    if (!focusId) return;
    const el = refs.current.get(focusId);
    el?.focus();
    el?.setSelectionRange(el.value.length, el.value.length);
  }, [focusId, items]);

  const update = (itemId: string, patch: Partial<RequirementItem>) =>
    onChange(items.map((i) => (i.id === itemId ? { ...i, ...patch } : i)));

  function insertAfter(index: number) {
    const item = newItem();
    onChange([...items.slice(0, index + 1), item, ...items.slice(index + 1)]);
    setFocusId(item.id);
  }

  function remove(index: number) {
    const next = items.filter((_, i) => i !== index);
    onChange(next.length || allowEmpty ? next : [newItem()]);
    setFocusId(next[Math.max(0, index - 1)]?.id ?? null);
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>, index: number) {
    if (e.key === "Enter") {
      e.preventDefault();
      insertAfter(index);
    } else if (e.key === "Backspace" && e.currentTarget.value === "" && items.length > 1) {
      e.preventDefault();
      remove(index);
    } else if (e.key === "ArrowDown" && items[index + 1]) {
      e.preventDefault();
      setFocusId(items[index + 1].id);
    } else if (e.key === "ArrowUp" && items[index - 1]) {
      e.preventDefault();
      setFocusId(items[index - 1].id);
    }
  }

  return (
    <div className="flex h-full flex-col">
      {items.length > 0 && (
      <ul className="nodrag nowheel min-h-0 flex-1 space-y-0.5 overflow-y-auto px-2 pb-1">
        {items.map((item, index) => (
          <li key={item.id} className="group/item flex items-start gap-2 rounded-action px-1 py-1 transition-colors hover:bg-white/[0.03]">
            <button
              type="button"
              role="checkbox"
              aria-checked={item.done}
              aria-label={item.done ? "Mark as not done" : "Mark as done"}
              onClick={() => update(item.id, { done: !item.done })}
              className={`mt-0.5 grid size-4 shrink-0 place-items-center rounded-xs ring-1 transition ${
                item.done ? "bg-leaf ring-leaf" : "ring-white/30 hover:ring-leaf/70"
              }`}
            >
              {item.done && <Check aria-hidden strokeWidth={3.5} className="size-3 text-white" />}
            </button>
            <textarea
              ref={(el) => {
                if (el) {
                  refs.current.set(item.id, el);
                  autoGrow(el);
                } else refs.current.delete(item.id);
              }}
              rows={1}
              value={item.text}
              onChange={(e) => {
                autoGrow(e.currentTarget);
                update(item.id, { text: e.target.value.replace(/\n/g, " ") });
              }}
              onKeyDown={(e) => onKeyDown(e, index)}
              placeholder={index === 0 ? firstPlaceholder : "Add a point…"}
              maxLength={500}
              aria-label={`Item ${index + 1}`}
              className={`min-w-0 flex-1 resize-none overflow-hidden bg-transparent text-[13px] leading-5 outline-none placeholder:text-white/30 ${
                item.done ? "text-white/40 line-through decoration-white/30" : "text-white/90"
              }`}
            />
            <button
              type="button"
              onClick={() => remove(index)}
              aria-label="Remove item"
              className="grid size-5 shrink-0 place-items-center rounded-xs text-white/30 opacity-0 transition group-hover/item:opacity-100 hover:bg-white/[0.06] hover:text-white focus-visible:opacity-100"
            >
              <X aria-hidden strokeWidth={2} className="size-3" />
            </button>
          </li>
        ))}
      </ul>
      )}

      {showAdd && (
      <button
        type="button"
        onClick={() => insertAfter(items.length - 1)}
        className="nodrag mx-2 mb-2 flex h-7 shrink-0 items-center gap-2 rounded-action px-1 text-[12px] text-white/40 transition hover:bg-white/[0.04] hover:text-white"
      >
        <Plus aria-hidden strokeWidth={2} className="size-3.5" />
        Add item
      </button>
      )}
    </div>
  );
}

/** "2/5" progress over items that have text */
export function checklistProgress(items: RequirementItem[]) {
  const filled = items.filter((i) => i.text.trim());
  const done = filled.filter((i) => i.done).length;
  return { done, total: filled.length, allDone: filled.length > 0 && done === filled.length };
}

/** Grow a one-line textarea to fit its text, so long points wrap. */
function autoGrow(el: HTMLTextAreaElement) {
  el.style.height = "auto";
  el.style.height = `${el.scrollHeight}px`;
}
