
function NoteList({
  notes,
  selectedNote,
  onSelect,
  onCreate,
  onDelete,
  onRestore,
  onPermanentDelete,
  onRefresh,
  loading,
  view = "all",
}) {
  return (
    <aside className="bg-white border border-gray-200 dark:border-gray-700 rounded-xl p-4 shadow-sm sticky top-20 max-h-[calc(100vh-100px)] overflow-y-auto">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">My Notes</h2>
        <button
          onClick={onCreate}
          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-md shadow transition"
        >
          + New
        </button>
      </div>

      <button
        onClick={onRefresh}
        disabled={loading}
        className="w-full mb-3 px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {loading ? "Refreshing..." : "Refresh"}
      </button>

      {notes.length === 0 && !loading && (
        <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
          No notes yet. Create your first note!
        </p>
      )}

      <div className="flex flex-col gap-1.5">
        {notes.map((note) => (
          <div
            key={note._id}
            className={`flex items-center gap-2 p-2.5 rounded-lg border transition ${
              selectedNote?._id === note._id
                ? "bg-indigo-50 bg-indigo-900/30 border-indigo-200 dark:border-indigo-700"
                : "border-transparent hover:bg-gray-50"
            }`}
          >
            <button
              onClick={() => onSelect(note)}
              className="flex-1 text-left flex flex-col gap-0.5"
            >
              <strong className="text-sm text-gray-900 dark:text-gray-100 font-semibold">
                {note.pinned ? "📌 " : ""}
                {note.title}
              </strong>
              <small className="text-xs text-gray-500 dark:text-gray-400">
                {(() => {
                  const words = note.content
                    ? note.content.trim().split(/\\s+/).filter(Boolean).length
                    : 0;
                  const chars = note.content ? note.content.length : 0;
                  const mins = Math.max(1, Math.ceil(words / 200)) || 0;
                  const reading = words ? `${mins} min read` : "0 min read";
                  return `${words} words · ${chars} chars · ${reading}`;
                })()}
              </small>
              <small className="text-xs text-gray-500 dark:text-gray-400">
                Edited:{" "}
                {note.updatedAt
                  ? new Date(note.updatedAt).toLocaleString()
                  : "Unknown"}
              </small>
            </button>

            {view === "trash" ? (
              <>
                <button
                  onClick={() => onRestore?.(note._id)}
                  className="px-2 py-1 border border-emerald-200 dark:border-emerald-700 rounded text-xs font-medium text-emerald-600 hover:bg-emerald-50 dark:bg-emerald-900/30"
                >
                  Restore
                </button>
                <button
                  onClick={() => onPermanentDelete?.(note._id)}
                  className="px-2 py-1 border border-red-200 dark:border-red-700 rounded text-xs font-medium text-red-500 hover:bg-red-50 dark:bg-red-900/30"
                >
                  Delete
                </button>
              </>
            ) : (
              <button
                onClick={() => onDelete(note._id)}
                aria-label={`Delete ${note.title}`}
                className="px-2 py-1 border border-red-200 dark:border-red-700 rounded text-xs font-medium text-red-500 hover:bg-red-50 dark:bg-red-900/30"
              >
                Delete
              </button>
            )}
          </div>
        ))}
      </div>
    </aside>
  );
}

export default NoteList;
