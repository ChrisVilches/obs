export function Code({ children, node }) {
  const { start, end } = node.position;
  if (start.line === end.line) {
    return (
      <code className="bg-[#2d2d2d] before:content-none after:content-none text-[#ffb454] font-mono text-[0.9em] px-1.5 py-0.5 rounded">
        {children}
      </code>
    );
  }
  return <code>{children}</code>;
}
