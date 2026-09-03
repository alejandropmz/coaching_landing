(function () {
    var items = document.querySelectorAll('[data-reveal]');

    if (!('IntersectionObserver' in window)) {
        items.forEach(function (el) {
            el.classList.remove('opacity-0', 'translate-y-8');
            el.classList.add('opacity-100', 'translate-y-0');
        });
        return;
    }

    var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
            if (entry.isIntersecting) {
                // Cuando el elemento entra en la pantalla (scroll hacia abajo o al llegar a él)
                entry.target.classList.remove('opacity-0', 'translate-y-8');
                entry.target.classList.add('opacity-100', 'translate-y-0');
            } else {
                // Cuando el elemento sale de la pantalla por arriba (hacemos scroll hacia arriba)
                // Se vuelve a ocultar para repetir la animación al volver a bajar
                entry.target.classList.remove('opacity-100', 'translate-y-0');
                entry.target.classList.add('opacity-0', 'translate-y-8');
            }
        });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

    items.forEach(function (el) { observer.observe(el); });
})();

/* ============================================================
   INTERACTIVE LEADERSHIP QUIZ MODAL
   ============================================================ */
(function () {
  'use strict';

  // ----- DOM references -----
  var trigger = document.getElementById('quiz-start');
  var modal = document.getElementById('quiz-modal');
  var backdrop = document.getElementById('quiz-modal-backdrop');
  var overlay = document.getElementById('quiz-modal-overlay');
  var closeBtn = document.getElementById('quiz-modal-close');
  var content = document.getElementById('quiz-content');

  if (!trigger || !modal || !backdrop || !overlay || !closeBtn || !content) {
    return;
  }

  // ----- State -----
  var quizData = null;
  var dataPromise = null;
  var step = 'welcome'; // welcome | question | calculating | email | result
  var questionIndex = 0;
  var scores = {}; // archetype key -> accumulated points
  var answers = []; // chosen option index per question, in order
  var userEmail = '';
  var isSending = false;
  var calcTimer = null;
  var OPTION_LABELS = ['A', 'B', 'C', 'D', 'E'];

  // ----- Helpers -----
  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function resetState() {
    step = 'welcome';
    questionIndex = 0;
    scores = {};
    answers = [];
    userEmail = '';
    isSending = false;
    if (calcTimer) {
      clearTimeout(calcTimer);
      calcTimer = null;
    }
  }

  // ----- Data fetching -----
  function loadData() {
    if (quizData) {
      return Promise.resolve(quizData);
    }
    if (dataPromise) {
      return dataPromise;
    }
    dataPromise = fetch('./data/quiz-data.json')
      .then(function (res) {
        if (!res.ok) {
          throw new Error('HTTP ' + res.status);
        }
        return res.json();
      })
      .then(function (json) {
        quizData = json.quiz;
        return quizData;
      })
      .catch(function (err) {
        dataPromise = null;
        throw err;
      });
    return dataPromise;
  }

  // ----- Modal open / close -----
  function openModal() {
    resetState();
    render();
    modal.classList.remove('hidden');
    document.body.classList.add('overflow-hidden');
    closeBtn.focus();
  }

  function closeModal() {
    modal.classList.add('hidden');
    document.body.classList.remove('overflow-hidden');
    if (calcTimer) {
      clearTimeout(calcTimer);
      calcTimer = null;
    }
  }

  // ----- Render dispatch -----
  function render() {
    if (step === 'welcome') {
      renderWelcome();
    } else if (step === 'question') {
      renderQuestion();
    } else if (step === 'calculating') {
      renderCalculating();
    } else if (step === 'email') {
      renderEmail();
    } else if (step === 'result') {
      renderResult();
    }
  }

  // ----- Step 1: Welcome -----
  function renderWelcome() {
    content.innerHTML =
      '<div class="p-8 sm:p-10 md:p-14 text-center">' +
        '<p class="text-gold text-[11px] md:text-xs tracking-[0.25em] uppercase font-semibold mb-6">QUIZ EXCLUSIVO</p>' +
        '<div class="w-10 h-[2px] bg-gold mx-auto mb-6 md:mb-8"></div>' +
        '<h2 class="font-bodoni font-medium text-2xl md:text-4xl text-charcoal leading-tight tracking-tight mb-5">Descubre tu esencia de liderazgo</h2>' +
        '<p class="font-sans text-sm md:text-base text-[#4B4640] leading-relaxed mb-8 md:mb-10">Identifica los pilares de tu marca personal y cómo proyectar una autoridad magnética en tu industria.</p>' +
        '<button type="button" id="quiz-begin" class="inline-block bg-charcoal text-cream font-sans text-xs md:text-sm font-semibold tracking-[0.2em] uppercase px-8 py-4 transition-colors duration-300 hover:bg-gold hover:text-charcoal cursor-pointer">Comenzar Quiz</button>' +
      '</div>';

    document.getElementById('quiz-begin').addEventListener('click', startQuiz);
  }

  function startQuiz() {
    loadData()
      .then(function () {
        step = 'question';
        questionIndex = 0;
        scores = {};
        render();
      })
      .catch(function () {
        renderError('No pudimos cargar las preguntas del quiz. Verifica tu conexión e inténtalo de nuevo.');
      });
  }

  function renderError(message) {
    content.innerHTML =
      '<div class="p-8 sm:p-10 md:p-14 text-center">' +
        '<p class="text-gold text-[11px] md:text-xs tracking-[0.25em] uppercase font-semibold mb-6">UPS, ALGO SALIÓ MAL</p>' +
        '<div class="w-10 h-[2px] bg-gold mx-auto mb-6"></div>' +
        '<p class="font-sans text-sm md:text-base text-[#4B4640] leading-relaxed mb-8">' + escapeHtml(message) + '</p>' +
        '<button type="button" id="quiz-retry" class="inline-block bg-charcoal text-cream font-sans text-xs md:text-sm font-semibold tracking-[0.2em] uppercase px-8 py-4 transition-colors duration-300 hover:bg-gold hover:text-charcoal cursor-pointer">Intentar de nuevo</button>' +
      '</div>';

    document.getElementById('quiz-retry').addEventListener('click', startQuiz);
  }

  // ----- Step 2: Questions -----
  function renderQuestion() {
    var total = quizData.questions.length;
    var q = quizData.questions[questionIndex];
    var html = '';

    html += '<div class="p-8 sm:p-10 md:p-14">';

    html += '<p class="text-gold text-[11px] md:text-xs tracking-[0.2em] uppercase font-semibold mb-6">Pregunta ' + (questionIndex + 1) + ' de ' + total + '</p>';

    html += '<div class="flex gap-2 mb-8">';
    for (var i = 0; i < total; i++) {
      html += '<div class="h-[2px] flex-1 ' + (i <= questionIndex ? 'bg-gold' : 'bg-charcoal/15') + '"></div>';
    }
    html += '</div>';

    html += '<h2 class="font-bodoni font-medium text-xl md:text-3xl text-charcoal leading-snug tracking-tight mb-8">' + escapeHtml(q.question) + '</h2>';

    html += '<div class="space-y-4">';
    q.options.forEach(function (opt, i) {
      html += '<button type="button" data-option="' + i + '" class="quiz-option w-full text-left border border-charcoal/20 hover:border-gold focus:border-gold focus:outline-none p-5 md:p-6 transition-colors duration-300 cursor-pointer">';
      html += '<span class="block text-gold text-[10px] md:text-[11px] tracking-[0.25em] uppercase font-semibold mb-2">OPCIÓN ' + OPTION_LABELS[i] + '</span>';
      html += '<span class="block font-sans text-sm md:text-base text-charcoal leading-relaxed">' + escapeHtml(opt.text) + '</span>';
      html += '</button>';
    });
    html += '</div>';

    html += '</div>';

    content.innerHTML = html;

    var optionButtons = content.querySelectorAll('.quiz-option');
    Array.prototype.forEach.call(optionButtons, function (btn) {
      btn.addEventListener('click', function () {
        chooseOption(parseInt(btn.getAttribute('data-option'), 10));
      });
    });
  }

  function chooseOption(optionIndex) {
    var q = quizData.questions[questionIndex];
    var opt = q.options[optionIndex];
    scores[opt.archetype] = (scores[opt.archetype] || 0) + opt.points;
    answers.push(optionIndex);

    if (questionIndex < quizData.questions.length - 1) {
      questionIndex += 1;
      render();
    } else {
      step = 'calculating';
      render();
      calcTimer = setTimeout(function () {
        step = 'email';
        render();
        calcTimer = null;
      }, 1800);
    }
  }

  // ----- Step 3: Calculating -----
  function renderCalculating() {
    content.innerHTML =
      '<div class="p-8 sm:p-10 md:p-14 text-center">' +
        '<div class="w-12 h-12 border-2 border-charcoal/20 border-t-gold animate-spin mx-auto"></div>' +
        '<p class="font-bodoni font-medium text-xl md:text-2xl text-charcoal leading-tight mt-8">Calculando tu perfil...</p>' +
        '<p class="font-sans text-sm md:text-base text-[#4B4640] leading-relaxed mt-4">Analizando tus respuestas para revelar tu arquetipo de liderazgo dominante.</p>' +
      '</div>';
  }

  // ----- Step 4: Email capture -----
  function renderEmail() {
    content.innerHTML =
      '<div class="p-8 sm:p-10 md:p-14 text-center">' +
        '<p class="text-gold text-[11px] md:text-xs tracking-[0.25em] uppercase font-semibold mb-6">PASO FINAL</p>' +
        '<div class="w-10 h-[2px] bg-gold mx-auto mb-6"></div>' +
        '<h2 class="font-bodoni font-medium text-2xl md:text-3xl text-charcoal leading-tight tracking-tight mb-5">Recibe tu desglose completo de liderazgo</h2>' +
        '<p class="font-sans text-sm md:text-base text-[#4B4640] leading-relaxed mb-8">Déjanos tu correo y te enviaremos el análisis detallado de tu arquetipo con recomendaciones personalizadas.</p>' +
        '<form id="quiz-email-form" class="text-left">' +
          '<label for="quiz-email" class="block text-charcoal text-[11px] md:text-xs tracking-[0.2em] uppercase font-semibold mb-3">TU EMAIL</label>' +
          '<input type="email" id="quiz-email" name="email" placeholder="tucorreo@ejemplo.com" autocomplete="email" required ' +
            'class="w-full bg-transparent border-b border-charcoal/30 focus:border-gold text-charcoal placeholder:text-charcoal/40 text-base py-3 focus:outline-none transition-colors duration-300 mb-8">' +
          '<button type="submit" id="quiz-email-submit" class="w-full inline-flex items-center justify-center gap-2 bg-charcoal text-cream font-sans text-xs md:text-sm font-semibold tracking-[0.2em] uppercase px-8 py-4 transition-colors duration-300 hover:bg-gold hover:text-charcoal disabled:opacity-60 disabled:cursor-wait cursor-pointer">Ver mi resultado <span aria-hidden="true">→</span></button>' +
          '<div id="quiz-email-status" class="min-h-[24px] mt-4 text-left font-sans text-sm" role="status" aria-live="polite"></div>' +
        '</form>' +
        '<button type="button" id="quiz-skip" class="mt-6 text-charcoal hover:text-gold font-sans text-xs tracking-[0.2em] uppercase font-semibold border-b border-charcoal/40 hover:border-gold pb-1 transition-colors duration-300 focus:outline-none disabled:opacity-60 disabled:cursor-wait cursor-pointer">Saltar y ver mi resultado ahora</button>' +
      '</div>';

    document.getElementById('quiz-email-form').addEventListener('submit', submitEmail);
    document.getElementById('quiz-skip').addEventListener('click', skipEmail);
  }

  function skipEmail() {
    if (isSending) {
      return;
    }
    showResult();
  }

  function submitEmail(e) {
    e.preventDefault();

    if (isSending) {
      return;
    }

    var input = document.getElementById('quiz-email');
    var email = input.value.trim();

    if (!email) {
      showEmailStatus('Por favor ingresa un correo válido.', true);
      return;
    }

    userEmail = email;
    setEmailSending(true);
    showEmailStatus('', false);

    var result = computeDetailedResult();

    sendQuizResultsByEmail(email, result)
      .then(function () {
        setEmailSending(false);
        showResult();
      })
      .catch(function () {
        setEmailSending(false);
        showEmailStatus('No pudimos enviar tu resultado. Revisa tu correo e inténtalo de nuevo, o salta este paso.', true);
      });
  }

  function setEmailSending(sending) {
    isSending = sending;

    var submit = document.getElementById('quiz-email-submit');
    var skip = document.getElementById('quiz-skip');

    if (submit) {
      submit.disabled = sending;
      if (sending) {
        submit.innerHTML =
          '<span class="inline-block h-4 w-4 border-2 border-cream/30 border-t-cream animate-spin align-middle" aria-hidden="true"></span>' +
          '<span>Enviando...</span>';
      } else {
        submit.innerHTML = 'Ver mi resultado <span aria-hidden="true">→</span>';
      }
    }

    if (skip) {
      skip.disabled = sending;
    }
  }

  function showEmailStatus(message, isError) {
    var status = document.getElementById('quiz-email-status');
    if (!status) {
      return;
    }
    status.textContent = message;
    status.className = 'min-h-[24px] mt-4 text-left font-sans text-sm ' + (isError ? 'text-error' : 'text-charcoal');
  }

  function sendQuizResultsByEmail(email, result) {
    return fetch('./api/send-quiz-results.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: email,
        result: result
      })
    }).then(function (res) {
      return res.json().catch(function () {
        return {};
      }).then(function (data) {
        if (!res.ok || data.error) {
          throw new Error(data.error || ('HTTP ' + res.status));
        }
        return data;
      });
    });
  }

  // ----- Step 5: Result -----
  function showResult() {
    step = 'result';
    render();
  }

  function computeResult() {
    var bestArchetype = null;
    var bestScore = -1;

    Object.keys(scores).forEach(function (archetype) {
      if (scores[archetype] > bestScore) {
        bestScore = scores[archetype];
        bestArchetype = archetype;
      }
    });

    if (!bestArchetype) {
      bestArchetype = Object.keys(quizData.archetypes)[0];
    }

    return bestArchetype;
  }

  function computeDetailedResult() {
    var bestKey = computeResult();
    var keys = Object.keys(quizData.archetypes);

    var scoreBreakdown = keys.map(function (key) {
      return {
        key: key,
        title: quizData.archetypes[key].title,
        points: scores[key] || 0
      };
    }).sort(function (a, b) {
      return b.points - a.points;
    });

    var totalPoints = scoreBreakdown.reduce(function (sum, row) {
      return sum + row.points;
    }, 0);

    var answersBreakdown = quizData.questions.map(function (q, i) {
      var optionIndex = answers[i];
      var selected = (typeof optionIndex === 'number' && q.options[optionIndex])
        ? q.options[optionIndex]
        : null;

      return {
        question: q.question,
        answer: selected ? selected.text : null,
        archetype: selected ? selected.archetype : null,
        points: selected ? selected.points : 0
      };
    });

    return {
      key: bestKey,
      archetype: quizData.archetypes[bestKey],
      scores: scoreBreakdown,
      answers: answersBreakdown,
      totalPoints: totalPoints,
      totalQuestions: quizData.questions.length
    };
  }

  function renderResult() {
    var result = computeDetailedResult();
    var archetype = result.archetype;

    content.innerHTML =
      '<div class="p-8 sm:p-10 md:p-14 text-center">' +
        '<p class="text-gold text-[11px] md:text-xs tracking-[0.25em] uppercase font-semibold mb-6">TU ARQUETIPO DE LIDERAZGO</p>' +
        '<div class="w-10 h-[2px] bg-gold mx-auto mb-6"></div>' +
        '<h2 class="font-bodoni font-medium text-3xl md:text-4xl text-charcoal leading-tight tracking-tight mb-5">' + escapeHtml(archetype.title) + '</h2>' +
        '<p class="font-sans text-sm md:text-base text-[#4B4640] leading-relaxed mb-6">' + escapeHtml(archetype.description) + '</p>' +
        '<p class="font-sans text-sm md:text-base text-deep-gold leading-relaxed mb-8">' + escapeHtml(archetype.cta) + '</p>' +
        '<a href="#agendar" id="quiz-result-cta" class="inline-flex items-center justify-center gap-2 bg-charcoal text-cream font-sans text-xs md:text-sm font-semibold tracking-[0.2em] uppercase px-8 py-4 transition-colors duration-300 hover:bg-gold hover:text-charcoal">Agendar mi sesión <span aria-hidden="true">→</span></a>' +
      '</div>';

    document.getElementById('quiz-result-cta').addEventListener('click', closeModal);
  }

  // ----- Event wiring -----
  trigger.addEventListener('click', function (e) {
    e.preventDefault();
    openModal();
  });

  closeBtn.addEventListener('click', closeModal);

  overlay.addEventListener('click', function (e) {
    if (e.target === overlay) {
      closeModal();
    }
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !modal.classList.contains('hidden')) {
      closeModal();
    }
  });
})();