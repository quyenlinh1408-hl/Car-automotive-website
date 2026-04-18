/**
 * Authentication Module
 * Quản lý login, logout, token verification, và user session
 */

const Auth = {
  /**
   * Get current user from localStorage
   */
  getCurrentUser() {
    try {
      const userStr = localStorage.getItem('user');
      return userStr ? JSON.parse(userStr) : null;
    } catch {
      return null;
    }
  },

  /**
   * Get JWT token from localStorage
   */
  getToken() {
    return localStorage.getItem('token');
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated() {
    return !!this.getToken() && !!this.getCurrentUser();
  },

  /**
   * Check if user is Admin
   */
  isAdmin() {
    const user = this.getCurrentUser();
    return user && user.role === 'admin';
  },

  /**
   * Verify token validity with backend
   */
  async verifyToken() {
    const token = this.getToken();
    if (!token) return false;

    try {
      const response = await fetch('/api/auth/verify-token', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      return response.ok;
    } catch {
      return false;
    }
  },

  /**
   * Logout user
   */
  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('translationHistory');
    window.location.href = 'login.html';
  },

  /**
   * Get user initials for avatar
   */
  getUserInitials() {
    const user = this.getCurrentUser();
    if (!user) return '?';
    const names = user.fullname.split(' ');
    return names.map(n => n[0]).join('').toUpperCase();
  },

  /**
   * Format user greeting based on time of day
   */
  getGreeting() {
    const hours = new Date().getHours();
    if (hours < 12) return 'Chào buổi sáng';
    if (hours < 18) return 'Chào buổi chiều';
    return 'Chào buổi tối';
  },

  /**
   * Add authorization header to fetch requests
   */
  getAuthHeaders() {
    const token = this.getToken();
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  },

  /**
   * Check authentication on page load
   */
  async checkAuthOnLoad() {
    if (!this.isAuthenticated()) {
      window.location.href = 'login.html';
      return false;
    }

    // Verify token is still valid
    const isValid = await this.verifyToken();
    if (!isValid) {
      this.logout();
      return false;
    }

    return true;
  },

  /**
   * Create user profile dropdown in header
   */
  createUserDropdown() {
    const user = this.getCurrentUser();
    if (!user) return '';

    const initials = this.getUserInitials();
    const greeting = this.getGreeting();

    return `
      <div class="user-profile-dropdown">
        <button class="user-profile-btn" onclick="Auth.toggleDropdown()">
          <div class="user-avatar">${initials}</div>
          <span class="user-name">${user.fullname}</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M6 9l6 6 6-6"/>
          </svg>
        </button>
        
        <div class="user-dropdown-menu hidden" id="userDropdownMenu">
          <div class="dropdown-header">
            <div class="dropdown-user-info">
              <div class="dropdown-avatar">${initials}</div>
              <div>
                <div class="dropdown-name">${user.fullname}</div>
                <div class="dropdown-role">${user.role === 'admin' ? '👑 Lead Admin' : '📝 người dùng'}</div>
              </div>
            </div>
          </div>
          
          <div class="dropdown-divider"></div>
          
          <a class="dropdown-item" href="profile.html">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
            Hồ sơ cá nhân
          </a>
          
          <a class="dropdown-item" href="history.html">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
            Lịch sử dịch
          </a>
          
          ${user.role === 'admin' ? `
            <a class="dropdown-item" href="approval-users.html">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M23 11a4 4 0 0 1-4 4"></path>
                <path d="M23 7a4 4 0 0 0-4-4"></path>
              </svg>
              Duyệt tài khoản
            </a>
          ` : ''}
          
          <div class="dropdown-divider"></div>
          
          <button class="dropdown-item dropdown-logout" onclick="Auth.logout()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
            Đăng xuất
          </button>
        </div>
      </div>
    `;
  },

  /**
   * Toggle user dropdown menu
   */
  toggleDropdown() {
    const menu = document.getElementById('userDropdownMenu');
    if (menu) {
      menu.classList.toggle('hidden');
    }
  },

  /**
   * Close dropdown when clicking outside
   */
  initDropdownClickHandler() {
    document.addEventListener('click', (e) => {
      const dropdown = document.querySelector('.user-profile-dropdown');
      if (dropdown && !dropdown.contains(e.target)) {
        const menu = document.getElementById('userDropdownMenu');
        if (menu) menu.classList.add('hidden');
      }
    });
  },

  /**
   * Save translation to user history
   */
  saveTranslationToHistory(translation) {
    const user = this.getCurrentUser();
    if (!user) return;

    let history = JSON.parse(localStorage.getItem('translationHistory') || '{}');
    if (!history[user.id]) {
      history[user.id] = [];
    }

    history[user.id].push({
      id: Date.now().toString(),
      sourceText: translation.sourceText,
      sourceLanguage: translation.sourceLanguage,
      translations: translation.translations,
      timestamp: new Date().toISOString()
    });

    // Keep only last 100 translations
    if (history[user.id].length > 100) {
      history[user.id] = history[user.id].slice(-100);
    }

    localStorage.setItem('translationHistory', JSON.stringify(history));

    // Also sync with backend
    this.syncTranslationToBackend(translation);
  },

  /**
   * Get user translation history
   */
  getTranslationHistory() {
    const user = this.getCurrentUser();
    if (!user) return [];

    const history = JSON.parse(localStorage.getItem('translationHistory') || '{}');
    return history[user.id] || [];
  },

  /**
   * Sync translation to backend for persistence
   */
  async syncTranslationToBackend(translation) {
    const token = this.getToken();
    if (!token) return;

    try {
      await fetch('/api/user/translation-history', {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(translation)
      });
    } catch (error) {
      console.error('Failed to sync translation history:', error);
    }
  },

  /**
   * Get user translation history from backend
   */
  async getTranslationHistoryFromBackend() {
    const token = this.getToken();
    if (!token) return [];

    try {
      const response = await fetch('/api/user/translation-history', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        return data.history || [];
      }
    } catch (error) {
      console.error('Failed to fetch translation history:', error);
    }

    return [];
  },

  /**
   * Save vocabulary/term to "Từ vựng của tôi"
   */
  saveVocabulary(term) {
    const user = this.getCurrentUser();
    if (!user) return false;

    let vocabulary = JSON.parse(localStorage.getItem('vocabulary') || '{}');
    if (!vocabulary[user.id]) {
      vocabulary[user.id] = [];
    }

    // Check if term already exists
    const exists = vocabulary[user.id].some(v => v.english === term.english);
    if (exists) return false; // Already saved

    vocabulary[user.id].push({
      id: Date.now().toString(),
      english: term.english,
      vietnamese: term.vietnamese,
      japanese: term.japanese,
      chinese: term.chinese_simplified,
      savedAt: new Date().toISOString()
    });

    localStorage.setItem('vocabulary', JSON.stringify(vocabulary));
    
    // Sync with backend
    this.syncVocabularyToBackend(term);
    return true;
  },

  /**
   * Remove vocabulary from saved list
   */
  removeVocabulary(termId) {
    const user = this.getCurrentUser();
    if (!user) return;

    let vocabulary = JSON.parse(localStorage.getItem('vocabulary') || '{}');
    if (vocabulary[user.id]) {
      vocabulary[user.id] = vocabulary[user.id].filter(v => v.id !== termId);
      localStorage.setItem('vocabulary', JSON.stringify(vocabulary));
    }
  },

  /**
   * Get user's saved vocabulary
   */
  getVocabulary() {
    const user = this.getCurrentUser();
    if (!user) return [];

    const vocabulary = JSON.parse(localStorage.getItem('vocabulary') || '{}');
    return vocabulary[user.id] || [];
  },

  /**
   * Check if term is saved
   */
  isVocabularySaved(englishTerm) {
    const vocabulary = this.getVocabulary();
    return vocabulary.some(v => v.english === englishTerm);
  },

  /**
   * Sync vocabulary to backend for persistence
   */
  async syncVocabularyToBackend(term) {
    const token = this.getToken();
    if (!token) return;

    try {
      await fetch('/api/user/vocabulary', {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(term)
      });
    } catch (error) {
      console.error('Failed to sync vocabulary:', error);
    }
  }
};

// Auto-initialize authentication on page load if needed
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    Auth.initDropdownClickHandler();
  });
} else {
  Auth.initDropdownClickHandler();
}
