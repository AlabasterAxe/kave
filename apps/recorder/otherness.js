async function downloadLog() {
  const { log, devicePixelRatio } = await chrome.storage.local.get([
    "log",
    "devicePixelRatio",
  ]);
  const window = await chrome.windows.getCurrent();
  const blob = new Blob([
    JSON.stringify({
      log,
      devicePixelRatio,
      resolution: {
        x: window.width,
        y: window.height - 85,
      },
    }),
  ]);
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "mouse-events.json";
  link.click();
}

let recording = false;

chrome.storage.local.get(["status"]).then(({ status }) => {
  if (status === "start") {
    recording = true;
    recordButton.innerText = "Stop";
  }
});

const recordButton = document.getElementById("record-button");
recordButton.onclick = () => {
  if (recording) {
    chrome.storage.local.set({ status: "stop" });
    setTimeout(() => {
      downloadLog();
    }, 500);
    recordButton.innerText = "Record";
  } else {
    chrome.storage.local.set({ status: "start" });
    recordButton.innerText = "Stop";
  }
  recording = !recording;
  chrome.windows.getCurrent().then((window) => {
    chrome.windows.update(window.id, {
      height: Math.floor(Math.min(window.height, window.width * 0.5625) + 85),
      width: Math.floor(Math.min(window.width, window.height * 1.7778)),
    });
  });
};
