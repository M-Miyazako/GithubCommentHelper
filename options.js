document.addEventListener('DOMContentLoaded', () => {
    const imageWidthInput = document.getElementById('imageWidth');
    const saveButton = document.getElementById('saveButton');

    // ストレージからimageWidthを読み込む
    chrome.storage.sync.get(['imageWidth'], (result) => {
        if (result.imageWidth !== undefined) {
            imageWidthInput.value = result.imageWidth;
        }
    });

    // 保存ボタンがクリックされたときの処理
    saveButton.addEventListener('click', () => {
        const imageWidthValue = parseInt(imageWidthInput.value, 10);
        if (!isNaN(imageWidthValue)) {
            chrome.storage.sync.set({ imageWidth: imageWidthValue }, () => {
                alert('設定が保存されました。');
            });
        } else {
            alert('有効な数字を入力してください。');
        }
    });
});