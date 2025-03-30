// Chromeのi18n APIを使用して多言語対応を実装

chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
    if (request.action === "replaceMedia") {
        const activeElement = document.activeElement;
        if (activeElement && activeElement.value) {
            const result = await replaceMedia(activeElement.value);
            activeElement.value = result;
        }
    } else if (request.action === "replaceSelectedText") {
        const selectedText = window.getSelection().toString();
        const result = await replaceMedia(selectedText);
        applyTextReplacement(result);
    } else if (request.action === "convertToTable") {
        const selectedText = window.getSelection().toString();
        const result = await convertToMarkdownTable(selectedText);
        applyTextReplacement(result);
    }
});

/**
 * 選択範囲にテキストを適用する関数
 * activeElementから選択範囲を取得できない場合は、windowのselectionを使用
 * @param {string} resultText - 適用するテキスト
 */
function applyTextReplacement(resultText) {
    const activeElement = document.activeElement;
    const selection = window.getSelection();
    
    // activeElementから選択範囲を取得できるか確認
    if (activeElement && 
        activeElement.value !== undefined && 
        activeElement.selectionStart !== undefined && 
        activeElement.selectionEnd !== undefined) {
        
        const start = activeElement.selectionStart;
        const end = activeElement.selectionEnd;
        const value = activeElement.value;
        
        const before = value.substring(0, start);
        const after = value.substring(end, value.length);
        
        activeElement.value = before + resultText + after;
        activeElement.selectionStart = activeElement.selectionEnd = start + resultText.length;
    } 
    // activeElementから取得できない場合はwindow.selectionを使用
    else if (selection && !selection.isCollapsed) {
        const range = selection.getRangeAt(0);
        
        // 選択範囲を削除して新しいテキストを挿入
        range.deleteContents();
        const textNode = document.createTextNode(resultText);
        range.insertNode(textNode);
        
        // 選択範囲を挿入したテキストの後ろに移動
        selection.removeAllRanges();
        const newRange = document.createRange();
        newRange.setStartAfter(textNode);
        newRange.setEndAfter(textNode);
        selection.addRange(newRange);
    }
}

function replaceMedia(inputString) {
  return new Promise((resolve) => {
    chrome.storage.sync.get(['imageWidth', 'videoWidth'], (result) => {
      let imageWidth = result.imageWidth ? ` width="${result.imageWidth}"` : '';
      let videoWidth = result.videoWidth ? ` width="${result.videoWidth}"` : '';
      let outputString = inputString;
      if (outputString.includes('![')) {
        outputString = outputString.replace(/!\[(.*?)\]\((.*?)\)/g, `<img src="$2"${imageWidth} alt="$1">`);
      }
      if (outputString.includes('https://github.com/user-attachments/assets/')) {
        // URL付き動画タグとスタンドアロンURLの両方を抽出する
        const videoTagRegex = /<video[^>]*src=["'](https:\/\/github\.com\/user-attachments\/assets\/[^"']+)["'][^>]*\/?>/g;
        const urlRegex = /(https:\/\/github\.com\/user-attachments\/assets\/[^\s<>"']+)/g;
        
        // 動画のタグとURLの一致をすべて見つける
        const matches = [];
        let match;
        
        // 動画タグをすべて見つける
        while ((match = videoTagRegex.exec(outputString)) !== null) {
          matches.push({
            fullMatch: match[0],
            url: match[1],
            hasVideoTag: true,
            index: match.index
          });
        }
        
        // URLをすべて見つける
        urlRegex.lastIndex = 0;
        while ((match = urlRegex.exec(outputString)) !== null) {
          // URLが動画タグの一部でないかチェック
          const isInVideoTag = matches.some(m => 
            m.hasVideoTag && 
            m.url === match[0] && 
            m.index <= match.index && 
            m.index + m.fullMatch.length >= match.index + match[0].length
          );
          
          if (!isInVideoTag) {
            matches.push({
              fullMatch: match[0],
              url: match[0],
              hasVideoTag: false,
              index: match.index
            });
          }
        }
        
        // 置換時にインデックスの問題を回避するために、マッチを逆順に並べ替える
        matches.sort((a, b) => b.index - a.index);
        
        // 動画タグでないURLのみを置換
        for (const match of matches) {
          if (!match.hasVideoTag) {
            outputString = outputString.substring(0, match.index) + 
                          `<video src="${match.url}"${videoWidth} />` + 
                          outputString.substring(match.index + match.fullMatch.length);
          }
        }
      }
      resolve(outputString);
    });
  });
}

function convertToMarkdownTable(text) {
  return new Promise((resolve) => {
    chrome.storage.sync.get(['tableHeaders'], (result) => {
      const lines = text.trim().split('\n');
      const dataCount = lines.length;
      const tableHeaders = result.tableHeaders || [];
      
      // テーブルの列数を決定（データの数とヘッダーの数の大きい方）
      const columnCount = Math.max(dataCount, tableHeaders.length);
      
      // テーブルのヘッダー行を作成
      let table = '|';
      for (let i = 0; i < columnCount; i++) {
        const headerText = i < tableHeaders.length ? tableHeaders[i] : '';
        table += ` ${headerText} |`;
      }
      table += '\n';
      
      // 区切り行を作成
      table += '|' + ' :---: |'.repeat(columnCount) + '\n';
      
      // データ行を作成
      table += '|';
      for (let i = 0; i < columnCount; i++) {
        const cellText = i < dataCount ? lines[i].trim() : '';
        table += ` ${cellText} |`;
      }
      
      resolve(table);
    });
  });
}
