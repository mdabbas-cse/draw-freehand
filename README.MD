#Freehand

## Description
This is a simple drawing app that allows you to draw on a canvas with your mouse. You can change the color of the pen, the size of the pen, and the background color of the canvas. You can also save your drawing as a png file.


## Installation
To install this app, simply clone this repository and open the index.html file in your browser.

## Usage
To use this app, simply open the index.html file in your browser. You can then draw on the canvas with your mouse. You can change the color of the pen, the size of the pen, and the background color of the canvas. You can also save your drawing as a png file.

## Features
- Change the color of the pen
- Change the size of the pen
- Change the background color of the canvas
- Change the type of pen (round or square)
- Change the opacity of the pen
- Change the flow of the pen
- Change the hardness of the pen
- Change the tool type (brush, eraser & line)
- Download your drawing as a png, jpg and svg file
- Get the base64 of your drawing

### API

```
const canvasSelect = document.querySelector('canvas')

canvas = new Freehand(canvasSelect, {
  penSize: 3,
  penColor: '#000000',
  penType: 'round',
  penOpacity: 1,
  penFlow: 1,
  penHardness: 1,
  backgroundColor: '#0e11df',
  toolType: 'brush',
})

// clear canvas
document.querySelector('#clear').addEventListener('click', () => {
  canvas.clear()
})


// for custom event
canvas.addEventListener('mouseup', (e) => {
  console.log(canvas.download())
})

```

## options 

| option | type | default | description |
| --- | --- | --- | --- |
| penSize | number | 3 | pen size |
| penColor | string | '#000000' | pen color |
| penType | string | 'round' | pen type |
| penOpacity | number | 1 | pen opacity |
| penFlow | number | 1 | pen flow |
| penHardness | number | 1 | pen hardness |
| backgroundColor | string | '#ffffff' | background color |
| toolType | string | 'brush' | tool type |

## methods

| method | description |
| --- | --- |
| clear | clear canvas |
| download | download canvas as png file |
| undo | for undo |
| redo | for redo |
| addEventListener | for custom event |
| removeEventListener | for custom event |
| dispatchEvent | for custom event |
| destroy | destroy canvas |
| setPenSize | set pen size |
| setPenColor | set pen color |
| setPenType | set pen type |
| setPenOpacity | set pen opacity |
| setPenFlow | set pen flow |
| setPenHardness | set pen hardness |
| setBackgroundColor | set background color |
| setToolType | set tool type |
| getCanvasData | get base64 of canvas |


## Keyboard Shortcuts
****
| key | description |
| --- | --- |
| `ctrl + z` | Undo |
| `ctrl + y` | Redo |
| `ctrl + s` | Download file |
| `ctrl + d` | Clear canvas |



