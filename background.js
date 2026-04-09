/**
 * Background.js - Gerenciamento de eventos em segundo plano
 */

importScripts('utils.js');

// Criar menu de contexto ao instalar
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "saveAsPrompt",
    title: "Salvar como Prompt no Vault",
    contexts: ["selection"]
  });
});

// Lidar com cliques no menu de contexto
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === "saveAsPrompt") {
    const selectedText = info.selectionText;
    const domain = Utils.getDomain(tab.url);
    
    const newPrompt = {
      title: "Novo Prompt Capturado",
      content: selectedText,
      domain: domain,
      category: "Geral",
      tags: ["capturado"]
    };

    await Utils.addPrompt(newPrompt);
    
    // Notificar o usuário (opcional, via mensagem para o content script ou popup)
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon128.png',
      title: 'Prompt Vault',
      message: 'Texto salvo com sucesso no seu Vault!'
    });
  }
});
