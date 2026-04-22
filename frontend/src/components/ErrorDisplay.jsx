import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

export default function ErrorDisplay({ message, file }) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center">
      <div className="w-16 h-16 mb-4 rounded-full bg-red-900/30 border border-red-800 flex items-center justify-center">
        <ExclamationTriangleIcon className="w-8 h-8 text-red-400" />
      </div>
      <p className="text-lg font-medium text-red-300 mb-1">{message || 'An error occurred'}</p>
      {file && <p className="text-sm text-gray-500 font-mono">{file}</p>}
    </div>
  );
}
