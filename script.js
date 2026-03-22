document.querySelectorAll('.terms__tab').forEach(tab => {
    tab.addEventListener('click', () => {
        document.querySelectorAll('.terms__tab').forEach(t => t.classList.remove('terms__tab--active'));
        tab.classList.add('terms__tab--active');
    });
});

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
        }
    });
}, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

requestAnimationFrame(() => {
    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
});

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        const href = this.getAttribute('href');
        if (href === '#') {
            e.preventDefault();
            return;
        }
        const target = document.querySelector(href);
        if (target) {
            e.preventDefault();
            target.scrollIntoView({ behavior: 'smooth' });
        }
    });
});

const NEWS_TOPICS = {
    'annual-meeting': {
        id: 'annual-meeting',
        title: 'Годовое собрание акционеров АО «Алмазный Мир»',
        date: '01.03.2025',
        path: 'news-item.html',
        full: [
            'Уважаемый акционер! Уведомляем Вас, что по решению Совета директоров ОАО «Алмазный Мир» (протокол № 7/17 от 15.05.2017), 20 июня 2017 года состоится годовое общее собрание акционеров Открытого акционерного общества «Алмазный Мир», проводимое в форме собрания (совместное присутствие).',
            'Полное фирменное наименование Общества: Открытое акционерное общество «Алмазный Мир»;',
            'Место нахождения Общества: ул. Смольная, д. 12, г. Москва, Российская Федерация; Место проведения собрания: г. Москва, ул. Смольная, д. 12, ОАО «Алмазный Мир»; Начало собрания: 11:00; Начало регистрации: 10:00.'
        ],
        image: 'assets/news/1.png'
    },
    'history-1970': {
        id: 'history-1970',
        title: 'Работаем в отрасли с 1970 года',
        date: '28.02.2025',
        path: 'news-item.html',
        full: [
            'История компании связана с развитием отечественной алмазной отрасли и традициями завода «Кристалл».',
            'Мы продолжаем развивать инфраструктуру, объединяя экспертизу, лаборатории и сервис на одной площадке.'
        ],
        image: 'assets/news/2.png'
    },
    'state-infrastructure': {
        id: 'state-infrastructure',
        title: 'Государственная инфраструктура',
        date: '25.02.2025',
        path: 'news-item.html',
        full: [
            'На площадке действуют государственные лаборатории и профессиональные службы, обеспечивающие контроль и прозрачность.',
            'Мы выстраиваем процессы так, чтобы клиент получал полный цикл услуг в одном месте.'
        ],
        image: 'assets/news/3.png'
    }
};

window.NEWS_TOPICS = NEWS_TOPICS;

function renderStaticNews(grid, perPage) {
    const entries = Object.values(NEWS_TOPICS);
    const slice = entries.slice(0, perPage);
    const textOnly = grid.classList.contains('news__grid--text-only');

    grid.innerHTML = slice
        .map((item) => {
            const desc = (item.full && item.full[0]) || '';
            const imgBlock = `<div class="news-card__img" style="${item.image ? `background-image:url('${item.image}')` : ''}"></div>`;

            if (textOnly) {
                return `
<article class="news-card news-card--clickable reveal" data-news-id="${item.id}">
  ${imgBlock}
  <div class="news-card__content">
    <time class="news-card__date">${item.date}</time>
    <h3 class="news-card__title">${item.title}</h3>
  </div>
</article>`;
            }

            return `
<article class="news-card news-card--clickable reveal" data-news-id="${item.id}" data-news-image="${item.image || ''}">
  ${imgBlock}
  <div class="news-card__content">
    <time class="news-card__date">${item.date}</time>
    <h3 class="news-card__title">${item.title}</h3>
    <p class="news-card__desc">${desc}</p>
    <a href="news-item.html?id=${encodeURIComponent(item.id)}" class="news-card__more">
      Читать полностью
      <img src="assets/icons/arrow-diag.svg" alt="" class="news-card__more-icon">
    </a>
  </div>
</article>`;
        })
        .join('');
}

