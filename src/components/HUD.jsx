export default function HUD({ score, status }) {
  return (
    <div className="rounded-xl border border-slate-700 bg-slate-900/60 p-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-slate-400 text-xs uppercase tracking-wide">Score</div>
          <div className="text-3xl font-bold">{score}</div>
        </div>
        <div className="text-right max-w-[12rem]">
          <div className="text-slate-400 text-xs uppercase tracking-wide">Status</div>
          <div className="text-sm text-slate-200">{status}</div>
        </div>
      </div>
    </div>
  )
}
