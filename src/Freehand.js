
// =============================================================================
// perfect-freehand algorithm — ported from TypeScript to plain JS
// https://github.com/steveruizok/perfect-freehand  (MIT license)
// =============================================================================

// --- Constants ---
const PF_RATE_OF_PRESSURE = 0.275
const PF_FIXED_PI          = Math.PI + 0.0001
const PF_START_CAP_SEGS    = 13
const PF_END_CAP_SEGS      = 29
const PF_CORNER_CAP_SEGS   = 13
const PF_END_NOISE         = 3
const PF_MIN_T             = 0.15
const PF_T_RANGE           = 0.85
const PF_MIN_RADIUS        = 0.01
const PF_DEFAULT_PRESSURE  = 0.5
const PF_DEFAULT_FIRST_P   = 0.25
const PF_UNIT              = [1, 1]

// --- Scratch buffers (allocation-free hot loop) ---
const _pf_offset = [0, 0]
const _pf_tl     = [0, 0]
const _pf_tr     = [0, 0]
const _pf_vd     = [0, 0]

// --- Vec2 helpers ---
function pf_neg(A)              { return [-A[0], -A[1]] }
function pf_add(A, B)           { return [A[0]+B[0], A[1]+B[1]] }
function pf_addInto(o, A, B)    { o[0]=A[0]+B[0]; o[1]=A[1]+B[1]; return o }
function pf_sub(A, B)           { return [A[0]-B[0], A[1]-B[1]] }
function pf_subInto(o, A, B)    { o[0]=A[0]-B[0]; o[1]=A[1]-B[1]; return o }
function pf_mul(A, n)           { return [A[0]*n, A[1]*n] }
function pf_mulInto(o, A, n)    { o[0]=A[0]*n; o[1]=A[1]*n; return o }
function pf_div(A, n)           { return [A[0]/n, A[1]/n] }
function pf_per(A)              { return [A[1], -A[0]] }
function pf_perInto(o, A)       { const t=A[0]; o[0]=A[1]; o[1]=-t; return o }
function pf_dpr(A, B)           { return A[0]*B[0]+A[1]*B[1] }
function pf_isEqual(A, B)       { return A[0]===B[0] && A[1]===B[1] }
function pf_len(A)              { return Math.hypot(A[0], A[1]) }
function pf_dist2(A, B)         { const dx=A[0]-B[0], dy=A[1]-B[1]; return dx*dx+dy*dy }
function pf_uni(A)              { return pf_div(A, pf_len(A)) }
function pf_dist(A, B)          { return Math.hypot(A[1]-B[1], A[0]-B[0]) }
function pf_lrp(A, B, t)        { return pf_add(A, pf_mul(pf_sub(B, A), t)) }
function pf_lrpInto(o, A, B, t) { o[0]=A[0]+(B[0]-A[0])*t; o[1]=A[1]+(B[1]-A[1])*t; return o }
function pf_prj(A, B, c)        { return pf_add(A, pf_mul(B, c)) }
function pf_rotAround(A, C, r) {
  const s=Math.sin(r), c=Math.cos(r), px=A[0]-C[0], py=A[1]-C[1]
  return [px*c - py*s + C[0], px*s + py*c + C[1]]
}
function pf_rotAroundInto(o, A, C, r) {
  const s=Math.sin(r), c=Math.cos(r), px=A[0]-C[0], py=A[1]-C[1]
  o[0]=px*c - py*s + C[0]; o[1]=px*s + py*c + C[1]; return o
}

// --- Stroke radius ---
function pf_strokeRadius(size, thinning, pressure, easing = t => t) {
  return size * easing(0.5 - thinning * (0.5 - pressure))
}

// --- Simulate pressure from velocity ---
function pf_simulatePressure(prevPressure, distance, size) {
  const sp = Math.min(1, distance / size)
  const rp = Math.min(1, 1 - sp)
  return Math.min(1, prevPressure + (rp - prevPressure) * (sp * PF_RATE_OF_PRESSURE))
}

