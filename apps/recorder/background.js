function injectLogger() {

  if (window.recorderInjected) {
    console.log('already injected');
    return;
  } else {
    console.log('injected');
    window.recorderInjected = true;
  }
  chrome.storage.local.set({ log: [], status: "stop" });
  let startTime = Date.now();
  let log = [];
  let recording = false;

  chrome.storage.onChanged.addListener(({ status }) => {
    switch (status?.newValue) {
      case "start":
        startTime = Date.now();
        recording = true;
        log = [];
        break;
      case "stop":
        recording = false;
        chrome.storage.local.set({ log, devicePixelRatio });
        break;
    }
  });

  // on mousemove update div contents to reflect mouse coords
  document.onmousemove = function (e) {
    if (recording) {
      log.push({
        x: e.clientX,
        y: e.clientY,
        time: Date.now() - startTime,
        type: "mousemove",
      });
    }
  };

  document.onmousedown = function (e) {
    if (recording) {
      log.push({
        x: e.clientX,
        y: e.clientY,
        time: Date.now() - startTime,
        type: "mousedown",
      });
    }
  };

  document.onmouseup = function (e) {
    if (recording) {
      log.push({
        x: e.clientX,
        y: e.clientY,
        time: Date.now() - startTime,
        type: "mouseup",
      });
    }
  };

  document.onclick = function (e) {
    if (recording) {
      log.push({
        x: e.clientX,
        y: e.clientY,
        time: Date.now() - startTime,
        type: "click",
      });
    }
  };

  document.onkeydown = function (e) {
    if (recording) {
      log.push({
        x: e.clientX,
        y: e.clientY,
        time: Date.now() - startTime,
        type: "keydown",
        payload: {
          key: e.key,
          code: e.code,
        },
      });
    }
  };

  document.onkeyup = function (e) {
    if (recording) {
      log.push({
        x: e.clientX,
        y: e.clientY,
        time: Date.now() - startTime,
        type: "keyup",
        payload: {
          key: e.key,
          code: e.code,
        },
      });
    }
  };

  document.onwheel = function (e) {
    if (recording) {
      log.push({
        x: e.clientX,
        y: e.clientY,
        time: Date.now() - startTime,
        type: "wheel",
        payload: {
          deltaX: e.deltaX,
          deltaY: e.deltaY,
          deltaZ: e.deltaZ,
        },
      });
    }
  };
}


chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
  console.log('running');
  console.log(changeInfo);
  if (changeInfo.status == "complete") {
    if (tab.url.startsWith("http://localhost") || tab.url.startsWith("https://weekly.mathchops.com")) {
      chrome.scripting.executeScript({
        target: { tabId },
        function: injectLogger,
      });
    }
  }
});
