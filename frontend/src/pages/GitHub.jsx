import { useEffect, useState } from "react";
import { useAuth } from "../conetxt/AuthContext";
import { useTheme } from "../conetxt/ThemeContext";
import Sidebar from "../components/Sidebar";
import {
  githubStatus,
  githubDisconnect,
  listRepos,
  generateReadme,
} from "../services/githubApi";

export default function GitHub() {
  const { user, logout } = useAuth();
  const { theme } = useTheme();
  const [status, setStatus] = useState({ connected: false, username: null });
  const [repos, setRepos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedRepo, setSelectedRepo] = useState("");
  const [readme, setReadme] = useState("");
  const [generating, setGenerating] = useState(false);

  const loadStatus = async () => {
    try {
      const s = await githubStatus();
      setStatus(s);
      if (s.connected) {
        const r = await listRepos();
        setRepos(Array.isArray(r) ? r : []);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load GitHub status.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadStatus(); }, []);

  const connect = () => {
    window.location.href = "http://localhost:3000/api/github/auth";
  };

  const disconnect = async () => {
    try {
      await githubDisconnect();
      setStatus({ connected: false, username: null });
      setRepos([]);
      setSelectedRepo("");
      setReadme("");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to disconnect.");
    }
  };

  const handleGenerate = async () => {
    if (!selectedRepo) return;
    const [owner, repo] = selectedRepo.split("/");
    setGenerating(true);
    setError("");
    try {
      const result = await generateReadme(owner, repo);
      setReadme(result.readme || "");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to generate README.");
    } finally {
      setGenerating(false);
    }
  };

  const downloadReadme = () => {
    const blob = new Blob([readme], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "README.md";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen flex">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-20 flex items-center justify-between gap-4 px-6 py-3.5 bg-white dark:bg-gray-800/85 dark:bg-gray-800/85 backdrop-blur border-b border-gray-200 dark:border-gray-700">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">GitHub Integration</h1>
          <div className="flex items-center gap-2.5">
            <span className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/30 rounded-full text-sm font-medium text-indigo-600 dark:text-indigo-400">{user?.name ?? "User"}</span>
            <button onClick={logout} className="px-3.5 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">Log out</button>
          </div>
        </header>
        <main className="max-w-5xl mx-auto px-6 py-6 w-full flex flex-col gap-6">
          {error && <div className="px-3.5 py-2.5 bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-200 border border-red-200 dark:border-red-700 rounded-lg text-sm">{error}</div>}
          <section className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Connection</h2>
            {loading ? (
              <div className="text-gray-500 dark:text-gray-400 text-sm">Loading...</div>
            ) : status.connected ? (
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm text-gray-700 dark:text-gray-300">Connected as <span className="font-semibold">{status.username}</span></p>
                <button onClick={disconnect} className="px-3.5 py-2 border border-red-200 dark:border-red-700 text-red-500 text-sm rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30">Disconnect</button>
              </div>
            ) : (
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">Connect your GitHub account to import repositories and generate README files.</p>
                <button onClick={connect} className="px-4 py-2.5 bg-gray-900 hover:bg-black text-white font-semibold text-sm rounded-lg shadow-md transition">Connect GitHub</button>
              </div>
            )}
          </section>

          {status.connected && (
            <>
              <section className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-sm flex flex-col gap-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Import Repository & Generate README</h2>
                <div className="flex flex-wrap items-end gap-3">
                  <div className="flex-1 min-w-[240px]">
                    <label className="text-xs font-medium text-gray-600 dark:text-gray-300">Repository</label>
                    <select value={selectedRepo} onChange={(e) => setSelectedRepo(e.target.value)} className="w-full mt-1 px-3.5 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-900">
                      <option value="">Select a repository</option>
                      {repos.map((r) => (<option key={r.id} value={r.full_name}>{r.full_name}</option>))}
                    </select>
                  </div>
                  <button onClick={handleGenerate} disabled={!selectedRepo || generating} className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-lg shadow-md transition disabled:opacity-60">{generating ? "Generating..." : "Generate README"}</button>
                </div>
              </section>

              {readme && (
                <section className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-sm flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Generated README</h2>
                    <button onClick={downloadReadme} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg shadow transition">Export README.md</button>
                  </div>
                  <pre className="text-sm whitespace-pre-wrap bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4 max-h-96 overflow-auto font-mono">{readme}</pre>
                </section>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
