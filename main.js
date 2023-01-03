const { app, BrowserWindow, ipcMain, screen, systemPreferences } = require("electron")
const { desktopCapturer } = require("electron")
const os = require("os");

let videoWindow;
let captureWindow;
let indicatorWindow;
let oldWidth;
let oldHeight;
let oldX;
let oldY;

function createWindow() {
	videoWindow = new BrowserWindow({
		title: "Floom Video",
		width: 200,
		height: 200,
		transparent: true,
		frame: false,
		skipTaskbar: true,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
        }
	});
	videoWindow.setAlwaysOnTop(true, "pop-up-menu");
	videoWindow.loadFile("video.html");

	indicatorWindow = new BrowserWindow({
		title: "",
		skipTaskbar: true,
		show: false,
		width: 800,
		height: 600,
		transparent: true,
		roundedCorners: false,
		frame: false,
		hasShadow: false,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
        }
	});
	indicatorWindow.setAlwaysOnTop(true, "status");
	indicatorWindow.loadFile("indicator.html");
	indicatorWindow.setIgnoreMouseEvents(true);

	captureWindow = new BrowserWindow({
		title: "Floom Capture",
		width: 800,
		height: 600,
		transparent: true,
		frame: false,
		roundedCorners: false,
		hasShadow: false,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
        }
	});

	captureWindow.setAlwaysOnTop(true, "status");
	captureWindow.loadFile("capture.html");
	captureWindow.show();

	videoWindow.setPosition(captureWindow.getPosition()[0] + 20, captureWindow.getPosition()[1] + 400);
	videoWindow.show();

	ipcMain.on("quit", function() {
		app.exit(0);
	});

	console.log("setting up hooks");
	ipcMain.on("changeVideo", function(event, sourceId) {
		videoWindow.webContents.send("device", sourceId);
	});
	ipcMain.on("startRecording", function() {
		oldWidth = captureWindow.getSize()[0];
		oldHeight = captureWindow.getSize()[1];
		oldX = captureWindow.getPosition()[0];
		oldY = captureWindow.getPosition()[1];

		const primaryDisplay = screen.getPrimaryDisplay()
		const size = primaryDisplay.workAreaSize

		indicatorWindow.setSize(oldWidth + 20, oldHeight+20);
		indicatorWindow.setPosition(oldX - 10, oldY - 10);
		indicatorWindow.show();

		captureWindow.setSize(200,40);
		captureWindow.setPosition(size.width - 200, 40);
		setTimeout(() => {
			captureWindow.setAlwaysOnTop(true, "status");
		}, 1000);
		setTimeout(() => {
			indicatorWindow.setAlwaysOnTop(true, "status");
		}, 1000);
	});

	ipcMain.on("stopRecording", function() {
		indicatorWindow.hide();
		captureWindow.setSize(oldWidth,oldHeight);
		captureWindow.setPosition(oldX, oldY);
		setTimeout(() => {
			captureWindow.setAlwaysOnTop(true, "status");
		}, 1000);
	});

	if (os.platform() === "darwin") {
		systemPreferences.askForMediaAccess("camera");
		systemPreferences.askForMediaAccess("microphone");
	}

	captureWindow.webContents.on("did-finish-load", function() {
		console.log("Trying to get screen stream");
		desktopCapturer.getSources({ types: ["screen"] }).then(async sources => {
		  for (const source of sources) {
			console.log("Sending screen stream");
			captureWindow.webContents.send("SET_SOURCE", source.id)
			break;
		  }
		})
	});
}

app.whenReady().then(() => {
  createWindow()
  
  app.on("activate", function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on("window-all-closed", function () {
  app.quit()
})
