import * as vscode from 'vscode';

export class WebviewPanel {
  /**
   * Generate HTML for the webview
   */
  getHtml(): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>RepoLens</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      padding: 0;
      font-family: var(--vscode-font-family);
      color: var(--vscode-foreground);
      background-color: var(--vscode-sideBar-background);
      font-size: 13px;
      height: 100vh;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }
    .header {
      padding: 20px;
      background: var(--vscode-sideBarSectionHeader-background);
      border-bottom: 1px solid var(--vscode-sideBarSectionHeader-border);
      flex-shrink: 0;
    }
    .header h1 {
      font-size: 20px;
      font-weight: 600;
      margin-bottom: 6px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .header .tagline {
      font-size: 12px;
      color: var(--vscode-descriptionForeground);
      font-weight: normal;
    }
    .content {
      padding: 16px;
      overflow-y: auto;
      flex: 1;
    }
    .content::-webkit-scrollbar {
      width: 10px;
    }
    .content::-webkit-scrollbar-track {
      background: var(--vscode-scrollbarSlider-background);
    }
    .content::-webkit-scrollbar-thumb {
      background: var(--vscode-scrollbarSlider-hoverBackground);
      border-radius: 5px;
    }
    .content::-webkit-scrollbar-thumb:hover {
      background: var(--vscode-scrollbarSlider-activeBackground);
    }
    h2 {
      font-size: 14px;
      font-weight: 600;
      margin-bottom: 12px;
      color: var(--vscode-foreground);
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .input-group {
      margin-bottom: 16px;
    }
    input {
      width: 100%;
      padding: 8px 10px;
      background: var(--vscode-input-background);
      color: var(--vscode-input-foreground);
      border: 1px solid var(--vscode-input-border);
      border-radius: 4px;
      font-size: 13px;
      font-family: var(--vscode-font-family);
    }
    input:focus {
      outline: 1px solid var(--vscode-focusBorder);
      border-color: var(--vscode-focusBorder);
    }
    input::placeholder {
      color: var(--vscode-input-placeholderForeground);
    }
    button {
      width: 100%;
      padding: 8px 16px;
      background: var(--vscode-button-background);
      color: var(--vscode-button-foreground);
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 13px;
      font-weight: 500;
      font-family: var(--vscode-font-family);
      transition: background 0.1s;
    }
    button:hover:not(:disabled) {
      background: var(--vscode-button-hoverBackground);
    }
    button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    .secondary-btn {
      background: var(--vscode-button-secondaryBackground);
      color: var(--vscode-button-secondaryForeground);
      margin-top: 12px;
      margin-right: 8px;
      width: auto;
      display: inline-block;
    }
    .secondary-btn:hover:not(:disabled) {
      background: var(--vscode-button-secondaryHoverBackground);
    }
    .action-buttons {
      margin-top: 16px;
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }
    .section {
      margin-bottom: 12px;
      background: var(--vscode-editor-background);
      border: 1px solid var(--vscode-panel-border);
      border-radius: 6px;
      overflow: hidden;
    }
    .section-header {
      padding: 12px 16px;
      background: var(--vscode-sideBarSectionHeader-background);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: space-between;
      user-select: none;
      transition: background 0.1s;
    }
    .section-header:hover {
      background: var(--vscode-list-hoverBackground);
    }
    .section-header h2 {
      margin: 0;
      font-size: 13px;
    }
    .section-toggle {
      font-size: 16px;
      transition: transform 0.2s;
    }
    .section-toggle.collapsed {
      transform: rotate(-90deg);
    }
    .section-content {
      padding: 16px;
      max-height: 500px;
      overflow-y: auto;
      transition: max-height 0.3s ease;
    }
    .section-content::-webkit-scrollbar {
      width: 8px;
    }
    .section-content::-webkit-scrollbar-track {
      background: var(--vscode-scrollbarSlider-background);
    }
    .section-content::-webkit-scrollbar-thumb {
      background: var(--vscode-scrollbarSlider-hoverBackground);
      border-radius: 4px;
    }
    .section-content.collapsed {
      max-height: 0;
      padding: 0 16px;
      overflow: hidden;
    }
    .output {
      font-size: 12px;
      line-height: 1.6;
      white-space: pre-wrap;
      word-wrap: break-word;
    }
    .metadata-grid {
      display: grid;
      gap: 12px;
      margin-bottom: 16px;
    }
    .metadata-card {
      background: var(--vscode-sideBarSectionHeader-background);
      padding: 12px 16px;
      border-radius: 6px;
      border-left: 3px solid var(--vscode-button-background);
    }
    .metadata-label {
      font-size: 11px;
      text-transform: uppercase;
      color: var(--vscode-descriptionForeground);
      font-weight: 600;
      margin-bottom: 6px;
      letter-spacing: 0.5px;
    }
    .metadata-value {
      font-size: 16px;
      font-weight: 600;
      color: var(--vscode-foreground);
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .metadata-value.large {
      font-size: 20px;
    }
    .metadata-description {
      font-size: 13px;
      line-height: 1.5;
      color: var(--vscode-foreground);
      margin-bottom: 16px;
      padding: 12px;
      background: var(--vscode-textCodeBlock-background);
      border-radius: 4px;
    }
    .metadata-section {
      margin-bottom: 20px;
    }
    .metadata-section-title {
      font-size: 12px;
      font-weight: 600;
      color: var(--vscode-textLink-foreground);
      margin-bottom: 12px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .metadata-text {
      font-size: 12px;
      line-height: 1.6;
      color: var(--vscode-foreground);
    }
    .metadata-list {
      list-style: none;
      padding: 0;
      margin: 0;
    }
    .metadata-list li {
      padding: 6px 0;
      font-size: 12px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .metadata-list li::before {
      content: "•";
      color: var(--vscode-button-background);
      font-weight: bold;
      font-size: 16px;
    }
    .star-rating {
      display: flex;
      gap: 2px;
      font-size: 16px;
    }
    .risk-badge {
      display: inline-block;
      padding: 3px 8px;
      border-radius: 3px;
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-left: 8px;
    }
    .risk-high {
      background: #f44336;
      color: white;
    }
    .risk-moderate {
      background: #ff9800;
      color: white;
    }
    .risk-low {
      background: #4caf50;
      color: white;
    }
    .security-item {
      margin-bottom: 16px;
      padding: 12px;
      background: var(--vscode-textCodeBlock-background);
      border-radius: 4px;
      border-left: 3px solid var(--vscode-panel-border);
    }
    .security-item.high {
      border-left-color: #f44336;
    }
    .security-item.moderate {
      border-left-color: #ff9800;
    }
    .security-item.low {
      border-left-color: #4caf50;
    }
    .security-file {
      font-weight: 600;
      font-size: 12px;
      margin-bottom: 6px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .security-description {
      font-size: 11px;
      color: var(--vscode-descriptionForeground);
      line-height: 1.4;
      display: -webkit-box;
      -webkit-line-clamp: 3;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
    .chat-container {
      max-height: 400px;
      overflow-y: auto;
      margin-bottom: 12px;
      padding: 12px;
      background: var(--vscode-textCodeBlock-background);
      border-radius: 4px;
    }
    .chat-container::-webkit-scrollbar {
      width: 8px;
    }
    .chat-container::-webkit-scrollbar-track {
      background: var(--vscode-scrollbarSlider-background);
    }
    .chat-container::-webkit-scrollbar-thumb {
      background: var(--vscode-scrollbarSlider-hoverBackground);
      border-radius: 4px;
    }
    .chat-message {
      margin-bottom: 16px;
      padding-bottom: 16px;
      border-bottom: 1px solid var(--vscode-panel-border);
    }
    .chat-message:last-child {
      border-bottom: none;
      margin-bottom: 0;
      padding-bottom: 0;
    }
    .chat-question {
      font-weight: 600;
      color: var(--vscode-textLink-foreground);
      margin-bottom: 8px;
    }
    .chat-answer {
      color: var(--vscode-foreground);
      font-size: 12px;
      line-height: 1.6;
    }
    .button-group {
      display: flex;
      gap: 8px;
      margin-top: 12px;
    }
    .button-group button {
      flex: 1;
    }
    .clear-btn {
      background: var(--vscode-button-secondaryBackground);
      color: var(--vscode-button-secondaryForeground);
    }
    .clear-btn:hover:not(:disabled) {
      background: var(--vscode-button-secondaryHoverBackground);
    }
    .loading {
      padding: 32px 16px;
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 20px;
    }
    .loading-spinner {
      width: 48px;
      height: 48px;
      border: 4px solid var(--vscode-progressBar-background);
      border-top: 4px solid var(--vscode-button-background);
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }
    .loading-text {
      font-size: 16px;
      font-weight: 600;
      color: var(--vscode-foreground);
    }
    .loading-steps {
      width: 100%;
      max-width: 400px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin-top: 8px;
    }
    .loading-step {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 16px;
      background: var(--vscode-editor-background);
      border-radius: 6px;
      border-left: 3px solid var(--vscode-textBlockQuote-border);
      opacity: 0.5;
      transition: all 0.3s ease;
    }
    .loading-step.active {
      opacity: 1;
      border-left-color: var(--vscode-button-background);
      background: var(--vscode-list-hoverBackground);
    }
    .loading-step.completed {
      opacity: 0.7;
      border-left-color: #4caf50;
    }
    .loading-step .step-icon {
      font-size: 18px;
      min-width: 24px;
    }
    .loading-step.active .step-icon {
      animation: pulse 1.5s ease-in-out infinite;
    }
    .loading-step.completed .step-icon::before {
      content: "✅";
    }
    .loading-step .step-text {
      font-size: 13px;
      text-align: left;
    }
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    @keyframes pulse {
      0%, 100% { transform: scale(1); opacity: 1; }
      50% { transform: scale(1.2); opacity: 0.8; }
    }
    .error {
      color: var(--vscode-errorForeground);
      padding: 12px;
      background: var(--vscode-inputValidation-errorBackground);
      border: 1px solid var(--vscode-inputValidation-errorBorder);
      border-radius: 4px;
      margin: 12px 0;
      font-size: 12px;
    }
    .error::before {
      content: "⚠️ ";
    }
    code {
      background: var(--vscode-textCodeBlock-background);
      padding: 2px 6px;
      border-radius: 3px;
      font-family: var(--vscode-editor-font-family);
      font-size: 12px;
    }
    pre {
      background: var(--vscode-textCodeBlock-background);
      padding: 12px;
      border-radius: 4px;
      overflow-x: auto;
      font-size: 12px;
    }
    .hidden {
      display: none;
    }
    ul {
      margin-left: 20px;
      margin-top: 8px;
    }
    li {
      margin-bottom: 4px;
    }
    .provider-badge {
      display: inline-block;
      padding: 4px 10px;
      background: var(--vscode-badge-background);
      color: var(--vscode-badge-foreground);
      border-radius: 12px;
      font-size: 11px;
      font-weight: 600;
      margin-bottom: 12px;
    }
    h2, h3, h4 {
      margin-top: 16px;
      margin-bottom: 8px;
    }
    h3 {
      font-size: 13px;
      font-weight: 600;
    }
    h4 {
      font-size: 12px;
      font-weight: 600;
    }
    p {
      margin-bottom: 12px;
      line-height: 1.6;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>🔍 RepoLens</h1>
    <div class="tagline">Understand Before You Run</div>
  </div>

  <div class="content">
    <div id="currentRepoSection" class="section hidden">
      <h2>📂 Current Repository</h2>
      <div id="currentRepoInfo" class="output"></div>
      <button id="analyzeCurrentBtn" class="secondary-btn" style="width: 100%; margin-top: 12px;">🔍 Analyze with CLI</button>
    </div>

    <div class="input-group">
      <input 
        type="text" 
        id="repoUrl" 
        placeholder="https://github.com/owner/repo"
      />
      <button id="analyzeBtn">🔍 Analyze Repository</button>
    </div>

    <div id="loading" class="loading hidden">
      <div class="loading-spinner"></div>
      <div class="loading-text">Analyzing repository...</div>
      <div class="loading-steps">
        <div class="loading-step" id="step1">
          <span class="step-icon">⏳</span>
          <span class="step-text">Fetching repository data...</span>
        </div>
        <div class="loading-step" id="step2">
          <span class="step-icon">⏳</span>
          <span class="step-text">Analyzing code structure...</span>
        </div>
        <div class="loading-step" id="step3">
          <span class="step-icon">⏳</span>
          <span class="step-text">Scanning for security issues...</span>
        </div>
        <div class="loading-step" id="step4">
          <span class="step-icon">⏳</span>
          <span class="step-text">Generating AI insights...</span>
        </div>
      </div>
    </div>
    <div id="error" class="error hidden"></div>

    <div id="results" class="hidden">
      <div class="provider-badge hidden" id="providerBadge">AI Provider</div>
      
      <div class="section" id="askSection">
        <div class="section-header" onclick="toggleSection('ask')">
          <h2>💬 Ask Questions</h2>
          <span class="section-toggle" id="ask-toggle">▼</span>
        </div>
        <div class="section-content" id="ask-content">
          <div id="chatHistory" class="chat-container hidden"></div>
          <input 
            type="text" 
            id="questionInput" 
            placeholder="e.g., Does this make network requests?"
          />
          <div class="button-group">
            <button id="askBtn">💬 Ask</button>
            <button id="clearChatBtn" class="clear-btn">🗑️ Clear</button>
          </div>
        </div>
      </div>

      <div class="section" id="summarySection">
        <div class="section-header" onclick="toggleSection('summary')">
          <h2>📋 Repository Overview</h2>
          <span class="section-toggle collapsed" id="summary-toggle">▶</span>
        </div>
        <div class="section-content collapsed" id="summary-content">
          <div id="repoMetadata"></div>
          <div id="summary" class="output"></div>
        </div>
      </div>

      <div class="section" id="setupSection">
        <div class="section-header" onclick="toggleSection('setup')">
          <h2>⚙️ Setup Instructions</h2>
          <span class="section-toggle" id="setup-toggle">▼</span>
        </div>
        <div class="section-content" id="setup-content">
          <div id="setup" class="output"></div>
          <div class="action-buttons">
            <button id="quickSetupBtn" class="secondary-btn">🚀 Quick Setup (Clone & Install)</button>
            <button id="openTerminalBtn" class="secondary-btn">💻 Open in Terminal</button>
          </div>
        </div>
      </div>

      <div class="section" id="securitySection">
        <div class="section-header" onclick="toggleSection('security')">
          <h2>🔒 Security Analysis</h2>
          <span class="section-toggle collapsed" id="security-toggle">▶</span>
        </div>
        <div class="section-content collapsed" id="security-content">
          <div id="security" class="output"></div>
        </div>
      </div>
    </div>
  </div>

  <script>
    const vscode = acquireVsCodeApi();
    let chatHistory = [];

    function toggleSection(sectionId) {
      const content = document.getElementById(sectionId + '-content');
      const toggle = document.getElementById(sectionId + '-toggle');
      
      if (content.classList.contains('collapsed')) {
        content.classList.remove('collapsed');
        toggle.classList.remove('collapsed');
        toggle.textContent = '▼';
      } else {
        content.classList.add('collapsed');
        toggle.classList.add('collapsed');
        toggle.textContent = '▶';
      }
    }

    function addChatMessage(question, answer) {
      chatHistory.push({ question, answer });
      
      const chatContainer = document.getElementById('chatHistory');
      chatContainer.classList.remove('hidden');
      
      const messageDiv = document.createElement('div');
      messageDiv.className = 'chat-message';
      messageDiv.innerHTML = 
        '<div class="chat-question">Q: ' + escapeHtml(question) + '</div>' +
        '<div class="chat-answer">' + formatMarkdown(answer) + '</div>';
      
      chatContainer.appendChild(messageDiv);
      chatContainer.scrollTop = chatContainer.scrollHeight;
    }

    function clearChat() {
      chatHistory = [];
      const chatContainer = document.getElementById('chatHistory');
      chatContainer.innerHTML = '';
      chatContainer.classList.add('hidden');
      document.getElementById('questionInput').value = '';
    }

    function escapeHtml(text) {
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    }

    function renderMetadata(metadata) {
      if (!metadata || !metadata.name) {
        return '';
      }

      const formatNumber = (num) => {
        if (num >= 1000) {
          return (num / 1000).toFixed(1) + 'k';
        }
        return num.toString();
      };

      const getBeginnerFriendly = (stars, forks) => {
        const score = Math.min(5, Math.floor((stars / 10000) + (forks / 1000)));
        let rating = '';
        for (let i = 0; i < 5; i++) {
          rating += i < score ? '⭐' : '☆';
        }
        return rating;
      };

      let html = '';
      
      // Repository name and description
      html += '<div class="metadata-description">';
      html += '<strong>' + escapeHtml(metadata.fullName || metadata.name) + '</strong><br>';
      html += escapeHtml(metadata.description || 'No description available');
      html += '</div>';

      // Stats grid
      html += '<div class="metadata-grid">';
      
      html += '<div class="metadata-card">';
      html += '<div class="metadata-label">Language</div>';
      html += '<div class="metadata-value">' + escapeHtml(metadata.language || 'Unknown') + '</div>';
      html += '</div>';

      html += '<div class="metadata-card">';
      html += '<div class="metadata-label">Stars</div>';
      html += '<div class="metadata-value large">⭐ ' + formatNumber(metadata.stars || 0) + '</div>';
      html += '</div>';

      html += '<div class="metadata-card">';
      html += '<div class="metadata-label">Forks</div>';
      html += '<div class="metadata-value large">🔱 ' + formatNumber(metadata.forks || 0) + '</div>';
      html += '</div>';

      html += '<div class="metadata-card">';
      html += '<div class="metadata-label">Beginner Friendly</div>';
      html += '<div class="metadata-value star-rating">' + getBeginnerFriendly(metadata.stars || 0, metadata.forks || 0) + '</div>';
      html += '</div>';

      html += '</div>';

      // Purpose section
      if (metadata.description) {
        html += '<div class="metadata-section">';
        html += '<div class="metadata-section-title">Purpose</div>';
        html += '<div class="metadata-text">' + escapeHtml(metadata.description) + '</div>';
        html += '</div>';
      }

      // Additional info
      html += '<div class="metadata-section">';
      html += '<div class="metadata-section-title">Additional Information</div>';
      html += '<ul class="metadata-list">';
      html += '<li>License: ' + escapeHtml(metadata.license || 'No license') + '</li>';
      html += '<li>Open Issues: ' + (metadata.openIssues || 0) + '</li>';
      if (metadata.homepage) {
        html += '<li>Homepage: <a href="' + metadata.homepage + '">' + metadata.homepage + '</a></li>';
      }
      html += '</ul>';
      html += '</div>';

      return html;
    }

    function renderSecurityFindings(findings) {
      if (!findings || !findings.flaggedFiles || findings.flaggedFiles.length === 0) {
        return '<div class="metadata-text">✅ No security issues detected</div>';
      }

      const getRiskClass = (reason) => {
        const highRisk = ['eval()', 'exec()', 'shell execution', 'Binary executable', 'Destructive'];
        const moderateRisk = ['subprocess', 'child_process', 'network requests'];
        
        if (highRisk.some(r => reason.includes(r))) return 'high';
        if (moderateRisk.some(r => reason.includes(r))) return 'moderate';
        return 'low';
      };

      const getRiskLabel = (riskClass) => {
        if (riskClass === 'high') return '<span class="risk-badge risk-high">HIGH</span>';
        if (riskClass === 'moderate') return '<span class="risk-badge risk-moderate">MODERATE</span>';
        return '<span class="risk-badge risk-low">LOW</span>';
      };

      let html = '<div class="metadata-text" style="margin-bottom: 16px;">';
      html += '<strong>Overall Risk: </strong>';
      html += getRiskLabel(findings.riskLevel.toLowerCase());
      html += ' - Found ' + findings.flaggedFiles.length + ' potential issue(s)';
      html += '</div>';

      // Group by file
      const fileMap = {};
      findings.flaggedFiles.forEach(item => {
        if (!fileMap[item.file]) {
          fileMap[item.file] = [];
        }
        fileMap[item.file].push(item.reason);
      });

      // Render each file
      Object.entries(fileMap).forEach(([file, reasons]) => {
        const riskClass = getRiskClass(reasons[0]);
        html += '<div class="security-item ' + riskClass + '">';
        html += '<div class="security-file">';
        html += '<span>' + escapeHtml(file) + '</span>';
        html += getRiskLabel(riskClass);
        html += '</div>';
        html += '<div class="security-description">';
        html += reasons.map(r => '• ' + escapeHtml(r)).join('<br>');
        html += '</div>';
        html += '</div>';
      });

      return html;
    }

    document.getElementById('analyzeBtn').addEventListener('click', () => {
      const url = document.getElementById('repoUrl').value.trim();
      if (!url) {
        showError('Please enter a GitHub repository URL');
        return;
      }

      showLoading();
      hideError();
      hideResults();
      clearChat();

      vscode.postMessage({
        command: 'analyze',
        url: url
      });
    });

    document.getElementById('askBtn').addEventListener('click', () => {
      const question = document.getElementById('questionInput').value.trim();
      if (!question) {
        showError('Please enter a question');
        return;
      }

      document.getElementById('askBtn').disabled = true;

      vscode.postMessage({
        command: 'ask',
        question: question
      });
    });

    document.getElementById('clearChatBtn').addEventListener('click', () => {
      clearChat();
    });

    document.getElementById('questionInput').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        document.getElementById('askBtn').click();
      }
    });

    document.getElementById('quickSetupBtn').addEventListener('click', () => {
      vscode.postMessage({
        command: 'quickSetup'
      });
    });

    document.getElementById('openTerminalBtn').addEventListener('click', () => {
      vscode.postMessage({
        command: 'openTerminal'
      });
    });

    document.getElementById('analyzeCurrentBtn').addEventListener('click', () => {
      vscode.postMessage({
        command: 'analyzeCurrentRepo'
      });
    });

    window.addEventListener('message', event => {
      const message = event.data;

      switch (message.command) {
        case 'showCurrentRepo':
          const currentRepoSection = document.getElementById('currentRepoSection');
          const currentRepoInfo = document.getElementById('currentRepoInfo');
          currentRepoInfo.innerHTML = 
            '<p><strong>Repository:</strong> ' + message.repoName + '</p>' +
            '<p><strong>Path:</strong> <code>' + message.repoPath + '</code></p>' +
            '<p style="margin-top: 12px; color: var(--vscode-descriptionForeground);">' +
            'Click "Analyze with CLI" to start interactive analysis in the terminal.' +
            '</p>';
          currentRepoSection.classList.remove('hidden');
          break;

        case 'progress':
          updateProgress(message.step);
          break;

        case 'analysisComplete':
          hideLoading();
          showResults();
          
          // Show provider badge
          if (message.provider) {
            document.getElementById('providerBadge').textContent = message.provider;
            document.getElementById('providerBadge').classList.remove('hidden');
          }
          
          // Render metadata
          if (message.metadata) {
            document.getElementById('repoMetadata').innerHTML = renderMetadata(message.metadata);
          }
          
          document.getElementById('summary').innerHTML = formatMarkdown(message.summary);
          document.getElementById('setup').innerHTML = formatMarkdown(message.setup);
          
          // Render security findings
          if (message.securityFindings) {
            document.getElementById('security').innerHTML = renderSecurityFindings(message.securityFindings);
          } else {
            document.getElementById('security').innerHTML = formatMarkdown(message.security);
          }
          break;

        case 'analysisError':
          hideLoading();
          showError(message.error);
          break;

        case 'answerReady':
          const question = document.getElementById('questionInput').value.trim();
          addChatMessage(question, message.answer);
          document.getElementById('questionInput').value = '';
          document.getElementById('askBtn').disabled = false;
          break;

        case 'answerError':
          showError(message.error);
          document.getElementById('askBtn').disabled = false;
          break;
      }
    });

    function showLoading() {
      document.getElementById('loading').classList.remove('hidden');
    }

    function hideLoading() {
      document.getElementById('loading').classList.add('hidden');
    }

    function showError(message) {
      const errorDiv = document.getElementById('error');
      errorDiv.textContent = message;
      errorDiv.classList.remove('hidden');
    }

    function hideError() {
      document.getElementById('error').classList.add('hidden');
    }

    function showResults() {
      document.getElementById('results').classList.remove('hidden');
    }

    function hideResults() {
      document.getElementById('results').classList.add('hidden');
    }

    function updateProgress(step) {
      const steps = ['step1', 'step2', 'step3', 'step4'];
      const stepIndex = step - 1;
      
      // Mark previous steps as completed
      for (let i = 0; i < stepIndex; i++) {
        const stepEl = document.getElementById(steps[i]);
        stepEl.classList.remove('active');
        stepEl.classList.add('completed');
      }
      
      // Mark current step as active
      if (stepIndex < steps.length) {
        const currentStep = document.getElementById(steps[stepIndex]);
        currentStep.classList.add('active');
        currentStep.classList.remove('completed');
      }
    }

    function formatMarkdown(text) {
      // Simple markdown formatting with better structure
      let formatted = text
        // Headers
        .replace(/^#### (.*$)/gim, '<h4>$1</h4>')
        .replace(/^### (.*$)/gim, '<h3>$1</h3>')
        .replace(/^## (.*$)/gim, '<h2>$1</h2>')
        .replace(/^# (.*$)/gim, '<h2>$1</h2>')
        // Bold and italic
        .replace(/\\*\\*(.+?)\\*\\*/g, '<strong>$1</strong>')
        .replace(/\\*(.+?)\\*/g, '<em>$1</em>')
        // Code blocks (triple backticks)
        .replace(/\\\`\\\`\\\`[\\s\\S]*?\\\`\\\`\\\`/g, function(match) {
          return '<pre><code>' + match.slice(3, -3) + '</code></pre>';
        })
        // Inline code (single backticks)
        .replace(/\\\`(.+?)\\\`/g, '<code>$1</code>')
        // Lists
        .replace(/^\\* (.*)$/gim, '<li>$1</li>')
        .replace(/^- (.*)$/gim, '<li>$1</li>')
        // Wrap consecutive list items in ul
        .replace(/(<li>.*<\\/li>\\n?)+/g, '<ul>$&</ul>')
        // Line breaks
        .replace(/\\n\\n/g, '</p><p>')
        .replace(/\\n/g, '<br>');
      
      return '<p>' + formatted + '</p>';
    }
  </script>
</body>
</html>`;
  }
}
