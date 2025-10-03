export default function Header() {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Blocky Road Crosser</h1>
        <p className="text-slate-400">A simple Minecraft-style 3D road crossing game</p>
      </div>
      <div className="hidden md:flex items-center gap-2 text-slate-400">
        <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        <span className="text-sm">WebGL running</span>
      </div>
    </div>
  )
}
