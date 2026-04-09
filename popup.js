/**
 * Popup.js - Lógica da interface principal
 */

let allPrompts = [];
let currentFilter = 'all';
let showOnlyFavs = false;
let currentDomain = '';

document.addEventListener('DOMContentLoaded', async () => {
  // Obter domínio atual
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tabs[0]) {
    currentDomain = Utils.getDomain(tabs[0].url);
    document.getElementById('chip-domain').textContent = `Neste Site (${currentDomain})`;
  }

  // Carregar prompts
  await loadPrompts();

  // Event Listeners
  document.getElementById('search-input').addEventListener('input', renderPrompts);
  document.getElementById('btn-filter-fav').addEventListener('click', toggleFavFilter);
  document.getElementById('btn-options').addEventListener('click', () => chrome.runtime.openOptionsPage());
  document.getElementById('btn-add-quick').addEventListener('click', () => chrome.runtime.openOptionsPage());
  
  // Chips de filtro
  document.querySelectorAll('.filter-chip').forEach(chip => {
    chip.addEventListener('click', (e) => {
      document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
      e.target.classList.add('active');
      currentFilter = e.target.dataset.category;
      renderPrompts();
    });
  });

  // Modal actions
  document.getElementById('btn-cancel-var').addEventListener('click', closeModal);
});

async function loadPrompts() {
  allPrompts = await Utils.getPrompts();
  renderPrompts();
}

function toggleFavFilter() {
  showOnlyFavs = !showOnlyFavs;
  document.getElementById('btn-filter-fav').classList.toggle('active', showOnlyFavs);
  renderPrompts();
}

function renderPrompts() {
  const listElement = document.getElementById('prompts-list');
  const searchTerm = document.getElementById('search-input').value.toLowerCase();
  
  let filtered = allPrompts.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(searchTerm) || 
                          p.content.toLowerCase().includes(searchTerm);
    const matchesFav = showOnlyFavs ? p.favorite : true;
    
    let matchesCategory = true;
    if (currentFilter === 'domain') {
      matchesCategory = p.domain === currentDomain;
    } else if (currentFilter !== 'all') {
      matchesCategory = p.category.toLowerCase() === currentFilter.toLowerCase();
    }
    
    return matchesSearch && matchesFav && matchesCategory;
  });

  // Ordenar: favoritos primeiro, depois por data
  filtered.sort((a, b) => {
    if (a.favorite && !b.favorite) return -1;
    if (!a.favorite && b.favorite) return 1;
    return new Date(b.updatedAt) - new Date(a.updatedAt);
  });

  if (filtered.length === 0) {
    listElement.innerHTML = '<div class="empty-state"><p>Nenhum prompt encontrado.</p></div>';
    return;
  }

  listElement.innerHTML = '';
  filtered.forEach(prompt => {
    const card = document.createElement('div');
    card.className = 'prompt-card';
    card.innerHTML = `
      <div class="prompt-header">
        <span class="prompt-title">${prompt.title}</span>
        ${prompt.favorite ? '<span class="prompt-fav">⭐</span>' : ''}
      </div>
      <div class="prompt-preview">${prompt.content}</div>
      <div class="prompt-meta">
        <span class="prompt-tag">${prompt.category}</span>
        <div class="prompt-actions">
          <button class="btn-icon btn-copy" title="Copiar">📋</button>
          <button class="btn-icon btn-use" title="Usar (Preencher variáveis)">⚡</button>
        </div>
      </div>
    `;

    // Eventos do card
    card.querySelector('.btn-copy').addEventListener('click', (e) => {
      e.stopPropagation();
      handleCopy(prompt);
    });

    card.querySelector('.btn-use').addEventListener('click', (e) => {
      e.stopPropagation();
      handleUse(prompt);
    });

    card.addEventListener('click', () => handleUse(prompt));

    listElement.appendChild(card);
  });
}

async function handleCopy(prompt) {
  const success = await Utils.copyToClipboard(prompt.content);
  if (success) {
    showFeedback('Copiado!');
    await Utils.updatePrompt(prompt.id, { usageCount: (prompt.usageCount || 0) + 1 });
  }
}

function handleUse(prompt) {
  const variables = Utils.extractVariables(prompt.content);
  
  if (variables.length === 0) {
    handleCopy(prompt);
    return;
  }

  openVariablesModal(prompt, variables);
}

function openVariablesModal(prompt, variables) {
  const modal = document.getElementById('modal-variables');
  const form = document.getElementById('variables-form');
  form.innerHTML = '';

  variables.forEach(variable => {
    const div = document.createElement('div');
    div.className = 'var-field';
    div.innerHTML = `
      <label>${variable}</label>
      <input type="text" data-var="${variable}" placeholder="Valor para {${variable}}">
    `;
    form.appendChild(div);
  });

  modal.classList.add('active');

  const copyBtn = document.getElementById('btn-copy-final');
  // Remover listeners antigos
  const newCopyBtn = copyBtn.cloneNode(true);
  copyBtn.parentNode.replaceChild(newCopyBtn, copyBtn);

  newCopyBtn.addEventListener('click', async () => {
    const values = {};
    form.querySelectorAll('input').forEach(input => {
      values[input.dataset.var] = input.value || `{${input.dataset.var}}`;
    });

    const finalContent = Utils.replaceVariables(prompt.content, values);
    const success = await Utils.copyToClipboard(finalContent);
    
    if (success) {
      showFeedback('Prompt final copiado!');
      await Utils.updatePrompt(prompt.id, { usageCount: (prompt.usageCount || 0) + 1 });
      closeModal();
    }
  });
}

function closeModal() {
  document.getElementById('modal-variables').classList.remove('active');
}

function showFeedback(message) {
  const footer = document.querySelector('footer');
  const originalContent = footer.innerHTML;
  footer.innerHTML = `<div style="text-align:center; color: var(--accent); font-weight:600; padding:10px;">${message}</div>`;
  setTimeout(() => {
    footer.innerHTML = originalContent;
    // Re-bind events if necessary, but here we just reload the whole footer
    document.getElementById('btn-add-quick').addEventListener('click', () => chrome.runtime.openOptionsPage());
  }, 1500);
}
