// Insert some js into the page to watch for in-page title changes (i.e. Google Mail)

let titleChangedByMe = false;
let observer;

// Set up a new observer
observer = new window.WebKitMutationObserver(function (mutations) {
  if (titleChangedByMe === true) {
    titleChangedByMe = false;
  } else {
    mutations.forEach(() => {
      chrome.runtime.sendMessage({ msg: 'title-changed' });
      titleChangedByMe = true;
    });
  }
});

// Register the observer
if (document.querySelector('head > title') !== null) {
  observer.observe(document.querySelector('head > title'), {
    subtree: true,
    characterresponse: true,
    childList: true,
  });
}
