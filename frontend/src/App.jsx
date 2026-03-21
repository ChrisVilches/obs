import { Route, Routes } from "react-router";
import { Toaster } from "react-hot-toast";
import { SWRConfig } from "swr";
import Dashboard from "./pages/Dashboard";
import FilePage from "./pages/FilePage";
import Layout from "./pages/Layout";
import { fetcher } from "./utils/fetcher";

export default function App() {
  return (
    <>
      <SWRConfig value={{ fetcher, revalidateOnFocus: false }}>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="file" element={<FilePage />} />
            <Route path="*" element={<Dashboard />} />
          </Route>
        </Routes>
      </SWRConfig>
      <Toaster position="bottom-center" />
    </>
  );
}
