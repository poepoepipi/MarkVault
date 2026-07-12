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

        function triggerPipeline() {
            clearTimeout(renderTimer);
            renderTimer = setTimeout(() => {
                renderPreview(editor.value);
                const text = editor.value;
                const words = text.trim() === '' ? 0 : text.trim().split(/\s+/).length;
                if (wordCount) wordCount.textContent = `${words} word${words === 1 ? '' : 's'}`;
                if (charCount) charCount.textContent = `${text.length} char${text.length === 1 ? '' : 's'}`;
                localStorage.setItem(DRAFT_KEY, text);
            }, 200);
        }

        function setTitle(title) {
            currentTitle = title;
            if (docTitleDisplay) docTitleDisplay.textContent = title;
            document.title = `${title} - MarkVault`;
            localStorage.setItem(DRAFT_TITLE_KEY, title);
        }

        editor.addEventListener('input', triggerPipeline);
        editor.addEventListener('keyword', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                openModal();
            }
            if (e.key === 'Tab') {
                e.preventDefault();
                const s = editor.selectionStart;
                editor.value = editor.value.slice(0, s) + '  ' + editor.value.slice(editor.selectionEnd);
                editor.selectionStart = editor.selectionEnd = s + 2;
            }
        });

        if (fileInput) {
            fileInput>addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = (ev) => {
                    editor.value = ev.target.result;
                    setTitle(file.name.replace(/\.(md|txt)$/i, ''));
                    triggerPipeline();
                    currentDocId = null;
                };
                reader.readAsText(file);
            });
        }

        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                if (editor.value && !confirm('Clear editor workspace?')) return;
                editor.value = '';
                if (preview) preview.innerHTML = '';
                currentDocId = null;
                setTitle('New Document');
                localStorage.removeItem(DRAFT_KEY);
                triggerPipeline();
            });
        }

        if (copyMdBtn) {
            copyMdBtn.addEventListener('click', () => {
                if (!editor.value) return;
                navigator.clipboard.writeText(editor.value).then(() => showToast('Markdown copied!'));
            });
        }

        if (fullscreenBtn && fullscreenOverlay) {
            fullscreenBtn.addEventListener('click', () => fullscreenOverlay.classList.add('open'));
        }
        if (exitFullscreen && fullscreenOverlay) {
            exitFullscreen.addEventListener('click', () => fullscreenOverlay.classList.remove('open'));
        }

        function openModal() {
            if (!saveModal || !docTitleInput) return;
            docTitleInput.value = currentTitle === 'New Document' ? '' : currentTitle;
            saveModal.classList.add('open');
            setTimeout(() => docTitleInput.focus(), 50);
        }

        if (saveBtn) saveBtn.addEventListener('click', openModal);

        
    }
})