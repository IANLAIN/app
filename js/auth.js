// Sistema de autenticación y gestión de usuarios
// Almacena usuarios en localStorage y mantiene la sesión activa

const STORAGE_USERS = 'app_users';
const STORAGE_SESSION = 'app_session';
const STORAGE_CURRENT_USER = 'app_current_user';
const STORAGE_CURRENT_USER_NAME = 'app_user_name';

// Usuarios de demostración iniciales
const defaultUsers = [
  {
    id: 'candidate_1',
    email: 'carlos@example.com',
    password: 'candidate123',
    name: 'Carlos Méndez',
    role: 'candidate',
    profile: {
      neurotype: 'autismo',
      interests: ['tecnologia', 'datos'],
      skills: ['programacion', 'analisis'],
      workPreference: 'remoto',
      environment: 'silencioso',
      completedOnboarding: true
    }
  },
  {
    id: 'company_1',
    email: 'empresa@example.com',
    password: 'company123',
    name: 'Tech Inclusiva S.A.',
    role: 'company',
    profile: {
      industry: 'tecnologia',
      philosophy: 'Innovación e inclusión',
      workEnvironment: 'colaborativo',
      accommodations: ['horario flexible', 'pausas activas']
    }
  }
];

// Inicializar almacenamiento
function initStorage() {
  if (!localStorage.getItem(STORAGE_USERS)) {
    localStorage.setItem(STORAGE_USERS, JSON.stringify(defaultUsers));
  }
}

function syncCurrentUser(user) {
  if (!user) {
    localStorage.removeItem(STORAGE_CURRENT_USER);
    localStorage.removeItem(STORAGE_CURRENT_USER_NAME);
    return;
  }

  const snapshot = {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    profile: user.profile || {}
  };

  localStorage.setItem(STORAGE_CURRENT_USER, JSON.stringify(snapshot));
  localStorage.setItem(STORAGE_CURRENT_USER_NAME, snapshot.name || '');
}

// Obtener usuario actual
export function getCurrentUser() {
  const session = localStorage.getItem(STORAGE_SESSION);
  try {
    if (!session) {
      const snapshot = localStorage.getItem(STORAGE_CURRENT_USER);
      return snapshot ? JSON.parse(snapshot) : null;
    }
    const { userId } = JSON.parse(session);
    const users = JSON.parse(localStorage.getItem(STORAGE_USERS));
    const current = users.find(u => u.id === userId) || null;
    if (current) return current;

    const snapshot = localStorage.getItem(STORAGE_CURRENT_USER);
    if (!snapshot) return null;
    const parsed = JSON.parse(snapshot);
    return parsed?.id === userId ? parsed : null;
  } catch (e) {
    return null;
  }
}

// Guardar sesión
export function setSession(userId) {
  localStorage.setItem(STORAGE_SESSION, JSON.stringify({ userId }));
}

// Cerrar sesión
export function logout() {
  localStorage.removeItem(STORAGE_SESSION);
  localStorage.removeItem(STORAGE_CURRENT_USER);
  localStorage.removeItem(STORAGE_CURRENT_USER_NAME);
  window.location.href = '../index.html';
}

// Registrar nuevo usuario
export function registerUser(email, password, name, role, additionalData = {}) {
  initStorage();
  const users = JSON.parse(localStorage.getItem(STORAGE_USERS));
  if (users.find(u => u.email === email)) {
    throw new Error('El correo ya está registrado');
  }
  const safeName = (name || '').trim() || email.split('@')[0] || 'Usuario';
  const newUser = {
    id: `${role}_${Date.now()}`,
    email,
    password,
    name: safeName,
    role,
    profile: {
      ...additionalData,
      completedOnboarding: role === 'candidate' ? false : true
    }
  };
  users.push(newUser);
  localStorage.setItem(STORAGE_USERS, JSON.stringify(users));
  setSession(newUser.id);
  syncCurrentUser(newUser);
  return newUser;
}

// Iniciar sesión
export function loginUser(email, password) {
  initStorage();
  const users = JSON.parse(localStorage.getItem(STORAGE_USERS));
  const user = users.find(u => u.email === email && u.password === password);
  if (!user) throw new Error('Credenciales inválidas');
  setSession(user.id);
  syncCurrentUser(user);
  return user;
}

// Actualizar perfil del usuario actual
export function updateUserProfile(updates) {
  const current = getCurrentUser();
  if (!current) return null;
  const users = JSON.parse(localStorage.getItem(STORAGE_USERS));
  const index = users.findIndex(u => u.id === current.id);
  if (index !== -1) {
    users[index] = { ...users[index], ...updates };
    localStorage.setItem(STORAGE_USERS, JSON.stringify(users));
    setSession(users[index].id);
    syncCurrentUser(users[index]);
    return users[index];
  }
  return null;
}

// Obtener todos los candidatos (para empresas)
export function getCandidates() {
  const users = JSON.parse(localStorage.getItem(STORAGE_USERS));
  return users.filter(u => u.role === 'candidate');
}

// Obtener todas las empresas (para candidatos)
export function getCompanies() {
  const users = JSON.parse(localStorage.getItem(STORAGE_USERS));
  return users.filter(u => u.role === 'company');
}

// Simular match entre candidato y vacante (lógica simple)
export function getMatchesForCandidate(candidateId) {
  // Vacantes simuladas
  const vacancies = [
    { id: 1, title: 'Desarrollador Frontend', company: 'Tech Inclusiva', match: 92, skills: ['programacion', 'detalle'], environment: 'remoto' },
    { id: 2, title: 'Analista de Datos', company: 'DataCare', match: 88, skills: ['datos', 'analisis'], environment: 'hibrido' },
    { id: 3, title: 'Soporte Técnico', company: 'HelpNet', match: 76, skills: ['comunicacion', 'computadores'], environment: 'presencial' }
  ];
  // Ordenar por match descendente
  return vacancies.sort((a,b) => b.match - a.match);
}

export function getMatchesForCompany(companyId) {
  const candidates = getCandidates();
  // Simular match basado en intereses comunes
  return candidates.map(c => ({
    ...c,
    match: Math.floor(Math.random() * 30) + 70 // entre 70 y 99
  })).sort((a,b) => b.match - a.match);
}

// Inicializar almacenamiento al cargar
initStorage();