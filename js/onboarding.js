/**
 * onboarding.js — Sensory profile questionnaire flow
 * Handles step navigation, option selection, and profile saving.
 */
export function initOnboarding(root = document) {
  const onboardingRoot = root.querySelector('#onboarding-flow');
  if (!onboardingRoot) return;

  let pasoActual = 1;
  const totalPasos = 5;
  const respuestas = {};

  const btnNext = root.querySelector('#btn-next');
  const btnPrev = root.querySelector('#btn-prev');
  const progressBar = root.querySelector('#barra-progreso');
  const stepText = root.querySelector('#texto-paso');

  if (!btnNext || !btnPrev) return;

  function mostrarPaso(paso) {
    root.querySelectorAll('.step-container').forEach(el => el.classList.remove('active'));
    const stepEl = root.querySelector(`#step-${paso}`);
    if (stepEl) {
      stepEl.classList.add('active');
    }
    btnPrev.style.display = paso === 1 ? 'none' : 'inline-flex';

    if (paso === totalPasos) {
      btnNext.textContent = 'Finalizar';
    } else {
      btnNext.textContent = 'Siguiente';
    }
  }

  function actualizarBarra() {
    const porcentaje = (pasoActual / totalPasos) * 100;
    if (progressBar) progressBar.style.width = `${porcentaje}%`;
    if (stepText) stepText.textContent = `Paso ${pasoActual} de ${totalPasos}`;
  }

  // Handle option clicks
  root.querySelectorAll('.opcion-card').forEach(card => {
    card.addEventListener('click', () => {
      const parentStep = card.closest('.step-container');
      if (!parentStep) return;
      const isMulti = parentStep.dataset.multi === 'true';
      const stepId = parentStep.id;

      if (!isMulti) {
        // Single selection
        parentStep.querySelectorAll('.opcion-card').forEach(c => c.classList.remove('seleccionada'));
        card.classList.add('seleccionada');

        // Auto-advance for single selection
        respuestas[stepId] = card.dataset.value;
        setTimeout(() => siguientePaso(), 400);
      } else {
        // Multi selection (Step 5)
        card.classList.toggle('seleccionada');
        const seleccionadas = Array.from(parentStep.querySelectorAll('.opcion-card.seleccionada')).map(c => c.dataset.value);
        respuestas[stepId] = seleccionadas;

        // Disable more than 3
        if (seleccionadas.length >= 3) {
          parentStep.querySelectorAll('.opcion-card:not(.seleccionada)').forEach(c => {
            c.style.opacity = '0.4';
            c.style.pointerEvents = 'none';
          });
        } else {
          parentStep.querySelectorAll('.opcion-card').forEach(c => {
            c.style.opacity = '1';
            c.style.pointerEvents = 'auto';
          });
        }
      }
    });
  });

  async function finalizarOnboarding() {
    btnNext.disabled = true;
    btnNext.textContent = 'Guardando...';
    try {
      localStorage.setItem('onboarding_gustos', JSON.stringify(respuestas));
      localStorage.setItem('onboarding_completed', 'true');
      if (window.showToast) window.showToast("¡Perfil guardado con éxito!", "success");
      
      // Simular pequeño retardo de red
      await new Promise(r => setTimeout(r, 400));

      const role = localStorage.getItem('user_role') || 'candidate';
      if (window.__spaNavigate) {
        window.__spaNavigate(`pages/dashboard-${role}.html`);
      } else {
        // Safe static redirection using path relation check
        const isSubdir = window.location.pathname.includes("/pages/");
        window.location.href = isSubdir ? `dashboard-${role}.html` : `pages/dashboard-${role}.html`;
      }
    } catch (err) {
      console.error("Error finalizing onboarding", err);
      btnNext.disabled = false;
      btnNext.textContent = 'Finalizar';
    }
  }

  function siguientePaso() {
    if (pasoActual < totalPasos) {
      pasoActual++;
      mostrarPaso(pasoActual);
      actualizarBarra();
    } else {
      finalizarOnboarding();
    }
  }

  function anteriorPaso() {
    if (pasoActual > 1) {
      pasoActual--;
      mostrarPaso(pasoActual);
      actualizarBarra();
    }
  }

  btnNext.addEventListener('click', siguientePaso);
  btnPrev.addEventListener('click', anteriorPaso);

  mostrarPaso(pasoActual);
  actualizarBarra();
}
