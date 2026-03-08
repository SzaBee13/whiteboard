import type { CursorPresence } from '../types'

interface UserCursorProps {
  cursor: CursorPresence
}

export default function UserCursor({ cursor }: UserCursorProps) {
  return (
    <div
      className="pointer-events-none absolute z-50 transition-transform duration-100"
      style={{
        left: `${cursor.x}px`,
        top: `${cursor.y}px`,
        transform: 'translate(-50%, -50%)',
      }}
    >
      {/* Cursor pointer */}
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="drop-shadow-lg"
      >
        <path
          d="M5.65376 12.3673L16.3612 3.07254L12.4695 15.7234L9.73117 13.0975L5.65376 12.3673Z"
          fill={cursor.avatar_color}
          stroke="white"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>

      {/* User info label */}
      <div
        className="absolute left-6 top-0 flex items-center gap-1.5 rounded-full px-2 py-1 text-xs font-medium text-white shadow-lg"
        style={{ backgroundColor: cursor.avatar_color }}
      >
        {cursor.avatar_url ? (
          <img
            src={cursor.avatar_url}
            alt={cursor.display_name}
            className="h-4 w-4 rounded-full border border-white"
          />
        ) : (
          <div className="flex h-4 w-4 items-center justify-center rounded-full bg-white/30 text-[10px] font-bold">
            {cursor.display_name.charAt(0).toUpperCase()}
          </div>
        )}
        <span className="whitespace-nowrap">{cursor.display_name}</span>
      </div>
    </div>
  )
}
