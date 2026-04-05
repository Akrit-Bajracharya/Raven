import { Navigate, Route, Routes } from "react-router"
import ChatPage from "./pages/ChatPage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import { useAuthStore } from "./store/useAuthStore";
import { useEffect, useRef } from "react";
import PageLoader from "./components/PageLoader"
import { Toaster } from "react-hot-toast";
import useThemeStore from "./store/useThemeStore";
import OnboardingPage from "./pages/OnboardingPage";
import CallModal from "./components/CallModal";
import IncomingCallModal from "./components/IncomingCallModal";
import { useCallStore } from "./store/Usecallstore.js"
import { useWebRTC } from "./store/Usewebrtc.js"

function App() {
  const { authUser, checkAuth, isCheckingAuth, socket } = useAuthStore();

  const webRTC = useWebRTC();
  const webRTCRef = useRef(webRTC);
  useEffect(() => {
    webRTCRef.current = webRTC;
  });

  useThemeStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (!authUser || !socket) return;

    socket.on("call:incoming", (data) => {
      useCallStore.getState().setIncomingCall(data);
    });

    socket.on("call:accepted", async ({ answer }) => {
      await webRTCRef.current.handleAnswer(answer);
      useCallStore.getState().setCallStatus("connected");
    });

    socket.on("call:rejected", () => {
      useCallStore.getState().resetCall();
    });

    socket.on("call:ended", () => {
      useCallStore.getState().resetCall();
    });

    socket.on("call:ice-candidate", async ({ candidate }) => {
      await webRTCRef.current.handleIceCandidate(candidate);
    });

    socket.on("call:camera-toggle", ({ isCameraOff }) => {
      useCallStore.getState().setRemoteCameraOff(isCameraOff);
    });

    return () => {
      socket.off("call:incoming");
      socket.off("call:accepted");
      socket.off("call:rejected");
      socket.off("call:ended");
      socket.off("call:ice-candidate");
      socket.off("call:camera-toggle");
    };
  }, [authUser, socket]);

  if (isCheckingAuth) return <PageLoader />

  return (
    <div
      className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden"
      style={{ backgroundColor: "var(--bg-base)", color: "var(--text-primary)" }}
    >
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:14px_24px]" />

      <div
        className="absolute top-0 -left-4 size-96 opacity-20 blur-[100px]"
        style={{ backgroundColor: "var(--accent)" }}
      />
      <div
        className="absolute bottom-0 -right-4 size-96 opacity-20 blur-[100px]"
        style={{ backgroundColor: "var(--accent-hover)" }}
      />

      <Routes>
        <Route
          path="/"
          element={
            !authUser ? (
              <Navigate to="/login" />
            ) : !authUser.onboarded ? (
              <Navigate to="/onboarding" />
            ) : (
              <ChatPage />
            )
          }
        />

        <Route
          path="/onboarding"
          element={
            !authUser ? (
              <Navigate to="/login" />
            ) : authUser.onboarded ? (
              <Navigate to="/" />
            ) : (
              <OnboardingPage />
            )
          }
        />

        <Route
          path="/login"
          element={!authUser ? <LoginPage /> : <Navigate to="/" />}
        />

        <Route
          path="/signup"
          element={!authUser ? <SignupPage /> : <Navigate to="/" />}
        />
      </Routes>

      <CallModal />
      <IncomingCallModal />

      <Toaster />
    </div>
  );
}

export default App;