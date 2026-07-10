(function () {
    'use strict';

    const THEME_KEY = 'markvault_theme';
    const DRAFT_KEY = 'markvault_draft';
    const DRAFT_TITLE_KEY = 'markvault_draft_title';
    const themeToggle = document.getElementById('themeToggle');
    const toast = document.getElementById('toast');

    function applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem(THEME_KEY, theme);
    }
    if (themeToggle) {
        applyTheme(localStorage.getItem(THEME_KEY) || 'dark');
        themeToggle.addEventListener('click', () => {
            applyTheme(document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
        });
    }

    let toastTimer = null;
    function showToast(msg, isError = false) {
        if (!toast) return;
        toast.textContent = msg;
        toast.style.borderColor = isError ? 'var(--danger)' : 'var(--border)';
        toast.classList.add('show');
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => toast.classList.remove('show'), 2200);
    }

    const editor = document.getElementById('editor');
    if (editor) {
        let currentDocId = null;
        let currentTitle = 'New Document';
        let renderTimer = null;

        const preview = document.getElementById('preview');
        const wordCount = document.getElementById('wordCount');
        const charCount = document.getElementById('charCount');
        const docTitleDisplay = document.getElementById('docTitleDisplay');
        const saveBtn = document.getElementById('saveBtn');
        const copyMdBtn = document.getElementById('copyMdBtn');
        const fullscreenBtn = document.getElementById('fullscreenBtn');
        const clearBtn = document.getElementById('clearBtn');
        const fileInput = document.getElementById('fileInput');
        const divider = document.getElementById('divider');
        const editorPane = document.getElementById('editorPane');
        const previewPane = document.getElementById('previewPane');
        const saveModal = document.getElementById('saveModal');
        const docTitleInput = document.getElementById('docTitleInput');
        const fullscreenOverlay = document.getElementById('fullscreenOverlay');
        const fullscreenContent = document.getElementById('fullscreenContent');
        const exitFullscreen = document.getElementById('exitFullscreen');
        const renderBadge = document.getElementById('renderBadge');

        async function renderPreview(content) {
            if (renderBadge) renderBadge.textContent = '...';
            try {
                const res = await fetch('/api/render', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ content })
                });
                if (!res.ok) throw new Error();
                const data = await res.json();
                if (preview) preview.innerHTML = data.html;
                if (fullscreenContent) fullscreenContent.innerHTML = data.html;
                if (renderBadge) renderBadge.textContent = 'live';
            } catch {
                if (renderBadge) renderBadge.textContent = 'err';
            }
        }
        
    }
})