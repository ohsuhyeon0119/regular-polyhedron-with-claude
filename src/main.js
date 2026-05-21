import './style.css'
import { SOLIDS } from './solids.js'
import { createScene } from './scene.js'

const sidebar   = document.getElementById('sidebar')
const canvas    = document.getElementById('canvas')
const infoName  = document.getElementById('info-name')
const infoSub   = document.getElementById('info-sub')
const statFaces = document.getElementById('stat-faces')
const statEdges = document.getElementById('stat-edges')
const statVerts = document.getElementById('stat-verts')

const scene = createScene(canvas)

function select(solid, itemEl) {
  document.querySelectorAll('.solid-item').forEach(el => el.classList.remove('active'))
  itemEl.classList.add('active')

  scene.setSolid(solid)

  infoName.textContent  = solid.nameKo
  infoName.style.color  = solid.accentColor
  infoSub.textContent   = `${solid.nameEn} — 플라톤의 ${solid.element}`
  statFaces.textContent = solid.faces
  statEdges.textContent = solid.edges
  statVerts.textContent = solid.vertices
}

SOLIDS.forEach((solid, i) => {
  const item = document.createElement('div')
  item.className = 'solid-item' + (i === 0 ? ' active' : '')
  item.innerHTML = `
    <div class="solid-thumb" style="border-color:${solid.color}55;background:${solid.color}18">
      <div class="thumb-dot" style="background:${solid.color};box-shadow:0 0 10px ${solid.color}"></div>
    </div>
    <div class="solid-info">
      <div class="solid-name">${solid.nameKo}</div>
      <div class="solid-faces">${solid.nameEn} · ${solid.faces}면</div>
    </div>
  `
  item.addEventListener('click', () => select(solid, item))
  sidebar.appendChild(item)
})

// Initialize with first solid
select(SOLIDS[0], sidebar.querySelector('.solid-item'))