async function hydrateNewsFromWP() {
    const grids = document.querySelectorAll('[data-news-list]');
    if (!grids.length) return;

    for (const grid of grids) {
        const perPage = parseInt(grid.getAttribute('data-per-page') || '3', 10);
        let usedWP = false;
        try {
            const res = await fetch(`/wp-json/wp/v2/posts?per_page=${perPage}&_embed=1`);
            if (res.ok) {
                const posts = await res.json();
                if (Array.isArray(posts) && posts.length) {
                    const textOnly = grid.classList.contains('news__grid--text-only');
                    grid.innerHTML = posts
                        .map((post) => {
                            const id = String(post.id);
                            const title = (post.title && post.title.rendered) || '';
                            const date = (post.date || '').slice(0, 10).split('-').reverse().join('.');
                            const contentHtml = (post.content && post.content.rendered) || '';
                            let image =
                                post._embedded?.['wp:featuredmedia']?.[0]?.source_url || '';
                            if (!image && contentHtml) {
                                const imgMatch = contentHtml.match(/<img[^>]+src=["']([^"']+)["']/i);
                                if (imgMatch) {
                                    image = imgMatch[1];
                                }
                            }
                            const stripHtml = (s) =>
                                String(s || '')
                                    .replace(/<[^>]+>/g, ' ')
                                    .replace(/\s+/g, ' ')
                                    .trim();

                            const excerptHtml = (post.excerpt && post.excerpt.rendered) || '';
                            const excerptPlain = stripHtml(excerptHtml);
                            const fullPlain = stripHtml(contentHtml);
                            const shortBase = excerptPlain || fullPlain;
                            const short = shortBase.slice(0, 160) + (shortBase.length > 160 ? '…' : '');

                            const imgBlock = `<div class="news-card__img" style="${image ? `background-image:url('${image}')` : ''}"></div>`;

                            if (textOnly) {
                                return `
<article class="news-card news-card--clickable reveal" data-news-id="${id}" data-news-image="${image}">
  ${imgBlock}
  <div class="news-card__content">
    <time class="news-card__date">${date}</time>
    <h3 class="news-card__title">${title}</h3>
  </div>
</article>`;
                            }

                            return `
<article class="news-card news-card--clickable reveal" data-news-id="${id}" data-news-image="${image}">
  ${imgBlock}
  <div class="news-card__content">
    <time class="news-card__date">${date}</time>
    <h3 class="news-card__title">${title}</h3>
    <p class="news-card__desc">${short}</p>
    <a href="news-item.html?id=${encodeURIComponent(id)}" class="news-card__more">
      Читать полностью
      <img src="assets/icons/arrow-diag.svg" alt="" class="news-card__more-icon">
    </a>
  </div>
</article>`;
                        })
                        .join('');
                    usedWP = true;
                }
            }
        } catch (e) {
            // ignore, пойдём на статический рендер
        }

        if (!usedWP) {
            renderStaticNews(grid, perPage);
        }

        // Анимация появления для новых карточек
        grid.querySelectorAll('.reveal').forEach((el) => observer.observe(el));
    }
}

const headerEl = document.querySelector('.header');
if (headerEl) {
    const onScroll = () => {
        if (window.scrollY > 16) {
            headerEl.classList.add('header--scrolled');
        } else {
            headerEl.classList.remove('header--scrolled');
        }
    };
    window.addEventListener('scroll', onScroll);
    onScroll();
}

const burger = document.querySelector('.header__burger');
if (burger && headerEl) {
    burger.addEventListener('click', () => {
        headerEl.classList.toggle('header--menu-open');
    });
}

const mobileServicesToggle = document.querySelector('.mobile-menu__services-toggle');
const mobileServicesList = document.querySelector('.mobile-menu__services-list');
if (mobileServicesToggle && mobileServicesList) {
    mobileServicesToggle.addEventListener('click', () => {
        mobileServicesList.classList.toggle('mobile-menu__services-list--open');
    });
}

