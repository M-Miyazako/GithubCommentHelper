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
        const result = convertToMarkdownTable(selectedText);
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
    chrome.storage.sync.get(['imageWidth'], (result) => {
      let imageWidth = result.imageWidth ? ` width="${result.imageWidth}"` : '';
      let outputString = inputString;
      if (outputString.includes('![')) {
        outputString = outputString.replace(/!\[(.*?)\]\((.*?)\)/g, `<img src="$2"${imageWidth} alt="$1">`);
      }
      if (outputString.includes('https://github.com/user-attachments/assets/')) {
        outputString = outputString.replace(/(https:\/\/github\.com\/user-attachments\/assets\/[^\s]+)/g, '<video src="$1" />');
      }
      resolve(outputString);
    });
  });
}

function convertToMarkdownTable(text) {
  const lines = text.trim().split('\n');
  const columns = lines.length;

  let table = '|' + ' |'.repeat(columns) + '\n';
  table += '|' + ' :---: |'.repeat(columns) + '\n';
  table += '|';

  lines.forEach(line => {
    table += ' ' + line.trim() + ' |';
  });
  table += '\n';
  
  return table;
}

