(() => {
  const carousel = document.querySelector('[data-category-carousel]');
  if (!carousel) return;

  const viewport = carousel.querySelector('[data-carousel-viewport]');
  const track = carousel.querySelector('[data-carousel-track]');
  const previousButton = carousel.querySelector('[data-carousel-previous]');
  const nextButton = carousel.querySelector('[data-carousel-next]');
  const toggleButton = carousel.querySelector('[data-carousel-toggle]');
  const originalCards = Array.from(track.children);
  const cardCount = originalCards.length;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const resumeDelay = 5000;
  const interval = 4500;
  let index = cardCount;
  let timer;
  let resumeTimer;
  let manuallyPaused = false;
  let isHovered = false;
  let isFocused = false;
  let isDragging = false;
  let dragStartX = 0;
  let dragStartOffset = 0;

  const before = originalCards.map(card => card.cloneNode(true));
  const after = originalCards.map(card => card.cloneNode(true));

  [...before, ...after].forEach(card => {
    card.setAttribute('aria-hidden', 'true');
    card.inert = true;
  });
  before.reverse().forEach(card => track.prepend(card));
  after.forEach(card => track.append(card));

  const setPosition = (animate = true) => {
    track.style.transition = animate && !reducedMotion.matches ? '' : 'none';
    track.style.transform = `translate3d(-${track.children[index].offsetLeft}px, 0, 0)`;
  };

  const canAutoplay = () => (
    !manuallyPaused &&
    !isHovered &&
    !isFocused &&
    !isDragging &&
    !reducedMotion.matches &&
    !document.hidden
  );

  const clearTimers = () => {
    window.clearTimeout(timer);
    window.clearTimeout(resumeTimer);
  };

  const scheduleAutoplay = () => {
    window.clearTimeout(timer);
    if (!canAutoplay()) return;
    timer = window.setTimeout(() => {
      move(1);
      scheduleAutoplay();
    }, interval);
  };

  const resumeAfterInteraction = () => {
    window.clearTimeout(resumeTimer);
    if (manuallyPaused || isHovered || isFocused || reducedMotion.matches || document.hidden) return;
    resumeTimer = window.setTimeout(() => {
      move(1);
      scheduleAutoplay();
    }, resumeDelay);
  };

  const move = direction => {
    index += direction;
    setPosition();
  };

  [previousButton, nextButton].forEach((button, buttonIndex) => {
    button.addEventListener('click', () => {
      clearTimers();
      move(buttonIndex === 0 ? -1 : 1);
      resumeAfterInteraction();
    });
  });

  toggleButton.addEventListener('click', () => {
    manuallyPaused = !manuallyPaused;
    toggleButton.setAttribute('aria-pressed', String(manuallyPaused));
    toggleButton.textContent = manuallyPaused ? 'Continuar' : 'Pausar';
    toggleButton.setAttribute('aria-label', manuallyPaused ? 'Reanudar movimiento' : 'Pausar movimiento');
    clearTimers();
    if (!manuallyPaused) scheduleAutoplay();
  });

  viewport.addEventListener('keydown', event => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    clearTimers();
    move(event.key === 'ArrowLeft' ? -1 : 1);
    resumeAfterInteraction();
  });

  viewport.addEventListener('pointerdown', event => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    clearTimers();
    isDragging = true;
    dragStartX = event.clientX;
    dragStartOffset = track.children[index].offsetLeft;
    viewport.classList.add('is-dragging');
    track.style.transition = 'none';
    viewport.setPointerCapture(event.pointerId);
  });

  viewport.addEventListener('pointermove', event => {
    if (!isDragging) return;
    const offset = dragStartOffset - (event.clientX - dragStartX);
    track.style.transform = `translate3d(-${Math.max(0, offset)}px, 0, 0)`;
  });

  const finishDrag = event => {
    if (!isDragging) return;
    const distance = event.clientX - dragStartX;
    isDragging = false;
    viewport.classList.remove('is-dragging');
    if (event.type === 'pointercancel') setPosition();
    else if (Math.abs(distance) > 45) move(distance < 0 ? 1 : -1);
    else setPosition();
    resumeAfterInteraction();
  };

  viewport.addEventListener('pointerup', finishDrag);
  viewport.addEventListener('pointercancel', finishDrag);

  carousel.addEventListener('pointerenter', () => {
    isHovered = true;
    clearTimers();
  });

  carousel.addEventListener('pointerleave', () => {
    isHovered = false;
    resumeAfterInteraction();
  });

  carousel.addEventListener('focusin', () => {
    isFocused = true;
    clearTimers();
  });

  carousel.addEventListener('focusout', event => {
    if (carousel.contains(event.relatedTarget)) return;
    isFocused = false;
    resumeAfterInteraction();
  });

  track.addEventListener('transitionend', event => {
    if (event.target !== track) return;
    if (index >= cardCount * 2) index = cardCount;
    else if (index < cardCount) index = cardCount * 2 - 1;
    else return;
    setPosition(false);
  });

  window.addEventListener('resize', () => setPosition(false));
  document.addEventListener('visibilitychange', () => {
    clearTimers();
    if (!document.hidden) scheduleAutoplay();
  });
  reducedMotion.addEventListener('change', () => {
    clearTimers();
    setPosition(false);
    if (!reducedMotion.matches) scheduleAutoplay();
  });

  setPosition(false);
  scheduleAutoplay();
})();