document.querySelectorAll('.nav__item--services').forEach((item) => {
    const link = item.querySelector('.nav__link--services');
    const dropdown = item.querySelector('.nav-dropdown');
    const cats = dropdown ? Array.from(dropdown.querySelectorAll('.nav-dropdown__cat')) : [];
    const panels = dropdown ? Array.from(dropdown.querySelectorAll('.nav-dropdown__panel')) : [];
    let closeTimeout;

    const open = () => {
        clearTimeout(closeTimeout);
        item.classList.add('nav__item--open');
    };

    const scheduleClose = () => {
        clearTimeout(closeTimeout);
        closeTimeout = setTimeout(() => {
            item.classList.remove('nav__item--open');
        }, 200);
    };

    if (link) {
        link.addEventListener('mouseenter', open);
        link.addEventListener('click', (e) => {
            e.preventDefault();
            if (item.classList.contains('nav__item--open')) {
                item.classList.remove('nav__item--open');
            } else {
                open();
            }
        });
    }

    if (dropdown) {
        dropdown.addEventListener('mouseenter', open);
        dropdown.addEventListener('mouseleave', scheduleClose);
    }
    item.addEventListener('mouseleave', scheduleClose);

    cats.forEach((cat) => {
        cat.addEventListener('click', (e) => {
            e.preventDefault();
            const target = cat.dataset.cat;
            const itemEl = cat.closest('.nav-dropdown__item');

            cats.forEach((c) => {
                const item = c.closest('.nav-dropdown__item');
                const isActive = c === cat;
                c.classList.toggle('is-active', isActive);
                if (item) {
                    item.classList.toggle('nav-dropdown__item--open', isActive);
                }
            });

            panels.forEach((p) => {
                p.classList.toggle('is-open', p.dataset.panel === target);
            });
        });
    });
});

function getCurrentService() {
    const raw = window.location.pathname.split('/').pop() || '';
    const clean = raw.split('?')[0].split('#')[0];
    const base = clean || 'index.html';
    const serviceMap = {
        'service-hallmark.html': { cat: 'control', href: 'service-hallmark.html' },
        'service-gemology.html': { cat: 'control', href: 'service-gemology.html' },
        'service-operator.html': { cat: 'control', href: 'service-operator.html' },
        'service-fulfillment.html': { cat: 'b2b', href: 'service-fulfillment.html' },
        'service-logistics.html': { cat: 'b2b', href: 'service-logistics.html' },
        'service-customs.html': { cat: 'b2b', href: 'service-customs.html' },
        'service-storage.html': { cat: 'b2b', href: 'service-storage.html' },
        'service-jewelry.html': { cat: 'production', href: 'service-jewelry.html' },
        'service-rent.html': { cat: 'production', href: 'service-rent.html' },
        'service-market.html': { cat: 'trade', href: 'service-market.html' },
        'service-expo.html': { cat: 'trade', href: 'service-expo.html' },
    };
    const fileKey = base.includes('.') ? base : `${base}.html`;
    return serviceMap[fileKey];
}

function highlightActiveService() {
    const current = getCurrentService();
    if (!current) return;

    // десктопный дропдаун
    document.querySelectorAll('.nav-dropdown').forEach((dropdown) => {
        const cats = Array.from(dropdown.querySelectorAll('.nav-dropdown__cat'));
        const panels = Array.from(dropdown.querySelectorAll('.nav-dropdown__panel'));

        cats.forEach((catBtn) => {
            const isTarget = catBtn.dataset.cat === current.cat;
            catBtn.classList.toggle('is-active', isTarget);
            const itemEl = catBtn.closest('.nav-dropdown__item');
            if (itemEl) {
                itemEl.classList.toggle('nav-dropdown__item--open', isTarget);
            }
        });

        panels.forEach((panel) => {
            const isTargetPanel = panel.dataset.panel === current.cat;
            panel.classList.toggle('is-open', isTargetPanel);
            if (isTargetPanel) {
                const links = panel.querySelectorAll('a[href]');
                links.forEach((link) => {
                    const href = link.getAttribute('href');
                    const same = href === current.href;
                    link.classList.toggle('nav__active', same);
                });
            }
        });
    });

    // мобильное меню
    document.querySelectorAll('.mobile-menu__services-list a[href]').forEach((link) => {
        const href = link.getAttribute('href');
        link.classList.toggle('nav__active', href === current.href);
    });
}

