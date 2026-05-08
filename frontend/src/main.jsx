import { StrictMode } from "react";
import { BrowserRouter, Routes, Route } from "react-router";
import { Toaster } from "react-hot-toast";
import ReactDOM from "react-dom/client";
import App from "./App";
import { SWRConfig } from "swr";
import { AppConfigProvider } from "./contexts/AppConfigContext";
import Dashboard from "./pages/Dashboard";
import { fetcher } from "./utils/fetcher";
import FilePage from "./pages/FilePage";
import Layout from "./pages/Layout";
import "./index.css";
import {
  createBrowserRouter,
  RouterProvider,
} from "react-router";

// TODO: cleanup this mess

// const root = document.getElementById("root");
//
// ReactDOM.createRoot(root).render(
//   <>
//     <AppConfigProvider>
//       <SWRConfig value={{ fetcher, revalidateOnFocus: false }}>
//         <BrowserRouter>
//           <Routes>
//             <Route element={<Layout />}>
//               <Route index element={<Dashboard />} />
//               <Route path="file" element={<FilePage />} />
//               <Route path="*" element={<Dashboard />} />
//             </Route>
//           </Routes>
//         </BrowserRouter>
//       </SWRConfig>
//     </AppConfigProvider>
//     <Toaster position="bottom-center" />
//   </>,
// );

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
      { path: "/", element: <Dashboard /> },
      { path: "/file", element: <FilePage /> },
      // TODO: Fix this 404 handler
      { path: "*", element: <span className="text-gray-500">Not Found</span> },
    ],
  },
]);

const root = document.getElementById("root");
ReactDOM.createRoot(root).render(
  <RouterProvider router={router} />,
);
// TODO: bring back strict mode
// const router = createBrowserRouter([{ path: "*", element: <App /> }]);
//
// createRoot(document.getElementById("root")).render(
//   <StrictMode>
//     <RouterProvider router={router} />
//   </StrictMode>,
// );
