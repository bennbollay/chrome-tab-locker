console.log("Script loaded");
let input = document.getElementById("window-title");
input.addEventListener("keyup", function (e) {
  if (e.keyCode === 13) {
    console.log("Input Enter Press");
    chrome.storage.local.get(null, s => {
      chrome.tabs.query({ active: true, currentWindow: true }, t => {
        s[t[0].windowId].windowTitle = input.value;
        chrome.storage.local.set(s);
      });
    });
  }
});
