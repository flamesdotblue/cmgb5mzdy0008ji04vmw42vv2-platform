export default function RestartButton({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full rounded-lg bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 transition-colors text-white py-2.5 px-4 font-medium shadow-sm"
    >
      Restart
    </button>
  )
}
