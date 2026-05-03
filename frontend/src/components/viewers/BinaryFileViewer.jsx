import { DocumentIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import Button from '../Button';

export default function BinaryFileViewer({ file }) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center">
      <DocumentIcon className="w-16 h-16 text-gray-600 mb-4" />
      <p className="text-lg font-medium text-gray-400 mb-2">Binary file</p>
      <p className="text-sm text-gray-500 mb-6"><code className="text-gray-400">{file}</code> — this file type cannot be viewed in the browser.</p>
      <Button
        variant="secondary"
        href={`/api/files/raw?file=${encodeURIComponent(file)}&attachment=true`}
        icon={
          <ArrowDownTrayIcon className="w-4 h-4" />
        }
      >
        Download
      </Button>
    </div>
  );
}
