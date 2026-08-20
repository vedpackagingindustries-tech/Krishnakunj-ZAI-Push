export default function OrnamentalDivider() {
  return (
    <div className="flex items-center justify-center gap-3 py-4">
      <span className="block h-px flex-1 max-w-16 bg-gradient-to-r from-transparent to-light-gold" />
      <svg
        width="20"
        height="20"
        viewBox="0 0 20 20"
        fill="none"
        className="text-light-gold"
        aria-hidden="true"
      >
        <path
          d="M10 2L12 8L18 10L12 12L10 18L8 12L2 10L8 8L10 2Z"
          fill="currentColor"
          opacity="0.5"
        />
      </svg>
      <span className="block h-px flex-1 max-w-16 bg-gradient-to-l from-transparent to-light-gold" />
    </div>
  );
}
