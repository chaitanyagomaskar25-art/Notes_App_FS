import { useEffect, useState } from "react";
import { useAuth } from "../conetxt/AuthContext";
import { useTheme } from "../conetxt/ThemeContext";
import Sidebar from "../components/Sidebar";
import {
  getSnippets,
  createSnippet,
  updateSnippet,
  deleteSnippet,
} from "../services/snippetApi";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark, oneLight } from "react-syntax-highlighter/dist/esm/styles/prism";

const LANGUAGES = [
  "javascript", "typescript", "python", "java", "c", "cpp", "csharp",
  "go", "rust", "php", "ruby", "swift", "kotlin", "html", "css",
  "json", "yaml", "bash", "sql", "markdown",
];

export default function Snippets() {
  const { user, logout } = useAuth();
  const { theme } = useTheme();
  const [snippets, setSnippets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    title: "", code: "", language: "javascript", description: "", tags: "",
  });

  const load = async () => {
    setLoading(true);
    try {
      const result = await getSnippets();
      setSnippets(Array.isArray(result) ? result : []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load snippets.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const resetForm = () => {
    setEditing(null);
    setForm({ title: "", code: "", language: "javascript", description: "", tags: "" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) { setError("Title is required"); return; }
    try {
      const payload = {
        title: form.title.trim(),
        code: form.code,
        language: form.language,
        description: form.description,
        tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
      };
      if (editing) {
        const updated = await updateSnippet(editing, payload);
        setSnippets((prev) => prev.map((s) => (s._id === editing ? updated : s)));
      } else {
        const created = await createSnippet(payload);
        setSnippets((prev) => [created, ...prev]);
      }
      resetForm();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save snippet.");
    }
  };

  const handleEdit = (snippet) => {
    setEditing(snippet._id);
    setForm({
      title: snippet.title,
      code: snippet.code,
      language: snippet.language,
      description: snippet.description || "",
      tags: (snippet.tags || []).join(", "),
    });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this snippet?")) return;
    try {
      await deleteSnippet(id);
      setSnippets((prev) => prev.filter((s) => s._id !== id));
      if (editing === id) resetForm();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete snippet.");
    }
  };

  const copyCode = async (code) => {
    try { await navigator.clipboard.writeText(code); } catch {}
  };

  return (
    <div className="min-h-screen flex">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 ml-[var(--sidebar-width)] transition-all duration-200">
        <header className="sticky top-0 z-20 flex items-center justify-between gap-4 px-6 py-3.5 bg-white dark:bg-gray-800/85 dark:bg-gray-800/85 backdrop-blur border-b border-gray-200 dark:border-gray-700">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Code Snippets</h1>
          <div className="flex items-center gap-2.5">
            <span className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/30 rounded-full text-sm font-medium text-indigo-600 dark:text-indigo-400">{user?.name ?? "User"}</span>
            <button onClick={logout} className="px-3.5 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">Log out</button>
          </div>
        </header>
        <main className="max-w-6xl mx-auto px-6 py-6 w-full flex flex-col gap-6">
          {error && <div className="px-3.5 py-2.5 bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-200 border border-red-200 dark:border-red-700 rounded-lg text-sm">{error}</div>}
          <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-sm flex flex-col gap-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{editing ? "Edit Snippet" : "New Snippet"}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-gray-800 dark:text-gray-200">Title</label>
                <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="px-3.5 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 bg-white dark:bg-gray-900" placeholder="Snippet title" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-gray-800 dark:text-gray-200">Language</label>
                <select value={form.language} onChange={(e) => setForm({ ...form, language: e.target.value })} className="px-3.5 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-900">
                  {LANGUAGES.map((l) => (<option key={l} value={l}>{l}</option>))}
                </select>
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-gray-800 dark:text-gray-200">Description</label>
              <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="px-3.5 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 bg-white dark:bg-gray-900" placeholder="Optional description" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-gray-800 dark:text-gray-200">Code</label>
              <textarea value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} rows={8} className="px-3.5 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-mono focus:outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 bg-white dark:bg-gray-900" placeholder="// code here" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-gray-800 dark:text-gray-200">Tags (comma separated)</label>
              <input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} className="px-3.5 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 bg-white dark:bg-gray-900" placeholder="react, hooks" />
            </div>
            <div className="flex gap-2.5">
              <button type="submit" className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-lg shadow-md transition">{editing ? "Update Snippet" : "Save Snippet"}</button>
              {editing && (<button type="button" onClick={resetForm} className="px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">Cancel</button>)}
            </div>
          </form>

          {loading ? (
            <div className="flex items-center justify-center py-16 text-gray-500 dark:text-gray-400"><div className="w-8 h-8 border-4 border-gray-200 dark:border-gray-700 border-t-indigo-600 rounded-full animate-spin" /></div>
          ) : snippets.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 border border-dashed border-gray-200 dark:border-gray-700 rounded-xl p-12 text-center"><p className="text-gray-500 dark:text-gray-400">No snippets yet. Create your first one above.</p></div>
          ) : (
            <div className="flex flex-col gap-4">
              {snippets.map((snippet) => (
                <div key={snippet._id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm overflow-hidden">
                  <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                    <div>
                      <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">{snippet.title}</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{snippet.language} · {(snippet.tags || []).join(", ") || "no tags"}</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => copyCode(snippet.code)} className="px-3 py-1.5 border border-gray-200 dark:border-gray-700 rounded-lg text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">Copy</button>
                      <button onClick={() => handleEdit(snippet)} className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-lg shadow transition">Edit</button>
                      <button onClick={() => handleDelete(snippet._id)} className="px-3 py-1.5 border border-red-200 dark:border-red-700 text-red-500 text-xs font-medium rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30">Delete</button>
                    </div>
                  </div>
                  {snippet.description && (<p className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300">{snippet.description}</p>)}
                  <SyntaxHighlighter language={snippet.language} style={theme === "dark" ? oneDark : oneLight} customStyle={{ margin: 0, borderRadius: 0 }}>
                    {snippet.code || ""}
                  </SyntaxHighlighter>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
