chrome.action.onClicked.addListener((tab) => {
    if (tab && tab.id) {
        chrome.tabs.sendMessage(tab.id, { action: "replaceMedia" }).catch((error) => {
            console.error("メッセージ送信に失敗しました:", error);
        });
    } else {
        console.error("タブが存在しません");
    }
});

const createProperties = {
    id: "replaceMedia",
    title: "選択したテキストをHTMLタグに置換",
    contexts: ["selection"]
  };
const regex = /https:\/\/github\.com\/.*/;

chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create(createProperties);
  });

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if(tab && tab.active) {
        if(tab.url.match(regex)) {
            chrome.contextMenus.create(createProperties, () => chrome.runtime.lastError);
        } else {
            chrome.contextMenus.remove("replaceMedia", () => chrome.runtime.lastError);
        }
    }
});

chrome.tabs.onActivated.addListener((info) => {
    chrome.tabs.get(info.tabId, (tab) => {
        if(tab.url.match(regex)) {
            chrome.contextMenus.create(createProperties, () => chrome.runtime.lastError);
        } else {
            chrome.contextMenus.remove("replaceMedia", () => chrome.runtime.lastError);
        }
    });
});

chrome.windows.onFocusChanged.addListener((info) => {
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
        if(tabs[0].url.match(regex)) {
            chrome.contextMenus.create(createProperties, () => chrome.runtime.lastError);
        } else {
            chrome.contextMenus.remove("replaceMedia", () => chrome.runtime.lastError);
        }
    });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
if (info.menuItemId === "replaceMedia" && info.selectionText) {
    chrome.tabs.sendMessage(tab.id, { action: "replaceSelectedText", selectionText: info.selectionText }).catch((error) => {
        console.error("メッセージ送信に失敗しました:", error);
    });
}
});