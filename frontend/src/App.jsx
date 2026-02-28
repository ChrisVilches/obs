import { SWRConfig } from 'swr';
import { Routes, Route } from 'react-router';
import { fetcher } from './utils/fetcher';
import Layout from './pages/Layout';
import Dashboard from './pages/Dashboard';
import FilePage from './pages/FilePage';

export default function App() {
  return (
    <SWRConfig value={{ fetcher, revalidateOnFocus: false }}>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="file" element={<FilePage />} />
          <Route path="*" element={<Dashboard />} />
        </Route>
      </Routes>
    </SWRConfig>
  );
}
