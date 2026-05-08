import { useLocation } from "react-router-dom";

export default function NotFound() {
  const location = useLocation();

  return (
    <div className="min-h-full flex flex-col">
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <p className="text-7xl font-bold text-gray-700/50 select-none">404</p>
          <h2 className="mt-4 text-lg font-medium text-gray-300">
            Page not found
          </h2>
          <p className="mt-2 text-sm text-gray-500">
            No route matches{" "}
            <code className="rounded bg-gray-800 px-1.5 py-0.5 text-xs text-gray-400">
              {location.pathname}
            </code>
          </p>
        </div>
      </div>
    </div>
  );
}
