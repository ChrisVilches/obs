export default function Button({ variant = 'secondary', icon, children, className = '', href, onClick, ...props }) {
  const base = 'inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium border rounded-md transition-colors';

  const variants = {
    primary: 'text-green-300 bg-green-900 border-green-700 hover:bg-green-800 hover:text-green-200',
    secondary: 'text-gray-300 bg-gray-800 border-gray-700 hover:bg-gray-700 hover:text-white',
  };

  const classes = `${base} ${variants[variant]} ${className}`.trim();

  if (href) {
    return (
      <a href={href} className={classes} {...props}>
        {icon}
        {children && <span className="hidden md:inline">{children}</span>}
      </a>
    );
  }

  return (
    <button onClick={onClick} className={classes} {...props}>
      {icon}
      {children && <span className="hidden md:inline">{children}</span>}
    </button>
  );
}