const servicesCarousel = document.querySelector('[data-services-carousel]');
if (servicesCarousel) {
    const tabs = Array.from(document.querySelectorAll('.services-tab'));
    const tabsWrap = document.querySelector('.services-tabs');
    const track = servicesCarousel.querySelector('.services-track');
    const slides = Array.from(servicesCarousel.querySelectorAll('.service-slide'));
    const btnPrev = servicesCarousel.querySelector('.services-arrow--left');
    const btnNext = servicesCarousel.querySelector('.services-arrow--right');
    const dotsRoot = document.querySelector('[data-services-dots]');
    let activeCat = 'control';
    let index = 0;

    const visibleSlides = () => slides.filter(s => !s.hasAttribute('hidden'));

    const updateTabsPill = () => {
        if (!tabsWrap) return;
        const active = tabsWrap.querySelector('.services-tab.is-active');
        if (!active) return;
        const x = active.offsetLeft - tabsWrap.scrollLeft;
        const y = active.offsetTop - tabsWrap.scrollTop;
        const w = active.offsetWidth;
        const h = active.offsetHeight;
        tabsWrap.style.setProperty('--pill-x', `${Math.max(6, x)}px`);
        tabsWrap.style.setProperty('--pill-y', `${Math.max(6, y)}px`);
        tabsWrap.style.setProperty('--pill-w', `${w}px`);
        tabsWrap.style.setProperty('--pill-h', `${h}px`);
    };

    const setIndex = (nextIndex) => {
        const vis = visibleSlides();
        if (!track || vis.length === 0) return;
        index = Math.max(0, Math.min(nextIndex, Math.max(0, vis.length - 1)));
        const cardWidth = vis[0].getBoundingClientRect().width;
        const gap = 24;
        track.style.transform = `translateX(${-index * (cardWidth + gap)}px)`;
        renderDots();
    };

    const renderDots = () => {
        if (!dotsRoot) return;
        const vis = visibleSlides();
        if (!vis.length) {
            dotsRoot.innerHTML = '';
            return;
        }
        const maxIndex = Math.max(0, vis.length - 1);
        const dots = Array.from({ length: maxIndex + 1 }).map((_, i) => {
            const active = i === index ? 'is-active' : '';
            return `<button class="services-dot ${active}" type="button" aria-label="Слайд ${i + 1}" data-dot="${i}"></button>`;
        });
        dotsRoot.innerHTML = dots.join('');
        dotsRoot.querySelectorAll('[data-dot]').forEach((btn) => {
            btn.addEventListener('click', () => {
                const i = parseInt(btn.getAttribute('data-dot') || '0', 10);
                setIndex(i);
            });
        });
    };

    const applyCategory = (cat) => {
        activeCat = cat;
        index = 0;
        slides.forEach(s => {
            if (s.dataset.cat === cat) s.removeAttribute('hidden');
            else s.setAttribute('hidden', '');
        });
        track.style.transition = 'none';
        setIndex(0);
        requestAnimationFrame(() => {
            track.style.transition = 'transform 0.35s ease';
        });
        updateTabsPill();
        renderDots();
    };

    tabs.forEach(t => {
        t.addEventListener('click', () => {
            tabs.forEach(x => x.classList.remove('is-active'));
            t.classList.add('is-active');
            applyCategory(t.dataset.cat);
        });
    });

    if (btnPrev) btnPrev.addEventListener('click', () => setIndex(index - 1));
    if (btnNext) btnNext.addEventListener('click', () => setIndex(index + 1));

    // свайп по карточкам на мобилке
    const viewport = servicesCarousel.querySelector('.services-viewport');
    if (viewport && track) {
        let startX = 0;
        let startIndex = 0;
        let isDown = false;

        const onDown = (e) => {
            const pt = 'touches' in e ? e.touches[0] : e;
            isDown = true;
            startX = pt.clientX;
            startIndex = index;
            track.style.transition = 'none';
        };

        const onMove = (e) => {
            if (!isDown) return;
            const pt = 'touches' in e ? e.touches[0] : e;
            const dx = pt.clientX - startX;
            const vis = visibleSlides();
            if (!vis.length) return;
            const cardWidth = vis[0].getBoundingClientRect().width;
            const gap = 24;
            const base = -startIndex * (cardWidth + gap);
            track.style.transform = `translateX(${base + dx}px)`;
        };

        const onUp = (e) => {
            if (!isDown) return;
            isDown = false;
            const pt = (e && 'changedTouches' in e) ? e.changedTouches[0] : e;
            const endX = pt?.clientX ?? startX;
            const dx = endX - startX;
            const vis = visibleSlides();
            const cardWidth = vis[0]?.getBoundingClientRect().width || 1;
            const gap = 24;
            const step = cardWidth + gap;
            const moved = Math.round(-dx / step);
            track.style.transition = 'transform 0.35s ease';
            setIndex(startIndex + moved);
        };

        viewport.addEventListener('touchstart', onDown, { passive: true });
        viewport.addEventListener('touchmove', onMove, { passive: true });
        viewport.addEventListener('touchend', onUp, { passive: true });
        viewport.addEventListener('mousedown', onDown);
        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup', onUp);
        viewport.addEventListener('mouseleave', onUp);
    }
    window.addEventListener('resize', () => {
        setIndex(index);
        updateTabsPill();
        renderDots();
    });
    tabsWrap?.addEventListener('scroll', () => updateTabsPill());

    applyCategory(activeCat);
    requestAnimationFrame(updateTabsPill);
}

