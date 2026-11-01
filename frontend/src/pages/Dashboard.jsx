import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { useAuth } from "../conetxt/AuthContext";
import { useTheme } from "../conetxt/ThemeContext";
import { getNotes } from "../services/noteApi";
import { getActivities } from "../services/activityApi";
import Sidebar from "../components/Sidebar";

function StatCard({ label, value, accent }) {
  const colors = {
    indigo: "bg-indigo-50 bg-indigo-900/30 text-indigo-600",
    amber: "bg-amber-50 bg-amber-900/30 text-amber-600",
    emerald: "bg-emerald-50 text-emerald-600",
    rose: "bg-rose-50 text-rose-600",
  };
  return (
    <div className="bg-white border border-gray-200 dark:border-gray-700 rounded-xl p-5 shadow-sm hover:-translate-y-0.5 hover:shadow-md transition">
      <div
        className={`inline-flex items-center justify-center w-10 h-10 rounded-lg mb-3 ${colors[accent] || colors.indigo}`}
      >
        <span className="text-lg font-bold">#</span>
      </div>
      <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{value}</div>
      <div className="text-sm text-gray-500 dark:text-gray-400">{label}</div>
    </div>
  );
}

function NoteListCard({ title, notes, empty }) {
  return (
    <div className="bg-white border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">{title}</h2>
      {notes.length === 0 ? (
        <p className="text-sm text-gray-400 italic">{empty}</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {notes.map((note) => (
            <li
              key={note._id}
              className="flex items-center justify-between gap-2 px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg"
            >
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                  {note.title}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {note.category || "General"}
                </span>
              </div>
              <span className="text-xs text-gray-400 whitespace-nowrap">
                {new Date(note.updatedAt || note.createdAt).toLocaleDateString()}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export const Dashboard = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [notes, setNotes] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const result = await getNotes();
        if (active) setNotes(Array.isArray(result) ? result : []);
        const acts = await getActivities();
        if (active) setActivities(Array.isArray(acts) ? acts : []);
      } catch (err) {
        if (active) setError(err.response?.data?.message || "Failed to load notes.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const upcomingReminders = useMemo(() => {
    const now = new Date();
    return notes
      .filter((n) => n.reminder && new Date(n.reminder) >= now && !n.trashed)
      .sort((a, b) => new Date(a.reminder) - new Date(b.reminder))
      .slice(0, 6);
  }, [notes]);

  const stats = useMemo(() => {
    const total = notes.length;
    const favorites = notes.filter((n) => n.favorite).length;
    const pinned = notes.filter(
      (n) => n.pinned && !n.trashed && !n.archived
    );
    const recent = [...notes]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5);
    const recentlyUpdated = [...notes]
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
      .slice(0, 5);
    const categoryMap = notes.reduce((acc, note) => {
      const key = note.category || "General";
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
    const categories = Object.entries(categoryMap).sort((a, b) => b[1] - a[1]);
    const maxCategoryCount = categories.reduce((m, [, c]) => Math.max(m, c), 0) || 1;
    return { total, favorites, pinned, recent, recentlyUpdated, categories, maxCategoryCount };
  }, [notes]);

  const handleLogout = async () => {
    try {
      await logout();
    } finally {
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
          <span className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/30 bg-indigo-900/30 rounded-full text-sm font-medium text-indigo-600">
            {user?.name ?? "User"}
          </span>
          <button
            onClick={toggleTheme}
            className="px-3.5 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? "☀️" : "🌙"}
          </button>
          <button
            onClick={handleLogout}
            className="px-3.5 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50"
          >
            Log out
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 w-full flex flex-col gap-6">
        <section className="bg-gradient-to-br from-indigo-600 to-indigo-400 text-white rounded-2xl p-8 shadow-lg">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold mb-1">
                Welcome{user?.name ? `, ${user.name}` : ""}
              </h1>
              <p className="opacity-90 max-w-xl">
                Here's an overview of your notes and activity.
              </p>
            </div>
            <Link
              to="/notes"
              className="inline-flex items-center px-5 py-2.5 bg-white dark:bg-gray-800 text-indigo-600 font-semibold text-sm rounded-lg shadow hover:bg-gray-100 transition"
            >
              + New Note
            </Link>
          </div>
        </section>

        {!loading && stats.pinned.length > 0 && (
          <section className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
              📌 Pinned Notes
            </h2>
            <ul className="flex flex-col gap-2">
              {stats.pinned.map((note) => (
                <li
                  key={note._id}
                  className="flex items-center justify-between gap-2 px-3 py-2 bg-white dark:bg-gray-800 border border-amber-200 dark:border-amber-700 rounded-lg"
                >
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                      {note.title}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {note.category || "General"}
                    </span>
                  </div>
                  <Link
                    to="/notes"
                    className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
                  >
                    Open
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

                {!loading && upcomingReminders.length > 0 && (
          <section className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-xl p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
              ⏰ Upcoming Reminders
            </h2>
            <ul className="flex flex-col gap-2">
              {upcomingReminders.map((note) => (
                <li
                  key={note._id}
                  className="flex items-center justify-between gap-2 px-3 py-2 bg-white dark:bg-gray-800 border border-blue-200 dark:border-blue-700 rounded-lg"
                >
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                      {note.title}
                    </span>
                    <span className="text-xs text-blue-600 dark:text-blue-400">
                      {new Date(note.reminder).toLocaleString()}
                    </span>
                  </div>
                  <Link
                    to="/notes"
                    className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
                  >
                    Open
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {!loading && activities.length > 0 && (
          <section className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Activity History
            </h2>
            <ul className="flex flex-col gap-2">
              {activities.slice(0, 12).map((a) => (
                <li
                  key={a._id}
                  className="flex items-center justify-between gap-2 px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm"
                >
                  <span className="text-gray-700 dark:text-gray-300">
                    <span className="font-medium capitalize">{a.action.replace(/_/g, " ")}</span>
                    {a.note?.title ? ` — ${a.note.title}` : ""}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                    {new Date(a.createdAt).toLocaleString()}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

{error && (
          <div className="px-3.5 py-2.5 bg-red-50 dark:bg-red-900/30 text-red-800 border border-red-200 dark:border-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-16 text-gray-500 dark:text-gray-400">
            <div className="w-8 h-8 border-4 border-gray-200 dark:border-gray-700 border-t-indigo-600 rounded-full animate-spin" />
          </div>
        ) : (
          <>
            <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard label="Total Notes" value={stats.total} accent="indigo" />
              <StatCard label="Favorites" value={stats.favorites} accent="amber" />
              <StatCard
                label="Categories"
                value={stats.categories.length}
                accent="emerald"
              />
              <StatCard
                label="Updated Today"
                value={notes.filter((n) => {
                  const d = new Date(n.updatedAt);
                  const now = new Date();
                  return (
                    d.getFullYear() === now.getFullYear() &&
                    d.getMonth() === now.getMonth() &&
                    d.getDate() === now.getDate()
                  );
                }).length}
                accent="rose"
              />
            </section>

            <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <NoteListCard
                title="Recent Notes"
                notes={stats.recent}
                empty="No notes yet."
              />
              <NoteListCard
                title="Recently Updated"
                notes={stats.recentlyUpdated}
                empty="No updates yet."
              />
            </section>

            <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  Favorite Notes
                </h2>
                {stats.favorites === 0 ? (
                  <p className="text-sm text-gray-400 italic">
                    No favorites yet. Star a note to see it here.
                  </p>
                ) : (
                  <ul className="flex flex-col gap-2">
                    {notes
                      .filter((n) => n.favorite)
                      .slice(0, 6)
                      .map((note) => (
                        <li
                          key={note._id}
                          className="flex items-center justify-between gap-2 px-3 py-2 bg-amber-50 dark:bg-amber-900/30 bg-amber-900/30 border border-amber-200 dark:border-amber-700 rounded-lg"
                        >
                          <span className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                            {note.title}
                          </span>
                          <span className="text-xs text-amber-600">★</span>
                        </li>
                      ))}
                  </ul>
                )}
              </div>

              <div className="bg-white border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  Category Statistics
                </h2>
                {stats.categories.length === 0 ? (
                  <p className="text-sm text-gray-400 italic">No categories yet.</p>
                ) : (
                  <div className="flex flex-col gap-3">
                    {stats.categories.map(([name, count]) => (
                      <div key={name} className="flex flex-col gap-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium text-gray-700 dark:text-gray-300">{name}</span>
                          <span className="text-gray-500">{count}</span>
                        </div>
                        <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-indigo-50 dark:bg-indigo-900/300 rounded-full transition-all"
                            style={{
                              width: `${(count / stats.maxCategoryCount) * 100}%`,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>
          </>
        )}
      </main>
      </div>
    </div>
  );
};
