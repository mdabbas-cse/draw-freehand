const canvasEl = document.querySelector('#canvas')

const canvas = new DrawFreehand.Freehand(canvasEl, {
  penSize: 16,
  penColor: '#000000',
  penOpacity: 1,
  backgroundColor: '#ffffff',
  toolType: 'brush',
  thinning: 0.5,
  streamline: 0.5,
  smoothing: 0.5,
})

const easingFns = {
  linear:       t => t,
  easeInQuad:   t => t * t,
  easeOutQuad:  t => t * (2 - t),
  easeInOutQuad: t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
  easeInCubic:  t => t * t * t,
  easeOutCubic: t => --t * t * t + 1,
}

const defaults = {
  size: 16,
  thinning: 0.5,
  streamline: 0.5,
  smoothing: 0.5,
  easing: 'linear',
  taperStart: 38,
  easingStart: 'easeOutQuad',
  taperEnd: 0,
  capEnd: true,
  color: '#000000',
  bgColor: '#ffffff',
}

function setVal(id, value) {
  const el = document.getElementById(id + '-val')
  if (el) el.textContent = value
}

// Size
document.getElementById('size').addEventListener('input', e => {
  canvas.setPenSize(+e.target.value)
  setVal('size', e.target.value)
})

// Thinning (-100..100 → -1..1)
document.getElementById('thinning').addEventListener('input', e => {
  const val = Math.round(e.target.value) / 100
  canvas.setThinning(val)
  setVal('thinning', val.toFixed(2))
})

// Streamline (0..100 → 0..1)
document.getElementById('streamline').addEventListener('input', e => {
  const val = +e.target.value / 100
  canvas.setStreamline(val)
  setVal('streamline', val.toFixed(2))
})

// Smoothing (0..100 → 0..1)
document.getElementById('smoothing').addEventListener('input', e => {
  const val = +e.target.value / 100
  canvas.setSmoothing(val)
  setVal('smoothing', val.toFixed(2))
})

// Easing
document.getElementById('easing').addEventListener('change', e => {
  canvas.setEasing(easingFns[e.target.value] || (t => t))
})

function getStartOptions() {
  return {
    taper: +document.getElementById('taper-start').value,
    easing: easingFns[document.getElementById('easing-start').value] || (t => t),
  }
}

function getEndOptions() {
  return {
    taper: +document.getElementById('taper-end').value,
    cap: document.getElementById('cap-end').checked,
  }
}

document.getElementById('taper-start').addEventListener('input', e => {
  setVal('taper-start', e.target.value)
  canvas.setStartOptions(getStartOptions())
})

document.getElementById('easing-start').addEventListener('change', () => {
  canvas.setStartOptions(getStartOptions())
})

document.getElementById('taper-end').addEventListener('input', e => {
  setVal('taper-end', e.target.value)
  canvas.setEndOptions(getEndOptions())
})

document.getElementById('cap-end').addEventListener('change', () => {
  canvas.setEndOptions(getEndOptions())
})

// Fill color
const penColorEl = document.getElementById('pen-color')
penColorEl.addEventListener('input', e => {
  canvas.setPenColor(e.target.value)
  document.querySelectorAll('.swatch').forEach(s => s.classList.remove('active'))
})

// Color swatches
document.querySelectorAll('.swatch').forEach(swatch => {
  swatch.addEventListener('click', () => {
    const color = swatch.dataset.color
    canvas.setPenColor(color)
    penColorEl.value = color
    document.querySelectorAll('.swatch').forEach(s => s.classList.remove('active'))
    swatch.classList.add('active')
  })
})

// Background color
document.getElementById('bg-color').addEventListener('input', e => {
  canvas.setBackgroundColor(e.target.value)
})

// Bottom controls
document.getElementById('undo').addEventListener('click', () => canvas.undo())
document.getElementById('redo').addEventListener('click', () => canvas.redo())
document.getElementById('clear').addEventListener('click', () => canvas.clear())

// Sidebar toggle
document.getElementById('toggle-sidebar').addEventListener('click', () => {
  document.getElementById('sidebar').classList.toggle('hidden')
})

// Reset Options
document.getElementById('reset-options').addEventListener('click', () => {
  const s = document.getElementById('size')
  s.value = defaults.size
  setVal('size', defaults.size)
  canvas.setPenSize(defaults.size)

  const th = document.getElementById('thinning')
  th.value = defaults.thinning * 100
  setVal('thinning', defaults.thinning.toFixed(1))
  canvas.setThinning(defaults.thinning)

  const sl = document.getElementById('streamline')
  sl.value = defaults.streamline * 100
  setVal('streamline', defaults.streamline.toFixed(1))
  canvas.setStreamline(defaults.streamline)

  const sm = document.getElementById('smoothing')
  sm.value = defaults.smoothing * 100
  setVal('smoothing', defaults.smoothing.toFixed(1))
  canvas.setSmoothing(defaults.smoothing)

  document.getElementById('easing').value = defaults.easing
  canvas.setEasing(easingFns[defaults.easing])

  document.getElementById('taper-start').value = defaults.taperStart
  setVal('taper-start', defaults.taperStart)
  document.getElementById('easing-start').value = defaults.easingStart
  canvas.setStartOptions({ taper: defaults.taperStart, easing: easingFns[defaults.easingStart] })

  document.getElementById('taper-end').value = defaults.taperEnd
  setVal('taper-end', defaults.taperEnd)
  document.getElementById('cap-end').checked = defaults.capEnd
  canvas.setEndOptions({ taper: defaults.taperEnd, cap: defaults.capEnd })

  canvas.setPenColor(defaults.color)
  penColorEl.value = defaults.color
  document.querySelectorAll('.swatch').forEach(s => {
    s.classList.toggle('active', s.dataset.color === defaults.color)
  })

  canvas.setBackgroundColor(defaults.bgColor)
  document.getElementById('bg-color').value = defaults.bgColor
})

// Copy Options
document.getElementById('copy-options').addEventListener('click', () => {
  const opts = {
    size: +document.getElementById('size').value,
    thinning: +document.getElementById('thinning').value / 100,
    streamline: +document.getElementById('streamline').value / 100,
    smoothing: +document.getElementById('smoothing').value / 100,
    easing: document.getElementById('easing').value,
    start: {
      taper: +document.getElementById('taper-start').value,
      easing: document.getElementById('easing-start').value,
    },
    end: {
      taper: +document.getElementById('taper-end').value,
      cap: document.getElementById('cap-end').checked,
    },
  }
  navigator.clipboard.writeText(JSON.stringify(opts, null, 2)).catch(() => {})
})

// Copy to SVG
document.getElementById('copy-svg').addEventListener('click', () => {
  const dataUrl = canvas.getCanvasData()
  const svg = `<svg xmlns="http://www.w3.org/2000/svg"><image href="${dataUrl}"/></svg>`
  navigator.clipboard.writeText(svg).catch(() => {})
})

document.addEventListener('contextmenu', e => e.preventDefault())