function initMobileServicesAccordion() {
    const list = document.querySelector('.mobile-menu__services-list');
    const toggle = document.querySelector('.mobile-menu__services-toggle');
    if (!list || !toggle) return;

    const current = getCurrentService();
    const activeCat = current ? current.cat : 'control';

    // строим категории из десктопного дропдауна (один источник правды)
    const desktop = document.querySelector('.nav-dropdown.nav-dropdown--accordion');
    if (!desktop) return;

    const cats = Array.from(desktop.querySelectorAll('.nav-dropdown__cat')).map((btn) => ({
        id: btn.getAttribute('data-cat') || '',
        title: btn.textContent?.trim() || '',
    })).filter((c) => c.id);

    const panels = cats.map((cat) => {
        const panel = desktop.querySelector(`.nav-dropdown__panel[data-panel="${cat.id}"]`);
        const links = panel ? Array.from(panel.querySelectorAll('a[href]')) : [];
        return {
            ...cat,
            links: links.map((a) => ({
                href: a.getAttribute('href') || '#',
                label: a.textContent?.trim() || '',
            })).filter((x) => x.href && x.label),
        };
    });

    const catIndex = panels.findIndex((p) => p.id === activeCat);
    const openIdx = catIndex >= 0 ? catIndex : 0;

    list.classList.add('mobile-services');
    list.innerHTML = panels.map((p, idx) => `
<div class="mobile-services__item ${idx === openIdx ? 'is-open' : ''}">
  <button class="mobile-services__cat ${idx === openIdx ? 'is-active' : ''}" type="button" data-mobile-cat="${p.id}">
    ${p.title}
  </button>
  <div class="mobile-services__panel" data-mobile-panel="${p.id}">
    ${p.links.map(l => `<a href="${l.href}">${l.label}</a>`).join('')}
  </div>
</div>`).join('');

    const items = Array.from(list.querySelectorAll('.mobile-services__item'));
    const setOpen = (id) => {
        items.forEach((it) => {
            const btn = it.querySelector('.mobile-services__cat');
            const panel = it.querySelector('.mobile-services__panel');
            const isTarget = btn?.getAttribute('data-mobile-cat') === id;
            it.classList.toggle('is-open', isTarget);
            btn?.classList.toggle('is-active', isTarget);
            if (panel) {
                if (isTarget) {
                    panel.style.maxHeight = panel.scrollHeight + 'px';
                } else {
                    panel.style.maxHeight = '0px';
                }
            }
        });
    };

    // init heights — открываем категорию текущей страницы
    requestAnimationFrame(() => {
        setOpen(activeCat);
    });

    items.forEach((it) => {
        const btn = it.querySelector('.mobile-services__cat');
        btn?.addEventListener('click', () => {
            const id = btn.getAttribute('data-mobile-cat') || '';
            if (!id) return;
            setOpen(id);
        });
    });

    window.addEventListener('resize', () => {
        const openBtn = list.querySelector('.mobile-services__cat.is-active');
        const id = openBtn?.getAttribute('data-mobile-cat') || '';
        if (id) setOpen(id);
    });
}

