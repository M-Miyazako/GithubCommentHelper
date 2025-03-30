// Chromeのi18n APIを使用して多言語対応を実装

document.addEventListener('DOMContentLoaded', () => {
    const imageWidthInput = document.getElementById('imageWidth');
    const videoWidthInput = document.getElementById('videoWidth');
    const saveButton = document.getElementById('saveButton');

    // i18nによるテキストの設定
    document.getElementById('pageTitle').textContent = chrome.i18n.getMessage('optionsTitle');
    document.getElementById('optionsHeader').textContent = chrome.i18n.getMessage('optionsHeader');
    document.getElementById('imageWidthLabel').textContent = chrome.i18n.getMessage('imageWidthLabel');
    document.getElementById('videoWidthLabel').textContent = chrome.i18n.getMessage('videoWidthLabel');
    document.getElementById('saveButton').textContent = chrome.i18n.getMessage('saveButton');

    // ストレージから設定を読み込む
    chrome.storage.sync.get(['imageWidth', 'videoWidth'], (result) => {
        if (result.imageWidth !== undefined) {
            imageWidthInput.value = result.imageWidth;
        }
        if (result.videoWidth !== undefined) {
            videoWidthInput.value = result.videoWidth;
        }
    });

    // 保存ボタンがクリックされたときの処理
    saveButton.addEventListener('click', () => {
        // 入力値を取得
        let imageWidthValue = parseInt(imageWidthInput.value, 10);
        let videoWidthValue = parseInt(videoWidthInput.value, 10);
        
        // 保存するデータのオブジェクトを作成
        const dataToSave = {};
        
        // 削除するキーの配列
        const keysToRemove = [];
        
        // 数値変換に成功し、値が0より大きい場合のみ保存する
        // それ以外の場合はキーを削除リストに追加
        if (!isNaN(imageWidthValue) && imageWidthValue > 0) {
            dataToSave.imageWidth = imageWidthValue;
        } else {
            keysToRemove.push('imageWidth');
        }
        
        if (!isNaN(videoWidthValue) && videoWidthValue > 0) {
            dataToSave.videoWidth = videoWidthValue;
        } else {
            keysToRemove.push('videoWidth');
        }
        
        // 保存完了メッセージを表示（非同期処理の完了後に表示）
        Promise.all([
            Object.keys(dataToSave).length > 0 ? new Promise(resolve => chrome.storage.sync.set(dataToSave, resolve)) : Promise.resolve(),
            keysToRemove.length > 0 ? new Promise(resolve => chrome.storage.sync.remove(keysToRemove, resolve)) : Promise.resolve()
        ]).then(() => {
            alert(chrome.i18n.getMessage('savedMessage'));
        });
    });
});