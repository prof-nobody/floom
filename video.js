const { ipcRenderer } = require('electron');

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
let sourceId = undefined;
let videoStream = undefined;
let sizeIndex = 0;
let sizes = [150, 200, 250, 300];
let effectIndex = 0;
let effects = ["none", "sepia", "grayscale", "invert"];
let selectedEffect = "none";

ctx.fillStyle = "black";
ctx.fillRect(0, 0, canvas.width, canvas.height);

var video = document.querySelector("#videoElement");
video.requestVideoFrameCallback(drawFrame);

ipcRenderer.on("device", async (event, id) => {
    sourceId = id;
    captureVideo();
});

ipcRenderer.on("startRecording", async(event, id) => {
    document.getElementById("controls").style.display = "none";
});

ipcRenderer.on("stopRecording", async(event, id) => {
    document.getElementById("controls").style.display = "flex";
});

document.getElementById("effect").addEventListener("click", () => {
    effectIndex = ((effectIndex + 1) % effects.length);
    selectedEffect = effects[effectIndex];
});

document.getElementById("scale").addEventListener("click", () => {
    sizeIndex = ((sizeIndex + 1) % sizes.length);
    const size = sizes[sizeIndex];
    window.resizeTo(size, size);
    canvas.style.width = (size-20)+"px";
    canvas.style.height = (size-20)+"px";
    canvas.width = size;
    canvas.height = size;
})

function captureVideo() {
    if (videoStream) {
        videoStream.getTracks().forEach(track => {
            track.stop();
        });
    }
    if (sourceId !== "none") {
        if (navigator.mediaDevices.getUserMedia) {
            navigator.mediaDevices.getUserMedia({ 
                video: { deviceId: sourceId ? { exact: sourceId } : undefined },
            })
                .then(function (stream) {
                    videoStream = stream;
                    video.srcObject = stream;
                })
                .catch(function (e) {
                    console.log("Something went wrong!");
                });
        }
    } else {
        videoStream = undefined;
    }
}

function drawFrame() {
    video.requestVideoFrameCallback(drawFrame);

    if (video.videoWidth === 0) {
        return;
    }

    const scale = canvas.height / video.videoHeight;
    const width = video.videoWidth * scale;

    ctx.save();
    if (selectedEffect === "none") {
        ctx.filter = "";
    }
    if (selectedEffect === "sepia") {
        ctx.filter = "sepia(1)";
    }
    if (selectedEffect === "grayscale") {
        ctx.filter = "grayscale(1)";
    }
    if (selectedEffect === "invert") {
        ctx.filter = "invert(1)";
    }
    ctx.drawImage(video, (canvas.width - width) / 2, 0, width, canvas.height);
    ctx.restore();
}