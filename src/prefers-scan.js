(function () {
  // Remove existing elements and styles from previous executions
  function cleanup() {
    document.querySelectorAll('.scan-panel').forEach((el) => el.remove());
    const existingStyle = document.querySelector('#scan-styles');
    if (existingStyle) existingStyle.remove();
  }
  cleanup();

  // Initialize core variables
  // Create DocumentFragment for better performance
  const fragment = document.createDocumentFragment();

  // Messages configuration
  const messages = {
    ui: {
      panelTitle: 'Prefers Scan',
      noResults: 'No user-preference media queries detected.',
      hasResults: 'Detected user-preference media queries:',
      blocked:
        'Some stylesheets could not be inspected due to CORS restrictions:',
      escapeHint: 'Use <kbd>Esc</kbd> to close panel',
    },
    buttons: {
      close: 'Close',
      darkLight: 'Dark/Light',
      screenReaderLabels: {
        panel: ' the panel',
        mode: ' mode toggle',
      },
    },
  };

  // Styles
  const style = document.createElement('style');
  style.id = 'scan-styles';
  style.textContent = `
    .scan-panel {
      position: fixed;
      top: 10px;
      left: 10px;
      background: #fff;
      color: #000;
      padding: 15px;
      border-radius: 5px;
      box-shadow: 0 0 10px rgba(0, 0, 0, .2);
      z-index: 99999;
      max-width: 400px;
      max-height: 70vh;
      overflow: auto;
      font-family: -apple-system, system-ui, sans-serif;
    }
    #scan-panel-title {
      font-size: 1.2em;
      font-weight: bold;
      margin: 0 0 0.5em 0;
    }
    .scan-panel h2 {
      font-size: 1em;
      margin-top: 1em;
      margin-bottom: 0.3em;
    }
    .scan-footer {
      display: flex;
      flex-direction: column;
    }
    .scan-btn {
      margin: 5px;
      padding: 5px 10px;
      border: none;
      border-radius: 3px;
      background: #0d6efd;
      color: #fff;
      font-size: .8em;
      cursor: pointer;
    }
    .scan-btn:focus {
      outline: 2px solid #0d6efd;
      outline-offset: 2px;
      box-shadow: 0 0 10px rgba(13, 110, 253, 0.25);
    }
    @media (forced-colors: active) {
      .scan-btn:focus {
        outline: 3px solid #000;
        outline-offset: 3px;
      }
    }
    @keyframes fadeIn {
      from {
        opacity: 0;
        transform: translateY(-8px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    @media (prefers-reduced-motion: no-preference) {
      .scan-panel {
        animation: fadeIn 0.5s ease-out;
      }
    }
    @media (prefers-color-scheme: dark) {
      .scan-panel {
        background: #1e1e1e;
        color: #f0f0f0;
      }
    }
    body.scan-dark .scan-panel {
      background: #1e1e1e;
      color: #eee;
    }
    .visually-hidden {
      border: 0 !important;
      clip: rect(1px, 1px, 1px, 1px) !important;
      -webkit-clip-path: inset(50%) !important;
        clip-path: inset(50%) !important;
      height: 1px !important;
      margin: -1px !important;
      overflow: hidden !important;
      padding: 0 !important;
      position: absolute !important;
      width: 1px !important;
      white-space: nowrap !important;
    }
  `;
  fragment.appendChild(style);

  // Define media queries pattern
  const patterns = [
    'prefers-reduced-motion',
    'prefers-contrast',
    'prefers-color-scheme',
    'prefers-reduced-transparency',
    'prefers-reduced-data',
    'forced-colors',
  ];

  // Initialize results object
  const results = [];
  const blocked = [];

  // Scan all stylesheets
  function scanStyleSheets() {
    for (const sheet of document.styleSheets) {
      let rules;
      try {
        rules = sheet.cssRules;
      } catch {
        blocked.push(sheet.href || 'unknown stylesheet');
        continue;
      }
      if (!rules) continue;
      for (const rule of rules) {
        if (rule instanceof CSSMediaRule) {
          if (patterns.some((p) => rule.conditionText.includes(p))) {
            results.push({
              media: rule.conditionText,
              source: sheet.href || 'inline style',
            });
          }
        }
      }
    }
  }

  // Build results HTML
  function updateResults() {
    let html = '';
    if (results.length === 0) {
      html += `<p>${messages.ui.noResults}</p>`;
    } else {
      html += `<p>${messages.ui.hasResults}</p><ul>`;
      results.forEach((r) => {
        html += `<li>${r.media}: ${r.source}</li>`;
      });
      html += '</ul>';
    }
    if (blocked.length) {
      html += `<p>${messages.ui.blocked}</p><ul>`;
      blocked.forEach((u) => (html += `<li>${u}</li>`));
      html += '</ul>';
    }
    return html;
  }

  scanStyleSheets();
  const resultsHTML = updateResults();

  // Display results panel
  const panel = document.createElement('div');
  panel.className = 'scan-panel';
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-modal', 'true');
  panel.setAttribute('aria-labelledby', 'scan-panel-title');
  panel.setAttribute('aria-live', 'polite');
  panel.setAttribute('aria-keyshortcuts', 'Escape');
  panel.innerHTML = `
    <p id="scan-panel-title">${messages.ui.panelTitle}</p>
    ${resultsHTML}
    <div class="scan-footer">
      <button class="scan-btn" id="scan-cleanup">
        ${messages.buttons.close}
        <span class="visually-hidden">${messages.buttons.screenReaderLabels.panel}</span>
      </button>
      <button class="scan-btn" id="scan-theme">
        ${messages.buttons.darkLight}
        <span class="visually-hidden">${messages.buttons.screenReaderLabels.mode}</span>
      </button>
    </div>
    <p><small>${messages.ui.escapeHint}</small></p>
  `;
  fragment.appendChild(panel);

  // Add complete fragment to DOM
  requestAnimationFrame(() => {
    document.body.insertBefore(fragment, document.body.firstChild);

    const panel = document.querySelector('.scan-panel');

    // Focus
    if (panel) {
      const firstButton = panel.querySelector('button');
      if (firstButton) {
        firstButton.focus();
      }

      // Escape shortcut
      panel.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          cleanup();
          document.activeElement?.blur();
        }
      });
    }

    // Add event listeners after elements are in DOM
    // Initialize states
    let isDarkMode = false;

    // Handle theme toggle
    const themeButton = document.getElementById('scan-theme');
    if (themeButton) {
      themeButton.setAttribute('aria-pressed', 'false'); // Initial state
      themeButton.addEventListener('click', () => {
        isDarkMode = !isDarkMode;
        themeButton.setAttribute('aria-pressed', isDarkMode ? 'true' : 'false');

        requestAnimationFrame(() => {
          document.body.classList.toggle('scan-dark');
        });
      });
    }

    // Handle cleanup button
    const cleanupButton = document.getElementById('scan-cleanup');
    if (cleanupButton) {
      cleanupButton.addEventListener('click', cleanup);
    }
  });
})();
