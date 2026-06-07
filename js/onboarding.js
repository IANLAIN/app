/**
 * onboarding.js — Cuestionario de onboarding (5 pasos)
 */

(function() {
  document.addEventListener('DOMContentLoaded', () => {
    const steps = document.querySelectorAll('.step-container');
    const prevBtn = document.getElementById('btn-prev');
    const nextBtn = document.getElementById('btn-next');
    const progressBar = document.getElementById('barra-progreso');
    const stepText = document.getElementById('texto-paso');
    const skillsCounter = document.getElementById('skills-counter');

    let currentStep = 0;
    const totalSteps = steps.length;
    const answers = { step1: null, step2: null, step3: null, step4: null, step5: [] };

    function bindOptionsForStep(stepIndex) {
      const step = steps[stepIndex];
      if (!step) return;
      const isMulti = step.getAttribute('data-multi') === 'true';
      const options = step.querySelectorAll('.opcion-card');

      options.forEach(opt => {
        opt.removeEventListener('click', handleOptionClick);
        opt.addEventListener('click', handleOptionClick);
      });

      function handleOptionClick(e) {
        const button = e.currentTarget;
        const value = button.getAttribute('data-value');
        
        if (isMulti) {
          const isSelected = button.classList.contains('seleccionada');
          if (!isSelected && answers.step5.length >= 3) {
            if (window.showToast) window.showToast('Solo puedes seleccionar hasta 3 habilidades.', 'warning');
            else alert('Solo puedes seleccionar hasta 3 habilidades.');
            return;
          }
          button.classList.toggle('seleccionada');
          if (button.classList.contains('seleccionada')) {
            if (!answers.step5.includes(value)) answers.step5.push(value);
          } else {
            answers.step5 = answers.step5.filter(v => v !== value);
          }
          updateSkillsCounter();
        } else {
          options.forEach(opt => opt.classList.remove('seleccionada'));
          button.classList.add('seleccionada');
          answers[`step${stepIndex+1}`] = value;
        }
      }
    }

    function updateSkillsCounter() {
      if (skillsCounter) {
        skillsCounter.textContent = `Seleccionadas: ${answers.step5.length} / 3`;
      }
    }

    function loadSavedAnswers() {
      const saved = localStorage.getItem('onboarding_responses');
      if (!saved) return;
      try {
        const parsed = JSON.parse(saved);
        Object.assign(answers, parsed);
        for (let i = 0; i < totalSteps; i++) {
          const step = steps[i];
          const isMulti = step.getAttribute('data-multi') === 'true';
          const savedValue = answers[`step${i+1}`];
          if (!savedValue && (!isMulti || (isMulti && answers.step5.length === 0))) continue;
          const options = step.querySelectorAll('.opcion-card');
          if (!isMulti) {
            options.forEach(opt => {
              if (opt.getAttribute('data-value') === savedValue) opt.classList.add('seleccionada');
            });
          } else {
            options.forEach(opt => {
              if (answers.step5.includes(opt.getAttribute('data-value'))) opt.classList.add('seleccionada');
            });
            updateSkillsCounter();
          }
        }
      } catch(e) { console.warn(e); }
    }

    function saveAnswers() {
      localStorage.setItem('onboarding_responses', JSON.stringify(answers));
    }

    function isCurrentStepValid() {
      const step = steps[currentStep];
      const isMulti = step.getAttribute('data-multi') === 'true';
      if (isMulti) return answers.step5.length > 0;
      return answers[`step${currentStep+1}`] !== null;
    }

    function updateProgress() {
      const percent = ((currentStep + 1) / totalSteps) * 100;
      if (progressBar) progressBar.style.width = `${percent}%`;
      if (stepText) stepText.textContent = `Paso ${currentStep+1} de ${totalSteps}`;
    }

    function showStep(stepIndex) {
      steps.forEach((step, idx) => {
        step.classList.toggle('active', idx === stepIndex);
      });
      bindOptionsForStep(stepIndex);
      updateProgress();
      if (prevBtn) prevBtn.style.display = stepIndex === 0 ? 'none' : 'inline-flex';
      if (nextBtn) nextBtn.textContent = (stepIndex === totalSteps - 1) ? 'Finalizar' : 'Siguiente';
    }

    function nextStep() {
      if (!isCurrentStepValid()) {
        const msg = 'Por favor selecciona una opción antes de continuar.';
        if (window.showToast) window.showToast(msg, 'warning');
        else alert(msg);
        return;
      }
      if (currentStep === totalSteps - 1) {
        finishOnboarding();
      } else {
        currentStep++;
        showStep(currentStep);
      }
    }

    function prevStep() {
      if (currentStep > 0) {
        currentStep--;
        showStep(currentStep);
      }
    }

    function finishOnboarding() {
      saveAnswers();
      const condition = answers.step1;
      if (condition && condition !== 'prefiero_no_decirlo' && condition !== 'otras_condiciones' && condition !== 'otra') {
        localStorage.setItem('app-candidate-type', condition);
        document.documentElement.setAttribute('data-candidate-type', condition);
      } else if (condition === 'otras_condiciones') {
        localStorage.setItem('app-candidate-type', 'tdah');
        document.documentElement.setAttribute('data-candidate-type', 'tdah');
      } else {
        localStorage.removeItem('app-candidate-type');
        document.documentElement.removeAttribute('data-candidate-type');
      }
      localStorage.setItem('app-user-type', 'candidato');
      localStorage.setItem('user_role', 'candidate');
      localStorage.setItem('demo_session', 'true');
      localStorage.setItem('onboarding_completed', 'true');
      if (window.showToast) window.showToast('Perfil completado. Redirigiendo...', 'success');
      setTimeout(() => {
        const isInPages = window.location.pathname.includes('/pages/');
        window.location.href = isInPages ? 'dashboard-candidate.html' : '../pages/dashboard-candidate.html';
      }, 1000);
    }

    if (nextBtn) nextBtn.addEventListener('click', nextStep);
    if (prevBtn) prevBtn.addEventListener('click', prevStep);

    loadSavedAnswers();
    showStep(0);

    if (localStorage.getItem('onboarding_completed') === 'true') {
      if (confirm('Ya completaste el cuestionario anteriormente. ¿Quieres volver a realizarlo?')) {
        localStorage.removeItem('onboarding_completed');
        localStorage.removeItem('onboarding_responses');
        document.querySelectorAll('.opcion-card').forEach(card => card.classList.remove('seleccionada'));
        answers.step1 = null; answers.step2 = null; answers.step3 = null; answers.step4 = null; answers.step5 = [];
        updateSkillsCounter();
        showStep(0);
      } else {
        const isInPages = window.location.pathname.includes('/pages/');
        window.location.href = isInPages ? 'dashboard-candidate.html' : '../pages/dashboard-candidate.html';
      }
    }
  });
})();