// --- Cap drawing helpers ---
function pf_drawDot(center, radius) {
  const start = pf_prj(center, pf_uni(pf_per(pf_sub(center, pf_add(center, [1,1])))), -radius)
  const pts = []
  const step = 1 / PF_START_CAP_SEGS
  for (let t = step; t <= 1; t += step) pts.push(pf_rotAround(start, center, PF_FIXED_PI*2*t))
  return pts
}
function pf_drawRoundStartCap(center, rightPoint, segs) {
  const cap = [], step = 1 / segs
  for (let t = step; t <= 1; t += step) cap.push(pf_rotAround(rightPoint, center, PF_FIXED_PI*t))
  return cap
}
function pf_drawFlatStartCap(center, leftPoint, rightPoint) {
  const cv = pf_sub(leftPoint, rightPoint)
  const oa = pf_mul(cv, 0.5), ob = pf_mul(cv, 0.51)
  return [pf_sub(center,oa), pf_sub(center,ob), pf_add(center,ob), pf_add(center,oa)]
}
function pf_drawRoundEndCap(center, direction, radius, segs) {
  const cap = [], start = pf_prj(center, direction, radius), step = 1 / segs
  for (let t = step; t < 1; t += step) cap.push(pf_rotAround(start, center, PF_FIXED_PI*3*t))
  return cap
}
function pf_drawFlatEndCap(center, direction, radius) {
  return [
    pf_add(center, pf_mul(direction, radius)),
    pf_add(center, pf_mul(direction, radius*0.99)),
    pf_sub(center, pf_mul(direction, radius*0.99)),
    pf_sub(center, pf_mul(direction, radius)),
  ]
}
function pf_taperDist(taper, size, totalLength) {
  if (taper === false || taper == null) return 0
  if (taper === true) return Math.max(size, totalLength)
  return taper
}
function pf_initialPressure(points, shouldSim, size) {
  return points.slice(0, 10).reduce((acc, curr) => {
    let p = curr.pressure
    if (shouldSim) p = pf_simulatePressure(acc, curr.distance, size)
    return (acc + p) / 2
  }, points[0].pressure)
}

// --- getStrokePoints ---
function pf_getStrokePoints(points, options = {}) {
  const { streamline = 0.5, size = 16, last: isComplete = false } = options
  if (points.length === 0) return []

  const t = PF_MIN_T + (1 - streamline) * PF_T_RANGE

  let pts = Array.isArray(points[0])
    ? points
    : points.map(({ x, y, pressure = PF_DEFAULT_PRESSURE }) => [x, y, pressure])

  if (pts.length === 2) {
    const last = pts[1]
    pts = pts.slice(0, -1)
    for (let i = 1; i < 5; i++) pts.push(pf_lrp(pts[0], last, i / 4))
  }
  if (pts.length === 1) {
    pts = [...pts, [...pf_add(pts[0], PF_UNIT), ...pts[0].slice(2)]]
  }

  const strokePoints = [{
    point: [pts[0][0], pts[0][1]],
    pressure: (pts[0][2] != null && pts[0][2] >= 0) ? pts[0][2] : PF_DEFAULT_FIRST_P,
    vector: [...PF_UNIT],
    distance: 0,
    runningLength: 0,
  }]

  let hasReachedMinLength = false
  let runningLength = 0
  let prev = strokePoints[0]
  const max = pts.length - 1

  for (let i = 1; i < pts.length; i++) {
    const point = (isComplete && i === max)
      ? [pts[i][0], pts[i][1]]
      : pf_lrp(prev.point, pts[i], t)

    if (pf_isEqual(prev.point, point)) continue

    const distance = pf_dist(point, prev.point)
    runningLength += distance

    if (i < max && !hasReachedMinLength) {
      if (runningLength < size) continue
      hasReachedMinLength = true
    }

    pf_subInto(_pf_vd, prev.point, point)
    prev = {
      point,
      pressure: (pts[i][2] != null && pts[i][2] >= 0) ? pts[i][2] : PF_DEFAULT_PRESSURE,
      vector: pf_uni(_pf_vd),
      distance,
      runningLength,
    }
    strokePoints.push(prev)
  }

  strokePoints[0].vector = strokePoints[1]?.vector || [0, 0]
  return strokePoints
}

