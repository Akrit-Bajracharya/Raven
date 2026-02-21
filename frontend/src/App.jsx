import { Navigate, Route, Routes } from "react-router"
import ChatPage from "./pages/ChatPage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import { useAuthStore } from "./store/useAuthStore";
import { useEffect } from "react";
import PageLoader from "./components/PageLoader"
import { Toaster } from "react-hot-toast";
import useThemeStore from "./store/useThemeStore";

function App() {
  const { authUser, checkAuth, isCheckingAuth } = useAuthStore();
  
  // Just importing this initializes the theme on mount
  useThemeStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  if (isCheckingAuth) return <PageLoader />

  return (
    <div
      className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden"
      style={{ backgroundColor: "var(--bg-base)", color: "var(--text-primary)" }}
    >
      {/* Background grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:14px_24px]" />

      {/* Glow blobs — now use theme accent color */}
      <div
        className="absolute top-0 -left-4 size-96 opacity-20 blur-[100px]"
        style={{ backgroundColor: "var(--accent)" }}
      />
      <div
        className="absolute bottom-0 -right-4 size-96 opacity-20 blur-[100px]"
        style={{ backgroundColor: "var(--accent-hover)" }}
      />

      <Routes>
        <Route path="/" element={authUser ? <ChatPage /> : <Navigate to={"/login"} />} />
        <Route path="/login" element={!authUser ? <LoginPage /> : <Navigate to={"/"} />} />
        <Route path="/signup" element={!authUser ? <SignupPage /> : <Navigate to={"/"} />} />
      </Routes>

      <Toaster />
    </div>
  );
}

export default App;