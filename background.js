// Chromeのi18n APIを使用して多言語対応を実装



// コンテキストメニューのタイトルを更新する関数
async function updateContextMenuTitles() {
    // 既存のメニューを削除
    chrome.contextMenus.removeAll();
    
    // 新しいメニューを作成
    chrome.contextMenus.create({
        id: "replaceMedia",
        title: chrome.i18n.getMessage('replaceMediaTitle'),
        contexts: ["selection"]
    });
    
    chrome.contextMenus.create({
        id: "convertToTable",
        title: chrome.i18n.getMessage('convertToTableTitle'),
        contexts: ["selection"]
    });
}

chrome.action.onClicked.addListener((tab) => {
    if (tab && tab.id) {
        chrome.tabs.sendMessage(tab.id, { action: "replaceMedia" }).catch((error) => {
            console.error("メッセージ送信に失敗しました:", error);
        });
    } else {
        console.error("タブが存在しません");
    }
});

// コンテキストメニューのプロパティ
const replaceMediaProperties = {
    id: "replaceMedia",
    title: chrome.i18n.getMessage('replaceMediaTitle'),
    contexts: ["selection"]
};

const convertToTableProperties = {
    id: "convertToTable",
    title: chrome.i18n.getMessage('convertToTableTitle'),
    contexts: ["selection"]
};

const regex = /https:\/\/github\.com\/.*/;

// 拡張機能インストール時の処理
chrome.runtime.onInstalled.addListener(() => {
    updateContextMenuTitles();
});



chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if(tab && tab.active) {
        if(tab.url.match(regex)) {
            updateContextMenuTitles();
        } else {
            chrome.contextMenus.removeAll(() => chrome.runtime.lastError);
        }
    }
});

chrome.tabs.onActivated.addListener((info) => {
    chrome.tabs.get(info.tabId, (tab) => {
        if(tab.url.match(regex)) {
            updateContextMenuTitles();
        } else {
            chrome.contextMenus.removeAll(() => chrome.runtime.lastError);
        }
    });
});

chrome.windows.onFocusChanged.addListener((info) => {
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
        if(tabs[0].url.match(regex)) {
            updateContextMenuTitles();
        } else {
            chrome.contextMenus.removeAll(() => chrome.runtime.lastError);
        }
    });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === "replaceMedia" && info.selectionText) {
        chrome.tabs.sendMessage(tab.id, { action: "replaceSelectedText" }).catch((error) => {
            console.error("メッセージ送信に失敗しました:", error);
        });
    } else if (info.menuItemId === "convertToTable" && info.selectionText) {
        chrome.tabs.sendMessage(tab.id, { action: "convertToTable" }).catch((error) => {
            console.error("メッセージ送信に失敗しました:", error);
        });
    }
});