import Button from './Button';

export default function BinaryFileDisplay({ file }) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center">
      <svg className="w-16 h-16 text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
      <p className="text-lg font-medium text-gray-400 mb-2">Binary file</p>
      <p className="text-sm text-gray-500 mb-6">This file type cannot be viewed in the browser.</p>
      <Button
        variant="secondary"
        href={`/api/files/raw?file=${encodeURIComponent(file)}&attachment=true`}
        icon={
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        }
      >
        Download
      </Button>
    </div>
  );
}
