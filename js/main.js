import { changeLanguage } from './i18n.js';
import { applyThemePolicy } from './theme.js';

document.addEventListener('DOMContentLoaded', () => {
    // 1. Initialize Theme Policy
    applyThemePolicy();

    // 2. Elements
    const html = document.documentElement;
    const themeToggle = document.getElementById('theme-toggle');
    const dyslexicToggle = document.getElementById('dyslexic-toggle');
    const langSelect = document.getElementById('lang-select');
    const navToggle = document.querySelector('[data-nav-toggle]');
    const logoutBtns = document.querySelectorAll('[data-logout]');

    // 3. Theme Toggle
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            const current = html.getAttribute('data-theme');
            const next = current === 'dark' ? 'light' : 'dark';
            html.setAttribute('data-theme', next);
            localStorage.setItem('app-theme', next);
        });
    }

    // 4. Dyslexic Font Toggle
    if (dyslexicToggle) {
        dyslexicToggle.addEventListener('click', () => {
            const isDyslexic = html.getAttribute('data-font') === 'dyslexic';
            if (isDyslexic) {
                html.removeAttribute('data-font');
                dyslexicToggle.setAttribute('aria-pressed', 'false');
            } else {
                html.setAttribute('data-font', 'dyslexic');
                dyslexicToggle.setAttribute('aria-pressed', 'true');
            }
        });
    }

    // 5. Language Selection
    if (langSelect) {
        langSelect.addEventListener('change', (e) => {
            if (typeof changeLanguage === 'function') {
                changeLanguage(e.target.value);
            }
        });
    }

    // 6. Mobile Navigation
    if (navToggle) {
        navToggle.addEventListener('click', () => {
            document.body.classList.toggle('nav-open');
            const expanded = navToggle.getAttribute('aria-expanded') === 'true';
            navToggle.setAttribute('aria-expanded', !expanded);
        });
    }

    // 7. Logout
    logoutBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem('app-user-type');
            localStorage.removeItem('user_role');
            localStorage.removeItem('demo_session');
            window.location.href = '../index.html';
        });
    });

    // 8. Simplify Button (for Dashboard)
    const simplifyBtns = document.querySelectorAll('[data-simplify]');
    simplifyBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetId = btn.getAttribute('data-target');
            if (targetId) {
                const targetEl = document.getElementById(targetId);
                if (targetEl) {
                    const isSimplified = targetEl.hasAttribute('data-is-simplified');
                    if (isSimplified) {
                        targetEl.textContent = targetEl.getAttribute('data-original');
                        targetEl.removeAttribute('data-is-simplified');
                    } else {
                        targetEl.textContent = targetEl.getAttribute('data-simplified');
                        targetEl.setAttribute('data-is-simplified', 'true');
                    }
                }
            }
        });
    });

    // 9. Task Toggle
    const taskToggles = document.querySelectorAll('[data-task-toggle]');
    taskToggles.forEach(btn => {
        btn.addEventListener('click', () => {
            const card = btn.closest('.task-card');
            if (card) {
                const isDone = card.classList.contains('is-done');
                if (isDone) {
                    card.classList.remove('is-done');
                    btn.textContent = 'Completar';
                    const prog = card.querySelector('progress');
                    if(prog) prog.value = parseInt(prog.getAttribute('data-orig-val') || 0);
                } else {
                    card.classList.add('is-done');
                    btn.textContent = 'Deshacer';
                    const prog = card.querySelector('progress');
                    if(prog) {
                        prog.setAttribute('data-orig-val', prog.value);
                        prog.value = prog.max;
                    }
                }
            }
        });
    });
});