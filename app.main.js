
const canvasSelect = document.querySelector('#canvas')

canvas = new DrawFreehand.Freehand(canvasSelect, {
  penSize: 3,
  penColor: '#000000',
  penType: 'round',
  penOpacity: 1,
  penFlow: 1,
  penHardness: 1,
  backgroundColor: '#0e11df',
  toolType: 'brush',
  imageFormat: 'image/png',
})

const tools = document.querySelectorAll('.tool')
console.log(tools)
tools.forEach(tool => {
  tool.addEventListener('click', (e) => {
    toolChange(tool.id)
    console.log(tool.id)
    tools.forEach(tool => tool.classList.remove('active'))
    tool.classList.add('active')
  })
})

function toolChange(tool) {
  switch (tool) {
    case 'brush':
      canvas.toolType = 'brush'
      break;
    case 'eraser':
      canvas.toolType = 'eraser'
      break;
    case 'line':
      canvas.toolType = 'line'
      break;
    case 'redo':
      canvas.redo()
      break;
    case 'undo':
      canvas.undo()
      break;
    case 'clear':
      canvas.clear()
      break;
    default:
      console.log('tool not found')
      break;
  }
}

const penColor = document.querySelector('#pen-color')
const backgroundColor = document.querySelector('#background-color')
const penSize = document.querySelector('#pen-size')
const penOpacity = document.querySelector('#pen-opacity')

penColor.addEventListener('change', (e) => {
  canvas.setPenColor(e.target.value)
})

backgroundColor.addEventListener('change', (e) => {
  canvas.setBackgroundColor(e.target.value)
})

penSize.addEventListener('change', (e) => {
  canvas.setPenSize(e.target.value)
})

penOpacity.addEventListener('change', (e) => {
  canvas.setPenOpacity(e.target.value)
})


// for custom event
// canvas.addEventListener('mouseup', (e) => {

//   console.log(canvas.download())
// })



document.addEventListener("contextmenu", (event) => {
  event.preventDefault();
  alert("Sorry prevent default off.")
});
