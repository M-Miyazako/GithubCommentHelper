// Chromeのi18n APIを使用して多言語対応を実装

document.addEventListener('DOMContentLoaded', () => {
    const imageWidthInput = document.getElementById('imageWidth');
    const imageHeightInput = document.getElementById('imageHeight');
    const videoWidthInput = document.getElementById('videoWidth');
    const videoHeightInput = document.getElementById('videoHeight');
    const saveButton = document.getElementById('saveButton');
    const tableHeadersContainer = document.getElementById('tableHeadersContainer');
    const addHeaderBtn = document.getElementById('addHeaderBtn');
    const bulkAlignLeft = document.getElementById('bulkAlignLeft');
    const bulkAlignCenter = document.getElementById('bulkAlignCenter');
    const bulkAlignRight = document.getElementById('bulkAlignRight');
    const defaultAlignLeft = document.getElementById('defaultAlignLeft');
    const defaultAlignCenter = document.getElementById('defaultAlignCenter');
    const defaultAlignRight = document.getElementById('defaultAlignRight');
    const overwriteExistingCheckbox = document.getElementById('overwriteExisting');

    // i18nによるテキストの設定
    document.getElementById('pageTitle').textContent = chrome.i18n.getMessage('optionsTitle');
    document.getElementById('optionsHeader').textContent = chrome.i18n.getMessage('optionsHeader');
    document.getElementById('imageWidthLabel').textContent = chrome.i18n.getMessage('imageWidthLabel');
    document.getElementById('imageHeightLabel').textContent = chrome.i18n.getMessage('imageHeightLabel');
    document.getElementById('videoWidthLabel').textContent = chrome.i18n.getMessage('videoWidthLabel');
    document.getElementById('videoHeightLabel').textContent = chrome.i18n.getMessage('videoHeightLabel');
    document.getElementById('tableHeadersLabel').textContent = chrome.i18n.getMessage('tableHeadersLabel');
    document.getElementById('addHeaderBtn').textContent = chrome.i18n.getMessage('addHeaderBtn');
    document.getElementById('saveButton').textContent = chrome.i18n.getMessage('saveButton');
    document.getElementById('alignmentBulkLabel').textContent = chrome.i18n.getMessage('alignmentBulkLabel');
    document.getElementById('bulkAlignLeftLabel').textContent = chrome.i18n.getMessage('alignmentLeft');
    document.getElementById('bulkAlignCenterLabel').textContent = chrome.i18n.getMessage('alignmentCenter');
    document.getElementById('bulkAlignRightLabel').textContent = chrome.i18n.getMessage('alignmentRight');
    document.getElementById('defaultAlignmentLabel').textContent = chrome.i18n.getMessage('defaultAlignmentLabel');
    document.getElementById('defaultAlignLeftLabel').textContent = chrome.i18n.getMessage('alignmentLeft');
    document.getElementById('defaultAlignCenterLabel').textContent = chrome.i18n.getMessage('alignmentCenter');
    document.getElementById('defaultAlignRightLabel').textContent = chrome.i18n.getMessage('alignmentRight');
    document.getElementById('overwriteSettingsLabel').textContent = chrome.i18n.getMessage('overwriteSettingsLabel');
    document.getElementById('overwriteExistingLabel').textContent = chrome.i18n.getMessage('overwriteExistingLabel');

    // ストレージから設定を読み込む
    chrome.storage.sync.get(['imageWidth', 'imageHeight', 'videoWidth', 'videoHeight', 'tableHeaders', 'columnAlignments', 'defaultAlignment', 'overwriteExisting'], (result) => {
        if (result.imageWidth !== undefined) {
            imageWidthInput.value = result.imageWidth;
        }
        if (result.imageHeight !== undefined) {
            imageHeightInput.value = result.imageHeight;
        }
        if (result.videoWidth !== undefined) {
            videoWidthInput.value = result.videoWidth;
        }
        if (result.videoHeight !== undefined) {
            videoHeightInput.value = result.videoHeight;
        }
        
        // overwriteExisting設定の読み込み（デフォルトはtrue）
        if (result.overwriteExisting !== undefined) {
            overwriteExistingCheckbox.checked = result.overwriteExisting;
        } else {
            overwriteExistingCheckbox.checked = true; // デフォルトで有効
        }
        
        // デフォルトの寄せ方向を設定
        const defaultAlignment = result.defaultAlignment || 'center';
        switch (defaultAlignment) {
            case 'left':
                defaultAlignLeft.checked = true;
                break;
            case 'right':
                defaultAlignRight.checked = true;
                break;
            case 'center':
            default:
                defaultAlignCenter.checked = true;
                break;
        }
        
        // テーブルヘッダーと寄せ方向の読み込みと表示
        const tableHeaders = result.tableHeaders || [];
        const columnAlignments = result.columnAlignments || [];
        
        // ヘッダーまたは寄せ方向の設定がある場合は表示
        if (tableHeaders.length > 0 || columnAlignments.length > 0) {
            // 表示する項目数を決定（ヘッダーと寄せ方向の数の大きい方）
            const itemCount = Math.max(tableHeaders.length, columnAlignments.length);
            
            for (let i = 0; i < itemCount; i++) {
                const headerValue = i < tableHeaders.length ? tableHeaders[i] : '';
                const alignmentValue = i < columnAlignments.length ? columnAlignments[i] : defaultAlignment;
                addHeaderInput(i, headerValue, alignmentValue);
            }
        } else {
            // 設定がない場合は空の入力欄を一つ追加
            addHeaderInput(0, '', defaultAlignment);
        }
    });

    // 一括設定ラジオボタンのイベントリスナー
    bulkAlignLeft.addEventListener('click', () => applyBulkAlignment('left'));
    bulkAlignCenter.addEventListener('click', () => applyBulkAlignment('center'));
    bulkAlignRight.addEventListener('click', () => applyBulkAlignment('right'));
    
    // 一括で寄せ方向を適用する関数
    function applyBulkAlignment(alignment) {
        const alignmentRadios = document.querySelectorAll('.column-alignment');
        alignmentRadios.forEach(radio => {
            if (radio.value === alignment) {
                radio.checked = true;
            }
        });
    }

    // ヘッダー入力欄を追加する関数
    function addHeaderInput(index, value = '', alignment = 'center') {
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
        
        // 寄せ方向のラジオグループを作成
        const alignmentDiv = document.createElement('div');
        alignmentDiv.className = 'alignment-options';
        
        const alignmentLabel = document.createElement('label');
        alignmentLabel.textContent = chrome.i18n.getMessage('columnAlignmentLabel');
        alignmentDiv.appendChild(alignmentLabel);
        
        const radioGroup = document.createElement('div');
        radioGroup.className = 'radio-group';
        
        // 左寄せラジオボタン
        const leftLabel = document.createElement('label');
        const leftRadio = document.createElement('input');
        leftRadio.type = 'radio';
        leftRadio.name = `alignment-${index}`;
        leftRadio.className = 'column-alignment';
        leftRadio.value = 'left';
        if (alignment === 'left') leftRadio.checked = true;
        const leftSpan = document.createElement('span');
        leftSpan.textContent = chrome.i18n.getMessage('alignmentLeft');
        leftLabel.appendChild(leftRadio);
        leftLabel.appendChild(leftSpan);
        
        // 中央寄せラジオボタン
        const centerLabel = document.createElement('label');
        const centerRadio = document.createElement('input');
        centerRadio.type = 'radio';
        centerRadio.name = `alignment-${index}`;
        centerRadio.className = 'column-alignment';
        centerRadio.value = 'center';
        if (alignment === 'center') centerRadio.checked = true;
        const centerSpan = document.createElement('span');
        centerSpan.textContent = chrome.i18n.getMessage('alignmentCenter');
        centerLabel.appendChild(centerRadio);
        centerLabel.appendChild(centerSpan);
        
        // 右寄せラジオボタン
        const rightLabel = document.createElement('label');
        const rightRadio = document.createElement('input');
        rightRadio.type = 'radio';
        rightRadio.name = `alignment-${index}`;
        rightRadio.className = 'column-alignment';
        rightRadio.value = 'right';
        if (alignment === 'right') rightRadio.checked = true;
        const rightSpan = document.createElement('span');
        rightSpan.textContent = chrome.i18n.getMessage('alignmentRight');
        rightLabel.appendChild(rightRadio);
        rightLabel.appendChild(rightSpan);
        
        radioGroup.appendChild(leftLabel);
        radioGroup.appendChild(centerLabel);
        radioGroup.appendChild(rightLabel);
        alignmentDiv.appendChild(radioGroup);
        
        const removeBtn = document.createElement('button');
        removeBtn.className = 'remove-header-btn';
        removeBtn.textContent = '✕';
        removeBtn.addEventListener('click', () => {
            headerGroup.remove();
            updateHeaderIndices();
        });
        
        headerGroup.appendChild(input);
        headerGroup.appendChild(alignmentDiv);
        headerGroup.appendChild(removeBtn);
        tableHeadersContainer.appendChild(headerGroup);
    }
    
    // ヘッダーのインデックスを更新する関数
    function updateHeaderIndices() {
        const headerGroups = tableHeadersContainer.querySelectorAll('.header-input-group');
        headerGroups.forEach((group, index) => {
            group.dataset.index = index;
            const input = group.querySelector('input.header-input');
            const radios = group.querySelectorAll('input[type="radio"]');
            
            // ラジオボタンのname属性を更新
            radios.forEach(radio => {
                radio.name = `alignment-${index}`;
            });
            
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
        // デフォルト寄せ方向を取得
        let defaultAlignment = 'center';
        if (defaultAlignLeft.checked) {
            defaultAlignment = 'left';
        } else if (defaultAlignRight.checked) {
            defaultAlignment = 'right';
        }
        addHeaderInput(headerGroups.length, '', defaultAlignment);
    });

    // 保存ボタンがクリックされたときの処理
    saveButton.addEventListener('click', () => {
        // 入力値を取得
        let imageWidthValue = parseInt(imageWidthInput.value, 10);
        let imageHeightValue = parseInt(imageHeightInput.value, 10);
        let videoWidthValue = parseInt(videoWidthInput.value, 10);
        let videoHeightValue = parseInt(videoHeightInput.value, 10);
        
        // テーブルヘッダーの値を取得
        const headerInputs = document.querySelectorAll('.header-input');
        const tableHeaders = Array.from(headerInputs).map(input => input.value.trim());
        
        // 列の寄せ方向を取得
        const columnAlignments = [];
        const headerGroups = tableHeadersContainer.querySelectorAll('.header-input-group');
        headerGroups.forEach(group => {
            const checkedRadio = group.querySelector('input[type="radio"]:checked');
            columnAlignments.push(checkedRadio ? checkedRadio.value : 'center');
        });
        
        // デフォルトの寄せ方向を取得
        let defaultAlignment;
        if (defaultAlignLeft.checked) {
            defaultAlignment = 'left';
        } else if (defaultAlignRight.checked) {
            defaultAlignment = 'right';
        } else {
            defaultAlignment = 'center';
        }
        
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
        
        if (!isNaN(imageHeightValue) && imageHeightValue > 0) {
            dataToSave.imageHeight = imageHeightValue;
        } else {
            keysToRemove.push('imageHeight');
        }
        
        if (!isNaN(videoWidthValue) && videoWidthValue > 0) {
            dataToSave.videoWidth = videoWidthValue;
        } else {
            keysToRemove.push('videoWidth');
        }
        
        if (!isNaN(videoHeightValue) && videoHeightValue > 0) {
            dataToSave.videoHeight = videoHeightValue;
        } else {
            keysToRemove.push('videoHeight');
        }
        
        // テーブルヘッダーと寄せ方向の保存条件を分ける
        // ヘッダーが空でない場合のみヘッダーを保存
        if (tableHeaders.length > 0 && tableHeaders.some(header => header !== '')) {
            dataToSave.tableHeaders = tableHeaders;
        } else {
            keysToRemove.push('tableHeaders');
        }
        
        // 寄せ方向が設定されている場合は保存（ヘッダーが空でも保存）
        if (columnAlignments.length > 0) {
            // デフォルト値（すべて中央寄せ）と異なるか確認
            const hasNonDefaultAlignment = columnAlignments.some(alignment => alignment !== 'center');
            if (hasNonDefaultAlignment) {
                dataToSave.columnAlignments = columnAlignments;
            } else {
                keysToRemove.push('columnAlignments');
            }
        } else {
            keysToRemove.push('columnAlignments');
        }
        
        // デフォルトの寄せ方向を保存
        dataToSave.defaultAlignment = defaultAlignment;
        
        // overwriteExisting設定を保存
        dataToSave.overwriteExisting = overwriteExistingCheckbox.checked;
        
        // 保存完了メッセージを表示（非同期処理の完了後に表示）
        Promise.all([
            Object.keys(dataToSave).length > 0 ? new Promise(resolve => chrome.storage.sync.set(dataToSave, resolve)) : Promise.resolve(),
            keysToRemove.length > 0 ? new Promise(resolve => chrome.storage.sync.remove(keysToRemove, resolve)) : Promise.resolve()
        ]).then(() => {
            alert(chrome.i18n.getMessage('savedMessage'));
        });
    });
});