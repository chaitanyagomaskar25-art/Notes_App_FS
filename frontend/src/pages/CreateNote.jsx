import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../conetxt/AuthContext";
import { useTheme } from "../conetxt/ThemeContext";
import Sidebar from "../components/Sidebar";
import NoteEditor from "../components/NoteEditor";
import { createNote } from "../services/noteApi";
import { getFolders } from "../services/folderApi";

export default function CreateNote() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [folders, setFolders] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const result = await getFolders();
        setFolders(Array.isArray(result) ? result : []);
      } catch (err) {
        // ignore
      }
    })();
  }, []);

  const handleSave = async (noteData) => {
    setSaving(true);
    setError("");
    try {
      await createNote(noteData);
      navigate("/notes", { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create note.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 ml-[var(--sidebar-width)] transition-all duration-200">
        <header className="sticky top-0 z-20 flex items-center justify-between gap-4 px-6 py-3.5 bg-white/85 dark:bg-gray-800/85 backdrop-blur border-b border-gray-200 dark:border-gray-700">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Create Note
          </h1>
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => navigate("/notes")}
              className="px-3.5 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
          </div>
        </header>
        <main className="max-w-3xl mx-auto px-6 py-6 w-full">
          {error && (
            <div className="mb-4 px-3.5 py-2.5 bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-200 border border-red-200 dark:border-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}
          <NoteEditor
            note={null}
            folders={folders}
            onSave={handleSave}
            onCancel={() => navigate("/notes")}
            saving={saving}
            autoSave={false}
          />
        </main>
      </div>
    </div>
  );
}