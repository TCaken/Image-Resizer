const { ipcRenderer } = require("electron")

const imgInput = document.getElementById("img")
const heightInput = document.getElementById("height")
const widthInput = document.getElementById("width")
const filename = document.getElementById("filename")
const outputPath = document.getElementById("output-path")
const form = document.querySelector("#img-form")

console.log(versions.node())

function loadImage(e){
  const file = e.target.files[0];

  if(!isFileImage(file)){
    alertError("Please enter an image!")
    return ;
  }

  const image = new Image()
  image.src = URL.createObjectURL(file)
  image.onload = function(){
    widthInput.value = this.width,
    heightInput.value = this.height
  }

  form.style.display = 'block'
  filename.innerText = file.name
  outputPath.innerText = path.join(os.homedir(), "imageresizer")

  alertSuccess("Image successfully read!")
}

// Send email to resize
function sendImage(e){
  e.preventDefault();

  const width = widthInput.value;
  const height = heightInput.value;
  const imgPath = imgInput.files[0].path

  if(!imgInput.files[0]){
    alertError("Pleae upload an image");
    return ;
  }

  if(width === '' || height === ''){
    alertError("Please fill in width and height");
    return ;
  }

  //Send to main ipc renderer
  ipcRenderer.send('image:resize', {
    imgPath,
    width,
    height
  })

}

// Catch the image:done event from main channel
ipcRenderer.on("image:done", () => {
  alertSuccess(`Image resized to $(widthInput.value) x $(heightInput.value)`)
})


//Check file type is image
function isFileImage(file){
  const acceptedImageTypes = ['image/gif', 'image/png', 'image/jpeg'];

  return file && acceptedImageTypes.includes(file['type'])
}

//Alert error with toastify.js
function alertError(message){
  Toastify.toast({
    text : message,
    duration : 10000,
    close : false,
    style : {
      background : 'red',
      color : 'white',
      textAlign : 'center'
    }
  })
}

function alertSuccess(message){
  Toastify.toast({
    text : message,
    duration : 10000,
    close : false,
    style : {
      background : 'darkgreen',
      color : 'white',
      textAlign : 'center'
    }
  })
}

imgInput.addEventListener("change", loadImage)
form.addEventListener("submit", sendImage)