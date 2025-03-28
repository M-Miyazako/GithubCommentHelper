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
        
        const result = await replaceMedia(selectedText)
        const activeElement = document.activeElement;

        const start = activeElement.selectionStart;
        const end = activeElement.selectionEnd;
        const value = activeElement.value;

        if (start !== undefined && end !== undefined) {
            const before = value.substring(0, start);
            const after = value.substring(end, value.length);
            
            activeElement.value = before + result + after;
            activeElement.selectionStart = activeElement.selectionEnd = start + result.length;
        }
    } else if (request.action === "convertToTable") {
        const selectedText = window.getSelection().toString();
        
        const result = convertToMarkdownTable(selectedText);
        const activeElement = document.activeElement;

        const start = activeElement.selectionStart;
        const end = activeElement.selectionEnd;
        const value = activeElement.value;

        if (start !== undefined && end !== undefined) {
            const before = value.substring(0, start);
            const after = value.substring(end, value.length);
            
            activeElement.value = before + result + after;
            activeElement.selectionStart = activeElement.selectionEnd = start + result.length;
        }
    }
});

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

