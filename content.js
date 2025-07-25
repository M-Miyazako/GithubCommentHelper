// Chromeのi18n APIを使用して多言語対応を実装

chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
    if (request.action === "replaceMedia") {
        const activeElement = document.activeElement;
        if (activeElement && activeElement.value) {
            const result = await replaceMedia(activeElement.value);
            activeElement.value = result;

            // 変更イベントを発火させる
            const inputEvent = new Event('input', { bubbles: true });
            activeElement.dispatchEvent(inputEvent);
        }
    } else if (request.action === "replaceSelectedText") {
        const selectedText = window.getSelection().toString();
        const result = await replaceMedia(selectedText);
        applyTextReplacement(result);
    } else if (request.action === "convertToTable") {
        const selectedText = window.getSelection().toString();
        const result = await convertToMarkdownTable(selectedText);
        applyTextReplacement(result);
    } else if (request.action === "replaceMediaThenTable") {
        const selectedText = window.getSelection().toString();
        // まずメディア変換を実行
        const mediaConverted = await replaceMedia(selectedText);
        // 次にテーブル変換を実行
        const tableConverted = await convertToMarkdownTable(mediaConverted);
        applyTextReplacement(tableConverted);
    }
});

/**
 * 選択範囲にテキストを適用する関数
 * activeElementから選択範囲を取得できない場合はスキップ
 * @param {string} resultText - 適用するテキスト
 */
function applyTextReplacement(resultText) {
    const activeElement = document.activeElement;
    
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
        
        // 変更イベントを発火させる
        const inputEvent = new Event('input', { bubbles: true });
        activeElement.dispatchEvent(inputEvent);
    }
}

function replaceMedia(inputString) {
  return new Promise((resolve) => {
    chrome.storage.sync.get(['imageWidth', 'imageHeight', 'videoWidth', 'videoHeight', 'overwriteExisting'], (result) => {
      let imageWidth = result.imageWidth ? ` width="${result.imageWidth}"` : '';
      let imageHeight = result.imageHeight ? ` height="${result.imageHeight}"` : '';
      let videoWidth = result.videoWidth ? ` width="${result.videoWidth}"` : '';
      let videoHeight = result.videoHeight ? ` height="${result.videoHeight}"` : '';
      let overwriteExisting = result.overwriteExisting !== undefined ? result.overwriteExisting : true; // デフォルトはtrue
      let outputString = inputString;
      // 既存のimgタグの幅/高さを上書きする処理
      if (overwriteExisting) {
        // imgタグの処理
        outputString = outputString.replace(/<img([^>]*?)>/g, (match, attributes) => {
          // 既存のwidth/height属性を削除
          let newAttributes = attributes.replace(/\s*(width|height)=["'][^"']*["']/gi, '');
          
          // 新しいwidth/height属性を追加（設定されている場合）
          if (result.imageWidth) {
            newAttributes += ` width="${result.imageWidth}"`;
          }
          if (result.imageHeight) {
            newAttributes += ` height="${result.imageHeight}"`;
          }
          
          return `<img${newAttributes}>`;
        });
        
        // videoタグの処理
        outputString = outputString.replace(/<video([^>]*?)(\s*\/?>|\s*>[\s\S]*?<\/video>)/g, (match, attributes, closing) => {
          // 既存のwidth/height属性を削除
          let newAttributes = attributes.replace(/\s*(width|height)=["'][^"']*["']/gi, '');
          
          // 新しいwidth/height属性を追加（設定されている場合）
          if (result.videoWidth) {
            newAttributes += ` width="${result.videoWidth}"`;
          }
          if (result.videoHeight) {
            newAttributes += ` height="${result.videoHeight}"`;
          }
          
          return `<video${newAttributes}${closing}`;
        });
      }
      
      if (outputString.includes('![')) {
        outputString = outputString.replace(/!\[(.*?)\]\((.*?)\)/g, `<img src="$2"${imageWidth}${imageHeight} alt="$1">`);
      }
      if (outputString.includes('https://github.com/user-attachments/assets/')) {
        // URL付き画像/動画タグとスタンドアロンURLの両方を抽出する
        const tagReges = /<(img|video)[^>]*src=["'](https:\/\/github\.com\/user-attachments\/assets\/[^"']+)["'][^>]*\/?>/g;
        const urlRegex = /(https:\/\/github\.com\/user-attachments\/assets\/[^\s<>"']+)/g;
        
        // 画像/動画のタグとURLの一致をすべて見つける
        const matches = [];
        let match;
        
        // 画像/動画タグをすべて見つける
        while ((match = tagReges.exec(outputString)) !== null) {
          matches.push({
            fullMatch: match[0],
            url: match[2],
            hasTag: true,
            index: match.index
          });
        }
        
        // URLをすべて見つける
        urlRegex.lastIndex = 0;
        while ((match = urlRegex.exec(outputString)) !== null) {
          // URLが画像/動画タグの一部でないかチェック
          const isInTag = matches.some(m => 
            m.hasTag && 
            m.url === match[0] && 
            m.index <= match.index && 
            m.index + m.fullMatch.length >= match.index + match[0].length
          );
          
          if (!isInTag) {
            matches.push({
              fullMatch: match[0],
              url: match[0],
              hasTag: false,
              index: match.index
            });
          }
        }
        
        // 置換時にインデックスの問題を回避するために、マッチを逆順に並べ替える
        matches.sort((a, b) => b.index - a.index);
        
        // 画像/動画タグでないURLのみを置換
        for (const match of matches) {
          if (!match.hasTag) {
            outputString = outputString.substring(0, match.index) + 
                          `<video src="${match.url}"${videoWidth}${videoHeight} />` + 
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
    chrome.storage.sync.get(['tableHeaders', 'columnAlignments', 'defaultAlignment'], (result) => {
      const lines = text.trim().split('\n');
      const dataCount = lines.length;
      const tableHeaders = result.tableHeaders || [];
      const columnAlignments = result.columnAlignments || [];
      const defaultAlignment = result.defaultAlignment || 'center';
      
      // テーブルの列数を決定（データの数とヘッダーの数の大きい方）
      const columnCount = Math.max(dataCount, tableHeaders.length);
      
      // テーブルのヘッダー行を作成
      let table = '|';
      for (let i = 0; i < columnCount; i++) {
        const headerText = i < tableHeaders.length ? tableHeaders[i] : '';
        table += ` ${headerText} |`;
      }
      table += '\n';
      
      // 区切り行を作成（寄せ方向に応じて記述）
      table += '|';
      for (let i = 0; i < columnCount; i++) {
        // 寄せ方向が設定されていない場合はデフォルト値を使用
        const alignment = i < columnAlignments.length ? columnAlignments[i] : defaultAlignment;
        let alignmentMark;
        
        switch (alignment) {
          case 'left':
            alignmentMark = ' :--- |';
            break;
          case 'right':
            alignmentMark = ' ---: |';
            break;
          case 'center':
          default:
            alignmentMark = ' :---: |';
            break;
        }
        
        table += alignmentMark;
      }
      table += '\n';
      
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
