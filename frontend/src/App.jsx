import { Routes, Route, Link } from 'react-router-dom';
import Home from './pages/Home';
import Viewer from './pages/Viewer';

export default function App() {
  return (
    <div>
      <nav>
        <Link to="/">Files</Link>
      </nav>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/view" element={<Viewer />} />
      </Routes>
    </div>
  );
}
