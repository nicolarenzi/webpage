// Theme management
class ThemeManager {
    constructor() {
        this.theme = localStorage.getItem('theme') || 'light';
        this.init();
    }

    init() {
        // Set initial theme
        this.setTheme(this.theme);
        
        // Add event listener to theme toggle button
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => this.toggleTheme());
        }
    }

    setTheme(theme) {
        this.theme = theme;
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        
        // Update theme toggle button aria-label
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
            themeToggle.setAttribute('aria-label', 
                theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'
            );
            // Update icon visibility explicitly to avoid any flash
            const sun = themeToggle.querySelector('.sun-icon');
            const moon = themeToggle.querySelector('.moon-icon');
            if (sun && moon) {
                if (theme === 'dark') {
                    sun.style.display = 'block';
                    moon.style.display = 'none';
                } else {
                    sun.style.display = 'none';
                    moon.style.display = 'block';
                }
            }
        }
    }

    toggleTheme() {
        const newTheme = this.theme === 'light' ? 'dark' : 'light';
        this.setTheme(newTheme);
    }
}

// Mobile navigation management
class MobileNavigation {
    constructor() {
        this.menuOpen = false;
        this.init();
    }

    init() {
        const mobileButton = document.getElementById('toggle-navigation-menu');
        const header = document.getElementById('main-header');
        
        if (mobileButton && header) {
            mobileButton.addEventListener('click', () => {
                this.toggleMenu(header, mobileButton);
            });
        }

        // Close menu when clicking on navigation links (mobile)
        const navLinks = document.querySelectorAll('#navigation-menu a');
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                if (this.menuOpen && header && mobileButton) {
                    this.toggleMenu(header, mobileButton);
                }
            });
        });

        // Close menu when clicking outside (mobile)
        document.addEventListener('click', (e) => {
            if (this.menuOpen && 
                !e.target.closest('#main-header') && 
                header && mobileButton) {
                this.toggleMenu(header, mobileButton);
            }
        });

        // Handle touch events for better mobile interaction
        document.addEventListener('touchstart', (e) => {
            if (this.menuOpen && 
                !e.target.closest('#main-header') && 
                header && mobileButton) {
                this.toggleMenu(header, mobileButton);
            }
        }, { passive: true });

        // Handle escape key to close menu
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.menuOpen && header && mobileButton) {
                this.toggleMenu(header, mobileButton);
            }
        });
    }

    toggleMenu(header, button) {
        this.menuOpen = !this.menuOpen;
        
        if (this.menuOpen) {
            header.classList.add('menu-open');
            document.body.classList.add('menu-open');
            // Prevent background scrolling on mobile
            document.body.style.overflow = 'hidden';
        } else {
            header.classList.remove('menu-open');
            document.body.classList.remove('menu-open');
            // Restore background scrolling
            document.body.style.overflow = '';
        }
        
        button.setAttribute('aria-expanded', this.menuOpen.toString());
    }
}

// Smooth scrolling for navigation links
class SmoothScroll {
    constructor() {
        this.init();
    }

    init() {
        // Handle navigation link clicks
        const navLinks = document.querySelectorAll('a[href^="#"]');
        
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = link.getAttribute('href');
                const targetElement = document.querySelector(targetId);
                
                if (targetElement) {
                    // Compute dynamic offset based on actual header height
                    const header = document.getElementById('main-header');
                    const headerHeight = header ? Math.ceil(header.getBoundingClientRect().height) : 0;
                    const extraMargin = 8; // small breathing room below the header
                    const targetRect = targetElement.getBoundingClientRect();
                    const targetPosition = window.pageYOffset + targetRect.top - (headerHeight + extraMargin);
                    
                    // Immediately update active state for better UX
                    const sectionId = targetId.substring(1);
                    const navigationHighlight = window.navigationHighlightInstance;
                    if (navigationHighlight) {
                        navigationHighlight.highlightNavLink(sectionId);
                    }
                    
                    window.scrollTo({
                        top: targetPosition,
                        behavior: 'smooth'
                    });
                    
                    // Update URL without triggering scroll
                    history.pushState(null, null, targetId);
                }
            });
        });
    }
}

