/**
 * Utils.js - Funções utilitárias e gerenciamento de dados
 */

const DEFAULT_CATEGORIES = [
  "imagem", "vídeo", "copy", "vendas", "automação", 
  "estudo", "roteiro", "persona", "realismo", "anúncios"
];

const Utils = {
  /**
   * Busca todos os prompts do storage
   */
  async getPrompts() {
    return new Promise((resolve) => {
      chrome.storage.local.get(["prompts"], (result) => {
        resolve(result.prompts || []);
      });
    });
  },

  /**
   * Salva a lista de prompts no storage
   */
  async savePrompts(prompts) {
    return new Promise((resolve) => {
      chrome.storage.local.set({ prompts }, () => {
        resolve();
      });
    });
  },

  /**
   * Adiciona um novo prompt
   */
  async addPrompt(promptData) {
    const prompts = await this.getPrompts();
    const newPrompt = {
      id: crypto.randomUUID(),
      title: promptData.title || "Sem título",
      content: promptData.content || "",
      category: promptData.category || "Geral",
      tags: promptData.tags || [],
      platform: promptData.platform || "",
      favorite: !!promptData.favorite,
      domain: promptData.domain || "",
      usageCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    prompts.push(newPrompt);
    await this.savePrompts(prompts);
    return newPrompt;
  },

  /**
   * Atualiza um prompt existente
   */
  async updatePrompt(id, updatedData) {
    const prompts = await this.getPrompts();
    const index = prompts.findIndex(p => p.id === id);
    if (index !== -1) {
      prompts[index] = {
        ...prompts[index],
        ...updatedData,
        updatedAt: new Date().toISOString()
      };
      await this.savePrompts(prompts);
      return prompts[index];
    }
    return null;
  },

  /**
   * Remove um prompt
   */
  async deletePrompt(id) {
    let prompts = await this.getPrompts();
    prompts = prompts.filter(p => p.id !== id);
    await this.savePrompts(prompts);
  },

  /**
   * Extrai variáveis de um texto: {variavel}
   */
  extractVariables(text) {
    const regex = /\{([^}]+)\}/g;
    const matches = text.matchAll(regex);
    const variables = new Set();
    for (const match of matches) {
      variables.add(match[1].trim());
    }
    return Array.from(variables);
  },

  /**
   * Substitui variáveis no texto
   */
  replaceVariables(text, values) {
    let result = text;
    for (const [key, value] of Object.entries(values)) {
      const regex = new RegExp(`\\{${key}\\}`, 'g');
      result = result.replace(regex, value);
    }
    return result;
  },

  /**
   * Obtém o domínio de uma URL
   */
  getDomain(url) {
    try {
      const hostname = new URL(url).hostname;
      return hostname.replace('www.', '');
    } catch (e) {
      return "";
    }
  },

  /**
   * Formata data para exibição
   */
  formatDate(isoString) {
    const date = new Date(isoString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  },

  /**
   * Copia texto para o clipboard
   */
  async copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (err) {
      console.error('Falha ao copiar: ', err);
      return false;
    }
  }
};
