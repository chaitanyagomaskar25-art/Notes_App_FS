import { useAuth } from "../conetxt/AuthContext";
import { useTheme } from "../conetxt/ThemeContext";
import { useNavigate } from "react-router";
import Sidebar from "../components/Sidebar";

export default function Settings() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login", { replace: true });
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen flex">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 ml-[var(--sidebar-width)] transition-all duration-200">
        <header className="sticky top-0 z-20 flex items-center justify-between gap-4 px-6 py-3.5 bg-white dark:bg-gray-800/85 dark:bg-gray-800/85 backdrop-blur border-b border-gray-200 dark:border-gray-700">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 text-gray-100">
            Settings
          </h1>
        </header>
        <main className="max-w-3xl mx-auto px-6 py-8 w-full flex flex-col gap-6">
          <section className="bg-white bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 text-gray-100 mb-4">
              Profile
            </h2>
            <div className="flex flex-col gap-2 text-sm text-gray-600 dark:text-gray-300">
              <p>
                <span className="font-medium text-gray-800 dark:text-gray-200 text-gray-200">
                  Name:
                </span>{" "}
                {user?.name ?? "—"}
              </p>
              <p>
                <span className="font-medium text-gray-800 dark:text-gray-200 text-gray-200">
                  Email:
                </span>{" "}
                {user?.email ?? "—"}
              </p>
            </div>
          </section>

          <section className="bg-white bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 text-gray-100 mb-4">
              Appearance
            </h2>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-800 dark:text-gray-200 text-gray-200">
                  Theme
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 text-gray-400">
                  Switch between light and dark mode.
                </p>
              </div>
              <button
                onClick={toggleTheme}
                className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                {theme === "dark" ? "☀️ Light mode" : "🌙 Dark mode"}
              </button>
            </div>
          </section>

          <section className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Account
            </h2>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                  Sign out
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Log out of your account on this device.
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg shadow transition"
              >
                Log out
              </button>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}