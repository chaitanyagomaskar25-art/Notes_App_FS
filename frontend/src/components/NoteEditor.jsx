
import { useState, useMemo, useRef, useEffect } from "react";
import { noteTemplates } from "../templates/noteTemplates";

import { aiAssist } from "../services/aiApi";
import SimpleMDE from "react-simplemde-editor";
import "easymde/dist/easymde.min.css";

function NoteEditor({ note, onSave, onCancel, saving, folders = [], autoSave = true }) {
  const [title, setTitle] = useState(() => note?.title ?? "");
  const [content, setContent] = useState(() => note?.content ?? "");
  const [category, setCategory] = useState(() => note?.category ?? "General");
  const [favorite, setFavorite] = useState(() => Boolean(note?.favorite));
  const [pinned, setPinned] = useState(() => Boolean(note?.pinned));
  const [tags, setTags] = useState(() =>
    Array.isArray(note?.tags) ? note.tags.join(", ") : ""
  );
  const [archived, setArchived] = useState(() => Boolean(note?.archived));
  const [trashed, setTrashed] = useState(() => Boolean(note?.trashed));
  const [folder, setFolder] = useState(() => note?.folder || "");
  const [reminder, setReminder] = useState(() => {
    if (!note?.reminder) return "";
    const d = new Date(note.reminder);
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
      d.getHours()
    )}:${pad(d.getMinutes())}`;
  });
  const [templateId, setTemplateId] = useState("blank");
  const [aiOpen, setAiOpen] = useState(false);
  const [aiAction, setAiAction] = useState("summarize");
  const [aiResult, setAiResult] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");

  const applyTemplate = (id) => {
    const tpl = noteTemplates.find((t) => t.id === id);
    if (!tpl) return;
    setTemplateId(id);
    setTitle(tpl.title);
    setContent(tpl.content);
    setCategory(tpl.category || "General");
    setTags((tpl.tags || []).join(", "));
  };

  const handleAi = async () => {
    setAiError("");
    setAiResult("");
    setAiLoading(true);
    try {
      const text = content || title;
      const res = await aiAssist(aiAction, text, title);
      setAiResult(res.result || "");
    } catch (err) {
      setAiError(
        err.response?.data?.message || "AI request failed. (Optional feature)"
      );
    } finally {
      setAiLoading(false);
    }
  };

  const applyAiResult = () => {
    if (!aiResult) return;
    if (aiAction === "title") {
      setTitle(aiResult.replace(/^["']|["']$/g, ""));
    } else if (aiAction === "explain") {
      setContent((prev) => `${prev}\n\n## Explanation\n${aiResult}`);
    } else {
      setContent(aiResult);
    }
  };

  const wordCount = content.trim()
    ? content.trim().split(/\\s+/).length
    : 0;
  const charCount = content.length;

  const autoSaveTimer = useRef(null);
  const isDirty = useRef(false);
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    isDirty.current = true;
  }, [title, content, category, favorite, pinned, tags, archived, trashed, folder, reminder]);

  useEffect(() => {
    if (!autoSave) return;
    if (!isDirty.current || !title.trim()) return;
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(() => {
      onSave(
        {
          title: title.trim(),
          content,
          category: category.trim() || "General",
          favorite,
          pinned,
          tags: tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean),
          archived,
          trashed,
          folder: folder || null,
      reminder: reminder || null,
        },
        true
      );
      isDirty.current = false;
    }, 1500);
    return () => {
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    };
  }, [title, content, category, favorite, pinned, tags, archived, trashed, folder, reminder]);

  const editorOptions = useMemo(
    () => ({
      spellChecker: false,
      placeholder: "Write your Markdown here...",
      status: ["lines", "words"],
      minHeight: "250px",
    }),
    []
  );

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!title.trim()) {
      alert("Please enter a note title.");
      return;
    }

    onSave({
      title: title.trim(),
      content,
      category: category.trim() || "General",
      favorite,
      pinned,
      tags: tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      archived,
      trashed,
      folder: folder || null,
      reminder: reminder || null,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-sm flex flex-col gap-4">
      <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
        {note ? "Edit Note" : "Create Note"}
      </h2>

      {!note && (
        <div className="flex flex-col gap-1.5">
          <label htmlFor="note-template" className="text-sm font-semibold text-gray-800 dark:text-gray-200">
            Template
          </label>
          <select
            id="note-template"
            value={templateId}
            onChange={(e) => applyTemplate(e.target.value)}
            className="px-3.5 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 bg-white dark:bg-gray-800"
          >
            {noteTemplates.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <label htmlFor="note-title" className="text-sm font-semibold text-gray-800 dark:text-gray-200">
          Title
        </label>
        <input
          id="note-title"
          type="text"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Enter note title"
          maxLength={150}
          required
          className="px-3.5 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="note-category" className="text-sm font-semibold text-gray-800 dark:text-gray-200">
            Category
          </label>
          <input
            id="note-category"
            type="text"
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            placeholder="General"
            maxLength={50}
            className="px-3.5 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100"
          />
        </div>
        <label className="flex items-center gap-2 mt-6 text-sm font-medium text-gray-700 dark:text-gray-300">
          <input
            type="checkbox"
            checked={favorite}
            onChange={(event) => setFavorite(event.target.checked)}
            className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
          />
          Mark as favorite
        </label>
        <label className="flex items-center gap-2 mt-6 text-sm font-medium text-gray-700 dark:text-gray-300">
          <input
            type="checkbox"
            checked={pinned}
            onChange={(event) => setPinned(event.target.checked)}
            className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
          />
          Pin note
        </label>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="note-folder" className="text-sm font-semibold text-gray-800 dark:text-gray-200">
          Folder
        </label>
        <select
          id="note-folder"
          value={folder}
          onChange={(event) => setFolder(event.target.value)}
          className="px-3.5 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 bg-white dark:bg-gray-800"
        >
          <option value="">No folder</option>
          {folders.map((f) => (
            <option key={f._id} value={f._id}>
              {f.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="note-reminder" className="text-sm font-semibold text-gray-800 dark:text-gray-200">
          Reminder
        </label>
        <input
          id="note-reminder"
          type="datetime-local"
          value={reminder}
          onChange={(event) => setReminder(event.target.value)}
          className="px-3.5 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 bg-white dark:bg-gray-900"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="note-tags" className="text-sm font-semibold text-gray-800 dark:text-gray-200">
          Tags (comma separated)
        </label>
        <input
          id="note-tags"
          type="text"
          value={tags}
          onChange={(event) => setTags(event.target.value)}
          placeholder="work, ideas, personal"
          className="px-3.5 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100"
        />
      </div>

      <div className="flex flex-wrap gap-4 text-sm font-medium text-gray-700 dark:text-gray-300">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={archived}
            onChange={(event) => setArchived(event.target.checked)}
            className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
          />
          Archived
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={trashed}
            onChange={(event) => setTrashed(event.target.checked)}
            className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
          />
          In Trash
        </label>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-semibold text-gray-800 dark:text-gray-200">Markdown content</label>
        <SimpleMDE
          value={content}
          onChange={setContent}
          options={editorOptions}
        />
      </div>

      <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">
            AI Assistant (optional)
          </span>
          <button
            type="button"
            onClick={() => setAiOpen((v) => !v)}
            className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            {aiOpen ? "Hide" : "Show"}
          </button>
        </div>
        {aiOpen && (
          <>
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={aiAction}
                onChange={(e) => setAiAction(e.target.value)}
                className="px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-900"
              >
                <option value="summarize">Summarize</option>
                <option value="grammar">Improve grammar</option>
                <option value="rewrite">Rewrite</option>
                <option value="title">Generate title</option>
                <option value="explain">Explain code</option>
              </select>
              <button
                type="button"
                onClick={handleAi}
                disabled={aiLoading}
                className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg shadow transition disabled:opacity-60"
              >
                {aiLoading ? "Working..." : "Run"}
              </button>
            </div>
            {aiError && (
              <p className="text-xs text-red-500 dark:text-red-400">{aiError}</p>
            )}
            {aiResult && (
              <div className="flex flex-col gap-2">
                <pre className="text-xs whitespace-pre-wrap bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-3 max-h-48 overflow-auto">
                  {aiResult}
                </pre>
                <button
                  type="button"
                  onClick={applyAiResult}
                  className="self-start px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded-lg shadow transition"
                >
                  Apply result
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
        <span>
          {wordCount} {wordCount === 1 ? "word" : "words"} · {charCount}{" "}
          {charCount === 1 ? "character" : "characters"}
        </span>
        <span className="italic">Auto-save enabled</span>
      </div>

      <div className="flex gap-2.5">
        <button
          type="submit"
          disabled={saving}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-lg shadow-md transition disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {saving ? "Saving..." : "Save Note"}
        </button>

        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

export default NoteEditor;