// --- getStrokeOutlinePoints ---
function pf_getStrokeOutlinePoints(points, options = {}) {
  const {
    size = 16, smoothing = 0.5, thinning = 0.5,
    simulatePressure: shouldSim = true,
    easing = t => t,
    start = {}, end = {},
    last: isComplete = false,
  } = options

  const { cap: capStart = true, easing: taperStartEase = t => t*(2-t) } = start
  const { cap: capEnd   = true, easing: taperEndEase   = t => --t*t*t+1 } = end

  if (points.length === 0 || size <= 0) return []

  const totalLength = points[points.length-1].runningLength
  const taperStart  = pf_taperDist(start.taper, size, totalLength)
  const taperEnd    = pf_taperDist(end.taper,   size, totalLength)
  const minDist2    = Math.pow(size * smoothing, 2)

  const leftPts  = []
  const rightPts = []

  let prevPressure   = pf_initialPressure(points, shouldSim, size)
  let radius         = pf_strokeRadius(size, thinning, points[points.length-1].pressure, easing)
  let firstRadius
  let prevVector     = points[0].vector
  let prevLeft       = points[0].point
  let prevRight      = prevLeft
  let tempLeft       = prevLeft
  let tempRight      = prevRight
  let isPrevSharp    = false

  for (let i = 0; i < points.length; i++) {
    let { pressure } = points[i]
    const { point, vector, distance, runningLength } = points[i]
    const isLast = i === points.length - 1

    if (!isLast && totalLength - runningLength < PF_END_NOISE) continue

    if (thinning) {
      if (shouldSim) pressure = pf_simulatePressure(prevPressure, distance, size)
      radius = pf_strokeRadius(size, thinning, pressure, easing)
    } else {
      radius = size / 2
    }
    if (firstRadius == null) firstRadius = radius

    const tsStrength = runningLength < taperStart
      ? taperStartEase(runningLength / taperStart) : 1
    const teStrength = totalLength - runningLength < taperEnd
      ? taperEndEase((totalLength - runningLength) / taperEnd) : 1

    radius = Math.max(PF_MIN_RADIUS, radius * Math.min(tsStrength, teStrength))

    const nextVector    = (!isLast ? points[i+1] : points[i]).vector
    const nextDpr       = !isLast ? pf_dpr(vector, nextVector) : 1.0
    const prevDpr       = pf_dpr(vector, prevVector)
    const isSharp       = prevDpr < 0 && !isPrevSharp
    const isNextSharp   = nextDpr !== null && nextDpr < 0

    if (isSharp || isNextSharp) {
      pf_perInto(_pf_offset, prevVector)
      pf_mulInto(_pf_offset, _pf_offset, radius)
      const step = 1 / PF_CORNER_CAP_SEGS
      for (let t = 0; t <= 1; t += step) {
        pf_subInto(_pf_tl, point, _pf_offset)
        pf_rotAroundInto(_pf_tl, _pf_tl, point, PF_FIXED_PI * t)
        tempLeft = [_pf_tl[0], _pf_tl[1]]
        leftPts.push(tempLeft)

        pf_addInto(_pf_tr, point, _pf_offset)
        pf_rotAroundInto(_pf_tr, _pf_tr, point, PF_FIXED_PI * -t)
        tempRight = [_pf_tr[0], _pf_tr[1]]
        rightPts.push(tempRight)
      }
      prevLeft  = tempLeft
      prevRight = tempRight
      if (isNextSharp) isPrevSharp = true
      continue
    }
    isPrevSharp = false

    if (isLast) {
      pf_perInto(_pf_offset, vector)
      pf_mulInto(_pf_offset, _pf_offset, radius)
      leftPts.push(pf_sub(point, _pf_offset))
      rightPts.push(pf_add(point, _pf_offset))
      continue
    }

    pf_lrpInto(_pf_offset, nextVector, vector, nextDpr)
    pf_perInto(_pf_offset, _pf_offset)
    pf_mulInto(_pf_offset, _pf_offset, radius)

    pf_subInto(_pf_tl, point, _pf_offset)
    tempLeft = [_pf_tl[0], _pf_tl[1]]
    if (i <= 1 || pf_dist2(prevLeft, tempLeft) > minDist2) {
      leftPts.push(tempLeft)
      prevLeft = tempLeft
    }

    pf_addInto(_pf_tr, point, _pf_offset)
    tempRight = [_pf_tr[0], _pf_tr[1]]
    if (i <= 1 || pf_dist2(prevRight, tempRight) > minDist2) {
      rightPts.push(tempRight)
      prevRight = tempRight
    }

    prevPressure = pressure
    prevVector   = vector
  }

  const firstPoint = [points[0].point[0], points[0].point[1]]
  const lastPoint  = points.length > 1
    ? [points[points.length-1].point[0], points[points.length-1].point[1]]
    : pf_add(points[0].point, [1,1])

  const startCap = []
  const endCap   = []

  if (points.length === 1) {
    if (!(taperStart || taperEnd) || isComplete) {
      return pf_drawDot(firstPoint, firstRadius || radius)
    }
  } else {
    if (taperStart || (taperEnd && points.length === 1)) {
      // tapered — no start cap
    } else if (capStart) {
      startCap.push(...pf_drawRoundStartCap(firstPoint, rightPts[0], PF_START_CAP_SEGS))
    } else {
      startCap.push(...pf_drawFlatStartCap(firstPoint, leftPts[0], rightPts[0]))
    }

    const direction = pf_per(pf_neg(points[points.length-1].vector))
    if (taperEnd || (taperStart && points.length === 1)) {
      endCap.push(lastPoint)
    } else if (capEnd) {
      endCap.push(...pf_drawRoundEndCap(lastPoint, direction, radius, PF_END_CAP_SEGS))
    } else {
      endCap.push(...pf_drawFlatEndCap(lastPoint, direction, radius))
    }
  }

  return leftPts.concat(endCap, rightPts.reverse(), startCap)
}