// Active navigation link highlighting
class NavigationHighlight {
    constructor() {
        this.sections = [];
        this.navLinks = [];
        this.init();
    }

    init() {
        // Get all sections and navigation links
        this.sections = document.querySelectorAll('section[id]');
        this.navLinks = document.querySelectorAll('#navigation-menu a[href^="#"]');
        
        if (this.sections.length > 0 && this.navLinks.length > 0) {
            // Set initial active state based on URL hash only
            this.setInitialActiveState();
            
            // Handle hash changes (but no scroll-based highlighting)
            window.addEventListener('hashchange', () => {
                this.handleHashChange();
            });
        }
    }

    setInitialActiveState() {
        const hash = window.location.hash;
        if (hash && hash !== '#') {
            const targetId = hash.substring(1);
            this.highlightNavLink(targetId);
        }
        // No default active state - only highlight when there's a hash in URL
    }

    handleHashChange() {
        const hash = window.location.hash;
        if (hash && hash !== '#') {
            const targetId = hash.substring(1);
            this.highlightNavLink(targetId);
        } else {
            // Clear all active states when there's no hash
            this.clearAllActiveStates();
        }
    }

    highlightNavLink(activeId) {
        // Remove active class from all links
        this.navLinks.forEach(link => {
            link.classList.remove('active');
            link.removeAttribute('aria-current');
        });

        // Add active class to current link
        const activeLink = document.querySelector(`#navigation-menu a[href="#${activeId}"]`);
        if (activeLink) {
            activeLink.classList.add('active');
            activeLink.setAttribute('aria-current', 'page');
        }
    }

    // Method to clear all active states (useful for debugging)
    clearAllActiveStates() {
        this.navLinks.forEach(link => {
            link.classList.remove('active');
            link.removeAttribute('aria-current');
        });
    }
}

// Performance optimization: Lazy load images if any are added
class LazyImageLoader {
    constructor() {
        this.init();
    }

    init() {
        if ('IntersectionObserver' in window) {
            const imageObserver = new IntersectionObserver((entries, observer) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        img.src = img.dataset.src;
                        img.classList.remove('lazy');
                        observer.unobserve(img);
                    }
                });
            });

            const lazyImages = document.querySelectorAll('img[data-src]');
            lazyImages.forEach(img => imageObserver.observe(img));
        }
    }
}

// Markdown content loader
class MarkdownLoader {
    constructor() {
        this.sections = ['about', 'news', 'publications', 'resume'];
        this.init();
    }

    init() {
        // Load all markdown sections
        this.sections.forEach(section => {
            this.loadMarkdown(section);
        });
    }

