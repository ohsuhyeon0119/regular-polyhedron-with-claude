import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js'
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js'

export function createScene(canvas) {
  // ── Renderer ──────────────────────────────────────────────────────────────
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.2
  renderer.outputColorSpace = THREE.SRGBColorSpace

  // ── Scene + Camera ────────────────────────────────────────────────────────
  const scene = new THREE.Scene()
  scene.background = new THREE.Color('#06000f')

  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100)
  camera.position.set(0, 0, 9)

  // ── Environment map (required for MeshPhysicalMaterial iridescence) ───────
  const pmrem = new THREE.PMREMGenerator(renderer)
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
  pmrem.dispose()

  // ── Lights ────────────────────────────────────────────────────────────────
  scene.add(new THREE.AmbientLight(0xffffff, 0.4))

  const lightDefs = [
    { color: '#ff00ff', intensity: 2, r: 6, phase: 0 },
    { color: '#00ffff', intensity: 2, r: 6, phase: Math.PI },
    { color: '#ffffff', intensity: 1.5, r: 5, phase: Math.PI / 2 },
    { color: '#aa44ff', intensity: 1.5, r: 5, phase: (3 * Math.PI) / 2 },
  ]

  const pointLights = lightDefs.map(({ color, intensity, r, phase }) => {
    const light = new THREE.PointLight(color, intensity, 20)
    light.userData = { r, phase }
    scene.add(light)
    return light
  })

  // ── Controls ──────────────────────────────────────────────────────────────
  const controls = new OrbitControls(camera, canvas)
  controls.enableZoom = false
  controls.enablePan = false
  controls.autoRotate = true
  controls.autoRotateSpeed = 1.2
  controls.enableDamping = true
  controls.dampingFactor = 0.06

  canvas.addEventListener('mousedown', () => { controls.autoRotate = false })
  canvas.addEventListener('mouseup',   () => { controls.autoRotate = true })
  canvas.addEventListener('mouseleave',() => { controls.autoRotate = true })

  // ── Post-processing ───────────────────────────────────────────────────────
  const composer = new EffectComposer(renderer)
  composer.addPass(new RenderPass(scene, camera))

  const bloom = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    0.7,   // strength
    0.5,   // radius
    0.35   // threshold — 높을수록 가장 밝은 부분만 번짐
  )
  composer.addPass(bloom)

  // ── Resize ────────────────────────────────────────────────────────────────
  function resize() {
    const container = canvas.parentElement
    const w = container.clientWidth
    const h = container.clientHeight
    renderer.setSize(w, h)
    composer.setSize(w, h)
    camera.aspect = w / h
    camera.updateProjectionMatrix()
    bloom.resolution.set(w, h)
  }
  resize()
  window.addEventListener('resize', resize)

  // ── Solid state ───────────────────────────────────────────────────────────
  let mesh = null
  let edges = null

  function setSolid(solidConfig) {
    // Dispose previous objects
    if (mesh)  { scene.remove(mesh);  mesh.geometry.dispose();  mesh.material.dispose() }
    if (edges) { scene.remove(edges); edges.geometry.dispose(); edges.material.dispose() }

    const geo = solidConfig.geometry()

    const mat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(solidConfig.color),
      metalness: 0.05,
      roughness: 0.04,
      transmission: 0.12,
      thickness: 0.5,
      iridescence: 1.0,
      iridescenceIOR: 1.5,
      iridescenceThicknessRange: [100, 800],
      envMapIntensity: 1.5,
      transparent: true,
      opacity: 0.92,
    })

    mesh = new THREE.Mesh(geo, mat)
    scene.add(mesh)

    // Glowing edge overlay
    const edgesGeo = new THREE.EdgesGeometry(geo)
    const edgesMat = new THREE.LineBasicMaterial({
      color: new THREE.Color(solidConfig.accentColor),
      transparent: true,
      opacity: 0.85,
    })
    edges = new THREE.LineSegments(edgesGeo, edgesMat)
    scene.add(edges)

    // Recolor orbiting lights to match the solid's palette
    pointLights[0].color.set(solidConfig.color)
    pointLights[1].color.set(solidConfig.accentColor)
    pointLights[2].color.set('#ffffff')
    pointLights[3].color.set(solidConfig.color)

    // Reset camera orientation
    controls.reset()
    camera.position.set(0, 0, 9)
  }

  // ── Animation loop ────────────────────────────────────────────────────────
  let t = 0

  function animate() {
    requestAnimationFrame(animate)
    t += 0.008

    pointLights.forEach(light => {
      const { r, phase } = light.userData
      light.position.set(
        Math.cos(t + phase) * r,
        Math.sin(t * 0.7 + phase) * 3,
        Math.sin(t + phase) * r
      )
    })

    controls.update()
    composer.render()
  }

  animate()

  return { setSolid }
}
