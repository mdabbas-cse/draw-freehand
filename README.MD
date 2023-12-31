# Draw-freehand

## Description
This is a simple drawing app that allows you to draw on a canvas with your mouse. You can change the color of the pen, the size of the pen, and the background color of the canvas. You can also save your drawing as a png file.

## Demo
Live Demo: [https://mdabbas-cse.github.io/draw-freehand/](https://mdabbas-cse.github.io/draw-freehand/)
![Demo](https://github.com/mdabbas-cse/draw-freehand/blob/main/img/draw-freehand.png "image")

## Usage
To use this app, simply open the index.html file in your browser. You can then draw on the canvas with your mouse. You can change the color of the pen, the size of the pen, and the background color of the canvas. You can also save your drawing as a png file.

## Roadmap and Features
- [x] Change the color of the pen.
- [x] Change the size of the pen.
- [x] Change the background color of the canvas.
- [x] Change the type of pen (round or square)
- [x] Change the opacity of the pen.
- [x] Change the flow of the pen.
- [x] Change the hardness of the pen.
- [x] Change the tool type (brush, eraser & line).
- [x] Download your drawing as a **JPG**, **PNG**, and **SVG** image format.
- [x] Get the base64 of your drawing.

## Basic Installation

```
const canvasSelect = document.querySelector('canvas')

const canvas = new DrawFreehand.Freehand(canvasSelect, {
  penSize: 3,
  penColor: '#000000',
  penType: 'round',
  penOpacity: 1,
  penFlow: 1,
  penHardness: 1,
  backgroundColor: '#0e11df',
  toolType: 'brush',
})
// all options are default value, you can change it.

// clear canvas
document.querySelector('#clear').addEventListener('click', () => {
  canvas.clear()
})

// set pen size and color
const penColor = document.querySelector('#pen-color')
const penSize = document.querySelector('#pen-size')

penColor.addEventListener('change', (e) => {
  canvas.setPenColor(e.target.value)
})

penSize.addEventListener('change', (e) => {
  canvas.setPenSize(e.target.value)
})

```

## Options 

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| penSize | number | 3 | pen size |
| penColor | string | '#000000' | pen color |
| penType | string | 'round' | pen type |
| penOpacity | number | 1 | pen opacity |
| penFlow | number | 1 | pen flow |
| penHardness | number | 1 | pen hardness |
| backgroundColor | string | '#ffffff' | background color |
| toolType | string | 'brush' | tool type |
| imageFormat | string | image/jpg, image/png, image/svg+xml | download image format |

## API

| Method | Description |
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

| Key | Description |
| --- | --- |
| `ctrl + z` | Undo |
| `ctrl + y` | Redo |
| `ctrl + s` | Download file |
| `ctrl + d` | Clear canvas |



## Browser Support
- Chrome
- Firefox
- Microsoft Edge
  

## Author
[MD. Abbas Uddin](https://github.com/mdabbas-cse)

## Development & Contribution
Want to contribute? Great!
To fix a bug or enhance an existing module, follow these steps: 

- Fork the repo
- Create a new branch (`git checkout -b [your branch name]]`)
- Install dependencies (`npm install`)
- Add changes to reflect the changes made
- Build the project (`npm run build-rollup`)
- Commit your changes (`git commit -am 'Improve feature'`)
- Push to the branch (`git push origin [your branch name]]`)
- Pull request are very welcome.

## Current Version
 1.0.0

## Change Log
###### v-1.0.0
- Initial release

## License
MIT © [Rubel Amin](https://github.com/mdrubelamin2) | [MD. Abbas Uddin](https://github.com/mdabbas-cse)