    async loadMarkdown(section) {
        const contentElement = document.getElementById(`${section}-content`);
        if (!contentElement) return;

        // Try multiple path strategies for better compatibility
        const pathsToTry = [
            `./${section}.md`,           // Relative to current directory
            `${section}.md`,             // Direct relative path
            `/${section}.md`             // Absolute from root (for some GitHub Pages setups)
        ];

        let lastError = null;
        
        for (const fullPath of pathsToTry) {
            try {
                console.log(`Trying to fetch: ${fullPath}`);
                const response = await fetch(fullPath);
                if (response.ok) {
                    const markdown = await response.text();
                    const html = this.parseMarkdown(markdown);
                    contentElement.innerHTML = html;
                    // Apply hover effect to new content
                    if (typeof window.applyBHoverEffect === 'function') {
                        window.applyBHoverEffect(contentElement);
                    }
                    console.log(`Successfully loaded ${section} from: ${fullPath}`);
                    return; // Success, exit early
                } else {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
            } catch (error) {
                console.warn(`Failed to load ${section} from ${fullPath}:`, error.message);
                lastError = error;
                // Continue to next path
            }
        }

        // If we get here, all paths failed
        console.error(`Error loading ${section} content - all paths failed:`, lastError);
        console.log(`Current location: ${window.location.href}`);
        contentElement.innerHTML = `
            <div class="error-message">
                <p>Sorry, unable to load ${section} content at this time.</p>
                <p><small>Last error: ${lastError?.message || 'Unknown error'}</small></p>
                <p><small>Tried paths: ${pathsToTry.join(', ')}</small></p>
            </div>
        `;
        // Apply hover effect to error content
        if (typeof window.applyBHoverEffect === 'function') {
            window.applyBHoverEffect(contentElement);
        }
    }

    parseMarkdown(markdown) {
        let html = markdown;

        // Convert headers
        html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
        html = html.replace(/^## (.*$)/gim, '<h2 class="title">$1</h2>');
        html = html.replace(/^# (.*$)/gim, '<h1 class="title">$1</h1>');

        // Convert bold text
        html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

        // Convert italic text
        html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');

        // Convert links
        html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="cactus-link">$1</a>');

        // Convert unordered lists
        html = html.replace(/^\s*- (.+)$/gm, '<li>$1</li>');
        html = html.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');

        // Convert paragraphs (split by double newlines)
        const paragraphs = html.split(/\n\s*\n/);
        html = paragraphs.map(p => {
            p = p.trim();
            if (!p) return '';
            
            // Skip if already wrapped in HTML tags
            if (p.startsWith('<') && p.endsWith('>')) return p;
            if (p.includes('<li>') || p.includes('<h') || p.includes('<ul>') || p.includes('<div')) return p;
            
            return `<p>${p}</p>`;
        }).join('\n\n');

        // Clean up nested tags
        html = html.replace(/<ul>\s*(<li>.*?<\/li>)\s*<\/ul>/gs, '<ul>$1</ul>');
        html = html.replace(/<li><\/li>/g, '');

        // Convert horizontal rules
        html = html.replace(/^---$/gm, '<hr>');

        return html;
    }
}

// Hover effect for letter 'b' and 'B'
(function() {
    function applyBHoverEffect(root) {
        const targetRoot = root || document.body;
        if (!targetRoot) return;

        const walker = document.createTreeWalker(
            targetRoot,
            NodeFilter.SHOW_TEXT,
            {
                acceptNode(node) {
                    const value = node.nodeValue;
                    if (!value || (value.indexOf('z') === -1 && value.indexOf('Z') === -1)) {
                        return NodeFilter.FILTER_REJECT;
                    }
                    const parent = node.parentNode;
                    if (!parent) return NodeFilter.FILTER_REJECT;
                    const tag = parent.nodeName;
                    if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'NOSCRIPT') {
                        return NodeFilter.FILTER_REJECT;
                    }
                    if (parent.classList && parent.classList.contains('hover-b')) {
                        return NodeFilter.FILTER_REJECT;
                    }
                    return NodeFilter.FILTER_ACCEPT;
                }
            }
        );

        const nodesToProcess = [];
        let current;
        while ((current = walker.nextNode())) {
            nodesToProcess.push(current);
        }

        nodesToProcess.forEach((textNode) => {
            const text = textNode.nodeValue;
            const fragment = document.createDocumentFragment();
            let buffer = '';

            for (let i = 0; i < text.length; i++) {
                const ch = text[i];
                if (ch === 'z' || ch === 'Z') {
                    if (buffer) {
                        fragment.appendChild(document.createTextNode(buffer));
                        buffer = '';
                    }
                    const span = document.createElement('span');
                    span.className = 'hover-b';
                    span.textContent = ch;
                    fragment.appendChild(span);
                } else {
                    buffer += ch;
                }
            }

            if (buffer) {
                fragment.appendChild(document.createTextNode(buffer));
            }

            if (textNode.parentNode) {
                textNode.parentNode.replaceChild(fragment, textNode);
            }
        });
    }

    window.applyBHoverEffect = applyBHoverEffect;
})();

// Bee spawning when clicking on a 'b'/'B'
(function() {
    function spawnBeeFromElement(el) {
        const rect = el.getBoundingClientRect();
        const startX = rect.left + rect.width / 2;
        const startY = rect.top + rect.height / 2;

        const bee = document.createElement('div');
        bee.className = 'flying-bee';
        bee.textContent = '🦟';
        bee.style.left = startX + 'px';
        bee.style.top = startY + 'px';

        // Random off-screen direction
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.max(window.innerWidth, window.innerHeight) + 200;
        const dx = Math.cos(angle) * distance;
        const dy = Math.sin(angle) * distance;
        bee.style.setProperty('--dx', dx + 'px');
        bee.style.setProperty('--dy', dy + 'px');

        document.body.appendChild(bee);

        const cleanup = () => {
            if (bee && bee.parentNode) bee.parentNode.removeChild(bee);
        };
        bee.addEventListener('animationend', cleanup, { once: true });
        setTimeout(cleanup, 4000);
    }

    document.addEventListener('mouseover', (e) => {
        const target = e.target;
        if (target && target.classList && target.classList.contains('hover-b')) {
             // prevent rapid-fire spawning when moving within the same letter
        if (target.dataset.beeHover === '1') return;
        target.dataset.beeHover = '1';
        spawnBeeFromElement(target);
        setTimeout(() => { delete target.dataset.beeHover; }, 250);
        }
    });
})();



// About sheet (bottom pull-up) — scroll-driven near page end
class AboutSheet {
  constructor() {
    this.sheet = document.getElementById('aboutSheet');
    if (!this.sheet) return;

    this.panel = this.sheet.querySelector('.about-sheet__panel');
    this.backdrop = this.sheet.querySelector('.about-sheet__backdrop');
    this.footer = document.querySelector('footer.site-footer');
    this.closeEls = this.sheet.querySelectorAll('[data-about-close]');
    this.handle = this.sheet.querySelector('.about-sheet__handle');

    this.prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // ===== Shared behavior =====
    this.OPEN_THRESHOLD = 0.08;
    this.LATCH_AT = 0.35;

    this.isLatched = false;
    this.lastClosedAt = 0;
    this.CLOSE_COOLDOWN_MS = 900;

    this.progress = 0;

    // ===== Mobile (scroll-driven) tuning =====
    this.START_AT_PX = 220;
    this.PULL_RANGE_PX = 260;

    // ===== Desktop (drag) tuning =====
    this.DESKTOP_DRAG_RANGE_PX = 420; // how many px of drag to go 0->1
    this.desktopArmed = false;
    this.dragging = false;

    this.mqDesktop = window.matchMedia('(min-width: 901px)');

    this.init();

    // keep mode in sync if user resizes across breakpoint
    this.mqDesktop.addEventListener?.('change', () => this.onModeChange());
    window.addEventListener('resize', () => this.onModeChange(), { passive: true });
  }

  isDesktop() {
    return this.mqDesktop.matches;
  }

  init() {
    // Close handlers
    this.closeEls.forEach(el => el.addEventListener('click', () => this.close()));

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.sheet.classList.contains('is-open')) this.close();
    });

