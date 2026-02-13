import { Routes, Route } from 'react-router';
import Layout from './pages/Layout';
import Dashboard from './pages/Dashboard';
import FilePage from './pages/FilePage';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="file" element={<FilePage />} />
        <Route path="*" element={<Dashboard />} />
      </Route>
    </Routes>
  );
}
