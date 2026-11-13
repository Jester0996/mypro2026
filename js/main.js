// ========== Настройки ==========
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const desktopMedia = window.matchMedia('(min-width: 769px)');

const header          = document.getElementById('header');
const menuBtn         = document.getElementById('menu-btn');
const navbar          = document.getElementById('navbar');
const navLinks        = document.querySelectorAll('.nav-link');
const sections        = document.querySelectorAll('section[id]');
const scrollTopBtn    = document.getElementById('scroll-top');
const progressCircle  = document.querySelector('.scroll-progress circle');
const PROGRESS_LENGTH = 126; // длина окружности (r = 20), совпадает с CSS

document.addEventListener('DOMContentLoaded', () => {
  initMobileMenu();
  initScrollHandler();
  initTyping();
  initAnimations();
  initCounters();
  initPortfolioFilter();
  initContactForm();
});

// ========== Мобильное меню ==========
function setMenu(open) {
  navbar.classList.toggle('active', open);
  menuBtn.classList.toggle('active', open);
  menuBtn.setAttribute('aria-expanded', String(open));
  menuBtn.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
  document.body.style.overflow = open ? 'hidden' : '';
}

function initMobileMenu() {
  menuBtn.addEventListener('click', () => {
    setMenu(!navbar.classList.contains('active'));
  });

  navLinks.forEach(link => {
    link.addEventListener('click', () => setMenu(false));
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && navbar.classList.contains('active')) {
      setMenu(false);
      menuBtn.focus();
    }
  });

  document.addEventListener('click', (e) => {
    if (!navbar.classList.contains('active')) return;
    if (navbar.contains(e.target) || menuBtn.contains(e.target)) return;
    setMenu(false);
  });

  // При переходе на широкий экран меню закрываем, иначе останется заблокирована прокрутка
  desktopMedia.addEventListener('change', (e) => {
    if (e.matches) setMenu(false);
  });
}

// ========== Шапка, прогресс прокрутки и активный пункт меню ==========
function updateActiveLink(scrollY) {
  let currentId = '';
  sections.forEach(section => {
    const top = section.offsetTop - 150;
    if (scrollY >= top && scrollY < top + section.offsetHeight) {
      currentId = section.id;
    }
  });
  navLinks.forEach(link => {
    const isActive = link.dataset.section === currentId;
    link.classList.toggle('active', isActive);
    if (isActive) link.setAttribute('aria-current', 'true');
    else link.removeAttribute('aria-current');
  });
}

function initScrollHandler() {
  let ticking = false;

  const update = () => {
    const y = window.scrollY;
    header.classList.toggle('scrolled', y > 50);
    scrollTopBtn.classList.toggle('visible', y > 300);

    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    const progress = maxScroll > 0 ? y / maxScroll : 0;
    if (progressCircle) {
      progressCircle.style.strokeDashoffset = PROGRESS_LENGTH - progress * PROGRESS_LENGTH;
    }

    updateActiveLink(y);
    ticking = false;
  };

  // Один обработчик с requestAnimationFrame вместо нескольких без ограничения частоты
  window.addEventListener('scroll', () => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(update);
    }
  }, { passive: true });

  scrollTopBtn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
  });

  update();
}

// ========== Печатающийся текст в заголовке (один проход, без бесконечного цикла) ==========
function initTyping() {
  const el = document.querySelector('.typing-text');
  if (!el) return;

  const cursor = document.querySelector('.cursor');
  const text = 'frontend-разработчик';

  // При «уменьшении движения» показываем готовый текст без анимации и курсора
  if (reduceMotion) {
    el.textContent = text;
    if (cursor) cursor.hidden = true;
    return;
  }

  const TYPE_MS = 80;
  const CURSOR_HOLD_MS = 1200;
  let count = 0;

  // Анимация длится около трёх секунд и сама останавливается (WCAG 2.2.2)
  const tick = () => {
    count += 1;
    el.textContent = text.slice(0, count);
    if (count < text.length) {
      setTimeout(tick, TYPE_MS);
    } else if (cursor) {
      setTimeout(() => { cursor.hidden = true; }, CURSOR_HOLD_MS);
    }
  };

  tick();
}

// ========== Появление блоков при прокрутке ==========
function initAnimations() {
  const elements = document.querySelectorAll('[data-aos]');

  if (reduceMotion || !('IntersectionObserver' in window)) {
    elements.forEach(el => el.classList.add('aos-animate'));
    return;
  }

  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const delay = Number(entry.target.dataset.aosDelay || 0);
      setTimeout(() => entry.target.classList.add('aos-animate'), delay);
      obs.unobserve(entry.target);
    });
  }, { threshold: 0.1 });

  elements.forEach(el => observer.observe(el));
}

