import { changeLanguage } from './i18n.js';
import { initTheme } from './theme.js';

document.addEventListener('DOMContentLoaded', () => {
    // Initialize standard Theme & Dyslexic features
    initTheme();

    // --- Theme & Accessibility ---
    const html = document.documentElement;
    const langSelect = document.getElementById('lang-select');
    const contrastToggle = document.getElementById('contrast-toggle');
    const fontSizeSlider = document.getElementById('fontSize-slider');
    const hideImagesToggle = document.getElementById('hide-images-toggle');

    // Language
    if (langSelect) {
        langSelect.addEventListener('change', (e) => {
            if (typeof changeLanguage === 'function') {
                changeLanguage(e.target.value);
            }
        });
    }

    // Accessibility Panel controls
    if (fontSizeSlider) {
        fontSizeSlider.addEventListener('input', (e) => {
            document.body.classList.remove('font-size-1', 'font-size-2', 'font-size-3');
            document.body.classList.add(`font-size-${e.target.value}`);
        });
    }
    if (contrastToggle) {
        contrastToggle.addEventListener('change', (e) => {
            html.setAttribute('data-theme', e.target.checked ? 'dark' : 'light');
        });
    }
    if (hideImagesToggle) {
        hideImagesToggle.addEventListener('change', (e) => {
            if (e.target.checked) {
                document.body.classList.add('hide-images');
            } else {
                document.body.classList.remove('hide-images');
            }
        });
    }

    // --- Modal Logic ---
    const modal = document.getElementById('auth-modal');
    const modalCloseBtn = document.getElementById('modal-close');
    const openModalBtns = document.querySelectorAll('[data-open-modal]');
    const tabs = document.querySelectorAll('.modal-tab');
    const panels = document.querySelectorAll('.modal-panel');
    const switchTabLinks = document.querySelectorAll('[data-switch-tab]');

    function openModal(tabId) {
        if (!modal) return;
        modal.removeAttribute('hidden');
        document.body.style.overflow = 'hidden'; // prevent scrolling
        switchTab(tabId);
    }

    function closeModal() {
        if (!modal) return;
        modal.setAttribute('hidden', '');
        document.body.style.overflow = '';
    }

    function switchTab(tabId) {
        tabs.forEach(t => {
            const isActive = t.getAttribute('data-tab') === tabId;
            t.classList.toggle('active', isActive);
            t.setAttribute('aria-selected', isActive ? 'true' : 'false');
        });
        panels.forEach(p => {
            const isActive = p.id === `panel-${tabId}`;
            p.classList.toggle('active', isActive);
        });
        
        // Reset wizard if opening register
        if (tabId === 'register') {
            goToStep(1);
        }
    }

    openModalBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            openModal(btn.getAttribute('data-open-modal'));
        });
    });

    if (modalCloseBtn) modalCloseBtn.addEventListener('click', closeModal);
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });
    }

    tabs.forEach(tab => {
        tab.addEventListener('click', () => switchTab(tab.getAttribute('data-tab')));
    });

    switchTabLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            switchTab(link.getAttribute('data-switch-tab'));
        });
    });

    // --- Demo Buttons ---
    document.getElementById('demo-candidate-btn')?.addEventListener('click', () => {
        localStorage.setItem('app-user-type', 'candidato');
        window.location.href = 'pages/dashboard-candidate.html';
    });
    document.getElementById('demo-company-btn')?.addEventListener('click', () => {
        localStorage.setItem('app-user-type', 'empresa');
        window.location.href = 'pages/dashboard-company.html';
    });
    
    // Login form demo
    document.getElementById('login-form')?.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        if (email.includes('empresa')) {
            localStorage.setItem('app-user-type', 'empresa');
            window.location.href = 'pages/dashboard-company.html';
        } else {
            localStorage.setItem('app-user-type', 'candidato');
            window.location.href = 'pages/dashboard-candidate.html';
        }
    });

    // --- Wizard Logic ---
    let currentStep = 1;
    let selectedRole = null; // 'candidate' or 'company'
    const roleCards = document.querySelectorAll('.role-card');
    const btnToStep2 = document.getElementById('btn-to-step2');
    const backToStep1 = document.getElementById('back-to-step1');
    const backToStep2 = document.getElementById('back-to-step2');
    const regForm = document.getElementById('register-form');
    const btnToStep4 = document.getElementById('btn-to-step4');
    const dots = document.querySelectorAll('.prog-dot');
    const steps = document.querySelectorAll('.wizard-step');

    function goToStep(step) {
        currentStep = step;
        steps.forEach((s, idx) => {
            s.classList.toggle('active', idx + 1 === step);
        });
        dots.forEach((d, idx) => {
            d.classList.toggle('active', idx + 1 <= step);
        });
        if (step === 3 && typeof radarChart !== 'undefined') {
            setTimeout(() => radarChart.resize(), 50);
        }
    }

    roleCards.forEach(card => {
        card.addEventListener('click', () => {
            roleCards.forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
            selectedRole = card.getAttribute('data-role');
            btnToStep2.removeAttribute('disabled');
            btnToStep2.removeAttribute('aria-disabled');
            
            // Toggle company fields in step 2
            const companyFields = document.getElementById('company-fields');
            if (companyFields) {
                companyFields.style.display = selectedRole === 'company' ? 'block' : 'none';
            }
        });
    });

    if (btnToStep2) {
        btnToStep2.addEventListener('click', () => {
            if (selectedRole) goToStep(2);
        });
    }
    if (backToStep1) backToStep1.addEventListener('click', () => goToStep(1));
    
    if (regForm) {
        regForm.addEventListener('submit', (e) => {
            e.preventDefault();
            if (selectedRole === 'candidate') {
                goToStep(3); // go to radar chart
            } else {
                goToStep(4); // company skips radar
                document.getElementById('verify-email-display').textContent = document.getElementById('reg-email').value;
            }
        });
    }

    if (backToStep2) backToStep2.addEventListener('click', () => goToStep(2));

    if (btnToStep4) {
        btnToStep4.addEventListener('click', () => {
            goToStep(4);
            document.getElementById('verify-email-display').textContent = document.getElementById('reg-email').value;
        });
    }
    
    document.getElementById('go-to-dashboard')?.addEventListener('click', () => {
        localStorage.setItem('app-user-type', selectedRole === 'company' ? 'empresa' : 'candidato');
        window.location.href = selectedRole === 'company' ? 'pages/dashboard-company.html' : 'pages/dashboard-candidate.html';
    });

    // --- Radar Chart ---
    const ctx = document.getElementById('radarChart')?.getContext('2d');
    let radarChart;

    if (ctx && typeof Chart !== 'undefined') {
        radarChart = new Chart(ctx, {
            type: 'radar',
            data: {
                labels: ['Procesamiento', 'Ambiental', 'Ejecución', 'Ajustes'],
                datasets: [{
                    label: 'Perfil',
                    data: [5, 5, 5, 5],
                    backgroundColor: 'rgba(210, 227, 198, 0.5)',
                    borderColor: '#4a3311',
                    pointBackgroundColor: '#d2e3c6',
                    pointBorderColor: '#4a3311',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    r: {
                        angleLines: { color: '#d1bfae' },
                        grid: { color: '#d1bfae' },
                        pointLabels: { font: { size: 10 }, color: '#4a3311' },
                        ticks: { display: false, min: 0, max: 10 }
                    }
                },
                plugins: { legend: { display: false } }
            }
        });

        // Sliders
        const axes = ['axis1', 'axis2', 'axis3', 'axis4'];
        axes.forEach((id, idx) => {
            const slider = document.getElementById(id);
            const valSpan = document.getElementById(`val${idx+1}`);
            if (slider) {
                slider.addEventListener('input', (e) => {
                    const val = e.target.value;
                    if (valSpan) valSpan.textContent = val;
                    radarChart.data.datasets[0].data[idx] = parseInt(val, 10);
                    radarChart.update();
                });
            }
        });
    }

    // Password visibility toggles
    ['login', 'reg'].forEach(prefix => {
        const btn = document.getElementById(`${prefix}-eye-btn`);
        const input = document.getElementById(`${prefix}-password`);
        if (btn && input) {
            btn.addEventListener('click', () => {
                const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
                input.setAttribute('type', type);
            });
        }
    });
});
