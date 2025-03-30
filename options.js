// Chromeのi18n APIを使用して多言語対応を実装

document.addEventListener('DOMContentLoaded', () => {
    const imageWidthInput = document.getElementById('imageWidth');
    const videoWidthInput = document.getElementById('videoWidth');
    const saveButton = document.getElementById('saveButton');
    const tableHeadersContainer = document.getElementById('tableHeadersContainer');
    const addHeaderBtn = document.getElementById('addHeaderBtn');

    // i18nによるテキストの設定
    document.getElementById('pageTitle').textContent = chrome.i18n.getMessage('optionsTitle');
    document.getElementById('optionsHeader').textContent = chrome.i18n.getMessage('optionsHeader');
    document.getElementById('imageWidthLabel').textContent = chrome.i18n.getMessage('imageWidthLabel');
    document.getElementById('videoWidthLabel').textContent = chrome.i18n.getMessage('videoWidthLabel');
    document.getElementById('tableHeadersLabel').textContent = chrome.i18n.getMessage('tableHeadersLabel');
    document.getElementById('addHeaderBtn').textContent = chrome.i18n.getMessage('addHeaderBtn');
    document.getElementById('saveButton').textContent = chrome.i18n.getMessage('saveButton');

    // ストレージから設定を読み込む
    chrome.storage.sync.get(['imageWidth', 'videoWidth', 'tableHeaders'], (result) => {
        if (result.imageWidth !== undefined) {
            imageWidthInput.value = result.imageWidth;
        }
        if (result.videoWidth !== undefined) {
            videoWidthInput.value = result.videoWidth;
        }
        
        // テーブルヘッダーの読み込みと表示
        const tableHeaders = result.tableHeaders || [];
        tableHeaders.forEach((header, index) => {
            addHeaderInput(index, header);
        });
        
        // ヘッダーが一つもない場合は空の入力欄を一つ追加
        if (tableHeaders.length === 0) {
            addHeaderInput(0, '');
        }
    });

    // ヘッダー入力欄を追加する関数
    function addHeaderInput(index, value = '') {
        const headerGroup = document.createElement('div');
        headerGroup.className = 'header-input-group';
        headerGroup.dataset.index = index;
        
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'header-input';
        input.value = value;
        
        // プレースホルダーの多言語対応（第二引数でパラメータを渡す）
        const placeholderText = chrome.i18n.getMessage('headerPlaceholder', [index + 1]);
        if (placeholderText) {
            input.placeholder = placeholderText;
        }
        
        const removeBtn = document.createElement('button');
        removeBtn.className = 'remove-header-btn';
        removeBtn.textContent = '✕';
        removeBtn.addEventListener('click', () => {
            headerGroup.remove();
            updateHeaderIndices();
        });
        
        headerGroup.appendChild(input);
        headerGroup.appendChild(removeBtn);
        tableHeadersContainer.appendChild(headerGroup);
    }
    
    // ヘッダーのインデックスを更新する関数
    function updateHeaderIndices() {
        const headerGroups = tableHeadersContainer.querySelectorAll('.header-input-group');
        headerGroups.forEach((group, index) => {
            group.dataset.index = index;
            const input = group.querySelector('input');
            
            // プレースホルダーの多言語対応（第二引数でパラメータを渡す）
            const placeholderText = chrome.i18n.getMessage('headerPlaceholder', [index + 1]);
            if (placeholderText) {
                input.placeholder = placeholderText;
            }
        });
    }
    
    // ヘッダー追加ボタンのイベントリスナー
    addHeaderBtn.addEventListener('click', () => {
        const headerGroups = tableHeadersContainer.querySelectorAll('.header-input-group');
        addHeaderInput(headerGroups.length);
    });

    // 保存ボタンがクリックされたときの処理
    saveButton.addEventListener('click', () => {
        // 入力値を取得
        let imageWidthValue = parseInt(imageWidthInput.value, 10);
        let videoWidthValue = parseInt(videoWidthInput.value, 10);
        
        // テーブルヘッダーの値を取得
        const headerInputs = document.querySelectorAll('.header-input');
        const tableHeaders = Array.from(headerInputs).map(input => input.value.trim());
        
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
        
        // テーブルヘッダーが空でない場合のみ保存
        if (tableHeaders.length > 0 && tableHeaders.some(header => header !== '')) {
            dataToSave.tableHeaders = tableHeaders;
        } else {
            keysToRemove.push('tableHeaders');
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