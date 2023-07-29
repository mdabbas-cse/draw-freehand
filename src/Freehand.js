
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
    this.#ctx.putImageData(this.#snapShot, 0, 0)
    const { clientX, client } = e

    this.#ctx.strokeStyle = this.toolType === 'brush' ? this.#penColor : this.#backgroundColor
    this.#ctx.lineTo(offsetX, offsetY)
    this.#ctx.stroke()
    this.#ctx.moveTo(offsetX, offsetY)

    // for straight line
    if (this.toolType === 'line') {
      this.#ctx.beginPath()
      this.#ctx.moveTo(this.#prevMouseX, this.#prevMouseY)
      this.#ctx.lineTo(offsetX, offsetY)
      this.#ctx.stroke()
    }

  }

  #stopDrawing() {
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

    // set line cap
    this.#snapShot = this.#ctx.getImageData(0, 0, this.#canvas.width, this.#canvas.height)
    // create new path
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
