// Chromeのi18n APIを使用して多言語対応を実装

document.addEventListener('DOMContentLoaded', () => {
    const imageWidthInput = document.getElementById('imageWidth');
    const saveButton = document.getElementById('saveButton');

    // i18nによるテキストの設定
    document.getElementById('pageTitle').textContent = chrome.i18n.getMessage('optionsTitle');
    document.getElementById('optionsHeader').textContent = chrome.i18n.getMessage('optionsHeader');
    document.getElementById('imageWidthLabel').textContent = chrome.i18n.getMessage('imageWidthLabel');
    document.getElementById('saveButton').textContent = chrome.i18n.getMessage('saveButton');

    // ストレージから設定を読み込む
    chrome.storage.sync.get(['imageWidth'], (result) => {
        if (result.imageWidth !== undefined) {
            imageWidthInput.value = result.imageWidth;
        }
    });

    // 保存ボタンがクリックされたときの処理
    saveButton.addEventListener('click', () => {
        const imageWidthValue = parseInt(imageWidthInput.value, 10);
        
        if (!isNaN(imageWidthValue)) {
            chrome.storage.sync.set({ 
                imageWidth: imageWidthValue
            }, () => {
                alert(chrome.i18n.getMessage('savedMessage'));
            });
        } else {
            alert(chrome.i18n.getMessage('invalidNumberMessage'));
        }
    });
});