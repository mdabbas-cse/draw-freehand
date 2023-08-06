!function(t,e){"object"==typeof exports&&"undefined"!=typeof module?e(exports):"function"==typeof define&&define.amd?define(["exports"],e):e((t="undefined"!=typeof globalThis?globalThis:t||self).DrawFreehand={})}(this,(function(t){"use strict";t.Freehand=class{#t=null;#e=!1;#s=null;#i=null;#n=null;#a=null;#o=null;#h=null;#r=null;#l=null;#c=null;#d=null;#p=null;#u=null;toolType=null;ratio=null;#g={"image/png":"png","image/jpeg":"jpg"};#v=[];#w;constructor(t,e={}){try{this.#t="string"==typeof t?this.#y(t):t}catch(t){}this.#t.style.cursor="url('./img/pen.ico'), crosshair",this.#m(e),this.init()}#m(t){this.#s=t?.penSize||3,this.#i=t?.penColor||"#000000",this.#n=t?.penType||"round",this.#a=t?.penOpacity||1,this.#o=t?.penFlow||1,this.#h=t?.penHardness||1,this.#r=t?.backgroundColor||"#ffffff",this.toolType=t?.toolType||"brush",this.#l=t?.imageFormat||"image/png"}init(){this.#d=0,this.#p=0,this.#w=-1,this.#e=!1,window.addEventListener("resize",this.resizeCanvas.bind(this)),window.addEventListener("load",this.resizeCanvas.bind(this)),this.#u=this.#t.getContext("2d",{willReadFrequently:!0}),this.#u.scale(this.ratio,this.ratio),this.#x(),this.#u.fillStyle=this.#i,this.#t.addEventListener("mousedown",this.#f.bind(this)),this.#t.addEventListener("touchstart",this.#f.bind(this)),this.#t.addEventListener("mousemove",this.#b.bind(this)),this.#t.addEventListener("touchmove",this.#b.bind(this)),this.#t.addEventListener("mouseup",this.#C.bind(this)),this.#t.addEventListener("touchend",this.#C.bind(this)),this.#y("#clear")?.addEventListener("click",this.clear),window.addEventListener("keydown",(t=>{t.ctrlKey&&"z"===t.key&&this.undo(),t.ctrlKey&&"y"===t.key&&this.redo(),t.ctrlKey&&"s"===t.key&&(t.preventDefault(),this.download()),t.ctrlKey&&"d"===t.key&&(t.preventDefault(),this.clear())}))}#y=t=>document.querySelector(t);resizeCanvas(){const t=Math.max(window.devicePixelRatio||1,1);this.#t.width=this.#t.offsetWidth*t,this.#t.height=this.#t.offsetHeight*t,this.ratio=t}#x(){this.#u.fillStyle="#fff",this.#u.fillRect(0,0,this.#t.width,this.#t.height),this.#u.fillStyle=this.#r}#b(t){if(!this.#e)return;this.#u.putImageData(this.#c,0,0);const{offsetX:e,offsetY:s}=t;this.#u.strokeStyle="brush"===this.toolType?this.#i:this.#r,this.#u.lineTo(e,s),this.#u.stroke(),this.#u.moveTo(e,s),"line"===this.toolType&&(this.#u.beginPath(),this.#u.moveTo(this.#d,this.#p),this.#u.lineTo(e,s),this.#u.stroke())}#C(){this.#e=!1,this.#u.beginPath(),this.#k()}#f(t){this.#e=!0,this.#u.strokeStyle=this.#i,this.#u.lineCap=this.#n,this.#u.lineJoin="round",this.#u.globalAlpha=this.#a,this.#u.globalCompositeOperation=this.#o,this.#u.miterLimit=this.#h,this.#d=t.offsetX,this.#p=t.offsetY,this.#u.lineWidth=this.#s,this.#u.strokeStyle=this.#i,this.#u.fillStyle=this.#r,this.#c=this.#u.getImageData(0,0,this.#t.width,this.#t.height),this.#u.beginPath(),this.#b(t)}#k(){this.#v.push(this.#u.getImageData(0,0,this.#t.width,this.#t.height)),this.#w+=1}clear(){0!==this.#v.length&&(this.#u.clearRect(0,0,this.#t.width,this.#t.height),this.#x(),this.#v=[],this.#w=-1)}undo(){this.#w<=0?this.clear():(this.#w-=1,this.#u.putImageData(this.#v[this.#w],0,0))}redo(){this.#w>=this.#v.length-1||(this.#w+=1,this.#u.putImageData(this.#v[this.#w],0,0))}setToolType(t){this.toolType=t}setPenSize(t){this.#s=t}setPenColor(t){this.#i=t}setPenType(t){this.#n=t}setPenOpacity(t){this.#a=t}setPenFlow(t){this.#o=t}setPenHardness(t){this.#h=t}setBackgroundColor(t){this.#r=t}setImageFormat(t){this.#l=t}getImageString(){return this.#t.toDataURL(this.#l)}download(t){const e=this.getImageString(),s=this.#D(e),i=window.URL.createObjectURL(s),n=document.createElement("a");n.style="display: none",n.download=Date.now()+"."+this.#g[this.#l],n.href=i,document.body.appendChild(n),n.click(),window.URL.revokeObjectURL(i)}#D(t){const e=t.split(";base64,"),s=e[0].split(":")[1],i=window.atob(e[1]),n=i.length,a=new Uint8Array(n);for(let t=0;t<n;++t)a[t]=i.charCodeAt(t);return new Blob([a],{type:s})}#L(t,e){const s=dataURLToBlob(t),i=window.URL.createObjectURL(s);imageUrl.href=i,imageUrl.innerText=e;const n=document.createElement("a");n.style="display: none",n.href=i,n.download=e,document.body.appendChild(n),n.click(),window.URL.revokeObjectURL(i)}destroy(){this.#t=null,this.#e=null,this.#u=null}addEventListener(t,e){this.#t.addEventListener(t,e)}getCanvasData(){return this.#t.toDataURL(this.#l)}}}));
//# sourceMappingURL=draw-freehand.umd.js.map
