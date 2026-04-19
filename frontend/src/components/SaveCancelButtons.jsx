export default function SaveCancelButtons({ onSave, onCancel }) {
  return (
    <>
      <button
        onClick={onSave}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-green-300 bg-green-900 border border-green-700 rounded-md hover:bg-green-800 hover:text-green-200 transition-colors mr-2"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        <span className="hidden md:inline">Save</span>
      </button>
      <button
        onClick={onCancel}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-300 bg-gray-800 border border-gray-700 rounded-md hover:bg-gray-700 hover:text-white transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
        <span className="hidden md:inline">Cancel</span>
      </button>
    </>
  );
}