    // Initial paint
    this.apply(0);

    // Start correct mode
    this.onModeChange();
  }

  onModeChange() {
    // Reset state when switching modes
    this.dragging = false;
    this.isLatched = false;
    this.desktopArmed = false;
    this.sheet.classList.remove('is-armed', 'is-dragging', 'is-open');
    document.body.style.overflow = '';

    // Remove any listeners/observers from the other mode
    this.teardownMobile();
    this.teardownDesktop();

    // Re-init the active mode
    if (this.isDesktop()) {
      this.initDesktop();
    } else {
      this.initMobile();
    }
  }

  /* =========================
     MOBILE MODE (your current idea)
     ========================= */
  initMobile() {
    this._onScroll = () => this.onScrollMobile();
    window.addEventListener('scroll', this._onScroll, { passive: true });
    window.addEventListener('resize', this._onScroll, { passive: true });
    this.onScrollMobile();
  }

  teardownMobile() {
    if (this._onScroll) {
      window.removeEventListener('scroll', this._onScroll);
      window.removeEventListener('resize', this._onScroll);
      this._onScroll = null;
    }
  }

  onScrollMobile() {
    // Don’t pop if the mobile menu is open (avoid “two overlays”)
    const header = document.getElementById('main-header');
    if (header && header.classList.contains('menu-open')) {
      this.apply(0);
      return;
    }

    // cooldown after close
    if (Date.now() - this.lastClosedAt < this.CLOSE_COOLDOWN_MS) {
      this.apply(0);
      return;
    }

    const scrollY = window.scrollY || window.pageYOffset || 0;
    const viewportH = window.innerHeight || 0;
    const docH = Math.max(
      document.body.scrollHeight,
      document.documentElement.scrollHeight,
      document.body.offsetHeight,
      document.documentElement.offsetHeight
    );

    const bottomDistance = docH - (scrollY + viewportH);

    const start = this.START_AT_PX;
    const range = this.PULL_RANGE_PX;

    let p = (start - bottomDistance) / range;
    p = Math.max(0, Math.min(1, p));

    if (this.footer) {
      const r = this.footer.getBoundingClientRect();
      const footerP = 1 - (r.top / viewportH);
      const footerClamped = Math.max(0, Math.min(1, footerP));
      p = Math.max(p, footerClamped * 0.85);
    }

    // mobile can latch too
    if (!this.isLatched && p >= this.LATCH_AT) {
      this.isLatched = true;
    }
    if (this.isLatched) p = 1;

    this.apply(p);
  }

  /* =========================
     DESKTOP MODE (IntersectionObserver + drag handle)
     ========================= */
  initDesktop() {
    // Arm when footer is visible enough
    if (this.footer && 'IntersectionObserver' in window) {
      this._io = new IntersectionObserver(
        (entries) => {
          const entry = entries[0];
          // arm when footer starts entering view
          const armed = entry.isIntersecting || entry.intersectionRatio > 0;
          this.setDesktopArmed(armed);
        },
        { root: null, threshold: [0, 0.05, 0.15] }
      );
      this._io.observe(this.footer);
    } else {
      // fallback: always armed if no IO
      this.setDesktopArmed(true);
    }

    // Drag listeners
    if (this.handle) {
      this._onPointerDown = (e) => this.onPointerDown(e);
      this.handle.addEventListener('pointerdown', this._onPointerDown);
    }

    // optional: allow dragging by grabbing the top area of the panel too
    // (uncomment if you want)
    // this.panel?.addEventListener('pointerdown', (e) => this.onPointerDown(e));
  }

  teardownDesktop() {
    if (this._io) {
      try { this._io.disconnect(); } catch {}
      this._io = null;
    }
    if (this.handle && this._onPointerDown) {
      this.handle.removeEventListener('pointerdown', this._onPointerDown);
      this._onPointerDown = null;
    }
    this.removeDragMoveUp();
  }

  setDesktopArmed(armed) {
    // Don’t arm if just closed (prevents instant re-open)
    if (Date.now() - this.lastClosedAt < this.CLOSE_COOLDOWN_MS) {
      armed = false;
    }

    this.desktopArmed = armed;

    if (armed) {
      this.sheet.classList.add('is-armed');

      // tiny “peek” so user notices it’s draggable (optional)
      if (!this.isLatched && !this.dragging) {
        this.apply(0.45);
      }
    } else {
      this.sheet.classList.remove('is-armed');
      if (!this.isLatched && !this.dragging) {
        this.apply(0);
      }
    }
  }

  onPointerDown(e) {
    if (!this.isDesktop()) return;
    if (!this.desktopArmed && !this.isLatched) return; // only draggable when armed or already open

    // don’t start drag from links/buttons inside panel
    const t = e.target;
    if (t && (t.closest('a') || t.closest('button'))) return;

    this.dragging = true;
    this.sheet.classList.add('is-dragging');

    this.startY = e.clientY;
    this.startProgress = this.isLatched ? 1 : this.progress;

    // capture pointer so we keep receiving move/up
    try { this.handle?.setPointerCapture?.(e.pointerId); } catch {}

    this._onPointerMove = (ev) => this.onPointerMove(ev);
    this._onPointerUp = (ev) => this.onPointerUp(ev);

    window.addEventListener('pointermove', this._onPointerMove, { passive: true });
    window.addEventListener('pointerup', this._onPointerUp, { passive: true });
    window.addEventListener('pointercancel', this._onPointerUp, { passive: true });
  }

  removeDragMoveUp() {
    if (this._onPointerMove) {
      window.removeEventListener('pointermove', this._onPointerMove);
      this._onPointerMove = null;
    }
    if (this._onPointerUp) {
      window.removeEventListener('pointerup', this._onPointerUp);
      window.removeEventListener('pointercancel', this._onPointerUp);
      this._onPointerUp = null;
    }
  }

  onPointerMove(e) {
    if (!this.dragging) return;

    const dy = this.startY - e.clientY; // dragging up => positive
    const deltaP = dy / this.DESKTOP_DRAG_RANGE_PX;

    let p = this.startProgress + deltaP;
    p = Math.max(0, Math.min(1, p));

    // while dragging, don’t auto-latch until release
    this.isLatched = false;
    this.apply(p);
  }

  onPointerUp(e) {
    if (!this.dragging) return;

    this.dragging = false;
    this.sheet.classList.remove('is-dragging');
    this.removeDragMoveUp();

    // snap decision
    const p = this.progress;

    if (p >= this.LATCH_AT) {
      this.open();
    } else {
      this.close();
    }
  }

  open() {
    this.isLatched = true;
    this.apply(1);
    this.sheet.classList.add('is-open');
    this.sheet.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';

    if (!this.prefersReduced) {
      setTimeout(() => this.panel?.focus?.(), 50);
    }
  }

  /* =========================
     SHARED APPLY + CLOSE
     ========================= */
  apply(p) {
    // If latched, stay fully open
    if (this.isLatched) p = 1;

    this.progress = p;

    const y = (105 - (105 * p)).toFixed(2) + '%';
    const alpha = (p <= 0 ? 0 : Math.min(1, p * 1.15)).toFixed(3);
    const backdrop = (Math.min(1, p * 0.95)).toFixed(3);

    this.sheet.style.setProperty('--sheet-y', y);
    this.sheet.style.setProperty('--sheet-alpha', alpha);
    this.sheet.style.setProperty('--sheet-backdrop', backdrop);

    const openEnough = p >= this.OPEN_THRESHOLD;

    if (openEnough) {
      this.sheet.classList.add('is-open');
      this.sheet.setAttribute('aria-hidden', 'false');

      // Only lock scroll if it’s fully open / latched (desktop) or sufficiently open (mobile latch)
      if (this.isLatched || (!this.isDesktop() && p > 0.35)) {
        document.body.style.overflow = 'hidden';
      }
    } else {
      this.sheet.classList.remove('is-open');
      this.sheet.setAttribute('aria-hidden', 'true');

      // unlock scroll unless mobile menu is open
      const header = document.getElementById('main-header');
      if (!header || !header.classList.contains('menu-open')) {
        document.body.style.overflow = '';
      }
    }
  }

  close() {
  this.lastClosedAt = Date.now();
  this.isLatched = false;

  // fully hide immediately
  this.apply(0);

  // unlock scroll unless menu is open
  const header = document.getElementById('main-header');
  if (!header || !header.classList.contains('menu-open')) {
    document.body.style.overflow = '';
  }

  // ✅ Desktop: don't permanently remove "armed" state.
  // Re-arm after cooldown IF footer is still in view.
  if (this.isDesktop()) {
    // Keep it non-interactive during cooldown
    this.setDesktopArmed(false);

    window.setTimeout(() => {
      // if user is still at the footer area, bring the tab back
      if (this.isDesktop() && this.footerInView && !this.isLatched && !this.dragging) {
        this.setDesktopArmed(true);  // will also apply the peek
      }
    }, this.CLOSE_COOLDOWN_MS + 50);
  }
}  
}


