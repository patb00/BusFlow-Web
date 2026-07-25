// The same mark as the browser-tab icon (public/favicon.svg).
export default function Brand({ size = 26 }) {
  return (
    <span className="brand__mark" aria-hidden="true">
      <svg width={size} height={size} viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
        <rect width="32" height="32" rx="8" fill="currentColor" />
        <rect x="7" y="8" width="18" height="14" rx="3" fill="#fff" />
        <rect x="9.5" y="10.5" width="13" height="5" rx="1.5" fill="currentColor" />
        <circle cx="11.5" cy="24" r="2" fill="#fff" />
        <circle cx="20.5" cy="24" r="2" fill="#fff" />
      </svg>
    </span>
  )
}