// --- getStroke (main entry point) ---
function getStroke(points, options = {}) {
  return pf_getStrokeOutlinePoints(pf_getStrokePoints(points, options), options)
}

// --- Render outline polygon onto a Canvas 2D context ---
function strokeToCanvas(ctx, stroke) {
  if (!stroke.length) return
  ctx.beginPath()
  ctx.moveTo(stroke[0][0], stroke[0][1])
  for (let i = 1; i < stroke.length - 1; i++) {
    const mx = (stroke[i][0] + stroke[i+1][0]) / 2
    const my = (stroke[i][1] + stroke[i+1][1]) / 2
    ctx.quadraticCurveTo(stroke[i][0], stroke[i][1], mx, my)
  }
  ctx.closePath()
}

// =============================================================================
// Freehand class
// =============================================================================

export default class Freehand {

  #canvas          = null
  #isDrawing       = false
  #penSize         = null
  #penColor        = null
  #penType         = null
  #penOpacity      = null
  #penFlow         = null
  #penHardness     = null
  #backgroundColor = null
  #imageFormat     = null
  #snapShot        = null

  #prevMouseX = null
  #prevMouseY = null

  #ctx     = null
  toolType = null
  ratio    = null

  #imageFormats = { 'image/png': 'png', 'image/jpeg': 'jpg' }

  #pathArr    = []
  #countIndex

  // perfect-freehand options
  #thinning         = 0.5
  #streamline       = 0.5
  #pfSmoothing      = 0.5
  #simulatePressure = true
  #easing           = t => t
  #taperStart       = {}
  #taperEnd         = {}

  // accumulated input points for current stroke: [x, y, pressure][]
  #currentPoints = []

  constructor(canvas, options = {}) {
    try {
      this.#canvas = (typeof canvas === 'string') ? this.#select(canvas) : canvas
    } catch (error) {
      console.error('Please provide canvas selector or canvas element')
    }
    this.#canvas.style.cursor = "url('./img/pen.ico'), crosshair"
    this.#setDefaults(options)
    this.init()
  }

