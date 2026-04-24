import { Toaster } from "react-hot-toast";
import { Route, Routes } from "react-router";
import { SWRConfig } from "swr";
import { AppConfigProvider } from "./contexts/AppConfigContext";
import Dashboard from "./pages/Dashboard";
import FilePage from "./pages/FilePage";
import Layout from "./pages/Layout";
import { fetcher } from "./utils/fetcher";

export default function App() {
  return (
    <>
      <AppConfigProvider>
        <SWRConfig value={{ fetcher, revalidateOnFocus: false }}>
          <Routes>
            <Route element={<Layout />}>
              <Route index element={<Dashboard />} />
              <Route path="file" element={<FilePage />} />
              <Route path="*" element={<Dashboard />} />
            </Route>
          </Routes>
        </SWRConfig>
      </AppConfigProvider>
      <Toaster position="bottom-center" />
    </>
  );
}