function initNewsCards() {
    const cards = document.querySelectorAll('.news-card--clickable');
    cards.forEach(card => {
        const id = card.getAttribute('data-news-id');
        const toggleBtn = card.querySelector('.news-card__toggle');
        const full = card.querySelector('.news-card__full');

        if (toggleBtn && full) {
            toggleBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const isHidden = full.hasAttribute('hidden');
                if (isHidden) {
                    full.removeAttribute('hidden');
                    toggleBtn.textContent = 'Свернуть';
                } else {
                    full.setAttribute('hidden', '');
                    toggleBtn.textContent = 'Читать полностью';
                }
            });
        }

        card.addEventListener('click', () => {
            if (!id) return;
            window.location.href = `news-item.html?id=${encodeURIComponent(id)}`;
        });
    });
}

function initNewsItemPage() {
    const newsItemRoot = document.querySelector('main.page[data-news-id]');
    if (!newsItemRoot) return;

    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    if (id) {
        newsItemRoot.setAttribute('data-news-id', id);
    }

    const activeId = newsItemRoot.getAttribute('data-news-id');
    const topics = window.NEWS_TOPICS || {};

    const applyData = (data) => {
        if (!data) return;

    const titleEl = document.getElementById('news-title');
    const dateEl = document.getElementById('news-date');
    const textEl = document.getElementById('news-content');
    const imageEl = document.getElementById('news-image');

        if (titleEl) titleEl.textContent = data.title;
        if (dateEl) dateEl.textContent = data.date;
        if (textEl) {
            if (typeof data.contentHtml === 'string' && data.contentHtml.trim()) {
                textEl.innerHTML = data.contentHtml;
            } else if (Array.isArray(data.full)) {
                textEl.innerHTML = data.full
                    .map((p, i) => `<p${i ? ' style="margin-top:16px;"' : ''}>${p}</p>`)
                    .join('');
            }
        }
        if (imageEl && data.image) {
            imageEl.style.aspectRatio = '16 / 9';
            imageEl.style.margin = '48px 0';
            imageEl.style.borderRadius = '8px';
            imageEl.style.backgroundImage = `url('${data.image}')`;
            imageEl.style.backgroundSize = 'cover';
            imageEl.style.backgroundPosition = 'center';
        }
    };

    if (!activeId) return;

    // сначала пробуем статическую карту
    if (!/^\d+$/.test(activeId)) {
        const staticData = topics[activeId];
        if (staticData) {
            applyData(staticData);
        }
        return;
    }

    // если id числовой — грузим из WordPress
    fetch(`/wp-json/wp/v2/posts/${activeId}?_embed=1`)
        .then((res) => (res.ok ? res.json() : null))
        .then((post) => {
            if (!post) return;
            const title = (post.title && post.title.rendered) || '';
            const date = (post.date || '').slice(0, 10).split('-').reverse().join('.');
            const contentHtml = (post.content && post.content.rendered) || '';
            let image =
                post._embedded?.['wp:featuredmedia']?.[0]?.source_url || '';
            if (!image && contentHtml) {
                const imgMatch = contentHtml.match(/<img[^>]+src=["']([^"']+)["']/i);
                if (imgMatch) {
                    image = imgMatch[1];
                }
            }
            applyData({
                id: activeId,
                title,
                date,
                image,
                contentHtml,
            });
        })
        .catch(() => {
            const fallback = topics[activeId];
            if (fallback) applyData(fallback);
        });
}

