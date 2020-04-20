const DefaultWindowTitle = "";

// Update the title of the active tab.
function setTitle(tabId, title) {
  chrome.tabs.executeScript(
    tabId,
    { code: `document.title = '${title}';` },
    _ => chrome.runtime.lastError /* "check" error */
  );
}

function updateTitle(state, windowId, tabId, next = newTitle => {}) {
  chrome.tabs.get(tabId, tab => {
    let windowState = state[windowId];
    if (!windowState) {
      // Save the current title for the new tab.
      state[windowId] = {
        id: tabId,
        title: tab.title,
        windowTitle: windowState ? windowState.windowTitle : DefaultWindowTitle
      };
    }

    // Don't double up the prefix (easier than to deduplicate events)
    if (tab.title.startsWith(windowState ? windowState.windowTitle : DefaultWindowTitle)) {
      // Save the updated state and bail
      chrome.storage.local.set(state);
      return next(tab.title);
    }

    // Save the current title for the new tab.
    state[windowId] = {
      id: tabId,
      title: tab.title,
      windowTitle: windowState.windowTitle
    };

    // Set the new title with the leading wart
    let wTitle = windowState.windowTitle;
    let newTitle = (wTitle.length > 0 ? wTitle + ": " : "") + tab.title;
    setTitle(tabId, newTitle);

    // Save the updated state
    chrome.storage.local.set(state);
    next(newTitle);
  });
}

// Generate initial map
chrome.runtime.onInstalled.addListener(function () {
  chrome.windows.getAll({ populate: true }, function (windows) {
    let state = {};

    let tabs = [];
    windows.map(w => tabs.push(...w.tabs));

    // Save all of the currently active tabs.
    tabs.forEach(t => {
      if (t.active) {
        state[t.windowId] = {
          id: t.id,
          title: t.title,
          windowTitle: DefaultWindowTitle
        };
      }
    });

    chrome.storage.local.set(state);
  });
});

// Capture switching tabs
chrome.tabs.onActivated.addListener(info => {
  chrome.storage.local.get(null, state => {
    let windowState = state[info.windowId];
    if (windowState) {
      // Reset the window title back to the original.
      setTitle(windowState.id, windowState.title);
    }

    updateTitle(state, info.windowId, info.tabId);
  });
});

// Listen for messages from src/content.js indicating the title has changed.
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  chrome.storage.local.get(null, state => {
    if (state[sender.tab.windowId].id == sender.tab.id) {
      updateTitle(state, sender.tab.windowId, sender.tab.id, newTitle => {
        sendResponse({ newTitle });
      });
    }
  });
});

// Capture page loads or reloads
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status == "complete") {
    chrome.storage.local.get(null, state => {
      if (state[tab.windowId].id == tab.id) {
        updateTitle(state, tab.windowId, tab.id);
      }
    });
  }
});