  #setDefaults(options) {
    this.#penSize         = options?.penSize         || 8
    this.#penColor        = options?.penColor        || '#000000'
    this.#penType         = options?.penType         || 'round'
    this.#penOpacity      = options?.penOpacity      || 1
    this.#penFlow         = options?.penFlow         || 'source-over'
    this.#penHardness     = options?.penHardness     || 1
    this.#backgroundColor = options?.backgroundColor || '#ffffff'
    this.toolType         = options?.toolType        || 'brush'
    this.#imageFormat     = options?.imageFormat     || 'image/png'
    // perfect-freehand options
    this.#thinning         = options?.thinning         ?? 0.5
    this.#streamline       = options?.streamline       ?? 0.5
    this.#pfSmoothing      = options?.smoothing        ?? 0.5
    this.#simulatePressure = options?.simulatePressure ?? true
    this.#easing           = options?.easing           ?? (t => t)
    this.#taperStart       = options?.start            ?? {}
    this.#taperEnd         = options?.end              ?? {}
  }

  init() {
    this.#prevMouseX = 0
    this.#prevMouseY = 0
    this.#countIndex = -1
    this.#isDrawing  = false

    window.addEventListener('resize', this.resizeCanvas.bind(this))
    window.addEventListener('load',   this.resizeCanvas.bind(this))

    this.#ctx = this.#canvas.getContext('2d', { willReadFrequently: true })
    this.#setCanvasBackground()

    this.#canvas.addEventListener('mousedown',  this.#startDrawing.bind(this))
    this.#canvas.addEventListener('touchstart', this.#startDrawing.bind(this))
    this.#canvas.addEventListener('mousemove',  this.#draw.bind(this))
    this.#canvas.addEventListener('touchmove',  this.#draw.bind(this))
    this.#canvas.addEventListener('mouseup',    this.#stopDrawing.bind(this))
    this.#canvas.addEventListener('touchend',   this.#stopDrawing.bind(this))

    this.#select('#clear')?.addEventListener('click', this.clear.bind(this))

    window.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.key === 'z') { this.undo() }
      if (e.ctrlKey && e.key === 'y') { this.redo() }
      if (e.ctrlKey && e.key === 's') { e.preventDefault(); this.download() }
      if (e.ctrlKey && e.key === 'd') { e.preventDefault(); this.clear() }
    })
  }

  #select = selector => document.querySelector(selector)

  resizeCanvas() {
    const ratio = Math.max(window.devicePixelRatio || 1, 1)
    this.#canvas.width  = this.#canvas.offsetWidth  * ratio
    this.#canvas.height = this.#canvas.offsetHeight * ratio
    this.ratio = ratio
    this.#setCanvasBackground()
  }

  #setCanvasBackground() {
    this.#ctx.fillStyle = this.#backgroundColor || '#ffffff'
    this.#ctx.fillRect(0, 0, this.#canvas.width, this.#canvas.height)
  }

  // Returns { x, y, pressure } from either a mouse or touch event
  #getCoords(e) {
    if (e.touches && e.touches[0]) {
      const rect = this.#canvas.getBoundingClientRect()
      const ratio = this.ratio || 1
      return {
        x: (e.touches[0].clientX - rect.left) * ratio,
        y: (e.touches[0].clientY - rect.top)  * ratio,
        pressure: e.touches[0].force || PF_DEFAULT_PRESSURE,
      }
    }
    return {
      x: e.offsetX,
      y: e.offsetY,
      pressure: (e.pressure > 0) ? e.pressure : PF_DEFAULT_PRESSURE,
    }
  }

  // Build perfect-freehand options from current settings
  #pfOptions(last = false) {
    return {
      size:             this.#penSize,
      thinning:         this.#thinning,
      smoothing:        this.#pfSmoothing,
      streamline:       this.#streamline,
      simulatePressure: this.#simulatePressure,
      easing:           this.#easing,
      start:            this.#taperStart,
      end:              this.#taperEnd,
      last,
    }
  }

  #renderStroke(last = false) {
    const outline = getStroke(this.#currentPoints, this.#pfOptions(last))
    if (!outline.length) return

    const fillColor = (this.toolType === 'eraser')
      ? this.#backgroundColor
      : this.#penColor

    this.#ctx.putImageData(this.#snapShot, 0, 0)
    this.#ctx.fillStyle              = fillColor
    this.#ctx.globalAlpha            = this.#penOpacity
    this.#ctx.globalCompositeOperation = this.#penFlow

    strokeToCanvas(this.#ctx, outline)
    this.#ctx.fill()
  }

  #startDrawing(e) {
    e.preventDefault()
    this.#isDrawing = true

    const { x, y } = this.#getCoords(e)
    this.#prevMouseX = x
    this.#prevMouseY = y

    this.#snapShot     = this.#ctx.getImageData(0, 0, this.#canvas.width, this.#canvas.height)
    this.#currentPoints = []

    this.#draw(e)
  }

  #draw(e) {
    if (!this.#isDrawing) return
    e.preventDefault()

    const { x, y, pressure } = this.#getCoords(e)

    // Straight line tool — unchanged behaviour
    if (this.toolType === 'line') {
      this.#ctx.putImageData(this.#snapShot, 0, 0)
      this.#ctx.beginPath()
      this.#ctx.moveTo(this.#prevMouseX, this.#prevMouseY)
      this.#ctx.lineTo(x, y)
      this.#ctx.strokeStyle              = this.#penColor
      this.#ctx.lineWidth                = this.#penSize
      this.#ctx.lineCap                  = this.#penType
      this.#ctx.lineJoin                 = 'round'
      this.#ctx.globalAlpha              = this.#penOpacity
      this.#ctx.globalCompositeOperation = this.#penFlow
      this.#ctx.stroke()
      return
    }

    this.#currentPoints.push([x, y, pressure])
    this.#renderStroke(false)
  }

  #stopDrawing(e) {
    if (!this.#isDrawing) return
    e?.preventDefault()

    if (this.toolType !== 'line' && this.#currentPoints.length > 0) {
      this.#renderStroke(true)
    }

    this.#isDrawing = false
    this.#ctx.beginPath()
    this.#storePaths()
  }

  #storePaths() {
    this.#pathArr.push(this.#ctx.getImageData(0, 0, this.#canvas.width, this.#canvas.height))
    this.#countIndex += 1
  }

  clear() {
    if (this.#pathArr.length === 0) return
    this.#ctx.clearRect(0, 0, this.#canvas.width, this.#canvas.height)
    this.#setCanvasBackground()
    this.#pathArr      = []
    this.#countIndex   = -1
    this.#currentPoints = []
  }

  undo() {
    if (this.#countIndex <= 0) { this.clear(); return }
    this.#countIndex -= 1
    this.#ctx.putImageData(this.#pathArr[this.#countIndex], 0, 0)
  }

  redo() {
    if (this.#countIndex >= this.#pathArr.length - 1) return
    this.#countIndex += 1
    this.#ctx.putImageData(this.#pathArr[this.#countIndex], 0, 0)
  }

  // ---- Public setters (full control) ----

  setToolType(toolType)       { this.toolType = toolType }

  setPenSize(size)            { this.#penSize = size }
  setPenColor(color)          { this.#penColor = color }
  setPenType(type)            { this.#penType = type }
  setPenOpacity(opacity)      { this.#penOpacity = opacity }
  setPenFlow(flow)            { this.#penFlow = flow }
  setPenHardness(hardness)    { this.#penHardness = hardness }
  setBackgroundColor(color)   { this.#backgroundColor = color }
  setImageFormat(format)      { this.#imageFormat = format }

  // perfect-freehand controls
  setThinning(v)              { this.#thinning = v }          // 0–1: width variation by pressure
  setStreamline(v)            { this.#streamline = v }        // 0–1: path smoothing/simplification
  setSmoothing(v)             { this.#pfSmoothing = v }       // 0–1: edge softness
  setSimulatePressure(v)      { this.#simulatePressure = v }  // bool: velocity-based pressure
  setEasing(fn)               { this.#easing = fn }           // (t:0-1)=>0-1 pressure curve
  setStartOptions(opts)       { this.#taperStart = opts }     // { cap, taper, easing }
  setEndOptions(opts)         { this.#taperEnd = opts }       // { cap, taper, easing }

  getThinning()               { return this.#thinning }
  getStreamline()             { return this.#streamline }
  getSmoothing()              { return this.#pfSmoothing }

  // ---- Output ----

  getImageString()            { return this.#canvas.toDataURL(this.#imageFormat) }
  getCanvasData()             { return this.#canvas.toDataURL(this.#imageFormat) }

  download() {
    const data = this.getImageString()
    const blob = this.#dataURLToBlob(data)
    const url  = window.URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.style    = 'display:none'
    a.download = Date.now() + '.' + this.#imageFormats[this.#imageFormat]
    a.href     = url
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
  }

  #dataURLToBlob(dataURL) {
    const parts       = dataURL.split(';base64,')
    const contentType = parts[0].split(':')[1]
    const raw         = window.atob(parts[1])
    const uInt8Array  = new Uint8Array(raw.length)
    for (let i = 0; i < raw.length; i++) uInt8Array[i] = raw.charCodeAt(i)
    return new Blob([uInt8Array], { type: contentType })
  }

  addEventListener(event, callback) { this.#canvas.addEventListener(event, callback) }

  destroy() {
    this.#canvas     = null
    this.#isDrawing  = null
    this.#ctx        = null
  }
}