function initServiceItemPage() {
    // Страница service-item больше не используется
}

function showCopyToast(message, x, y) {
    let toast = document.querySelector('.copy-toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.className = 'copy-toast';
        document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.style.left = `${x}px`;
    toast.style.top = `${y}px`;
    requestAnimationFrame(() => {
        toast.classList.add('copy-toast--visible');
    });
    setTimeout(() => {
        toast.classList.remove('copy-toast--visible');
    }, 1500);
}

function initCopyContacts() {
    const links = document.querySelectorAll('a[href^="tel:"], a[href^="mailto:"]');
    const addresses = document.querySelectorAll('[data-copy-text]');
    if (!links.length && !addresses.length) return;

    links.forEach((link) => {
        link.addEventListener('click', (event) => {
            event.preventDefault();
            const href = link.getAttribute('href') || '';
            const isPhone = href.startsWith('tel:');
            const value = href.replace(/^tel:|^mailto:/, '');

            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(value).catch(() => {});
            }

            const rect = link.getBoundingClientRect();
            const x = rect.left + rect.width / 2;
            const y = Math.min(window.innerHeight - 12, rect.bottom + 10);
            const message = isPhone ? 'Номер скопирован' : 'Почта скопирована';
            showCopyToast(message, x, y);
        });
    });

    addresses.forEach((el) => {
        el.addEventListener('click', (event) => {
            event.preventDefault?.();
            const raw = el.getAttribute('data-copy-text') || el.textContent || '';
            const value = raw.replace(/\s+/g, ' ').trim();
            if (!value) return;

            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(value).catch(() => {});
            }

            const rect = el.getBoundingClientRect();
            const x = rect.left + rect.width / 2;
            const y = Math.min(window.innerHeight - 12, rect.bottom + 10);
            showCopyToast('Адрес скопирован', x, y);
        });
    });
}

async function sendLeadForm(form) {
    const formData = new FormData(form);
    const payload = {};
    formData.forEach((value, key) => {
        payload[key] = value;
    });

    try {
        await fetch('/wp-json/almaznymir/v1/lead', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });
    } catch (e) {
        // если бекенд недоступен — просто игнорируем, чтобы не ломать фронт
    }
}

function initContactForms() {
    const forms = document.querySelectorAll('[data-contact-form]');
    if (!forms.length) return;

    forms.forEach((contactForm) => {
        const emailInput = contactForm.querySelector('input[name="email"]');
        const emailError = contactForm.querySelector('.field__error');

        const validateEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value).trim());

        const showEmailError = (msg) => {
            if (!emailInput || !emailError) return;
            emailError.textContent = msg || '';
            emailInput.classList.toggle('field__input--error', Boolean(msg));
        };

        emailInput?.addEventListener('input', () => {
            showEmailError('');
        });

        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = emailInput?.value || '';
            if (!validateEmail(email)) {
                showEmailError('Введите почту, используя символ @');
                emailInput?.focus();
                return;
            }
            showEmailError('');
            sendLeadForm(contactForm).finally(() => {
                contactForm.reset();
                const x = window.innerWidth / 2;
                const y = window.innerHeight - 24;
                showCopyToast('Заявка отправлена', x, y);
            });
        });
    });
}

function initJewelryGallery() {
    // превью теперь управляется общей каруселью, клики по миниатюрам не меняют изображение
}

