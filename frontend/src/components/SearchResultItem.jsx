import { Link } from 'react-router-dom';

export default function SearchResultItem({ file, selectedFile, onClose }) {
  const lastSlash = file.lastIndexOf('/');
  const name = lastSlash === -1 ? file : file.slice(lastSlash + 1);
  const dir = lastSlash === -1 ? '/' : file.slice(0, lastSlash) + '/';

  return (
    <li>
      <Link
        to={`?file=${encodeURIComponent(file)}`}
        onClick={onClose}
        className={`block px-3 py-1.5 transition-colors ${
          file === selectedFile
            ? 'bg-indigo-900/40 text-indigo-300'
            : 'text-gray-400 hover:bg-gray-800'
        }`}
      >
        <span className={`block text-sm leading-tight ${file === selectedFile ? 'font-medium' : ''}`}>
          {name}
        </span>
        <span className={`block text-xs leading-tight mt-0.5 ${file === selectedFile ? 'text-indigo-400/70' : 'text-gray-600'}`}>
          {dir}
        </span>
      </Link>
    </li>
  );
}
