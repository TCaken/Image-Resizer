const { BrowserWindow, app, Menu, ipcMain, shell } = require('electron')
const fs = require('fs')
const path = require('path')
const os =  require('os')
const resizeImg = require("resize-img")

let mainWindow;

const isDev = process.env.NODE_ENV !== "production";
const isMac = process.platform === 'darwin';

function createMainWindow(){
    mainWindow = new BrowserWindow({
        title : "Image Resizer",
        width : isDev? 1000 : 500,
        height : 900,
        resizeable : isDev,
        webPreferences: {
          contextIsolation: true,
          nodeIntegration: true,
          preload: path.join(__dirname, "preload.js")
        }
    });

    mainWindow.loadFile(path.join(__dirname, "./renderer/index.html"));

     //Open up devtools if in dev
    if(isDev){
      mainWindow.webContents.openDevTools()
    }
}

//About Window
function createAboutWindow(){
  const aboutWindow = new BrowserWindow({
      title : "About Image Resizer",
      width : 300,
      height : 300,
  }); 

  aboutWindow.loadFile(path.join(__dirname, "./renderer/about.html"));
}


// App is ready
app.whenReady().then(() => {
    createMainWindow();

    // Create a menu
    const mainMenu = Menu.buildFromTemplate(menu)
    Menu.setApplicationMenu(mainMenu)

    // Remove mainWindow from memory on close
    // mainWindow.on('closed', () => (mainWindow = null))

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
          createMainWindow()
        }
      })
})

//Menu template
const menu = [
  ...(isMac? 
    [
      {
        label : app.name,
        submenu : [
          {
            label : "About",
            click : createAboutWindow
          }
        ]
      }  
    ] : []),
  {
    role : "fileMenu"
  },
  ...(!isMac? [
    {
      label : "Help",
      submenu : [
        {
          label : "About",
          click : createAboutWindow
        }
      ]
    }
  ] : []),
  ...(isDev
    ? [
        {
          label: 'Developer',
          submenu: [
            { role: 'reload' },
            { role: 'forcereload' },
            { type: 'separator' },
            { role: 'toggledevtools' },
          ],
        },
      ]
    : []),
  // {
  //   label : 'File',
  //   submenu : [
  //     {
  //       label : "Quit",
  //       click : () => app.quit(),
  //       accelerator : "CmdOrCtrl+W"
  //     }
  //   ]
  // }
]

ipcMain.on("image:resize", (e, options) => {
  options.dest = path.join(os.homedir(), "image-resizer")
  resizeImage(options)
  console.log(options)
})

async function resizeImage({imgPath, width, height, dest}){
  try{
    console.log(imgPath, width, height, dest)
    const newImage = await resizeImg(fs.readFileSync(imgPath), {
      width: +width,
      height: +height
    });

    const filename = path.basename(imgPath)

    // Create destination folder if it does not exist
    if(!fs.existsSync(dest)){
      fs.mkdirSync(dest)
    }

    // Write file to destination
    fs.writeFileSync(path.join(dest, filename), newImage);

    // Send a success message
    mainWindow.webContents.send("image:done")

    // Open the new file in shell
    shell.openPath(dest)
  }
  catch(e){
    console.log(e)
  }
}

app.on('window-all-closed', () => {
    if (! isMac) {
      app.quit()
    }
})