// Initialize all functionality when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Initialize all components
    new ThemeManager();
    new MobileNavigation();
    new SmoothScroll();
        new AboutSheet(); // ✅ add this

    
    // Make NavigationHighlight available globally for smooth scroll integration
    window.navigationHighlightInstance = new NavigationHighlight();
    
    new LazyImageLoader();
    new MarkdownLoader();
    
    // Apply hover effect to all 'b' letters on initial content
    if (typeof window.applyBHoverEffect === 'function') {
        window.applyBHoverEffect(document.body);
    }
    
    // Add loading state management
    document.body.classList.add('loaded');
    
    // Console message for developers
    console.log('🌵 Portfolio site loaded successfully!');
    console.log('🎉 Click the logo for a party surprise!');
    console.log('Built with inspiration from astro-theme-cactus');
});

// Handle page visibility changes (pause animations when not visible)
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
        document.body.classList.add('paused');
    } else {
        document.body.classList.remove('paused');
    }
});

// Add keyboard navigation support
document.addEventListener('keydown', (e) => {
    // Handle keyboard navigation for theme toggle
    if (e.key === 't' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
            themeToggle.click();
        }
    }
});

// Party Hat Explosion Feature
class PartyHatExplosion {
    constructor() {
        this.isAnimating = false;
        this.init();
    }

