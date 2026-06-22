
export default class Freehand {

  #canvas = null

  #isDrawing = false

  #penSize = null

  #penColor = null

  #penType = null

  #penOpacity = null

  #penFlow = null

  #penHardness = null

  #backgroundColor = null

  #imageFormat = null

  #snapShot = null

  // self uses variables
  #prevMouseX = null
  #prevMouseY = null

  #ctx = null

  toolType = null

  ratio = null

  #imageFormats = {
    'image/png': 'png',
    'image/jpeg': 'jpg'
  }

  #pathArr = []

  #countIndex

  #smoothingLevel = 0.5

  #currentPoints = []

  constructor(canvas, options = {}) {
    try {

      if (typeof canvas === 'string') {
        this.#canvas = this.#select(canvas)
      } else {
        this.#canvas = canvas
      }

    } catch (error) {
      console.error('Please provide canvas selector or canvas element')
    }
    this.#canvas.style.cursor = "url('./img/pen.ico'), crosshair"

    this.#setDefaults(options)

    this.init()
  }

  #setDefaults(options) {
    this.#penSize = options?.penSize || 3
    this.#penColor = options?.penColor || '#000000'
    this.#penType = options?.penType || 'round'
    this.#penOpacity = options?.penOpacity || 1
    this.#penFlow = options?.penFlow || 1
    this.#penHardness = options?.penHardness || 1
    this.#backgroundColor = options?.backgroundColor || '#ffffff'
    this.toolType = options?.toolType || 'brush' // brush, eraser
    this.#imageFormat = options?.imageFormat || 'image/png'
    this.#smoothingLevel = options?.smoothing ?? 0.5
  }

  init() {
    this.#prevMouseX = 0
    this.#prevMouseY = 0
    this.#countIndex = -1
    this.#isDrawing = false

    // call resizeCanvas() on window resize
    window.addEventListener('resize', this.resizeCanvas.bind(this))
    window.addEventListener('load', this.resizeCanvas.bind(this))

    this.#ctx = this.#canvas.getContext('2d', { willReadFrequently: true })
    this.#ctx.scale(this.ratio, this.ratio)

    this.#setCanvasBackground()

    this.#ctx.fillStyle = this.#penColor


    this.#canvas.addEventListener('mousedown', this.#startDrawing.bind(this))
    this.#canvas.addEventListener('touchstart', this.#startDrawing.bind(this))

    this.#canvas.addEventListener('mousemove', this.#draw.bind(this))
    this.#canvas.addEventListener('touchmove', this.#draw.bind(this))

    this.#canvas.addEventListener('mouseup', this.#stopDrawing.bind(this))
    this.#canvas.addEventListener('touchend', this.#stopDrawing.bind(this))

    this.#select('#clear')?.addEventListener('click', this.clear)

    window.addEventListener('keydown', (e) => {
      // for undo with ctrl+z
      if (e.ctrlKey && e.key === 'z') {
        this.undo()
      }

      // for redo with ctrl+y
      if (e.ctrlKey && e.key === 'y') {
        this.redo()
      }

      // for download with ctrl+s
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault()
        this.download()
      }

      // for clear with ctrl+d
      if (e.ctrlKey && e.key === 'd') {
        e.preventDefault()
        this.clear()
      }

    })
  }

  #select = selector => document.querySelector(selector)

  resizeCanvas() {
    const ratio = Math.max(window.devicePixelRatio || 1, 1);
    this.#canvas.width = this.#canvas.offsetWidth * ratio;
    this.#canvas.height = this.#canvas.offsetHeight * ratio;
    this.ratio = ratio
  }

  #setCanvasBackground() {
    // setting whole canvas background to white, so the downloaded img background will be white
    this.#ctx.fillStyle = "#fff";
    this.#ctx.fillRect(0, 0, this.#canvas.width, this.#canvas.height);
    this.#ctx.fillStyle = this.#backgroundColor; // setting fillstyle back to the selectedColor, it'll be the brush color
  }

  #draw(e) {
    if (!this.#isDrawing) return

    const x = e.offsetX
    const y = e.offsetY

    // Line tool: restore snapshot and show straight preview
    if (this.toolType === 'line') {
      this.#ctx.putImageData(this.#snapShot, 0, 0)
      this.#ctx.beginPath()
      this.#ctx.moveTo(this.#prevMouseX, this.#prevMouseY)
      this.#ctx.lineTo(x, y)
      this.#ctx.stroke()
      return
    }

    this.#ctx.strokeStyle = this.toolType === 'brush' ? this.#penColor : this.#backgroundColor

    // Apply EMA smoothing to input: smoothingLevel 0 = raw, 1 = heavily smoothed
    let sx = x, sy = y
    if (this.#smoothingLevel > 0 && this.#currentPoints.length > 0) {
      const prev = this.#currentPoints[this.#currentPoints.length - 1]
      const t = 1 - this.#smoothingLevel * 0.9
      sx = prev.x + (x - prev.x) * t
      sy = prev.y + (y - prev.y) * t
    }
    this.#currentPoints.push({ x: sx, y: sy })

    const pts = this.#currentPoints
    const len = pts.length

    if (len < 2) return

    this.#ctx.beginPath()

    if (this.#smoothingLevel > 0 && len === 2) {
      // First segment: draw only to the midpoint so bezier can start cleanly
      const midX = (pts[0].x + pts[1].x) / 2
      const midY = (pts[0].y + pts[1].y) / 2
      this.#ctx.moveTo(pts[0].x, pts[0].y)
      this.#ctx.lineTo(midX, midY)
    } else if (this.#smoothingLevel === 0 || len < 3) {
      // No smoothing: straight line segment
      this.#ctx.moveTo(pts[len - 2].x, pts[len - 2].y)
      this.#ctx.lineTo(pts[len - 1].x, pts[len - 1].y)
    } else {
      // Smooth: quadratic bezier from midpoint to midpoint, raw point as control
      const p0 = pts[len - 3]
      const p1 = pts[len - 2]
      const p2 = pts[len - 1]
      const startX = (p0.x + p1.x) / 2
      const startY = (p0.y + p1.y) / 2
      const endX = (p1.x + p2.x) / 2
      const endY = (p1.y + p2.y) / 2
      this.#ctx.moveTo(startX, startY)
      this.#ctx.quadraticCurveTo(p1.x, p1.y, endX, endY)
    }

    this.#ctx.stroke()
  }

  #stopDrawing() {
    if (this.#isDrawing && this.toolType !== 'line') {
      const pts = this.#currentPoints
      if (pts.length === 1) {
        // Single click with no drag: draw a dot
        const pt = pts[0]
        this.#ctx.beginPath()
        this.#ctx.arc(pt.x, pt.y, this.#penSize / 2, 0, Math.PI * 2)
        this.#ctx.fillStyle = this.toolType === 'brush' ? this.#penColor : this.#backgroundColor
        this.#ctx.fill()
      } else if (pts.length >= 2 && this.#smoothingLevel > 0) {
        // Close the gap from the last drawn midpoint to the actual last point
        const last = pts[pts.length - 1]
        const prev = pts[pts.length - 2]
        const midX = (prev.x + last.x) / 2
        const midY = (prev.y + last.y) / 2
        this.#ctx.beginPath()
        this.#ctx.moveTo(midX, midY)
        this.#ctx.lineTo(last.x, last.y)
        this.#ctx.stroke()
      }
    }
    this.#isDrawing = false
    this.#ctx.beginPath()
    this.#storePaths()
  }

  #startDrawing(e) {
    this.#isDrawing = true
    // set line color
    this.#ctx.strokeStyle = this.#penColor
    // set line cap
    this.#ctx.lineCap = this.#penType
    // line join
    this.#ctx.lineJoin = 'round'
    // set line opacity
    this.#ctx.globalAlpha = this.#penOpacity
    // set line flow
    this.#ctx.globalCompositeOperation = this.#penFlow
    // set line hardness
    this.#ctx.miterLimit = this.#penHardness

    // set previous mouse position
    this.#prevMouseX = e.offsetX
    this.#prevMouseY = e.offsetY

    // set line width
    this.#ctx.lineWidth = this.#penSize

    // set line color
    this.#ctx.strokeStyle = this.#penColor
    this.#ctx.fillStyle = this.#backgroundColor

    this.#snapShot = this.#ctx.getImageData(0, 0, this.#canvas.width, this.#canvas.height)
    this.#currentPoints = []
    this.#ctx.beginPath()

    this.#draw(e)
  }

  #storePaths() {
    this.#pathArr.push(this.#ctx.getImageData(0, 0, this.#canvas.width, this.#canvas.height))
    this.#countIndex += 1
  }

  clear() {
    if (this.#pathArr.length === 0) return
    this.#ctx.clearRect(0, 0, this.#canvas.width, this.#canvas.height)
    this.#setCanvasBackground()
    this.#pathArr = []
    this.#countIndex = -1
    this.#currentPoints = []
  }

  undo() {
    if (this.#countIndex <= 0) {
      this.clear()
      return
    }
    this.#countIndex -= 1
    // this.#pathArr.pop()
    this.#ctx.putImageData(this.#pathArr[this.#countIndex], 0, 0)
  }

  redo() {
    if (this.#countIndex >= this.#pathArr.length - 1) {
      return
    }
    this.#countIndex += 1
    this.#ctx.putImageData(this.#pathArr[this.#countIndex], 0, 0)
  }

  setToolType(toolType) {
    this.toolType = toolType
  }

  setPenSize(size) {
    this.#penSize = size
  }

  setPenColor(color) {
    this.#penColor = color
  }

  setPenType(type) {
    this.#penType = type
  }

  setPenOpacity(opacity) {
    this.#penOpacity = opacity
  }

  setPenFlow(flow) {
    this.#penFlow = flow
  }

  setPenHardness(hardness) {
    this.#penHardness = hardness
  }

  setBackgroundColor(color) {
    this.#backgroundColor = color
  }

  setImageFormat(imageFormat) {
    this.#imageFormat = imageFormat
  }

  setSmoothingLevel(level) {
    this.#smoothingLevel = Math.max(0, Math.min(1, level))
  }

  getSmoothingLevel() {
    return this.#smoothingLevel
  }

  getImageString() {
    return this.#canvas.toDataURL(this.#imageFormat)
  }

  download(filename) {
    const data = this.getImageString()
    const blob = this.#dataURLToBlob(data)
    const url = window.URL.createObjectURL(blob)

    const a = document.createElement("a");
    a.style = "display: none";
    a.download = Date.now() + '.' + this.#imageFormats[this.#imageFormat]; // passing current date as link download value
    a.href = url
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
  }

  #dataURLToBlob(dataURL) {
    const parts = dataURL.split(';base64,');
    const contentType = parts[0].split(":")[1];
    const raw = window.atob(parts[1]);
    const rawLength = raw.length;
    const uInt8Array = new Uint8Array(rawLength);

    for (let i = 0; i < rawLength; ++i) {
      uInt8Array[i] = raw.charCodeAt(i);
    }

    return new Blob([uInt8Array], { type: contentType });
  }

  #download(dataURL, filename) {
    const blob = dataURLToBlob(dataURL);
    const url = window.URL.createObjectURL(blob);

    imageUrl.href = url
    imageUrl.innerText = filename

    const a = document.createElement("a");
    a.style = "display: none";
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
  }

  destroy() {
    this.#canvas = null
    this.#isDrawing = null
    this.#ctx = null
  }

  // events
  addEventListener(event, callback) {
    this.#canvas.addEventListener(event, callback)
  }

  getCanvasData() {
    return this.#canvas.toDataURL(this.#imageFormat)
  }
}
