export default function Table({ children }) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full">{children}</table>
    </div>
  );
}