    init() {
        // Find the logo link and add click handler
        const logoLink = document.querySelector('#main-header .header-logo');
        if (logoLink) {
            logoLink.addEventListener('click', (e) => {
                e.preventDefault();
                this.triggerExplosion();
            });
        }
    }

    triggerExplosion() {
        // Check if user prefers reduced motion
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (prefersReducedMotion) {
            // Just do a simple pulse for users who prefer reduced motion
            const logoSvg = document.querySelector('#main-header svg');
            if (logoSvg) {
                logoSvg.classList.add('logo-party-pulse');
                setTimeout(() => {
                    logoSvg.classList.remove('logo-party-pulse');
                }, 600);
            }
            return;
        }
        
        // Get logo position for explosion origin
        const logoSvg = document.querySelector('#main-header svg');
        if (!logoSvg) return;
        
        const logoRect = logoSvg.getBoundingClientRect();
        const centerX = logoRect.left + logoRect.width / 2;
        const centerY = logoRect.top + logoRect.height / 2;
        const explosionId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        
        // Add pulse animation to logo
        logoSvg.classList.add('logo-party-pulse');
        
        // Create party hats explosion
        this.createPartyHats(centerX, centerY, explosionId);
        
        // Create sparkles
        this.createSparkles(centerX, centerY, explosionId);
        
        // Clean up after animation
        setTimeout(() => {
            logoSvg.classList.remove('logo-party-pulse');
            // Clean up any remaining elements for this explosion only
            this.cleanupExplosionElements(explosionId);
        }, 2500);
    }