function initJewelryCarousel() {
    const root = document.querySelector('[data-jewelry-carousel]');
    const gallery = document.querySelector('[data-jewelry-gallery]');
    if (!root || !gallery) return;

    const slides = Array.from(root.querySelectorAll('.jewelry-slide'));
    const btnPrev = root.querySelector('.jewelry-arrow--prev');
    const btnNext = root.querySelector('.jewelry-arrow--next');
    const thumbs = Array.from(gallery.querySelectorAll('.jewelry-thumb img'));
    if (slides.length !== 3 || !btnPrev || !btnNext || thumbs.length !== 8) return;

    const allImgs = [
        ...slides.map((s) => s.querySelector('img')),
        ...thumbs,
    ];
    let order = allImgs.map((img) => ({
        src: img.getAttribute('src'),
        alt: img.getAttribute('alt') || '',
    }));

    slides[0].classList.add('is-prev');
    slides[1].classList.add('is-active');
    slides[2].classList.add('is-next');

    const render = () => {
        const [left, center, right] = order.slice(0, 3);
        const topImgs = slides.map((s) => s.querySelector('img'));
        if (left && topImgs[0]) {
            topImgs[0].src = left.src;
            topImgs[0].alt = left.alt;
        }
        if (center && topImgs[1]) {
            topImgs[1].src = center.src;
            topImgs[1].alt = center.alt;
        }
        if (right && topImgs[2]) {
            topImgs[2].src = right.src;
            topImgs[2].alt = right.alt;
        }

        const rest = order.slice(3);
        thumbs.forEach((thumb, idx) => {
            const item = rest[idx];
            if (!item) return;
            thumb.src = item.src;
            thumb.alt = item.alt;
        });
    };

    const rotateRight = () => {
        order.unshift(order.pop());
        render();
    };

    const rotateLeft = () => {
        order.push(order.shift());
        render();
    };

    btnPrev.addEventListener('click', rotateLeft);
    btnNext.addEventListener('click', rotateRight);

    render();
}

function initImageLightbox() {
    let overlay = null;
    let overlayImg = null;

    const createOverlay = () => {
        if (overlay) return;
        overlay = document.createElement('div');
        overlay.className = 'lightbox';
        overlay.innerHTML = '<div class="lightbox__backdrop"></div><img class="lightbox__img" alt="">';
        document.body.appendChild(overlay);
        overlayImg = overlay.querySelector('.lightbox__img');

        const close = () => {
            overlay.classList.remove('lightbox--visible');
            setTimeout(() => {
                if (overlayImg) overlayImg.src = '';
            }, 200);
        };

        overlay.querySelector('.lightbox__backdrop').addEventListener('click', close);
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) close();
        });
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && overlay && overlay.classList.contains('lightbox--visible')) {
                close();
            }
        });
    };

    const isDecorative = (img) => {
        const cls = img.className || '';
        const parentCls = img.parentElement?.className || '';
        const combined = `${cls} ${parentCls}`;
        return (
            combined.includes('logo') ||
            combined.includes('icon') ||
            combined.includes('footer__icon') ||
            combined.includes('hero-card__icon') ||
            combined.includes('hero-card__icon-img') ||
            combined.includes('benefit__icon') ||
            combined.includes('values__item') ||
            combined.includes('contact-card__icon') ||
            combined.includes('lab-card__logo') ||
            combined.includes('partners__logo') ||
            combined.includes('nav__arrow')
        );
    };

    const candidates = document.querySelectorAll('img');
    candidates.forEach((img) => {
        const src = img.getAttribute('src') || '';
        const ext = src.split('?')[0].split('#')[0].toLowerCase();
        const isPhoto = ext.endsWith('.png') || ext.endsWith('.jpg') || ext.endsWith('.jpeg') || ext.endsWith('.webp');
        if (!isPhoto || isDecorative(img)) return;
        img.style.cursor = 'zoom-in';
        img.addEventListener('click', () => {
            const fullSrc = img.getAttribute('src');
            if (!fullSrc) return;
            createOverlay();
            if (!overlay || !overlayImg) return;
            overlayImg.src = fullSrc;
            overlay.classList.add('lightbox--visible');
        });
        img.addEventListener('contextmenu', (e) => e.preventDefault());
        img.addEventListener('dragstart', (e) => e.preventDefault());
    });
}

document.addEventListener('DOMContentLoaded', () => {
    (async () => {
        await hydrateNewsFromWP();
        initNewsCards();
        initNewsItemPage();
        initCopyContacts();
        initServiceItemPage();
        initContactForms();
        initMobileServicesAccordion();
        highlightActiveService();
        initJewelryGallery();
        initImageLightbox();
        initJewelryCarousel();
    })();
});
