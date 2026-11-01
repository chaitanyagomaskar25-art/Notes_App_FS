
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { useAuth } from "../conetxt/AuthContext";
import { useTheme } from "../conetxt/ThemeContext";

import {
  getNotes,
  createNote,
  updateNote,
  deleteNote,
  restoreNote,
  permanentDeleteNote,
  emptyTrash,
  updateCollaborators,
  getVersions,
  restoreVersion,
} from "../services/noteApi";
import {
  getFolders,
  createFolder,
  renameFolder,
  deleteFolder,
} from "../services/folderApi";
import { createShare, listShares, revokeShare } from "../services/shareApi";
import { logActivity } from "../services/activityApi";

import NoteList from "../components/NoteList";
import NoteEditor from "../components/NoteEditor";
import CollaboratorManager from "../components/CollaboratorManager";
import Checklist from "../components/Checklist";
import Sidebar from "../components/Sidebar";
import { exportMarkdown, exportTxt, exportPdf } from "../utils/exportUtils";

function Notes() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const view = searchParams.get("view") || "all";
  const [notes, setNotes] = useState([]);
  const [selectedTag, setSelectedTag] = useState(null);
  const [folders, setFolders] = useState([]);
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [dateField, setDateField] = useState("updated");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [folderName, setFolderName] = useState("");
  const [editingFolderId, setEditingFolderId] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [confirmTitle, setConfirmTitle] = useState("");
  const [confirmMessage, setConfirmMessage] = useState("");

  useEffect(() => {
    setSelectedTag(null);
  }, [view]);

  const loadFolders = useCallback(async () => {
    try {
      const result = await getFolders();
      setFolders(Array.isArray(result) ? result : []);
    } catch (err) {
      // ignore
    }
  }, []);

  useEffect(() => {
    loadFolders();
  }, [loadFolders]);

  const allTags = useMemo(() => {
    const set = new Set();
    notes.forEach((note) => {
      (note.tags || []).forEach((tag) => set.add(tag));
    });
    return [...set].sort();
  }, [notes]);

  const visibleNotes = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const from = dateFrom ? new Date(dateFrom) : null;
    const to = dateTo ? new Date(dateTo) : null;
    if (to) to.setHours(23, 59, 59, 999);

    const filtered = notes.filter((note) => {
      if (selectedFolder && String(note.folder) !== String(selectedFolder)) {
        return false;
      }
      if (view === "trash") {
        if (!note.trashed) return false;
      } else if (view === "archived") {
        if (!(note.archived && !note.trashed)) return false;
      } else if (view === "favorites") {
        if (!(note.favorite && !note.trashed && !note.archived)) return false;
      } else if (!note.trashed && !note.archived) {
        if (view === "tags" && selectedTag) {
          if (!(note.tags || []).includes(selectedTag)) return false;
        } else if (view !== "tags" && view !== "all") {
          return false;
        }
      } else {
        return false;
      }

      if (query) {
        const inTitle = (note.title || "").toLowerCase().includes(query);
        const inContent = (note.content || "").toLowerCase().includes(query);
        const inTags = (note.tags || []).some((t) =>
          String(t).toLowerCase().includes(query)
        );
        const folderName =
          folders.find((f) => String(f._id) === String(note.folder))?.name || "";
        const inFolder = folderName.toLowerCase().includes(query);
        if (!inTitle && !inContent && !inTags && !inFolder) return false;
      }

      const dateValue = new Date(
        dateField === "created" ? note.createdAt : note.updatedAt
      );
      if (from && dateValue < from) return false;
      if (to && dateValue > to) return false;

      return true;
    });
    return filtered.sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));
  }, [notes, view, selectedTag, selectedFolder, searchQuery, dateField, dateFrom, dateTo, folders]);

  const viewTitle = {
    all: "All Notes",
    favorites: "Favorite Notes",
    archived: "Archived Notes",
    tags: "Notes by Tag",
    trash: "Trash",
  }[view] || "All Notes";
  const [selectedNote, setSelectedNote] = useState(null);
  const [showVersions, setShowVersions] = useState(false);
  const [versions, setVersions] = useState([]);
  const [versionsLoading, setVersionsLoading] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [shares, setShares] = useState([]);
  const [sharesLoading, setSharesLoading] = useState(false);
  const [shareAccess, setShareAccess] = useState("public");
  const [shareExpires, setShareExpires] = useState("");
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const loadNotes = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const result = await getNotes();
      setNotes(Array.isArray(result) ? result : []);
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to load notes."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  const handleSave = async (noteData, keepEditing = false) => {
    setSaving(true);
    setError("");

    try {
      if (selectedNote?._id) {
        const updated = await updateNote(
          selectedNote._id,
          noteData
        );

        const savedNote = {
          ...selectedNote,
          ...noteData,
          ...(updated && typeof updated === "object"
            ? updated
            : {}),
        };

        setNotes((current) =>
          current.map((note) =>
            note._id === selectedNote._id ? savedNote : note
          )
        );
        setSelectedNote(savedNote);
      } else {
        const created = await createNote(noteData);
        const newNote = created?.note ?? created;

        if (!newNote?._id) {
          await loadNotes();
          setSelectedNote(null);
          if (!keepEditing) setEditing(false);
          return;
        }

        setNotes((current) => [newNote, ...current]);
        setSelectedNote(newNote);
      }

      if (!keepEditing) setEditing(false);
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to save note."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    setConfirmTitle("Delete Note");
    setConfirmMessage("Are you sure you want to delete this note?");
    setConfirmAction(async () => {
      await deleteNote(id);
      setNotes((current) => current.filter((note) => note._id !== id));
      if (selectedNote?._id === id) {
        setSelectedNote(null);
        setEditing(false);
      }
    });
    setShowConfirm(true);
  };

  const handleUpdateCollaborators = async (id, collaborators) => {
    await updateCollaborators(id, collaborators);
    await loadNotes();

    setSelectedNote((current) =>
      current?._id === id
        ? { ...current, collaborators }
        : current
    );
  };

  const startNewNote = () => {
    setSelectedNote(null);
    setEditing(true);
  };

  const handleCreateFolder = () => {
    setFolderName("");
    setEditingFolderId(null);
    setShowFolderModal(true);
  };

  const handleSaveFolder = async () => {
    const name = folderName.trim();
    if (!name) return;
    try {
      if (editingFolderId) {
        await renameFolder(editingFolderId, name);
      } else {
        await createFolder(name);
      }
      await loadFolders();
      setShowFolderModal(false);
      setFolderName("");
      setEditingFolderId(null);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save folder.");
    }
  };

  const handleRenameFolder = (folder) => {
    setFolderName(folder.name);
    setEditingFolderId(folder._id);
    setShowFolderModal(true);
  };

  const handleDeleteFolder = async (folder) => {
    setConfirmTitle("Delete Folder");
    setConfirmMessage(`Delete folder "${folder.name}"? Notes will be moved out.`);
    setConfirmAction(async () => {
      await deleteFolder(folder._id);
      if (selectedFolder === folder._id) setSelectedFolder(null);
      await loadFolders();
      await loadNotes();
    });
    setShowConfirm(true);
  };

  const handleRestore = async (id) => {
    try {
      await restoreNote(id);
      await loadNotes();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to restore note.");
    }
  };

  const handlePermanentDelete = async (id) => {
    setConfirmTitle("Permanent Delete");
    setConfirmMessage("Permanently delete this note? This cannot be undone.");
    setConfirmAction(async () => {
      await permanentDeleteNote(id);
      setNotes((current) => current.filter((note) => note._id !== id));
      if (selectedNote?._id === id) {
        setSelectedNote(null);
        setEditing(false);
      }
    });
    setShowConfirm(true);
  };

  const handleEmptyTrash = async () => {
    setConfirmTitle("Empty Trash");
    setConfirmMessage("Empty trash? All trashed notes will be permanently deleted.");
    setConfirmAction(async () => {
      await emptyTrash();
      await loadNotes();
      setSelectedNote(null);
      setEditing(false);
    });
    setShowConfirm(true);
  };

  const handleToggleArchive = async () => {
    if (!selectedNote?._id) return;
    try {
      const updated = await updateNote(selectedNote._id, {
        archived: !selectedNote.archived,
      });
      const saved = {
        ...selectedNote,
        ...(updated && typeof updated === "object" ? updated : {}),
        archived: !selectedNote.archived,
      };
      setSelectedNote(saved);
      setNotes((current) =>
        current.map((note) => (note._id === saved._id ? saved : note))
      );
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update archive.");
    }
  };

  const handleClearReminder = async () => {
    if (!selectedNote?._id) return;
    try {
      const updated = await updateNote(selectedNote._id, { reminder: null });
      const saved = {
        ...selectedNote,
        ...(updated && typeof updated === "object" ? updated : {}),
        reminder: null,
      };
      setSelectedNote(saved);
      setNotes((current) =>
        current.map((note) => (note._id === saved._id ? saved : note))
      );
    } catch (err) {
      setError(err.response?.data?.message || "Failed to clear reminder.");
    }
  };

  const handleTogglePin = async () => {
    if (!selectedNote?._id) return;
    try {
      const updated = await updateNote(selectedNote._id, {
        pinned: !selectedNote.pinned,
      });
      const saved = {
        ...selectedNote,
        ...(updated && typeof updated === "object" ? updated : {}),
        pinned: !selectedNote.pinned,
      };
      setSelectedNote(saved);
      setNotes((current) =>
        current.map((note) => (note._id === saved._id ? saved : note))
      );
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update pin.");
    }
  };

  const handleUpdateChecklist = async (checklist) => {
    if (!selectedNote?._id) return;
    try {
      const updated = await updateNote(selectedNote._id, { checklist });
      const saved = {
        ...selectedNote,
        ...(updated && typeof updated === "object" ? updated : {}),
        checklist,
      };
      setSelectedNote(saved);
      setNotes((current) =>
        current.map((note) => (note._id === saved._id ? saved : note))
      );
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update checklist.");
    }
  };

  const handleOpenVersions = async () => {
    if (!selectedNote?._id) return;
    setShowVersions(true);
    setVersionsLoading(true);
    try {
      const result = await getVersions(selectedNote._id);
      setVersions(Array.isArray(result) ? result : []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load versions.");
    } finally {
      setVersionsLoading(false);
    }
  };

  const handleRestoreVersion = async (versionId) => {
    if (!selectedNote?._id) return;
    try {
      const updated = await restoreVersion(selectedNote._id, versionId);
      const saved = {
        ...selectedNote,
        ...(updated && typeof updated === "object" ? updated : {}),
      };
      setSelectedNote(saved);
      setNotes((current) =>
        current.map((note) => (note._id === saved._id ? saved : note))
      );
      setShowVersions(false);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to restore version.");
    }
  };

  const handleOpenShare = async () => {
    if (!selectedNote?._id) return;
    setShowShare(true);
    setSharesLoading(true);
    try {
      const result = await listShares(selectedNote._id);
      setShares(Array.isArray(result) ? result : []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load shares.");
    } finally {
      setSharesLoading(false);
    }
  };

  const handleCreateShare = async () => {
    if (!selectedNote?._id) return;
    try {
      const share = await createShare(selectedNote._id, {
        access: shareAccess,
        expiresAt: shareExpires || null,
      });
      setShares((prev) => [share, ...prev]);
      setShareExpires("");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create share.");
    }
  };

  const handleRevokeShare = async (id) => {
    try {
      await revokeShare(id);
      setShares((prev) => prev.filter((s) => s._id !== id));
    } catch (err) {
      setError(err.response?.data?.message || "Failed to revoke share.");
    }
  };

  const handleToggleFavorite = async () => {
    if (!selectedNote?._id) return;
    try {
      const updated = await updateNote(selectedNote._id, {
        favorite: !selectedNote.favorite,
      });
      const saved = {
        ...selectedNote,
        ...(updated && typeof updated === "object" ? updated : {}),
        favorite: !selectedNote.favorite,
      };
      setSelectedNote(saved);
      setNotes((current) =>
        current.map((note) => (note._id === saved._id ? saved : note))
      );
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update favorite.");
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login", { replace: true });
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="min-h-screen flex">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 ml-[var(--sidebar-width)] transition-all duration-200">
        <header className="sticky top-0 z-20 flex items-center justify-between gap-4 px-6 py-3.5 bg-white dark:bg-gray-800/85 dark:bg-gray-800/85 backdrop-blur border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2.5 text-lg font-semibold">
          <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-600 to-indigo-400 text-white font-bold text-sm shadow">
            N
          </span>
          Notes
        </div>
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={toggleTheme}
            className="px-3.5 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? "☀️" : "🌙"}
          </button>
          <Link
            to="/dashboard"
            className="px-3.5 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50"
          >
            Dashboard
          </Link>
          <span className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/30 bg-indigo-900/30 rounded-full text-sm font-medium text-indigo-600">
            {user?.name ?? "User"}
          </span>
          <button
            onClick={handleLogout}
            className="px-3.5 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50"
          >
            Log out
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-6 w-full flex flex-col gap-5">
        <header className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{viewTitle}</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Write, organize, and share your notes.</p>
          </div>
          {view === "trash" && (
            <button
              onClick={handleEmptyTrash}
              className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold text-sm rounded-lg shadow-md transition"
            >
              Empty Trash
            </button>
          )}
          <button
            onClick={() => navigate("/notes/new")}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-lg shadow-md transition"
          >
            + New Note
          </button>
        </header>

        {view === "tags" && allTags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedTag(null)}
              className={`px-3 py-1.5 text-xs font-medium rounded-full border transition ${
                selectedTag === null
                  ? "bg-indigo-600 text-white border-indigo-600"
                  : "bg-gray-50 dark:bg-gray-900 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700"
              }`}
            >
              All
            </button>
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setSelectedTag(tag)}
                className={`px-3 py-1.5 text-xs font-medium rounded-full border transition ${
                  selectedTag === tag
                    ? "bg-indigo-600 text-white border-indigo-600"
                    : "bg-gray-50 dark:bg-gray-900 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700"
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        )}

        {error && (
          <div className="px-3.5 py-2.5 bg-red-50 dark:bg-red-900/30 bg-red-900/30 text-red-800 dark:text-red-200 border border-red-200 dark:border-red-700 rounded-lg text-sm" role="alert">
            {error}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setSelectedFolder(null)}
            className={`px-3 py-1.5 text-xs font-medium rounded-full border transition ${
              selectedFolder === null
                ? "bg-indigo-600 text-white border-indigo-600"
                : "bg-gray-50 dark:bg-gray-900 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700"
            }`}
          >
            All Folders
          </button>
          {folders.map((folder) => (
            <div key={folder._id} className="flex items-center gap-1">
              <button
                onClick={() => setSelectedFolder(folder._id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-full border transition ${
                  selectedFolder === folder._id
                    ? "bg-indigo-600 text-white border-indigo-600"
                    : "bg-gray-50 dark:bg-gray-900 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700"
                }`}
              >
                {folder.name}
              </button>
              <button
                onClick={() => handleRenameFolder(folder)}
                className="text-xs text-gray-400 hover:text-indigo-600"
                aria-label="Rename folder"
              >
                ✎
              </button>
              <button
                onClick={() => handleDeleteFolder(folder)}
                className="text-xs text-gray-400 hover:text-red-500"
                aria-label="Delete folder"
              >
                ✕
              </button>
            </div>
          ))}
          <button
            onClick={handleCreateFolder}
            className="px-3 py-1.5 text-xs font-medium rounded-full border border-dashed border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            + New Folder
          </button>
        </div>

        {showFolderModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {editingFolderId ? "Rename Folder" : "New Folder"}
                </h2>
                <button
                  onClick={() => setShowFolderModal(false)}
                  className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  ✕
                </button>
              </div>
              <div className="flex flex-col gap-3">
                <label className="text-xs font-medium text-gray-600 dark:text-gray-300">
                  Folder Name
                </label>
                <input
                  type="text"
                  value={folderName}
                  onChange={(e) => setFolderName(e.target.value)}
                  placeholder="Enter folder name"
                  className="px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  autoFocus
                />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <button
                  onClick={() => setShowFolderModal(false)}
                  className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-sm font-medium transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveFolder}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg shadow transition"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )}

        {showConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {confirmTitle}
                </h2>
                <button
                  onClick={() => setShowConfirm(false)}
                  className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  ✕
                </button>
              </div>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                {confirmMessage}
              </p>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowConfirm(false)}
                  className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-sm font-medium transition"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    await confirmAction();
                    setShowConfirm(false);
                  }}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg shadow transition"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 shadow-sm flex flex-col gap-3">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by title, content, tags or folder..."
            className="px-3.5 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 bg-white dark:bg-gray-900"
          />
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={dateField}
              onChange={(e) => setDateField(e.target.value)}
              className="px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-900"
            >
              <option value="updated">Last updated</option>
              <option value="created">Created</option>
            </select>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-900"
            />
            <span className="text-sm text-gray-500 dark:text-gray-400">to</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-900"
            />
            {(searchQuery || dateFrom || dateTo) && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setDateFrom("");
                  setDateTo("");
                }}
                className="px-3 py-2 text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                Clear filters
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-5 items-start">
          <NoteList
            notes={visibleNotes}
            selectedNote={selectedNote}
            view={view}
            onSelect={(note) => {
              setSelectedNote(note);
              setEditing(false);
            }}
            onCreate={() => navigate("/notes/new")}
            onDelete={handleDelete}
            onRestore={handleRestore}
            onPermanentDelete={handlePermanentDelete}
            onRefresh={loadNotes}
            loading={loading}
          />

          <section className="min-h-[400px]">
            {loading && notes.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 py-16 text-gray-500 dark:text-gray-400">
                <div className="w-8 h-8 border-4 border-gray-200 dark:border-gray-700 border-t-indigo-600 rounded-full animate-spin" />
                <p>Loading your notes...</p>
              </div>
            ) : editing ? (
              <NoteEditor
                key={selectedNote?._id ?? "new-note"}
                note={selectedNote}
                folders={folders}
                onSave={handleSave}
                onCancel={() => setEditing(false)}
                saving={saving}
              />
            ) : selectedNote ? (
              <div className="bg-white border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-sm flex flex-col gap-4">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{selectedNote.title}</h2>
                    <span className="px-2.5 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 text-xs font-medium rounded-full">
                      {selectedNote.category || "General"}
                    </span>
                    <button
                      onClick={handleToggleFavorite}
                      className={`px-2.5 py-1 text-xs font-medium rounded-full border transition ${
                        selectedNote.favorite
                          ? "bg-amber-50 dark:bg-amber-900/30 text-amber-600 border-amber-200 dark:border-amber-700"
                          : "bg-gray-50 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      {selectedNote.favorite ? "★ Favorited" : "☆ Favorite"}
                    </button>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <button
                      onClick={() => setEditing(true)}
                      className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-lg shadow-md transition"
                    >
                      Edit
                    </button>
                    <button
                      onClick={handleOpenVersions}
                      className="px-4 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 font-semibold text-sm rounded-lg shadow-md transition hover:bg-gray-200 dark:hover:bg-gray-600"
                    >
                      History
                    </button>
                    <div className="flex gap-1">
                      <button
                        onClick={async () => {
                          exportMarkdown(selectedNote);
                          await logActivity("exported", selectedNote._id, { format: "md" });
                        }}
                        className="px-3 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 text-xs font-medium rounded-lg shadow-md transition hover:bg-gray-200 dark:hover:bg-gray-600"
                        title="Export as Markdown"
                      >
                        MD
                      </button>
                      <button
                        onClick={async () => {
                          exportTxt(selectedNote);
                          await logActivity("exported", selectedNote._id, { format: "txt" });
                        }}
                        className="px-3 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 text-xs font-medium rounded-lg shadow-md transition hover:bg-gray-200 dark:hover:bg-gray-600"
                        title="Export as TXT"
                      >
                        TXT
                      </button>
                      <button
                        onClick={async () => {
                          exportPdf(selectedNote);
                          await logActivity("exported", selectedNote._id, { format: "pdf" });
                        }}
                        className="px-3 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 text-xs font-medium rounded-lg shadow-md transition hover:bg-gray-200 dark:hover:bg-gray-600"
                        title="Export as PDF"
                      >
                        PDF
                      </button>
                    </div>
                    <button
                      onClick={handleOpenShare}
                      className="px-4 py-2.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-semibold text-sm rounded-lg shadow-md transition hover:bg-indigo-100 dark:hover:bg-indigo-900/50"
                    >
                      Share
                    </button>
                    <button
                      onClick={handleTogglePin}
                      className={`px-4 py-2.5 font-semibold text-sm rounded-lg shadow-md transition ${
                        selectedNote.pinned
                          ? "bg-amber-500 hover:bg-amber-600 text-white"
                          : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600"
                      }`}
                    >
                      {selectedNote.pinned ? "📌 Pinned" : "Pin"}
                    </button>
                    <button
                      onClick={handleToggleArchive}
                      className={
                        "px-4 py-2.5 font-semibold text-sm rounded-lg shadow-md transition " +
                        (selectedNote.archived
                          ? "bg-gray-600 hover:bg-gray-700 text-white"
                          : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600")
                      }
                    >
                      {selectedNote.archived ? "Unarchive" : "Archive"}
                    </button>
                    {view === "trash" ? (
                      <>
                        <button
                          onClick={() => handleRestore(selectedNote._id)}
                          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm rounded-lg shadow-md transition"
                        >
                          Restore
                        </button>
                        <button
                          onClick={() => handlePermanentDelete(selectedNote._id)}
                          className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold text-sm rounded-lg shadow-md transition"
                        >
                          Delete Permanently
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => handleDelete(selectedNote._id)}
                        className="px-4 py-2.5 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 font-semibold text-sm rounded-lg shadow-md transition hover:bg-red-100 dark:hover:bg-red-900/50"
                      >
                        Move to Trash
                      </button>
                    )}
                  </div>
                </div>

                {selectedNote.reminder && (
                  <div className="flex items-center justify-between gap-2 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg text-sm">
                    <span className="text-blue-700 dark:text-blue-300">
                      ⏰ Reminder: {new Date(selectedNote.reminder).toLocaleString()}
                    </span>
                    <button
                      onClick={handleClearReminder}
                      className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      Clear
                    </button>
                  </div>
                )}

                {(() => {
                  const words = selectedNote.content
                    ? selectedNote.content.trim().split(/\\s+/).filter(Boolean).length
                    : 0;
                  const chars = selectedNote.content ? selectedNote.content.length : 0;
                  const mins = words ? Math.max(1, Math.ceil(words / 200)) : 0;
                  return (
                    <div className="flex flex-wrap gap-3 text-xs text-gray-500 dark:text-gray-400">
                      <span>{words} words</span>
                      <span>{chars} characters</span>
                      <span>{mins} min read</span>
                      <span>
                        Last edited:{" "}
                        {selectedNote.updatedAt
                          ? new Date(selectedNote.updatedAt).toLocaleString()
                          : "Unknown"}
                      </span>
                    </div>
                  );
                })()}

                <div className="whitespace-pre-wrap break-words font-mono text-sm leading-relaxed bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4 min-h-[120px]">
                  {selectedNote.content || <span className="text-gray-400 italic">No content yet.</span>}
                </div>

                <Checklist
                  items={selectedNote.checklist || []}
                  onChange={handleUpdateChecklist}
                />

                <CollaboratorManager
                  note={selectedNote}
                  onUpdate={handleUpdateCollaborators}
                />
              </div>
            ) : (
              <div className="bg-white border border-dashed border-gray-200 dark:border-gray-700 rounded-xl p-12 text-center flex flex-col items-center gap-2">
                <div className="text-4xl">📝</div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Welcome to your notes</h2>
                <p className="text-gray-500 mb-3">Select a note or create a new one to get started.</p>
                <button
                  onClick={() => navigate("/notes/new")}
                  className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-lg shadow-md transition"
                >
                  Create a Note
                </button>
              </div>
            )}
          </section>
        </div>
      </main>

      {showVersions && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Version History
              </h2>
              <button
                onClick={() => setShowVersions(false)}
                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              {versionsLoading ? (
                <div className="flex items-center justify-center py-8 text-gray-500 dark:text-gray-400">
                  <div className="w-6 h-6 border-4 border-gray-200 dark:border-gray-700 border-t-indigo-600 rounded-full animate-spin" />
                </div>
              ) : versions.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                  No previous versions yet.
                </p>
              ) : (
                <ul className="flex flex-col gap-3">
                  {versions.map((v) => (
                    <li
                      key={v._id}
                      className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                    >
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                          {v.title || "Untitled"}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(v.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mb-3">
                        {v.content?.slice(0, 120) || "No content"}
                      </p>
                      <button
                        onClick={() => handleRestoreVersion(v._id)}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-md shadow transition"
                      >
                        Restore this version
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}

      </div>

      {showShare && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Share Note
              </h2>
              <button
                onClick={() => setShowShare(false)}
                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                ✕
              </button>
            </div>
            <div className="p-6 flex flex-col gap-4">
              <div className="flex flex-wrap items-end gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-gray-600 dark:text-gray-300">
                    Access
                  </label>
                  <select
                    value={shareAccess}
                    onChange={(e) => setShareAccess(e.target.value)}
                    className="px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-900"
                  >
                    <option value="public">Public (anyone with link)</option>
                    <option value="private">Private (login required)</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-gray-600 dark:text-gray-300">
                    Expires at (optional)
                  </label>
                  <input
                    type="datetime-local"
                    value={shareExpires}
                    onChange={(e) => setShareExpires(e.target.value)}
                    className="px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-900"
                  />
                </div>
                <button
                  onClick={handleCreateShare}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg shadow transition"
                >
                  Create Link
                </button>
              </div>

              <div className="flex-1 overflow-y-auto">
                {sharesLoading ? (
                  <div className="flex items-center justify-center py-8 text-gray-500 dark:text-gray-400">
                    <div className="w-6 h-6 border-4 border-gray-200 dark:border-gray-700 border-t-indigo-600 rounded-full animate-spin" />
                  </div>
                ) : shares.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                    No active share links.
                  </p>
                ) : (
                  <ul className="flex flex-col gap-2">
                    {shares.map((s) => (
                      <li
                        key={s._id}
                        className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 flex flex-col gap-2"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-medium text-gray-700 dark:text-gray-200">
                            {s.access === "public" ? "🌐 Public" : "🔒 Private"}
                          </span>
                          {s.expiresAt && (
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              Expires: {new Date(s.expiresAt).toLocaleString()}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            readOnly
                            value={`${window.location.origin}/share/${s.token}`}
                            className="flex-1 px-2 py-1 text-xs border border-gray-200 dark:border-gray-700 rounded bg-gray-50 dark:bg-gray-900"
                          />
                          <button
                            onClick={() =>
                              navigator.clipboard.writeText(
                                `${window.location.origin}/share/${s.token}`
                              )
                            }
                            className="px-2 py-1 text-xs bg-indigo-600 hover:bg-indigo-700 text-white rounded"
                          >
                            Copy
                          </button>
                          <button
                            onClick={() => handleRevokeShare(s._id)}
                            className="px-2 py-1 text-xs border border-red-200 dark:border-red-700 text-red-500 rounded hover:bg-red-50 dark:hover:bg-red-900/30"
                          >
                            Revoke
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default Notes;
