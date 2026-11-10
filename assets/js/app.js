/*
 * THE FOOD GARDEN: site behaviour (vanilla JS, no dependencies)
 * ---------------------------------------------------------------------------
 *  1. Helpers                5. Reviews section + "Write a Review" form
 *  2. Visitor review store   6. Table booking -> WhatsApp enquiry
 *  3. Menu (filter/search/   7. Navigation, opening status, misc.
 *     sort)                  8. Start-up
 *  4. Food details dialog
 *
 * This is a discovery + enquiry demo: there is no backend, no ordering and no payment.
 * Visitor reviews are kept in this browser's localStorage only.
 */
(function () {
  'use strict';

  var DATA = window.FOOD_GARDEN;
  if (!DATA) return;

  var SITE = DATA.site;
  var CATEGORIES = DATA.categories;
  var DISHES = DATA.dishes;
  var SAMPLE_REVIEWS = DATA.sampleReviews;

  var dishById = {};
  var categoryLabel = {};
  DISHES.forEach(function (d, i) { d.order = i; dishById[d.id] = d; });
  CATEGORIES.forEach(function (c) { categoryLabel[c.id] = c.label; });

  /* ======================================================================
   * 1. Helpers
   * ==================================================================== */
  var SVG_NS = 'http://www.w3.org/2000/svg';
  var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  var WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  var RATING_WORDS = ['', 'Poor', 'Fair', 'Good', 'Very good', 'Excellent'];

  function byId(id) { return document.getElementById(id); }
  function $$(selector, root) { return Array.prototype.slice.call((root || document).querySelectorAll(selector)); }

  /**
   * Small DOM builder. Text always goes through textContent / text nodes,
   * so nothing typed by a visitor is ever parsed as HTML.
   */
  function h(tag, attrs) {
    var node = document.createElement(tag);
    var key, value, i, child;
    if (attrs) {
      for (key in attrs) {
        if (!Object.prototype.hasOwnProperty.call(attrs, key)) continue;
        value = attrs[key];
        if (value === null || value === undefined || value === false) continue;
        if (key === 'class') node.className = value;
        else if (key === 'text') node.textContent = value;
        else if (value === true) node.setAttribute(key, '');
        else node.setAttribute(key, value);
      }
    }
    for (i = 2; i < arguments.length; i++) {
      child = arguments[i];
      if (child === null || child === undefined || child === false) continue;
      if (Array.isArray(child)) child.forEach(function (c) { if (c) node.appendChild(c.nodeType ? c : document.createTextNode(String(c))); });
      else node.appendChild(child.nodeType ? child : document.createTextNode(String(child)));
    }
    return node;
  }

  function icon(name, extraClass) {
    var svg = document.createElementNS(SVG_NS, 'svg');
    var use = document.createElementNS(SVG_NS, 'use');
    svg.setAttribute('class', 'icon' + (extraClass ? ' ' + extraClass : ''));
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('focusable', 'false');
    use.setAttribute('href', '#i-' + name);
    svg.appendChild(use);
    return svg;
  }

  /** Five stars with a partial fill, e.g. 4.8 fills 96% of the row. */
  function stars(value, small) {
    var wrap = h('span', { class: 'stars' + (small ? ' stars--sm' : ''), role: 'img', 'aria-label': 'Rated ' + value + ' out of 5' });
    var base = h('span', { class: 'stars__base', 'aria-hidden': 'true' });
    var fill = h('span', { class: 'stars__fill', 'aria-hidden': 'true' });
    var i;
    wrap.style.setProperty('--rating', String(value));
    for (i = 0; i < 5; i++) { base.appendChild(icon('star')); fill.appendChild(icon('star')); }
    wrap.appendChild(base);
    wrap.appendChild(fill);
    return wrap;
  }

  function formatPrice(amount) { return '\u20B9' + amount; }
  function plural(count, one, many) { return count + ' ' + (count === 1 ? one : many); }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function toISODate(date) { return date.getFullYear() + '-' + pad(date.getMonth() + 1) + '-' + pad(date.getDate()); }

  /** "2026-10-28" -> "28 Oct 2026" (parsed by hand so time zones can never shift the day). */
  function formatDate(iso) {
    var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || '');
    if (!m) return '';
    return Number(m[3]) + ' ' + MONTHS[Number(m[2]) - 1] + ' ' + m[1];
  }
  function formatLongDate(iso) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || '');
    if (!m) return '';
    var date = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
    return WEEKDAYS[date.getDay()] + ', ' + formatDate(iso);
  }
  /** "19:30" -> "7:30 PM" */
  function formatTime(hhmm) {
    var parts = hhmm.split(':');
    var hours = Number(parts[0]);
    var suffix = hours >= 12 ? 'PM' : 'AM';
    return ((hours + 11) % 12 + 1) + ':' + parts[1] + ' ' + suffix;
  }

  /** Lower-case, accent-free, single-spaced text for forgiving search. */
  function normalise(text) {
    var s = String(text || '').toLowerCase();
    if (s.normalize) s = s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    return s.replace(/\s+/g, ' ').trim();
  }
  function cleanLine(text) { return String(text || '').replace(/\s+/g, ' ').trim(); }

  function imageUrl(dish, width) { return 'assets/img/dishes/' + dish.image + '-' + width + '.webp'; }
  function imageSrcset(dish) { return imageUrl(dish, 400) + ' 400w, ' + imageUrl(dish, 640) + ' 640w, ' + imageUrl(dish, 960) + ' 960w'; }

  var reducedMotion = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };
  function scrollToElement(el, block) {
    if (!el) return;
    el.scrollIntoView({ behavior: reducedMotion.matches ? 'auto' : 'smooth', block: block || 'start' });
  }

  /* ---- Toast ---- */
  var toastEl = byId('toast');
  var toastTimer = null;
  function toast(message) {
    var dialog = byId('dish-dialog');
    // A modal <dialog> sits in the top layer, so the toast has to live inside it to be seen.
    var host = dialog && dialog.open ? dialog : document.body;
    if (toastEl.parentNode !== host) host.appendChild(toastEl);
    toastEl.textContent = message;
    toastEl.classList.add('is-visible');
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(function () { toastEl.classList.remove('is-visible'); }, 4200);
  }

  /* ---- Field errors ---- */
  function setFieldError(control, errorEl, message) {
    if (message) {
      control.setAttribute('aria-invalid', 'true');
      errorEl.textContent = message;
      errorEl.hidden = false;
    } else {
      control.removeAttribute('aria-invalid');
      errorEl.textContent = '';
      errorEl.hidden = true;
    }
  }

  /* ======================================================================
   * 2. Visitor review store (localStorage, with an in-memory fallback)
   * ==================================================================== */
  var STORAGE_KEY = 'theFoodGarden.visitorReviews.v1';
  var NAME_MAX = 40;
  var COMMENT_MAX = 400;

  var reviewStore = (function () {
    var items = [];
    var persistent = true;

    function isValid(r) {
      return r && typeof r === 'object' &&
        typeof r.id === 'string' &&
        Object.prototype.hasOwnProperty.call(dishById, r.dishId) &&
        typeof r.name === 'string' && r.name.trim() !== '' &&
        typeof r.comment === 'string' && r.comment.trim() !== '' &&
        Number.isInteger(r.rating) && r.rating >= 1 && r.rating <= 5 &&
        typeof r.createdAt === 'string';
    }
    function tidy(r) {
      return {
        id: r.id,
        dishId: r.dishId,
        name: cleanLine(r.name).slice(0, NAME_MAX),
        rating: r.rating,
        comment: cleanLine(r.comment).slice(0, COMMENT_MAX),
        createdAt: r.createdAt
      };
    }
    function load() {
      try {
        var raw = window.localStorage.getItem(STORAGE_KEY);
        var parsed = raw ? JSON.parse(raw) : [];
        items = Array.isArray(parsed) ? parsed.filter(isValid).map(tidy) : [];
      } catch (err) {
        items = [];
        persistent = false;
      }
    }
    function save() {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
        persistent = true;
      } catch (err) {
        persistent = false; // private mode / storage blocked: keep working in memory
      }
      return persistent;
    }

    load();
    return {
      forDish: function (dishId) {
        return items.filter(function (r) { return r.dishId === dishId; })
          .sort(function (a, b) { return a.createdAt < b.createdAt ? 1 : -1; });
      },
      countFor: function (dishId) { return items.filter(function (r) { return r.dishId === dishId; }).length; },
      add: function (review) {
        var entry = tidy({
          id: 'v' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
          dishId: review.dishId,
          name: review.name,
          rating: review.rating,
          comment: review.comment,
          createdAt: new Date().toISOString()
        });
        items.push(entry);
        return { review: entry, saved: save() };
      },
      remove: function (id) {
        items = items.filter(function (r) { return r.id !== id; });
        save();
      }
    };
  })();

  function totalReviews(dishId) {
    return (SAMPLE_REVIEWS[dishId] || []).length + reviewStore.countFor(dishId);
  }

  /* ---- Review list rendering (shared by the dialog and the Reviews section) ---- */
  function reviewItem(review, kind, dish) {
    var isVisitor = kind === 'visitor';
    var name = review.name;
    var initial = Array.from(name.trim())[0] || '?';
    var dateText = isVisitor ? formatDate(toISODate(new Date(review.createdAt))) : formatDate(review.date);
    var item = h('li', { class: 'review' + (isVisitor ? ' review--visitor' : ''), 'data-review-id': isVisitor ? review.id : null },
      h('span', { class: 'review__avatar', 'aria-hidden': 'true', text: initial }),
      h('div', { class: 'review__head' },
        h('div', { class: 'review__who' },
          h('span', { class: 'review__name', text: name }),
          dateText ? h('span', { class: 'review__date', text: dateText }) : null
        ),
        h('span', { class: 'review__badge' + (isVisitor ? ' review__badge--visitor' : ''), text: isVisitor ? 'Unverified' : 'Sample' })
      ),
      h('div', { class: 'review__stars' }, stars(review.rating, true), h('span', { text: review.rating + '/5' })),
      h('p', { class: 'review__text', text: review.comment })
    );
    if (isVisitor) {
      item.appendChild(h('button', {
        class: 'review__remove', type: 'button', 'data-remove-review': review.id,
        'aria-label': 'Remove the review by ' + name + ' for ' + dish.name
      }, 'Remove'));
    }
    return item;
  }

  function renderReviewGroups(container, dish) {
    var samples = SAMPLE_REVIEWS[dish.id] || [];
    var visitors = reviewStore.forDish(dish.id);
    container.textContent = '';

    container.appendChild(h('section', { class: 'review-group' },
      h('h4', { class: 'review-group__title' }, 'Sample reviews (' + samples.length + ')'),
      h('ul', { class: 'review-list' }, samples.map(function (r) { return reviewItem(r, 'sample', dish); }))
    ));

    container.appendChild(h('section', { class: 'review-group' },
      h('h4', { class: 'review-group__title' },
        'Visitor reviews (' + visitors.length + ')',
        h('span', { class: 'review-group__hint', text: 'Unverified, saved in this browser only' })
      ),
      visitors.length
        ? h('ul', { class: 'review-list' }, visitors.map(function (r) { return reviewItem(r, 'visitor', dish); }))
        : h('p', { class: 'review-empty', text: 'No visitor reviews yet. Be the first to review ' + dish.name + '.' })
    ));
  }

  /* ======================================================================
   * 3. Menu: categories, search, sorting
   * ==================================================================== */
  var menuState = { category: 'all', query: '', sort: 'popular' };
  var menuGrid = byId('menu-grid');
  var menuCards = {};
  var menuChips = {};
  var searchInput = byId('menu-search');
  var searchClear = byId('menu-search-clear');
  var sortSelect = byId('menu-sort');

  var SORTERS = {
    // Popular = highest listed rating first; ties broken by review count, then menu order.
    popular: function (a, b) { return (b.rating - a.rating) || (totalReviews(b.id) - totalReviews(a.id)) || (a.order - b.order); },
    'price-asc': function (a, b) { return (a.price - b.price) || (a.order - b.order); },
    'price-desc': function (a, b) { return (b.price - a.price) || (a.order - b.order); }
  };

  function matchesQuery(dish, tokens) {
    var name = normalise(dish.name);
    return tokens.every(function (t) { return name.indexOf(t) !== -1; });
  }

  function ratingLine(dish) {
    var count = totalReviews(dish.id);
    return h('span', { class: 'rating', role: 'img', 'aria-label': 'Rated ' + dish.rating.toFixed(1) + ' out of 5, ' + plural(count, 'review', 'reviews') },
      icon('star'),
      h('span', { class: 'rating__value', 'aria-hidden': 'true', text: dish.rating.toFixed(1) }),
      h('span', { class: 'rating__count', 'aria-hidden': 'true', 'data-review-count': dish.id, text: '(' + plural(count, 'review', 'reviews') + ')' })
    );
  }

  function dietMark(dish) {
    var veg = dish.diet === 'veg';
    return h('span', { class: 'diet diet--' + (veg ? 'veg' : 'non-veg'), role: 'img', 'aria-label': veg ? 'Vegetarian' : 'Non-vegetarian', title: veg ? 'Vegetarian' : 'Non-vegetarian' });
  }

  function buildCard(dish) {
    return h('article', { class: 'dish-card', 'data-id': dish.id },
      h('div', { class: 'dish-card__media' },
        h('img', {
          src: imageUrl(dish, 400), srcset: imageSrcset(dish),
          sizes: '(min-width: 1080px) 282px, (min-width: 760px) 31vw, (min-width: 340px) 46vw, 92vw',
          width: 400, height: 300, alt: dish.alt, loading: 'lazy', decoding: 'async'
        }),
        dietMark(dish)
      ),
      h('div', { class: 'dish-card__body' },
        h('p', { class: 'dish-card__cat', text: categoryLabel[dish.category] }),
        h('h3', { class: 'dish-card__name', text: dish.name }),
        h('p', { class: 'dish-card__desc', text: dish.summary }),
        h('div', { class: 'dish-card__meta' },
          h('span', { class: 'price', text: formatPrice(dish.price) }),
          ratingLine(dish)
        ),
        h('button', { class: 'btn btn--secondary btn--block', type: 'button', 'data-open-dish': dish.id },
          'View Details', h('span', { class: 'sr-only', text: ': ' + dish.name }))
      )
    );
  }

  function buildMenu() {
    var chipHost = byId('menu-categories');
    var all = [{ id: 'all', label: 'All' }].concat(CATEGORIES);
    all.forEach(function (cat) {
      var count = cat.id === 'all' ? DISHES.length : DISHES.filter(function (d) { return d.category === cat.id; }).length;
      var chip = h('button', { class: 'chip', type: 'button', 'data-category': cat.id, 'aria-pressed': cat.id === 'all' ? 'true' : 'false' },
        cat.label, h('span', { class: 'chip__count', 'aria-hidden': 'true', text: String(count) }),
        h('span', { class: 'sr-only', text: ', ' + plural(count, 'dish', 'dishes') })
      );
      menuChips[cat.id] = chip;
      chipHost.appendChild(chip);
    });

    DISHES.forEach(function (dish) {
      var card = buildCard(dish);
      menuCards[dish.id] = card;
      menuGrid.appendChild(card);
    });

    chipHost.addEventListener('click', function (event) {
      var chip = event.target.closest('.chip');
      if (chip) setCategory(chip.getAttribute('data-category'));
    });
    searchInput.addEventListener('input', function () {
      menuState.query = searchInput.value;
      applyMenu();
    });
    // The search box filters as you type; Enter just dismisses the phone keyboard.
    searchInput.addEventListener('keydown', function (event) {
      if (event.key === 'Enter') { event.preventDefault(); searchInput.blur(); }
    });
    searchClear.addEventListener('click', function () {
      searchInput.value = '';
      menuState.query = '';
      applyMenu();
      searchInput.focus();
    });
    sortSelect.addEventListener('change', function () {
      menuState.sort = SORTERS[sortSelect.value] ? sortSelect.value : 'popular';
      applyMenu();
    });
    byId('menu-reset').addEventListener('click', function () {
      var keepQuery = this.getAttribute('data-mode') === 'all-categories';
      menuState.category = 'all';
      if (!keepQuery) { menuState.query = ''; searchInput.value = ''; }
      applyMenu();
      (keepQuery ? menuChips.all : searchInput).focus();
    });
    menuGrid.addEventListener('click', function (event) {
      var card = event.target.closest('.dish-card');
      if (card) openDish(card.getAttribute('data-id'));
    });

    applyMenu();
  }

  function setCategory(categoryId) {
    menuState.category = (categoryId === 'all' || categoryLabel[categoryId]) ? categoryId : 'all';
    applyMenu();
    var chip = menuChips[menuState.category];
    // Keep the selected chip in view inside its own horizontal scroller (never scrolls the page).
    var host = chip && chip.parentNode;
    if (host && host.scrollWidth > host.clientWidth) {
      host.scrollTo({ left: chip.offsetLeft - (host.clientWidth - chip.offsetWidth) / 2, behavior: reducedMotion.matches ? 'auto' : 'smooth' });
    }
  }

  function applyMenu() {
    var tokens = normalise(menuState.query).split(' ').filter(Boolean);
    var inCategory = function (d) { return menuState.category === 'all' || d.category === menuState.category; };
    var results = DISHES.filter(function (d) { return inCategory(d) && matchesQuery(d, tokens); });
    var visible = {};
    var countEl = byId('menu-count');
    var emptyEl = byId('menu-empty');
    var resetBtn = byId('menu-reset');
    var queryText = cleanLine(menuState.query);
    var elsewhere, text;

    results.sort(SORTERS[menuState.sort] || SORTERS.popular);
    results.forEach(function (d) { visible[d.id] = true; });

    DISHES.forEach(function (d) { menuCards[d.id].hidden = !visible[d.id]; });
    results.forEach(function (d) { menuGrid.appendChild(menuCards[d.id]); }); // re-order without re-creating images

    Object.keys(menuChips).forEach(function (id) {
      menuChips[id].setAttribute('aria-pressed', id === menuState.category ? 'true' : 'false');
    });
    searchClear.hidden = menuState.query === '';

    // Result summary
    if (results.length === DISHES.length) text = 'Showing all ' + plural(DISHES.length, 'dish', 'dishes');
    else text = 'Showing ' + results.length + ' of ' + plural(DISHES.length, 'dish', 'dishes');
    if (menuState.category !== 'all') text += ' in ' + categoryLabel[menuState.category];
    if (queryText) text += ' for \u201C' + queryText + '\u201D';
    countEl.textContent = text;
    countEl.hidden = results.length === 0;

    // Empty state
    menuGrid.hidden = results.length === 0;
    emptyEl.hidden = results.length !== 0;
    if (results.length === 0) {
      elsewhere = menuState.category === 'all' ? 0 : DISHES.filter(function (d) { return matchesQuery(d, tokens); }).length;
      text = 'Nothing on the menu matches \u201C' + queryText + '\u201D';
      if (menuState.category !== 'all') text += ' in ' + categoryLabel[menuState.category];
      text += '.';
      if (elsewhere) text += ' ' + plural(elsewhere, 'match', 'matches') + ' in other categories.';
      else text += ' Try another name, such as biryani, pizza or coffee.';
      byId('menu-empty-text').textContent = text;
      resetBtn.textContent = elsewhere ? 'Search all categories' : 'Show all dishes';
      resetBtn.setAttribute('data-mode', elsewhere ? 'all-categories' : 'reset');
    }
  }

  function refreshReviewCounts(dishId) {
    var count = totalReviews(dishId);
    var dish = dishById[dishId];
    $$('[data-review-count="' + dishId + '"]').forEach(function (el) {
      el.textContent = '(' + plural(count, 'review', 'reviews') + ')';
      if (el.parentNode && el.parentNode.classList.contains('rating')) {
        el.parentNode.setAttribute('aria-label', 'Rated ' + dish.rating.toFixed(1) + ' out of 5, ' + plural(count, 'review', 'reviews'));
      }
    });
    if (menuState.sort === 'popular') applyMenu(); // review count is the tie-breaker for "Popular"
  }

  /* ======================================================================
   * 4. Food details dialog
   *    The open dish is mirrored in the URL (#dish-<id>) so the phone's Back
   *    button closes the dialog instead of leaving the site.
   * ==================================================================== */
  var dishDialog = byId('dish-dialog');
  var dishDialogBody = byId('dish-dialog-body');
  var openDishId = null;
  var dishOpener = null; // the control that opened the dialog; focus goes back to it on close
  var dishPageY = null;  // where the page was when the dialog opened; it must be there again on close
  var DISH_HASH = '#dish-';

  function dishIdFromHash() {
    var hash = window.location.hash || '';
    var id = hash.indexOf(DISH_HASH) === 0 ? decodeURIComponent(hash.slice(DISH_HASH.length)) : '';
    return Object.prototype.hasOwnProperty.call(dishById, id) ? id : null;
  }

  var AVAILABILITY = {
    available: { cls: 'avail--available', label: 'Available today' },
    limited: { cls: 'avail--limited', label: 'Limited availability' },
    unavailable: { cls: 'avail--unavailable', label: 'Not available today' }
  };

  function renderDish(dish) {
    var count = totalReviews(dish.id);
    var availability = dish.availability || {};
    var status = AVAILABILITY[availability.status] || AVAILABILITY.available;
    var reviewsHost = h('div', { class: 'dish-detail__review-groups' });

    var content = h('div', { class: 'dish-detail__content' },
      h('div', { class: 'dish-detail__tags' },
        h('span', { class: 'tag', text: categoryLabel[dish.category] }),
        h('span', { class: 'tag' }, dietMark(dish), dish.diet === 'veg' ? 'Veg' : 'Non-veg')
      ),
      h('h2', { class: 'dish-detail__title', id: 'dish-dialog-title', text: dish.name }),
      h('div', { class: 'dish-detail__rating' },
        stars(dish.rating),
        h('strong', { text: dish.rating.toFixed(1) }),
        h('a', { href: '#dish-reviews', 'data-jump-reviews': true, 'data-review-total': dish.id, text: plural(count, 'review', 'reviews') })
      ),
      h('div', { class: 'dish-detail__buy' },
        h('p', { class: 'price dish-detail__price', text: formatPrice(dish.price) }),
        h('p', { class: 'tag avail ' + status.cls },
          h('span', { class: 'sr-only', text: 'Availability: ' }), status.label)
      ),
      h('p', { class: 'dish-detail__desc', text: dish.description }),
      availability.note ? h('p', { class: 'dish-detail__note', text: availability.note }) : null,
      h('h3', { class: 'dish-detail__subhead', text: 'Ingredients' }),
      h('ul', { class: 'ingredients' }, dish.ingredients.map(function (name) { return h('li', { text: name }); })),
      h('div', { class: 'dish-detail__actions' },
        h('button', { class: 'btn btn--primary', type: 'button', 'data-enquire': dish.id }, 'Book This Food / Enquire'),
        h('button', { class: 'btn btn--outline', type: 'button', 'data-write-review': dish.id }, icon('square-pen'), 'Write a Review')
      ),
      h('p', { class: 'dish-detail__note', text: 'Enquiries only. This demo does not take online orders or payments.' }),
      h('section', { class: 'dish-detail__reviews', id: 'dish-reviews', tabindex: '-1', 'aria-label': 'Reviews for ' + dish.name },
        h('h3', { text: 'Reviews for ' + dish.name }),
        h('p', { class: 'notice' }, icon('info'), h('span', { text: 'These are sample reviews for demonstration purposes, not verified customer feedback.' })),
        reviewsHost
      )
    );

    dishDialogBody.textContent = '';
    dishDialogBody.appendChild(h('div', { class: 'dish-detail__media' },
      h('img', {
        src: imageUrl(dish, 640), srcset: imageSrcset(dish),
        sizes: '(min-width: 900px) 440px, (min-width: 640px) 620px, 100vw',
        width: 960, height: 720, alt: dish.alt, decoding: 'async'
      })
    ));
    dishDialogBody.appendChild(content);
    renderReviewGroups(reviewsHost, dish);
  }

  /** Start every dish at the top. Must run while the dialog is visible: a hidden element keeps its old scroll position. */
  function resetDishScroll() {
    var content = dishDialogBody.querySelector('.dish-detail__content');
    dishDialogBody.scrollTop = 0;
    if (content) content.scrollTop = 0;
    dishDialog.classList.remove('is-scrolled');
  }

  // Fade the top edge behind the close button once text has scrolled up to it.
  // (Scroll events do not bubble, so listen in the capture phase.)
  dishDialog.addEventListener('scroll', function (event) {
    var scroller = event.target;
    var media = dishDialogBody.querySelector('.dish-detail__media');
    var limit = 8;
    if (!scroller || scroller.nodeType !== 1) return;
    // One-column layout: the photo scrolls away first, so wait until it has almost gone.
    if (scroller === dishDialogBody && media) limit = Math.max(8, media.offsetHeight - 70);
    dishDialog.classList.toggle('is-scrolled', scroller.scrollTop > limit);
  }, true);

  function showDish(id) {
    var dish = dishById[id];
    if (!dish) return;
    openDishId = id;
    renderDish(dish);
    if (!dishDialog.open) {
      dishOpener = document.activeElement && document.activeElement !== document.body ? document.activeElement : null;
      dishPageY = window.pageYOffset;
      if (typeof dishDialog.showModal === 'function') dishDialog.showModal();
      else dishDialog.setAttribute('open', '');
    }
    resetDishScroll();
    document.documentElement.classList.add('is-locked');
  }

  /**
   * After the dialog closes: the page is where it was, and keyboard focus is back on the control
   * that opened the dialog. Browsers normally do both by themselves; this covers the cases where
   * stepping back in history moves the page or drops the focus.
   */
  function restoreAfterDish(opener, pageY) {
    var active = document.activeElement;
    if (dishDialog.open) return;
    if (pageY !== null && Math.abs(window.pageYOffset - pageY) > 1) {
      // At once, not with the smooth scrolling used for the navigation links.
      try { window.scrollTo({ top: pageY, left: 0, behavior: 'instant' }); } catch (err) { window.scrollTo(0, pageY); }
    }
    if (!opener || !document.documentElement.contains(opener)) return;
    if (active && active !== document.body && active !== document.documentElement) return; // focus is already somewhere useful
    try { opener.focus({ preventScroll: true }); } catch (err) { /* ignore */ }
  }

  /** Open from a user action: adds a history entry so Back closes the dialog. */
  function openDish(id) {
    if (!dishById[id]) return;
    if (dishIdFromHash() !== id) {
      try {
        // Leave a plain address behind. Stepping back to one that ends in a #section (after a tap on
        // "Menu", say) would make the browser jump to that section when the details close.
        if (window.location.hash && !dishIdFromHash()) {
          window.history.replaceState(window.history.state, '', window.location.pathname + window.location.search);
        }
        window.history.pushState({ dish: id }, '', DISH_HASH + encodeURIComponent(id));
      } catch (err) { /* e.g. sandboxed frame */ }
    }
    showDish(id);
  }

  function hideDish() {
    if (dishDialog.open) {
      if (typeof dishDialog.close === 'function') dishDialog.close();
      else dishDialog.removeAttribute('open');
    }
  }

  // Fires for the close button, Esc, a backdrop click and Back/Forward.
  dishDialog.addEventListener('close', function () {
    var opener = dishOpener;
    var pageY = dishPageY;
    var settle = function () { restoreAfterDish(opener, pageY); };
    var settleSoon = function () { settle(); window.setTimeout(settle, 0); window.setTimeout(settle, 60); };
    dishOpener = null;
    dishPageY = null;
    openDishId = null;
    document.documentElement.classList.remove('is-locked');
    if (toastEl.parentNode === dishDialog) document.body.appendChild(toastEl);
    if (dishIdFromHash()) {
      // Closed by the visitor (not by Back): take the dish out of the URL as well.
      try {
        if (window.history.state && window.history.state.dish) {
          window.addEventListener('popstate', function onPop() {
            window.removeEventListener('popstate', onPop);
            settleSoon();
          });
          window.history.back();
        } else {
          window.history.replaceState(null, '', window.location.pathname + window.location.search);
        }
      } catch (err) { /* ignore */ }
    }
    settleSoon();
  });

  /** Keep the dialog in step with the URL (Back/Forward buttons, shared links). */
  function syncDishWithUrl() {
    var id = dishIdFromHash();
    if (id) { if (id !== openDishId) showDish(id); }
    else hideDish();
  }
  window.addEventListener('popstate', syncDishWithUrl);

  /** Close the dialog and move to another part of the page in one step. */
  function leaveDishFor(targetId, focusEl) {
    var target = byId(targetId);
    try {
      if (dishIdFromHash()) window.history.replaceState(null, '', '#' + targetId);
    } catch (err) { /* ignore */ }
    dishOpener = null; // focus and the page move on to the new section instead
    dishPageY = null;
    hideDish();
    window.requestAnimationFrame(function () {
      scrollToElement(target);
      if (focusEl) focusEl.focus({ preventScroll: true });
    });
  }

  byId('dish-dialog-close').addEventListener('click', hideDish);
  dishDialog.addEventListener('click', function (event) {
    var target = event.target;
    var el;
    if (target === dishDialog) { hideDish(); return; } // click on the backdrop

    el = target.closest('[data-enquire]');
    if (el) {
      addEnquiry(el.getAttribute('data-enquire'));
      leaveDishFor('reserve', byId('reserve-title'));
      return;
    }
    el = target.closest('[data-write-review]');
    if (el) {
      selectReviewDish(el.getAttribute('data-write-review'));
      leaveDishFor('write-review', byId('review-form-title'));
      return;
    }
    el = target.closest('[data-jump-reviews]');
    if (el) {
      event.preventDefault();
      el = byId('dish-reviews');
      scrollToElement(el);
      el.focus({ preventScroll: true });
      return;
    }
    el = target.closest('[data-remove-review]');
    if (el) removeVisitorReview(el.getAttribute('data-remove-review'));
  });

  /* ======================================================================
   * 5. Reviews section + "Write a Review" form
   * ==================================================================== */
  var reviewPanel = byId('review-panel');
  var reviewPicker = byId('review-dish-picker');
  var reviewForm = byId('write-review');
  var reviewDishSelect = byId('review-dish');
  var reviewStarsHost = byId('review-stars');
  var reviewRatingText = byId('review-rating-text');
  var reviewRatingGroup = byId('review-rating');
  var selectedReviewDish = DISHES[0].id;
  var pickerButtons = {};

  function buildReviews() {
    // Dish picker
    DISHES.forEach(function (dish) {
      var button = h('button', { class: 'dish-pick', type: 'button', 'data-dish': dish.id, 'aria-pressed': 'false' },
        h('img', { class: 'dish-pick__img', src: imageUrl(dish, 400), width: 46, height: 46, alt: '', loading: 'lazy', decoding: 'async' }),
        h('span', null,
          h('span', { class: 'dish-pick__name', text: dish.name }),
          h('span', { class: 'dish-pick__rating' }, icon('star'), h('span', { text: dish.rating.toFixed(1) }), h('span', { class: 'sr-only', text: ' out of 5' }))
        )
      );
      pickerButtons[dish.id] = button;
      reviewPicker.appendChild(button);
    });
    reviewPicker.addEventListener('click', function (event) {
      var button = event.target.closest('.dish-pick');
      if (button) selectReviewDish(button.getAttribute('data-dish'));
    });

    // "Food item" select, grouped by category
    CATEGORIES.forEach(function (cat) {
      var group = h('optgroup', { label: cat.label });
      DISHES.filter(function (d) { return d.category === cat.id; }).forEach(function (d) {
        group.appendChild(h('option', { value: d.id, text: d.name }));
      });
      reviewDishSelect.appendChild(group);
    });
    reviewDishSelect.addEventListener('change', function () { selectReviewDish(reviewDishSelect.value); });

    // Star rating input: five radio buttons, so it works with keyboard and screen readers
    [1, 2, 3, 4, 5].forEach(function (value) {
      var id = 'review-star-' + value;
      reviewStarsHost.appendChild(h('input', { class: 'sr-only', type: 'radio', name: 'rating', id: id, value: String(value) }));
      reviewStarsHost.appendChild(h('label', { class: 'star-input__star', for: id, 'data-value': String(value), title: value + ' out of 5' },
        icon('star'), h('span', { class: 'sr-only', text: plural(value, 'star', 'stars') + ', ' + RATING_WORDS[value] })));
    });
    reviewStarsHost.addEventListener('change', function () {
      paintStars(currentRating());
      setFieldError(reviewRatingGroup, byId('review-rating-error'), '');
    });
    reviewStarsHost.addEventListener('mouseover', function (event) {
      var label = event.target.closest('.star-input__star');
      if (label) paintStars(Number(label.getAttribute('data-value')), true);
    });
    reviewStarsHost.addEventListener('mouseleave', function () { paintStars(currentRating()); });

    // Clear a field's error as soon as the visitor starts fixing it
    [['review-name', 'review-name-error'], ['review-comment', 'review-comment-error']].forEach(function (pair) {
      byId(pair[0]).addEventListener('input', function () { setFieldError(byId(pair[0]), byId(pair[1]), ''); });
    });

    reviewForm.addEventListener('submit', onReviewSubmit);
    reviewPanel.addEventListener('click', function (event) {
      var el = event.target.closest('[data-remove-review]');
      if (el) { removeVisitorReview(el.getAttribute('data-remove-review')); return; }
      el = event.target.closest('[data-open-dish]');
      if (el) openDish(el.getAttribute('data-open-dish'));
    });

    selectReviewDish(selectedReviewDish);
  }

  function currentRating() {
    var checked = reviewStarsHost.querySelector('input:checked');
    return checked ? Number(checked.value) : 0;
  }
  function paintStars(value, preview) {
    $$('.star-input__star', reviewStarsHost).forEach(function (label) {
      label.classList.toggle('is-on', Number(label.getAttribute('data-value')) <= value);
    });
    if (!preview) reviewRatingText.textContent = value ? value + '/5 \u00B7 ' + RATING_WORDS[value] : 'Tap a star to rate';
  }

  /** One shared selection: the dish shown on the left is the dish the form reviews. */
  function selectReviewDish(dishId) {
    if (!dishById[dishId]) return;
    selectedReviewDish = dishId;
    reviewDishSelect.value = dishId;
    setFieldError(reviewDishSelect, byId('review-dish-error'), '');
    Object.keys(pickerButtons).forEach(function (id) {
      pickerButtons[id].setAttribute('aria-pressed', id === dishId ? 'true' : 'false');
    });
    renderReviewPanel();
  }

  function renderReviewPanel() {
    var dish = dishById[selectedReviewDish];
    var count = totalReviews(dish.id);
    var groups = h('div');
    reviewPanel.textContent = '';
    reviewPanel.appendChild(h('div', { class: 'review-panel__head' },
      h('img', { class: 'review-panel__thumb', src: imageUrl(dish, 400), width: 72, height: 72, alt: '', loading: 'lazy', decoding: 'async' }),
      h('div', { class: 'review-panel__info' },
        h('h3', { class: 'review-panel__name', text: dish.name }),
        h('div', { class: 'review-panel__meta' },
          stars(dish.rating, true),
          h('strong', { text: dish.rating.toFixed(1) }),
          h('span', { text: plural(count, 'review', 'reviews') })
        )
      ),
      h('button', { class: 'btn btn--outline', type: 'button', 'data-open-dish': dish.id }, 'View dish', h('span', { class: 'sr-only', text: ': ' + dish.name }))
    ));
    reviewPanel.appendChild(groups);
    renderReviewGroups(groups, dish);
  }

  function onReviewSubmit(event) {
    event.preventDefault();
    var nameInput = byId('review-name');
    var commentInput = byId('review-comment');
    var statusEl = byId('review-status');
    var dishId = reviewDishSelect.value;
    var rating = currentRating();
    var name = cleanLine(nameInput.value);
    var comment = cleanLine(commentInput.value);
    var firstInvalid = null;
    var result, dish, newItem;

    function check(control, errorEl, message, focusTarget) {
      setFieldError(control, errorEl, message);
      if (message && !firstInvalid) firstInvalid = focusTarget || control;
    }

    check(reviewDishSelect, byId('review-dish-error'), dishById[dishId] ? '' : 'Please choose a food item.');
    check(reviewRatingGroup, byId('review-rating-error'), rating >= 1 && rating <= 5 ? '' : 'Please tap a star to give your rating.', byId('review-star-1'));
    check(nameInput, byId('review-name-error'), name.length >= 2 ? '' : 'Please enter your name (at least 2 characters).');
    check(commentInput, byId('review-comment-error'), comment.length >= 3 ? '' : 'Please write a few words about the food.');

    if (firstInvalid) {
      statusEl.hidden = true;
      firstInvalid.focus();
      return;
    }

    dish = dishById[dishId];
    result = reviewStore.add({ dishId: dishId, name: name, rating: rating, comment: comment });

    // Reset the form but keep the chosen dish
    nameInput.value = '';
    commentInput.value = '';
    $$('input[name="rating"]', reviewStarsHost).forEach(function (input) { input.checked = false; });
    paintStars(0);

    selectReviewDish(dishId);
    refreshReviewCounts(dishId);

    statusEl.textContent = 'Thank you, ' + result.review.name + '. Your review of ' + dish.name + ' is now listed under Visitor reviews. It is unverified and ' +
      (result.saved ? 'saved in this browser only.' : 'could not be saved in this browser, so it will disappear when the page is reloaded.');
    statusEl.hidden = false;
    toast('Review added to ' + dish.name + '.');

    newItem = reviewPanel.querySelector('[data-review-id="' + result.review.id + '"]');
    if (newItem) {
      newItem.classList.add('review--new');
      scrollToElement(newItem, 'nearest');
    }
  }

  function removeVisitorReview(reviewId) {
    var dishId = null;
    DISHES.some(function (d) {
      if (reviewStore.forDish(d.id).some(function (r) { return r.id === reviewId; })) { dishId = d.id; return true; }
      return false;
    });
    if (!dishId) return;
    reviewStore.remove(reviewId);
    refreshReviewCounts(dishId);
    if (selectedReviewDish === dishId) renderReviewPanel();
    if (openDishId === dishId) refreshOpenDishReviews();
    byId('review-status').hidden = true;
    toast('Your review was removed.');
  }

  function refreshOpenDishReviews() {
    var dish = dishById[openDishId];
    var host = dishDialogBody.querySelector('.dish-detail__review-groups');
    var total = dishDialogBody.querySelector('[data-review-total]');
    if (!dish || !host) return;
    renderReviewGroups(host, dish);
    if (total) total.textContent = plural(totalReviews(dish.id), 'review', 'reviews');
  }

  /* ======================================================================
   * 6. Table booking -> WhatsApp enquiry (demo: nothing is stored or confirmed)
   * ==================================================================== */
  var bookingForm = byId('booking-form');
  var bookingResult = byId('booking-result');
  var bookingFields = {
    name: byId('booking-name'),
    phone: byId('booking-phone'),
    date: byId('booking-date'),
    time: byId('booking-time'),
    guests: byId('booking-guests'),
    requests: byId('booking-requests')
  };
  var enquiryDishes = [];
  var lastBookingMessage = '';

  function whatsappNumber() {
    var digits = String(SITE.whatsappNumber || '').replace(/\D/g, '');
    return digits.length >= 8 && digits.length <= 15 ? digits : '';
  }
  function whatsappUrl(message) {
    // With no number configured, WhatsApp opens the message and lets the sender pick a chat.
    return 'https://wa.me/' + whatsappNumber() + '?text=' + encodeURIComponent(message);
  }

  function buildBooking() {
    var cfg = SITE.booking;
    var today = new Date();
    var last = new Date(today.getFullYear(), today.getMonth(), today.getDate() + cfg.maxDaysAhead);
    var start = cfg.firstSlot.split(':');
    var end = cfg.lastSlot.split(':');
    var minutes = Number(start[0]) * 60 + Number(start[1]);
    var endMinutes = Number(end[0]) * 60 + Number(end[1]);
    var value, n;

    bookingFields.date.min = toISODate(today);
    bookingFields.date.max = toISODate(last);

    for (; minutes <= endMinutes; minutes += cfg.stepMinutes) {
      value = pad(Math.floor(minutes / 60)) + ':' + pad(minutes % 60);
      bookingFields.time.appendChild(h('option', { value: value, text: formatTime(value) }));
    }
    for (n = 1; n <= cfg.maxGuests; n++) {
      bookingFields.guests.appendChild(h('option', { value: String(n), text: plural(n, 'guest', 'guests') }));
    }
    bookingFields.guests.appendChild(h('option', { value: 'More than ' + cfg.maxGuests, text: 'More than ' + cfg.maxGuests + ' guests' }));

    if (whatsappNumber()) {
      byId('booking-demo-note').textContent = 'Demo booking system. Your request opens in WhatsApp as a ready-to-send message to the restaurant. Nothing is stored or confirmed on this website.';
    }

    ['name', 'phone', 'date', 'time', 'guests'].forEach(function (key) {
      var clear = function () { setFieldError(bookingFields[key], byId('booking-' + key + '-error'), ''); };
      bookingFields[key].addEventListener('input', clear);
      bookingFields[key].addEventListener('change', clear);
    });
    // Any edit makes the prepared message out of date, so take it away.
    bookingForm.addEventListener('input', onBookingEdit);
    bookingForm.addEventListener('change', onBookingEdit);
    bookingForm.addEventListener('submit', onBookingSubmit);

    byId('booking-dishes-list').addEventListener('click', function (event) {
      var button = event.target.closest('[data-remove-enquiry]');
      if (button) removeEnquiry(button.getAttribute('data-remove-enquiry'));
    });
    byId('booking-copy').addEventListener('click', function () { copyText(lastBookingMessage); });
    byId('booking-edit').addEventListener('click', function () {
      hideBookingResult();
      bookingFields.name.focus();
    });
  }

  var preparedSnapshot = null;
  function bookingSnapshot() {
    return ['name', 'phone', 'date', 'time', 'guests', 'requests'].map(function (key) {
      return bookingFields[key].value;
    }).join('\u0001');
  }
  function hideBookingResult() { bookingResult.hidden = true; preparedSnapshot = null; }
  /**
   * Compare the values instead of trusting the event alone: a text field also fires "change"
   * when it simply loses focus, which happens as soon as the prepared request is shown.
   */
  function onBookingEdit() {
    if (!bookingResult.hidden && bookingSnapshot() !== preparedSnapshot) hideBookingResult();
  }

  function validateBooking() {
    var values = {
      name: cleanLine(bookingFields.name.value),
      phone: cleanLine(bookingFields.phone.value),
      date: bookingFields.date.value,
      time: bookingFields.time.value,
      guests: bookingFields.guests.value,
      requests: String(bookingFields.requests.value || '').replace(/[ \t]+/g, ' ').replace(/\s*\n\s*/g, '\n').trim().slice(0, 300)
    };
    var errors = {};
    var now = new Date();
    var todayISO = toISODate(now);
    var phoneDigits = values.phone.replace(/\D/g, '');
    var dateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(values.date);
    var slot;

    if (values.name.length < 2) errors.name = 'Please enter your full name.';

    if (!values.phone) errors.phone = 'Please enter your phone number.';
    else if (!/^\+?[\d\s().-]+$/.test(values.phone) || phoneDigits.length < 10 || phoneDigits.length > 15) errors.phone = 'Please enter a valid phone number with 10 to 15 digits.';

    if (!values.date) errors.date = 'Please choose a date.';
    else if (!dateMatch) errors.date = 'Please choose a valid date.';
    else if (values.date < todayISO) errors.date = 'Please choose today or a later date.';
    else if (bookingFields.date.max && values.date > bookingFields.date.max) errors.date = 'Please choose a date within the next ' + SITE.booking.maxDaysAhead + ' days.';

    if (!values.time) errors.time = 'Please select a time.';
    else if (!errors.date && values.date === todayISO) {
      slot = values.time.split(':');
      if (Number(slot[0]) * 60 + Number(slot[1]) <= now.getHours() * 60 + now.getMinutes()) {
        errors.time = 'That time has already passed today. Pick a later time or another date.';
      }
    }

    if (!values.guests) errors.guests = 'Please select the number of guests.';

    return { values: values, errors: errors };
  }

  function bookingRows(values) {
    var rows = [
      ['Name', values.name],
      ['Phone', values.phone],
      ['Date', formatLongDate(values.date)],
      ['Time', formatTime(values.time)],
      ['Guests', values.guests]
    ];
    if (enquiryDishes.length) {
      rows.push(['Dishes of interest', enquiryDishes.map(function (id) { return dishById[id].name; }).join(', ')]);
    }
    rows.push(['Special requests', values.requests || 'None']);
    return rows;
  }

  var MESSAGE_TITLE = 'Table reservation request';
  var MESSAGE_FOOT = 'Sent from The Food Garden demo website. This is a request, not a confirmed booking.';

  /** Plain-text message using WhatsApp formatting (*bold*, _italic_). */
  function bookingMessage(values) {
    var lines = ['*' + MESSAGE_TITLE + '*', SITE.name + ', ' + SITE.shortAddress, ''];
    bookingRows(values).forEach(function (row) { lines.push('*' + row[0] + ':* ' + row[1]); });
    lines.push('', 'Please let me know if a table is available. Thank you!', '', '_' + MESSAGE_FOOT + '_');
    return lines.join('\n');
  }

  function onBookingSubmit(event) {
    event.preventDefault();
    var result = validateBooking();
    var firstInvalid = null;
    var message, url, opened, preview, list, link;

    ['name', 'phone', 'date', 'time', 'guests'].forEach(function (key) {
      setFieldError(bookingFields[key], byId('booking-' + key + '-error'), result.errors[key] || '');
      if (result.errors[key] && !firstInvalid) firstInvalid = bookingFields[key];
    });
    if (firstInvalid) {
      hideBookingResult();
      firstInvalid.focus();
      return;
    }

    message = bookingMessage(result.values);
    url = whatsappUrl(message);
    lastBookingMessage = message;

    // Preview of exactly what will be sent
    preview = byId('booking-result-message');
    list = h('dl', { class: 'msg__rows' }, bookingRows(result.values).map(function (row) {
      return h('div', null, h('dt', { text: row[0] + ':' }), h('dd', { text: row[1] }));
    }));
    preview.textContent = '';
    preview.appendChild(h('p', { class: 'msg__title', text: MESSAGE_TITLE }));
    preview.appendChild(h('p', { class: 'msg__place', text: SITE.name + ', ' + SITE.shortAddress }));
    preview.appendChild(list);
    preview.appendChild(h('p', { class: 'msg__foot', text: MESSAGE_FOOT }));

    link = byId('booking-whatsapp-link');
    link.href = url;

    // Open WhatsApp straight away (allowed because this runs inside the click/submit gesture).
    opened = null;
    try { opened = window.open(url, '_blank'); } catch (err) { opened = null; }
    if (opened) { try { opened.opener = null; } catch (err2) { /* ignore */ } }

    byId('booking-result-text').textContent =
      (opened ? 'WhatsApp should now be open with the message below. ' : 'Tap \u201COpen WhatsApp\u201D to continue with the message below. ') +
      (whatsappNumber()
        ? 'Send it to the restaurant to make your request. '
        : 'This demo has no restaurant number connected, so WhatsApp will ask you to choose a chat. ') +
      'Your table is not reserved until the restaurant replies to confirm.';

    preparedSnapshot = bookingSnapshot();
    bookingResult.hidden = false;
    bookingResult.focus({ preventScroll: true });
    scrollToElement(bookingResult, 'nearest');
  }

  function copyText(text) {
    function fallback() {
      var area = h('textarea', { readonly: true, 'aria-hidden': 'true', style: 'position:fixed;top:0;left:0;width:1px;height:1px;opacity:0;' });
      var ok = false;
      area.value = text;
      document.body.appendChild(area);
      area.select();
      try { ok = document.execCommand('copy'); } catch (err) { ok = false; }
      document.body.removeChild(area);
      toast(ok ? 'Message copied.' : 'Could not copy automatically. Please select the message and copy it.');
    }
    if (!text) return;
    if (navigator.clipboard && navigator.clipboard.writeText && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(function () { toast('Message copied.'); }, fallback);
    } else {
      fallback();
    }
  }

  /* ---- "Book This Food / Enquire": attach dishes to the table request ---- */
  function renderEnquiry() {
    var wrap = byId('booking-dishes');
    var list = byId('booking-dishes-list');
    list.textContent = '';
    enquiryDishes.forEach(function (id) {
      var dish = dishById[id];
      list.appendChild(h('li', { class: 'enquiry__chip' },
        h('span', { text: dish.name + ' \u00B7 ' + formatPrice(dish.price) }),
        h('button', { class: 'enquiry__remove', type: 'button', 'data-remove-enquiry': id, 'aria-label': 'Remove ' + dish.name + ' from your enquiry' }, icon('x'))
      ));
    });
    wrap.hidden = enquiryDishes.length === 0;
  }
  function addEnquiry(dishId) {
    var dish = dishById[dishId];
    if (!dish) return;
    if (enquiryDishes.indexOf(dishId) === -1) enquiryDishes.push(dishId);
    renderEnquiry();
    hideBookingResult();
    toast(dish.name + ' added to your table request. Fill in the form to send your enquiry.');
  }
  function removeEnquiry(dishId) {
    enquiryDishes = enquiryDishes.filter(function (id) { return id !== dishId; });
    renderEnquiry();
    hideBookingResult();
  }

  /* ======================================================================
   * 7. Navigation, opening status, misc.
   * ==================================================================== */
  var header = byId('site-header');
  var nav = byId('site-nav');
  var navToggle = byId('nav-toggle');
  var navLinks = $$('[data-nav]', nav);
  var SPY_IDS = ['home', 'menu', 'about', 'reviews', 'reserve', 'location', 'contact'];
  var lockedNavId = null;
  var spyTicking = false;

  function setNavOpen(open) {
    nav.classList.toggle('is-open', open);
    navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    navToggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  }
  function navIsOpen() { return nav.classList.contains('is-open'); }

  function setActiveNav(id) {
    navLinks.forEach(function (link) {
      var active = link.getAttribute('data-nav') === id;
      link.classList.toggle('is-active', active);
      if (active) link.setAttribute('aria-current', 'true');
      else link.removeAttribute('aria-current');
    });
  }

  function updateOnScroll() {
    spyTicking = false;
    var doc = document.documentElement;
    var line = header.offsetHeight + 28;
    var current = SPY_IDS[0];
    header.classList.toggle('is-scrolled', window.scrollY > 6);
    if (lockedNavId) return;
    SPY_IDS.forEach(function (id) {
      var el = byId(id);
      if (el && el.getBoundingClientRect().top <= line) current = id;
    });
    if (window.innerHeight + window.scrollY >= doc.scrollHeight - 2 && doc.scrollHeight > window.innerHeight + 2) {
      current = SPY_IDS[SPY_IDS.length - 1];
    }
    setActiveNav(current);
  }
  function requestScrollUpdate() {
    if (spyTicking) return;
    spyTicking = true;
    window.requestAnimationFrame(updateOnScroll);
  }

  function buildNavigation() {
    navToggle.addEventListener('click', function () { setNavOpen(!navIsOpen()); });
    nav.addEventListener('click', function (event) {
      if (event.target.closest('a')) setNavOpen(false);
    });
    document.addEventListener('click', function (event) {
      if (navIsOpen() && !header.contains(event.target)) setNavOpen(false);
    });
    // Keyboard: once focus moves on from the header into the page, the panel closes, so it never covers the focused element.
    document.addEventListener('focusin', function (event) {
      if (navIsOpen() && !header.contains(event.target)) setNavOpen(false);
    });
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && navIsOpen()) { setNavOpen(false); navToggle.focus(); }
    });
    if (window.matchMedia) {
      var desktop = window.matchMedia('(min-width: 1000px)');
      var onChange = function (e) { if (e.matches) setNavOpen(false); };
      if (desktop.addEventListener) desktop.addEventListener('change', onChange);
      else if (desktop.addListener) desktop.addListener(onChange);
    }

    // Highlight the clicked link at once and hold it until the visitor scrolls by hand.
    navLinks.forEach(function (link) {
      link.addEventListener('click', function () {
        lockedNavId = link.getAttribute('data-nav');
        setActiveNav(lockedNavId);
      });
    });
    ['wheel', 'touchmove', 'keydown', 'mousedown'].forEach(function (type) {
      window.addEventListener(type, function () {
        if (lockedNavId) { lockedNavId = null; requestScrollUpdate(); }
      }, { passive: true });
    });

    window.addEventListener('scroll', requestScrollUpdate, { passive: true });
    window.addEventListener('resize', requestScrollUpdate);
    updateOnScroll();
  }

  /** "Open Today" follows the editable opening-hours list in index.html. */
  function buildOpeningStatus() {
    var list = byId('hours-list');
    var badge = byId('open-status');
    var label = byId('open-status-text');
    var today, row;
    if (!list) return;
    try {
      today = new Intl.DateTimeFormat('en-US', { weekday: 'long', timeZone: SITE.timeZone || undefined }).format(new Date());
    } catch (err) {
      today = WEEKDAYS[new Date().getDay()];
    }
    row = list.querySelector('[data-day="' + today.toLowerCase() + '"]');
    if (!row) return;
    row.classList.add('is-today');
    if (row.firstElementChild) row.firstElementChild.appendChild(h('span', { class: 'sr-only', text: ' (today)' }));
    if (row.hasAttribute('data-closed')) {
      badge.classList.add('status-badge--closed');
      label.textContent = 'Closed Today';
    } else {
      badge.classList.remove('status-badge--closed');
      label.textContent = 'Open Today';
    }
  }

  function buildMisc() {
    // "Call" buttons: the demo number is masked, so there is nothing to dial.
    $$('[data-demo-call]').forEach(function (button) {
      button.addEventListener('click', function () {
        toast('Calling is switched off in this demo. The phone number is masked on purpose.');
      });
    });

    // Footer "Menu categories" links pre-select the category.
    $$('a[data-category]').forEach(function (link) {
      link.addEventListener('click', function () {
        menuState.query = '';
        searchInput.value = '';
        setCategory(link.getAttribute('data-category'));
      });
    });

    // Sideways rows of pills (phones): a browser can leave a pill that receives keyboard focus half outside the row.
    // Bring it fully into view. Keyboard focus only, so that a pill never moves away under a finger or a mouse.
    ['menu-categories', 'review-dish-picker'].forEach(function (id) {
      var row = byId(id);
      if (!row) return;
      row.addEventListener('focusin', function (event) {
        var pill = event.target.closest ? event.target.closest('button') : null;
        var byKeyboard = false;
        var pad, rect, box;
        if (!pill || row.scrollWidth <= row.clientWidth + 1) return;
        try { byKeyboard = pill.matches(':focus-visible'); } catch (err) { byKeyboard = false; }
        if (!byKeyboard) return;
        pad = parseFloat(window.getComputedStyle(row).paddingLeft) || 0;
        rect = pill.getBoundingClientRect();
        box = row.getBoundingClientRect();
        if (rect.left < box.left + pad) row.scrollLeft -= box.left + pad - rect.left;
        else if (rect.right > box.right - pad) row.scrollLeft += rect.right - (box.right - pad);
      });
    });

    // "Skip to main content": make sure keyboard focus really lands in the main content
    // (some browsers scroll to a plain #link without moving the focus).
    (function () {
      var skip = document.querySelector('.skip-link');
      var main = byId('main');
      if (!skip || !main) return;
      skip.addEventListener('click', function () {
        main.setAttribute('tabindex', '-1');
        main.addEventListener('blur', function onBlur() {
          main.removeEventListener('blur', onBlur);
          main.removeAttribute('tabindex');
        });
        main.focus();
      });
    })();
  }

  /* ======================================================================
   * 8. Start-up
   * ==================================================================== */
  function settleInitialScroll() {
    // The menu is drawn by script, which moves the sections below it. If the page was
    // opened on a link such as #reserve, line it up again once everything is in place.
    var navEntry = window.performance && performance.getEntriesByType ? performance.getEntriesByType('navigation')[0] : null;
    var hash = window.location.hash;
    var target;
    if (!hash || hash.length < 2 || (navEntry && navEntry.type !== 'navigate')) return;
    if (dishIdFromHash()) return;
    try { target = byId(decodeURIComponent(hash.slice(1))); } catch (err) { target = null; }
    if (target) target.scrollIntoView();
  }

  buildMenu();
  buildReviews();
  buildBooking();
  buildNavigation();
  buildOpeningStatus();
  buildMisc();
  settleInitialScroll();
  syncDishWithUrl();
})();