    cleanupExplosionElements(explosionId) {
        // Remove any remaining party hats for this explosion
        const remainingHats = document.querySelectorAll(`.party-hat[data-explosion="${explosionId}"]`);
        remainingHats.forEach(hat => {
            if (hat.parentNode) {
                hat.parentNode.removeChild(hat);
            }
        });
        
        // Remove any remaining sparkles for this explosion
        const remainingSparkles = document.querySelectorAll(`.party-sparkle[data-explosion="${explosionId}"]`);
        remainingSparkles.forEach(sparkle => {
            if (sparkle.parentNode) {
                sparkle.parentNode.removeChild(sparkle);
            }
        });
    }

    createPartyHats(centerX, centerY, explosionId) {
        const hatCount = 12; // Number of party hats to create
        const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3', '#54a0ff', '#5f27cd'];
        
        for (let i = 0; i < hatCount; i++) {
            const hat = document.createElement('div');
            hat.className = 'party-hat';
            hat.setAttribute('data-explosion', explosionId);
            
            // Create party hat SVG
            hat.innerHTML = this.getPartyHatSVG(colors[i % colors.length]);
            
            // Calculate explosion direction
            const angle = (360 / hatCount) * i;
            const radian = (angle * Math.PI) / 180;
            const distance = 150 + Math.random() * 100; // Random distance between 150-250px
            
            const targetX = centerX + Math.cos(radian) * distance;
            const targetY = centerY + Math.sin(radian) * distance;
            
            // Set initial position
            hat.style.left = centerX + 'px';
            hat.style.top = centerY + 'px';
            
            // Add to DOM
            document.body.appendChild(hat);
            
            // Trigger animation with slight delay for staggered effect
            setTimeout(() => {
                hat.classList.add('exploding');
                hat.style.left = targetX + 'px';
                hat.style.top = targetY + 'px';
                hat.style.transition = 'left 2s cubic-bezier(0.25, 0.46, 0.45, 0.94), top 2s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
            }, i * 50);
            
            // Clean up after animation
            setTimeout(() => {
                if (hat.parentNode) {
                    hat.parentNode.removeChild(hat);
                }
            }, 2500);
        }
    }

