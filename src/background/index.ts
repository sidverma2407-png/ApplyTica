/// <reference types="chrome"/>

chrome.runtime.onInstalled.addListener(() => {
  console.log('Applytica Extension Installed');
});

// Listener for messages from popup or content scripts
chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  if (request.type === 'PING') {
    sendResponse({ status: 'OK' });
  }
  return true;
});
