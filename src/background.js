const DefaultWindowTitle = "A";

function setTitle(id, title) {
	chrome.tabs.executeScript(
		id,
		{ code: `document.title = '${title}';` },
		_ => chrome.runtime.lastError /* "check" error */
	);
}

chrome.runtime.onInstalled.addListener(function () {
	chrome.windows.getAll({ populate: true }, function (windows) {
		let state = {};

		let tabs = [];
		windows.map(w => tabs.push(...w.tabs));

		tabs.forEach(t => {
			if (t.active) {
				state[t.windowId] = {
					id: t.id,
					title: t.title,
					windowTitle: DefaultWindowTitle
				};
				setTitle(t.id, "ACTIVE: " + t.title);
			}
		});

		chrome.storage.local.set(state);
	});
});

chrome.tabs.onActivated.addListener(info => {
	chrome.storage.local.get(null, state => {
		let windowState = state[info.windowId];
		if (windowState) {
			// Reset the window title back to the original.
			setTitle(windowState.id, windowState.title);
		}

		chrome.tabs.get(info.tabId, tab => {
			// Save the current title.
			state[info.windowId] = {
				id: info.tabId,
				title: tab.title,
				windowTitle: windowState ? windowState.windowTitle : DefaultWindowTitle
			};
			let wTitle = state[info.windowId].windowTitle;

			setTitle(
				info.tabId,
				(wTitle.length > 0 ? wTitle + ": " : "") + tab.title
			);
			// Save the new state
			chrome.storage.local.set(state);
		});
	});
});

chrome.storage.onChanged.addListener((changes, namespace) => {
	console.log("storage changed", changes, namespace);
});
