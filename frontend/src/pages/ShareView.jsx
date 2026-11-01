import { useEffect, useState } from "react";
import { useParams, Link } from "react-router";
import { viewShare } from "../services/shareApi";

export default function ShareView() {
  const { token } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const result = await viewShare(token);
        if (active) setData(result);
      } catch (err) {
        if (active)
          setError(
            err.response?.data?.message || "Unable to load shared note."
          );
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500 dark:text-gray-400">
        <div className="w-8 h-8 border-4 border-gray-200 dark:border-gray-700 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Unable to open shared note
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mb-4">{error}</p>
          {error.toLowerCase().includes("authentication") && (
            <Link
              to="/login"
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-lg shadow-md transition"
            >
              Sign in
            </Link>
          )}
        </div>
      </div>
    );
  }

  const note = data?.note;
  const words = note?.content
    ? note.content.trim().split(/\s+/).filter(Boolean).length
    : 0;
  const chars = note?.content ? note.content.length : 0;
  const mins = words ? Math.max(1, Math.ceil(words / 200)) : 0;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-3xl mx-auto">
        <div className="mb-4 text-sm text-gray-500 dark:text-gray-400">
          Shared note · {data?.share?.access} access
          {data?.share?.expiresAt
            ? ` · expires ${new Date(data.share.expiresAt).toLocaleString()}`
            : ""}
        </div>
        <article className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-sm">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            {note?.title}
          </h1>
          <div className="flex flex-wrap gap-3 text-xs text-gray-500 dark:text-gray-400 mb-4">
            <span>{note?.category || "General"}</span>
            <span>{words} words</span>
            <span>{chars} chars</span>
            <span>{mins} min read</span>
          </div>
          <div className="whitespace-pre-wrap break-words font-mono text-sm leading-relaxed bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4 min-h-[120px]">
            {note?.content || "No content"}
          </div>
        </article>
      </div>
    </div>
  );
}