// ========== Счётчики в hero ==========
function animateCount(el) {
  const target = Number(el.dataset.count);
  const suffix = el.dataset.suffix || '';
  const duration = 1500;
  const start = performance.now();

  const frame = (now) => {
    const progress = Math.min((now - start) / duration, 1);
    el.textContent = Math.round(target * progress) + (progress === 1 ? suffix : '');
    if (progress < 1) requestAnimationFrame(frame);
  };

  requestAnimationFrame(frame);
}

function initCounters() {
  const stats = document.querySelector('.home-stats');
  if (!stats || reduceMotion || !('IntersectionObserver' in window)) return;

  const counters = stats.querySelectorAll('.stat-number[data-count]');
  counters.forEach(counter => { counter.textContent = '0'; });

  const observer = new IntersectionObserver((entries, obs) => {
    if (!entries[0].isIntersecting) return;
    counters.forEach(counter => animateCount(counter));
    obs.disconnect();
  }, { threshold: 0.5 });

  observer.observe(stats);
}

// ========== Фильтр портфолио ==========
function initPortfolioFilter() {
  const buttons = document.querySelectorAll('.filter-btn');
  const items = document.querySelectorAll('.portfolio-item');

  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      const filter = btn.dataset.filter;

      buttons.forEach(b => {
        const isActive = b === btn;
        b.classList.toggle('active', isActive);
        b.setAttribute('aria-pressed', String(isActive));
      });

      items.forEach(item => {
        const match = filter === 'all' || item.dataset.category === filter;
        item.classList.toggle('hidden', !match);
      });
    });
  });
}

// ========== Форма обратной связи (Formspree) ==========
function pluralize(n, one, few, many) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
  return many;
}

function validateField(input) {
  const errorEl = input.closest('.form-group').querySelector('.form-error');
  const value = input.value.trim();
  let message = '';

  if (input.required && !value) {
    message = 'Это поле обязательно';
  } else if (input.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    message = 'Введите корректный email';
  } else if (input.minLength > 0 && value.length < input.minLength) {
    message = `Минимум ${input.minLength} ${pluralize(input.minLength, 'символ', 'символа', 'символов')}`;
  }

  input.classList.toggle('error', Boolean(message));
  input.setAttribute('aria-invalid', String(Boolean(message)));
  errorEl.textContent = message;
  return !message;
}

function initContactForm() {
  const form = document.getElementById('contact-form');
  if (!form) return;

  const submitBtn = document.getElementById('submit-btn');
  const successEl = document.getElementById('form-success');
  const failEl = document.getElementById('form-fail');
  const fields = [...form.querySelectorAll('input[name]:not([type="hidden"]):not([name="_gotcha"]), textarea[name]')];
  const scrollOpts = { behavior: reduceMotion ? 'auto' : 'smooth', block: 'nearest' };

  fields.forEach(field => {
    const errorEl = field.closest('.form-group').querySelector('.form-error');
    errorEl.id = `${field.id}-error`;
    field.setAttribute('aria-describedby', errorEl.id);
  });

  const setLoading = (isLoading) => {
    submitBtn.disabled = isLoading;
    submitBtn.classList.toggle('loading', isLoading);
    submitBtn.querySelector('.btn-text').textContent = isLoading ? 'Отправка' : 'Отправить сообщение';
    submitBtn.querySelector('.btn-icon').className = isLoading
      ? 'fas fa-spinner fa-spin btn-icon'
      : 'fas fa-paper-plane btn-icon';
  };

  fields.forEach(field => {
    field.addEventListener('blur', () => validateField(field));
    field.addEventListener('input', () => {
      if (field.classList.contains('error')) validateField(field);
    });
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    successEl.hidden = true;
    failEl.hidden = true;

    const results = fields.map(field => validateField(field));
    if (results.includes(false)) {
      fields[results.indexOf(false)].focus();
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(form.action, {
        method: 'POST',
        body: new FormData(form),
        headers: { Accept: 'application/json' }
      });
      if (!res.ok) throw new Error(`Formspree: HTTP ${res.status}`);
      form.reset();
      successEl.hidden = false;
      successEl.scrollIntoView(scrollOpts);
    } catch (err) {
      console.error(err);
      failEl.hidden = false;
      failEl.scrollIntoView(scrollOpts);
    } finally {
      setLoading(false);
    }
  });
}