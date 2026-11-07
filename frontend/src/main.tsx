import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import "./index.css";
import { AppShell } from "./components/AppShell";
import Landing from "./pages/Landing";
import Dashboard from "./pages/Dashboard";
import Create from "./pages/Create";
import Lessons from "./pages/Lessons";
import LessonWorkspace from "./pages/LessonWorkspace";
import Resources from "./pages/Resources";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import Learn from "./pages/Learn";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/learn/:id" element={<Learn />} />
        <Route path="/app" element={<AppShell />}>
          <Route index element={<Dashboard />} />
          <Route path="create" element={<Create />} />
          <Route path="lessons" element={<Lessons />} />
          <Route path="lessons/:id" element={<LessonWorkspace />} />
          <Route path="resources" element={<Resources />} />
          <Route path="reports" element={<Reports />} />
          <Route path="settings" element={<Settings />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
);
