
import { createBrowserRouter, RouterProvider, Navigate } from "react-router";
import Signup from "./pages/SingupPage";
import { Dashboard } from "./pages/Dashboard";
import ProtectedRoute from "./components/ProtectedRout";
import LoginPage from "./pages/LoginPage";
import Notes from "./pages/Notes";
import Settings from "./pages/Settings";
import ShareView from "./pages/ShareView";
import Snippets from "./pages/Snippets";
import CreateNote from "./pages/CreateNote";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Navigate to="/dashboard" replace />,
  },
  {
    path: "/favorites",
    element: <Navigate to="/notes?view=favorites" replace />,
  },
  {
    path: "/archived",
    element: <Navigate to="/notes?view=archived" replace />,
  },
  {
    path: "/tags",
    element: <Navigate to="/notes?view=tags" replace />,
  },
  {
    path: "/trash",
    element: <Navigate to="/notes?view=trash" replace />,
  },
  {
    path: "/signup",
    element: <Signup />,
  },
  {
    path: "/login",
    element: <LoginPage />
  },
  {
    path: "/share/:token",
    element: <ShareView />
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        path: "/dashboard",
        element: <Dashboard />,
      },
      {
        path: "/notes",
        element: <Notes />
      },
      {
        path: "/notes/new",
        element: <CreateNote />
      },
      {
        path: "/settings",
        element: <Settings />
      },
      {
        path: "/snippets",
        element: <Snippets />
      }
    ],
  },
]);

export function App() {
  return <RouterProvider router={router} />;
}

