import { Link, useSearchParams } from 'react-router-dom';

export default function Sidemenu({ files, onClose }) {
  const [searchParams] = useSearchParams();
  const selectedFile = searchParams.get('file');

  return (
    <nav className="flex-1 overflow-y-auto p-2">
      <ul className="space-y-0.5">
        {files.map((file) => (
          <li key={file}>
            <Link
              to={`?file=${encodeURIComponent(file)}`}
              onClick={onClose}
              className={`block px-3 py-2 rounded-md text-sm transition-colors ${
                file === selectedFile
                  ? 'bg-indigo-900/40 text-indigo-300 font-medium'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
              }`}
            >
              <span className="truncate block">{file}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
