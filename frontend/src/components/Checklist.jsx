import { useState } from "react";

export default function Checklist({ items = [], onChange, readOnly = false }) {
  const [newText, setNewText] = useState("");

  const doneCount = items.filter((i) => i.done).length;
  const total = items.length;
  const progress = total ? Math.round((doneCount / total) * 100) : 0;

  const addItem = () => {
    const text = newText.trim();
    if (!text) return;
    onChange([...items, { text, done: false }]);
    setNewText("");
  };

  const toggle = (index) => {
    const next = items.map((item, i) =>
      i === index ? { ...item, done: !item.done } : item
    );
    onChange(next);
  };

  const remove = (index) => {
    onChange(items.filter((_, i) => i !== index));
  };

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 shadow-sm flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
          Checklist
        </h3>
        {total > 0 && (
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {doneCount}/{total} done ({progress}%)
          </span>
        )}
      </div>

      {total > 0 && (
        <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-50 dark:bg-emerald-900/300 rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      <ul className="flex flex-col gap-2">
        {items.map((item, index) => (
          <li
            key={index}
            className="flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg"
          >
            <input
              type="checkbox"
              checked={!!item.done}
              disabled={readOnly}
              onChange={() => !readOnly && toggle(index)}
              className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
            />
            <span
              className={`flex-1 text-sm ${
                item.done
                  ? "line-through text-gray-400 dark:text-gray-500"
                  : "text-gray-800 dark:text-gray-200"
              }`}
            >
              {item.text}
            </span>
            {!readOnly && (
              <button
                onClick={() => remove(index)}
                className="text-xs text-gray-400 hover:text-red-500"
                aria-label="Delete task"
              >
                ✕
              </button>
            )}
          </li>
        ))}
      </ul>

      {!readOnly && (
        <div className="flex gap-2">
          <input
            type="text"
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addItem();
              }
            }}
            placeholder="Add a task..."
            className="flex-1 px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 bg-white dark:bg-gray-900"
          />
          <button
            onClick={addItem}
            className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg shadow transition"
          >
            Add
          </button>
        </div>
      )}
    </div>
  );
}