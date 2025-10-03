import { useEffect, useRef } from 'react'

// Load Three.js at runtime via ESM CDN to avoid local dependency
async function loadThree() {
  const THREE = await import('https://esm.sh/three@0.160.0')
  return THREE
}

export default function GameCanvas({ onScore, onGameOver, resetSignal }) {
  const containerRef = useRef(null)
  const gameRef = useRef({})

  useEffect(() => {
    let mounted = true
    let raf = 0
    let resizeObserver

    const init = async () => {
      const THREE = await loadThree()
      if (!mounted) return

      const container = containerRef.current
      const scene = new THREE.Scene()
      scene.background = new THREE.Color(0x0b1220)

      const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: false, powerPreference: 'high-performance' })
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
      renderer.setSize(container.clientWidth, container.clientHeight)
      renderer.outputColorSpace = THREE.SRGBColorSpace
      renderer.domElement.style.width = '100%'
      renderer.domElement.style.height = '100%'
      renderer.domElement.style.imageRendering = 'pixelated'
      container.innerHTML = ''
      container.appendChild(renderer.domElement)

      const camera = new THREE.PerspectiveCamera(55, container.clientWidth / container.clientHeight, 0.1, 100)
      camera.position.set(0, 10, 12)
      camera.lookAt(0, 0, 3)

      // Lighting
      const hemi = new THREE.HemisphereLight(0xffffff, 0x334455, 0.8)
      scene.add(hemi)
      const dir = new THREE.DirectionalLight(0xffffff, 0.8)
      dir.position.set(5, 10, 3)
      scene.add(dir)

      // Materials (flat, blocky colors)
      const mkMat = (hex) => new THREE.MeshLambertMaterial({ color: new THREE.Color(hex) })

      // Constants
      const TILE = 1
      const LANES = 8
      const X_MIN = -8
      const X_MAX = 8
      const START_Z = -3
      const GOAL_Z = LANES + 1

      // Ground (grass)
      const groundGeo = new THREE.BoxGeometry((X_MAX - X_MIN) + 6, 0.5, GOAL_Z - START_Z + 6)
      const ground = new THREE.Mesh(groundGeo, mkMat(0x355e3b))
      ground.position.set(0, -0.26, (GOAL_Z + START_Z) / 2)
      scene.add(ground)

      // Build lanes (road planes)
      const roadGeo = new THREE.BoxGeometry((X_MAX - X_MIN) + 4, 0.2, 1)
      const roadMat = mkMat(0x2b2f36)
      const laneZs = []
      for (let i = 0; i < LANES; i++) {
        const z = i
        laneZs.push(z)
        const road = new THREE.Mesh(roadGeo, roadMat)
        road.position.set(0, -0.15, z)
        scene.add(road)

        // lane markings
        const stripeGeo = new THREE.BoxGeometry(0.6, 0.05, 0.08)
        const stripeMat = mkMat(0xf2f2f2)
        for (let sx = X_MIN - 1; sx <= X_MAX + 1; sx += 1.2) {
          const stripe = new THREE.Mesh(stripeGeo, stripeMat)
          stripe.position.set(sx, 0.01, z)
          scene.add(stripe)
        }
      }

      // Start and goal pads
      const padGeo = new THREE.BoxGeometry((X_MAX - X_MIN) + 4, 0.2, 1)
      const startPad = new THREE.Mesh(padGeo, mkMat(0x4f7f4f))
      startPad.position.set(0, -0.15, START_Z)
      scene.add(startPad)
      const goalPad = new THREE.Mesh(padGeo, mkMat(0x4f7f4f))
      goalPad.position.set(0, -0.15, GOAL_Z)
      scene.add(goalPad)

      // Player (blocky avatar)
      const player = new THREE.Group()
      const body = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.8, 0.8), mkMat(0x8ab4ff))
      body.position.y = 0.4
      player.add(body)
      const head = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.6, 0.6), mkMat(0xffe0b3))
      head.position.set(0, 1.1, 0)
      player.add(head)
      scene.add(player)

      const playerPos = { x: 0, z: START_Z }
      const targetPos = { x: 0, z: START_Z }

      // Cars
      const carGeo = new THREE.BoxGeometry(1, 0.6, 0.9)
      const carTopGeo = new THREE.BoxGeometry(0.8, 0.4, 0.7)
      const carColors = [0xe4572e, 0xf0a202, 0x17bebb, 0x76b041, 0x9b5de5]

      function makeCar(colorHex) {
        const g = new THREE.Group()
        const base = new THREE.Mesh(carGeo, mkMat(colorHex))
        base.position.y = 0.3
        const top = new THREE.Mesh(carTopGeo, mkMat(0xd9e6ff))
        top.position.set(0, 0.75, 0)
        g.add(base)
        g.add(top)
        return g
      }

      const lanes = []
      for (let i = 0; i < LANES; i++) {
        const dirSign = i % 2 === 0 ? 1 : -1
        const speed = 0.6 + i * 0.05
        const cars = []
        const spacing = 4
        const count = Math.floor(((X_MAX - X_MIN) + 10) / spacing)
        for (let c = 0; c < count; c++) {
          const car = makeCar(carColors[(i + c) % carColors.length])
          car.position.set(X_MIN - 4 + c * spacing, 0, i)
          scene.add(car)
          cars.push(car)
        }
        lanes.push({ z: i, dir: dirSign, speed, cars })
      }

      // Input
      const keys = new Set()
      const onKeyDown = (e) => {
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
          e.preventDefault()
        }
        if (e.repeat) return
        keys.add(e.key)
        if (e.key === 'ArrowUp') targetPos.z += TILE
        if (e.key === 'ArrowDown') targetPos.z -= TILE
        if (e.key === 'ArrowLeft') targetPos.x -= TILE
        if (e.key === 'ArrowRight') targetPos.x += TILE

        // bounds
        targetPos.x = Math.max(X_MIN, Math.min(X_MAX, targetPos.x))
        targetPos.z = Math.max(START_Z, Math.min(GOAL_Z, targetPos.z))
      }
      const onKeyUp = (e) => keys.delete(e.key)
      window.addEventListener('keydown', onKeyDown)
      window.addEventListener('keyup', onKeyUp)

      // Resize
      const onResize = () => {
        const w = container.clientWidth
        const h = container.clientHeight
        renderer.setSize(w, h)
        camera.aspect = w / h
        camera.updateProjectionMatrix()
      }
      resizeObserver = new ResizeObserver(onResize)
      resizeObserver.observe(container)

      // Helpers
      function resetPlayer() {
        playerPos.x = 0
        playerPos.z = START_Z
        targetPos.x = 0
        targetPos.z = START_Z
        player.position.set(playerPos.x, 0, playerPos.z)
      }

      resetPlayer()

      // Game loop
      const clock = new THREE.Clock()
      function animate() {
        const dt = Math.min(clock.getDelta(), 0.05)

        // Smooth step player towards target for a chunky feel
        const lerp = (a, b, t) => a + (b - a) * t
        playerPos.x = lerp(playerPos.x, targetPos.x, 0.35)
        playerPos.z = lerp(playerPos.z, targetPos.z, 0.35)
        player.position.set(playerPos.x, 0, playerPos.z)

        // Follow cam slight offset
        const camTarget = new THREE.Vector3(playerPos.x * 0.3, 10, 12)
        camera.position.lerp(camTarget, 0.05)
        camera.lookAt(playerPos.x, 0.5, Math.max(playerPos.z, 0))

        // Move cars
        for (const lane of lanes) {
          const width = (X_MAX - X_MIN) + 16
          for (const car of lane.cars) {
            car.position.x += lane.dir * lane.speed * dt
            if (lane.dir > 0 && car.position.x > X_MAX + 6) car.position.x -= width
            if (lane.dir < 0 && car.position.x < X_MIN - 6) car.position.x += width
          }
        }

        // Collision detection (AABB simplified)
        let hit = false
        for (const lane of lanes) {
          if (Math.abs(playerPos.z - lane.z) < 0.45) {
            for (const car of lane.cars) {
              if (Math.abs(playerPos.x - car.position.x) < 0.75) {
                hit = true
                break
              }
            }
            if (hit) break
          }
        }
        if (hit) {
          onGameOver && onGameOver()
          resetPlayer()
        }

        // Goal reached
        if (targetPos.z >= GOAL_Z && Math.abs(playerPos.z - targetPos.z) < 0.05) {
          onScore && onScore()
          resetPlayer()
        }

        renderer.render(scene, camera)
        raf = requestAnimationFrame(animate)
      }
      raf = requestAnimationFrame(animate)

      // Store for cleanup
      gameRef.current = { THREE, scene, renderer, camera, onKeyDown, onKeyUp, resizeObserver }
    }

    init()

    return () => {
      mounted = false
      cancelAnimationFrame(raf)
      const g = gameRef.current
      if (g && g.renderer) {
        g.renderer.dispose()
        g.renderer.forceContextLoss && g.renderer.forceContextLoss()
      }
      if (g && g.scene) {
        // dispose materials/geometries
        g.scene.traverse((obj) => {
          if (obj.geometry) obj.geometry.dispose?.()
          if (obj.material) {
            if (Array.isArray(obj.material)) obj.material.forEach((m) => m.dispose?.())
            else obj.material.dispose?.()
          }
        })
      }
      if (g && g.onKeyDown) window.removeEventListener('keydown', g.onKeyDown)
      if (g && g.onKeyUp) window.removeEventListener('keyup', g.onKeyUp)
      if (g && g.resizeObserver) g.resizeObserver.disconnect()
    }
  }, [resetSignal, onScore, onGameOver])

  return (
    <div className="w-full aspect-[16/9] bg-slate-900 relative">
      <div ref={containerRef} className="absolute inset-0" />
      <div className="absolute left-2 bottom-2 text-[10px] text-slate-400 bg-slate-900/60 px-2 py-1 rounded">
        Minecraft-like blocky aesthetic using simple boxes
      </div>
    </div>
  )
}
