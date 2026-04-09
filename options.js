/**
 * Options.js - Gerenciamento completo dos prompts
 */

let allPrompts = [];
let currentView = 'all';
let editingPromptId = null;

document.addEventListener('DOMContentLoaded', async () => {
  await loadPrompts();

  // Event Listeners
  document.getElementById('main-search').addEventListener('input', renderPrompts);
  document.getElementById('btn-new-prompt').addEventListener('click', () => openModal());
  document.getElementById('prompt-form').addEventListener('submit', handleFormSubmit);
  document.getElementById('btn-delete').addEventListener('click', handleDelete);
  document.getElementById('btn-export').addEventListener('click', exportData);
  document.getElementById('btn-import').addEventListener('click', () => document.getElementById('file-input').click());
  document.getElementById('file-input').addEventListener('change', importData);

  // Navegação lateral
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', (e) => {
      if (e.target.dataset.view) {
        document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
        e.target.classList.add('active');
        currentView = e.target.dataset.view;
        updateViewTitle();
        renderPrompts();
      }
    });
  });

  // Fechar modal
  document.querySelectorAll('.btn-close').forEach(btn => {
    btn.addEventListener('click', closeModal);
  });
});

async function loadPrompts() {
  allPrompts = await Utils.getPrompts();
  renderPrompts();
}

function updateViewTitle() {
  const titles = {
    all: 'Todos os Prompts',
    favs: 'Favoritos',
    categories: 'Categorias'
  };
  document.getElementById('view-title').textContent = titles[currentView] || 'Prompts';
}

function renderPrompts() {
  const grid = document.getElementById('prompts-grid');
  const searchTerm = document.getElementById('main-search').value.toLowerCase();
  
  let filtered = allPrompts.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(searchTerm) || 
                          p.content.toLowerCase().includes(searchTerm) ||
                          p.tags.some(t => t.toLowerCase().includes(searchTerm));
    
    if (currentView === 'favs') return matchesSearch && p.favorite;
    return matchesSearch;
  });

  document.getElementById('prompt-count').textContent = filtered.length;

  if (filtered.length === 0) {
    grid.innerHTML = '<div class="empty-state" style="grid-column: 1/-1; padding: 100px;"><h2>Nenhum prompt encontrado.</h2><p>Comece criando um novo prompt!</p></div>';
    return;
  }

  grid.innerHTML = '';
  filtered.forEach(prompt => {
    const card = document.createElement('div');
    card.className = 'manage-card';
    card.innerHTML = `
      <div class="card-header">
        <h3 class="card-title">${prompt.title}</h3>
        ${prompt.favorite ? '<span class="favorite-star">⭐</span>' : ''}
      </div>
      <div class="card-content">${prompt.content}</div>
      <div class="card-footer">
        <div class="card-meta">
          <span class="tag">${prompt.category}</span>
          ${prompt.platform ? `<span class="tag">${prompt.platform}</span>` : ''}
        </div>
        <div class="card-actions">
          <button class="btn-icon btn-copy" title="Copiar">📋</button>
          <button class="btn-icon btn-duplicate" title="Duplicar">👯</button>
          <button class="btn-icon btn-edit" title="Editar">✏️</button>
        </div>
      </div>
    `;

    card.querySelector('.btn-copy').addEventListener('click', () => {
      Utils.copyToClipboard(prompt.content);
      alert('Copiado para a área de transferência!');
    });

    card.querySelector('.btn-duplicate').addEventListener('click', () => handleDuplicate(prompt));
    card.querySelector('.btn-edit').addEventListener('click', () => openModal(prompt));

    grid.appendChild(card);
  });
}

function openModal(prompt = null) {
  const modal = document.getElementById('modal-edit');
  const form = document.getElementById('prompt-form');
  const title = document.getElementById('modal-title');
  const deleteBtn = document.getElementById('btn-delete');

  form.reset();
  editingPromptId = null;

  if (prompt) {
    editingPromptId = prompt.id;
    title.textContent = 'Editar Prompt';
    deleteBtn.style.display = 'block';
    
    document.getElementById('edit-id').value = prompt.id;
    document.getElementById('title').value = prompt.title;
    document.getElementById('content').value = prompt.content;
    document.getElementById('category').value = prompt.category;
    document.getElementById('platform').value = prompt.platform || '';
    document.getElementById('tags').value = prompt.tags.join(', ');
    document.getElementById('favorite').checked = prompt.favorite;
  } else {
    title.textContent = 'Novo Prompt';
    deleteBtn.style.display = 'none';
  }

  modal.classList.add('active');
}

function closeModal() {
  document.getElementById('modal-edit').classList.remove('active');
}

async function handleFormSubmit(e) {
  e.preventDefault();
  
  const tagsInput = document.getElementById('tags').value;
  const tags = tagsInput ? tagsInput.split(',').map(t => t.trim()).filter(t => t) : [];

  const promptData = {
    title: document.getElementById('title').value,
    content: document.getElementById('content').value,
    category: document.getElementById('category').value,
    platform: document.getElementById('platform').value,
    tags: tags,
    favorite: document.getElementById('favorite').checked
  };

  if (editingPromptId) {
    await Utils.updatePrompt(editingPromptId, promptData);
  } else {
    await Utils.addPrompt(promptData);
  }

  closeModal();
  await loadPrompts();
}

async function handleDelete() {
  if (editingPromptId && confirm('Tem certeza que deseja excluir este prompt?')) {
    await Utils.deletePrompt(editingPromptId);
    closeModal();
    await loadPrompts();
  }
}

async function handleDuplicate(prompt) {
  const newPrompt = { ...prompt };
  delete newPrompt.id;
  newPrompt.title = `${newPrompt.title} (Cópia)`;
  newPrompt.createdAt = new Date().toISOString();
  newPrompt.updatedAt = new Date().toISOString();
  newPrompt.usageCount = 0;
  
  await Utils.addPrompt(newPrompt);
  await loadPrompts();
}

async function exportData() {
  const prompts = await Utils.getPrompts();
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(prompts, null, 2));
  const downloadAnchorNode = document.createElement('a');
  downloadAnchorNode.setAttribute("href", dataStr);
  downloadAnchorNode.setAttribute("download", "prompt_vault_export.json");
  document.body.appendChild(downloadAnchorNode);
  downloadAnchorNode.click();
  downloadAnchorNode.remove();
}

function importData(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async (event) => {
    try {
      const importedPrompts = JSON.parse(event.target.result);
      if (!Array.isArray(importedPrompts)) throw new Error('Formato inválido');
      
      const existingPrompts = await Utils.getPrompts();
      // Simples merge por ID ou apenas adicionar todos
      const merged = [...existingPrompts];
      
      importedPrompts.forEach(p => {
        if (!merged.find(m => m.id === p.id)) {
          merged.push(p);
        }
      });

      await Utils.savePrompts(merged);
      await loadPrompts();
      alert('Prompts importados com sucesso!');
    } catch (err) {
      alert('Erro ao importar arquivo: ' + err.message);
    }
  };
  reader.readAsText(file);
}
