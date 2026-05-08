import { StrictMode } from "react";
import { createBrowserRouter, RouterProvider } from "react-router";
import { Toaster } from "react-hot-toast";
import ReactDOM from "react-dom/client";
import { SWRConfig } from "swr";
import { AppConfigProvider } from "./contexts/AppConfigContext";
import Dashboard from "./pages/Dashboard";
import { fetcher } from "./utils/fetcher";
import FilePage from "./pages/FilePage";
import Layout from "./pages/Layout";
import NotFound from "./pages/NotFound";
import "./index.css";

const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <>
        <AppConfigProvider>
          <SWRConfig value={{ fetcher, revalidateOnFocus: false }}>
            <Layout />
          </SWRConfig>
        </AppConfigProvider>
        <Toaster position="bottom-center" />
      </>
    ),
    children: [
      { index: true, element: <Dashboard /> },
      { path: "file", element: <FilePage /> },
      { path: "*", element: <NotFound /> },
    ],
  },
]);

const root = document.getElementById("root");
ReactDOM.createRoot(root).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
