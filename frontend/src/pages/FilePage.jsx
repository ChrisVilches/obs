import { useSearchParams } from "react-router-dom";
import FileViewer from "../components/FileViewer";

export default function FilePage() {
  const [searchParams] = useSearchParams();
  const file = searchParams.get("f");

  if (!file) {
    return (
      <div className="min-h-full flex flex-col">
        <div className="flex-1 flex items-center justify-center">
          <p className="text-gray-500">No file specified.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <title>{file}</title>
      <FileViewer key={file} file={file} />
    </>
  );
}
