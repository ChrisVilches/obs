export default function PageHeader({ title, actions }) {
  return (
    <div className="sticky top-0 z-10 flex items-center px-4 h-14 border-b border-gray-800 bg-gray-900 shrink-0 pl-12 md:pl-4">
      <div className="flex-1 flex justify-center md:justify-start min-w-0">
        {title}
      </div>
      {actions && (
        <div className="flex items-center flex-shrink-0">
          {actions}
        </div>
      )}
    </div>
  );
}