    createSparkles(centerX, centerY, explosionId) {
        const sparkleCount = 20;
        
        for (let i = 0; i < sparkleCount; i++) {
            const sparkle = document.createElement('div');
            sparkle.className = 'party-sparkle';
            sparkle.setAttribute('data-explosion', explosionId);
            
            // Random colors for sparkles
            const hue = Math.random() * 360;
            sparkle.style.background = `hsl(${hue}, 70%, 60%)`;
            
            // Calculate explosion direction
            const angle = Math.random() * 360;
            const radian = (angle * Math.PI) / 180;
            const distance = 80 + Math.random() * 120;
            
            const targetX = centerX + Math.cos(radian) * distance;
            const targetY = centerY + Math.sin(radian) * distance;
            
            // Set initial position
            sparkle.style.left = centerX + 'px';
            sparkle.style.top = centerY + 'px';
            
            // Add to DOM
            document.body.appendChild(sparkle);
            
            // Trigger animation with slight delay
            setTimeout(() => {
                sparkle.classList.add('exploding');
                sparkle.style.left = targetX + 'px';
                sparkle.style.top = targetY + 'px';
                sparkle.style.transition = 'left 1.5s ease-out, top 1.5s ease-out';
            }, i * 30);
            
            // Clean up after animation
            setTimeout(() => {
                if (sparkle.parentNode) {
                    sparkle.parentNode.removeChild(sparkle);
                }
            }, 2000);
        }
    }

    getPartyHatSVG(color) {
        return `
            <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                <!-- Party hat triangle -->
                <path d="M50 10 L20 80 L80 80 Z" fill="${color}" stroke="#333" stroke-width="2"/>
                <!-- Hat brim -->
                <ellipse cx="50" cy="80" rx="30" ry="8" fill="#333"/>
                <!-- Decorative stripes -->
                <path d="M25 35 L75 35" stroke="white" stroke-width="2" opacity="0.8"/>
                <path d="M30 50 L70 50" stroke="white" stroke-width="2" opacity="0.8"/>
                <path d="M35 65 L65 65" stroke="white" stroke-width="2" opacity="0.8"/>
                <!-- Pom-pom on top -->
                <circle cx="50" cy="10" r="6" fill="white" stroke="#333" stroke-width="1"/>
                <circle cx="50" cy="10" r="3" fill="${color}"/>
            </svg>
        `;
    }
}

// Add reduced motion support
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

if (prefersReducedMotion.matches) {
    document.documentElement.style.setProperty('scroll-behavior', 'auto');
}

// Listen for changes in motion preference
prefersReducedMotion.addEventListener('change', () => {
    if (prefersReducedMotion.matches) {
        document.documentElement.style.setProperty('scroll-behavior', 'auto');
    } else {
        document.documentElement.style.setProperty('scroll-behavior', 'smooth');
    }
});


// About sheet bio tabs switch (mobile)
document.addEventListener('DOMContentLoaded', () => {
  const sheet = document.getElementById('aboutSheet');
  if (!sheet) return;

  const maiPanel = sheet.querySelector('#bio-mai');
  const nicolaPanel = sheet.querySelector('#bio-nicola');

  if (!maiPanel || !nicolaPanel) {
    console.warn('Bio panels not found');
    return;
  }

  function setActive(which) {
    const tabs = sheet.querySelectorAll('[data-bio-tab]');

    tabs.forEach(btn => {
      const isActive = btn.dataset.bioTab === which;
      btn.classList.toggle('is-active', isActive);
      btn.setAttribute('aria-selected', isActive ? 'true' : 'false');
      btn.tabIndex = isActive ? 0 : -1;
    });

    if (which === 'mai') {
      maiPanel.hidden = false;
      nicolaPanel.hidden = true;
    } else {
      maiPanel.hidden = true;
      nicolaPanel.hidden = false;
    }
  }

  // Default panel
  setActive('mai');

  // Delegated click handler
  sheet.addEventListener('click', (event) => {
    const button = event.target.closest('[data-bio-tab]');
    if (!button) return;

    event.preventDefault();
    setActive(button.dataset.bioTab);
  });
});

document.addEventListener('DOMContentLoaded', () => {
  new PartyHatExplosion();
});
