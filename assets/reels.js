/* Reels section JS: Professional Interactive Reels with Modal Support */
(function() {
  'use strict';

  // Utility functions
  function debounce(fn, wait) {
    var timeout;
    return function() {
      clearTimeout(timeout);
      timeout = setTimeout(fn, wait || 100);
    };
  }

  function throttle(fn, wait) {
    var inThrottle, lastFn, lastTime;
    return function() {
      var context = this, args = arguments;
      if (!inThrottle) {
        fn.apply(context, args);
        inThrottle = true;
        lastTime = Date.now();
      } else {
        clearTimeout(lastFn);
        lastFn = setTimeout(function() {
          if (Date.now() - lastTime >= wait) {
            fn.apply(context, args);
            lastTime = Date.now();
          }
        }, Math.max(wait - (Date.now() - lastTime), 0));
      }
    };
  }

  // Responsive column management
  function setColsFromData(track) {
    if (!track) return;

    var desktop = parseInt(track.getAttribute('data-desktop-cols')) || 4;
    var tablet = parseInt(track.getAttribute('data-tablet-cols')) || 3;
    var mobile = parseInt(track.getAttribute('data-mobile-cols')) || 2;

    function apply() {
      var w = window.innerWidth;
      var cols = desktop;
      if (w < 768) cols = mobile;
      else if (w < 1024) cols = tablet;
      track.style.setProperty('--cols', cols);
    }

    apply();
    window.addEventListener('resize', debounce(apply, 120));
  }

  // Enhanced lazy loading with error handling
  function lazyLoadMedia(card) {
    if (!card) return;

    var img = card.querySelector('img.reel-image');
    if (img && img.dataset && img.dataset.src && img.src !== img.dataset.src) {
      img.src = img.dataset.src;
      img.addEventListener('error', function() {
        img.style.display = 'none';
        var placeholder = card.querySelector('.reel-placeholder');
        if (placeholder) placeholder.style.display = 'flex';
      });
    }

    var vid = card.querySelector('video.reel-video');
    if (vid && vid.dataset && vid.dataset.src && !vid.getAttribute('src')) {
      vid.setAttribute('src', vid.dataset.src);
      vid.addEventListener('error', function() {
        vid.style.display = 'none';
        var placeholder = card.querySelector('.reel-placeholder');
        if (placeholder) placeholder.style.display = 'flex';
      });
    }
  }

  // Modal management
  var currentModal = null;

  function openModal(reelCard) {
    if (!reelCard) return;

    var section = reelCard.closest('.reels-section');
    var modal = section.querySelector('.reel-modal');
    if (!modal) return;

    // Populate modal content
    var modalMedia = modal.querySelector('.reel-modal-media');
    var modalTitle = modal.querySelector('.reel-modal-title');
    var modalDesc = modal.querySelector('.reel-modal-description');
    var modalPrice = modal.querySelector('.reel-modal-price');
    var modalLink = modal.querySelector('.reel-modal-link');

    // Clone and prepare media
    var originalMedia = reelCard.querySelector('.reel-media');
    if (originalMedia) {
      var clonedMedia = originalMedia.cloneNode(true);
      modalMedia.innerHTML = '';
      modalMedia.appendChild(clonedMedia);

      // Load full quality media
      lazyLoadMedia(modalMedia);

      // Handle video in modal - full screen video experience
      var video = modalMedia.querySelector('video');
      if (video) {
        video.muted = false;
        video.controls = true;
        video.loop = false;
        video.currentTime = 0;
        video.style.width = '100%';
        video.style.height = '100%';
        video.style.objectFit = 'contain';
        video.play().catch(function() { /* autoplay blocked */ });
      }
    }

    // Set content
    var title = reelCard.querySelector('.reel-title');
    if (title) modalTitle.textContent = title.textContent;

    var desc = reelCard.querySelector('.reel-description');
    if (desc) modalDesc.textContent = desc.textContent;

    var price = reelCard.querySelector('.reel-price');
    if (price) modalPrice.innerHTML = price.innerHTML;

    var link = reelCard.querySelector('.reel-link');
    if (link && modalLink) {
      modalLink.href = link.href;
    }

    // Show modal
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';

    // Focus management
    modal.focus();
    currentModal = modal;

    // Close on escape
    function handleEscape(e) {
      if (e.key === 'Escape') {
        closeModal();
        document.removeEventListener('keydown', handleEscape);
      }
    }
    document.addEventListener('keydown', handleEscape);
  }

  function closeModal() {
    if (!currentModal) return;

    currentModal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';

    // Pause any playing videos
    var video = currentModal.querySelector('video');
    if (video) {
      video.pause();
    }

    currentModal = null;
  }

  // Dots navigation
  function createDots(track, container) {
    var cards = track.querySelectorAll('.reel-card');
    if (cards.length <= 1) return;

    var dotsContainer = container.querySelector('.reels-dots');
    if (!dotsContainer) return;

    dotsContainer.innerHTML = '';

    cards.forEach(function(card, index) {
      var dot = document.createElement('button');
      dot.className = 'reels-dot';
      dot.setAttribute('aria-label', 'Go to slide ' + (index + 1));
      dot.addEventListener('click', function() {
        scrollToCard(track, index);
        updateDots(dotsContainer, index);
      });
      dotsContainer.appendChild(dot);
    });

    updateDots(dotsContainer, 0);
  }

  function updateDots(dotsContainer, activeIndex) {
    var dots = dotsContainer.querySelectorAll('.reels-dot');
    dots.forEach(function(dot, index) {
      dot.classList.toggle('active', index === activeIndex);
    });
  }

  function scrollToCard(track, index) {
    var cards = track.querySelectorAll('.reel-card');
    if (!cards[index]) return;

    var card = cards[index];
    var gap = parseFloat(getComputedStyle(track).gap) || 24;
    var scrollLeft = card.offsetLeft - gap;

    track.scrollTo({
      left: scrollLeft,
      behavior: 'smooth'
    });
  }

  // Enhanced scroll handling with dots update
  function handleScroll(track, dotsContainer) {
    if (!dotsContainer) return;

    var throttledUpdate = throttle(function() {
      var cards = track.querySelectorAll('.reel-card');
      var trackRect = track.getBoundingClientRect();
      var trackCenter = trackRect.left + trackRect.width / 2;

      var closestIndex = 0;
      var closestDistance = Infinity;

      cards.forEach(function(card, index) {
        var cardRect = card.getBoundingClientRect();
        var cardCenter = cardRect.left + cardRect.width / 2;
        var distance = Math.abs(cardCenter - trackCenter);

        if (distance < closestDistance) {
          closestDistance = distance;
          closestIndex = index;
        }
      });

      updateDots(dotsContainer, closestIndex);
    }, 100);

    track.addEventListener('scroll', throttledUpdate);
  }

  // Main initialization
  function initReels(container) {
    var track = container.querySelector('.reels-track');
    if (!track) return;

    setColsFromData(track);

    var prev = container.querySelector('.reels-prev');
    var next = container.querySelector('.reels-next');
    var dotsContainer = container.querySelector('.reels-dots');

    // Enhanced scroll function
    function scrollByCard(direction) {
      var card = track.querySelector('.reel-card');
      if (!card) return;

      var gap = parseFloat(getComputedStyle(track).gap) || 24;
      var cardWidth = card.getBoundingClientRect().width + gap;
      var currentScroll = track.scrollLeft;
      var targetScroll = currentScroll + (direction * cardWidth);

      // Ensure we don't scroll beyond bounds
      var maxScroll = track.scrollWidth - track.clientWidth;
      targetScroll = Math.max(0, Math.min(targetScroll, maxScroll));

      track.scrollTo({
        left: targetScroll,
        behavior: 'smooth'
      });
    }

    // Navigation events
    if (prev) {
      prev.addEventListener('click', function(e) {
        e.preventDefault();
        scrollByCard(-1);
      });
    }

    if (next) {
      next.addEventListener('click', function(e) {
        e.preventDefault();
        scrollByCard(1);
      });
    }

    // Touch/swipe support
    var startX, startY, distX, distY;
    var threshold = 50;
    var allowedTime = 300;
    var startTime;

    track.addEventListener('touchstart', function(e) {
      var touch = e.touches[0];
      startX = touch.pageX;
      startY = touch.pageY;
      startTime = new Date().getTime();
    });

    track.addEventListener('touchmove', function(e) {
      if (!startX || !startY) return;

      var touch = e.touches[0];
      distX = touch.pageX - startX;
      distY = touch.pageY - startY;
    });

    track.addEventListener('touchend', function(e) {
      if (!startX || !startY) return;

      var elapsedTime = new Date().getTime() - startTime;

      if (elapsedTime <= allowedTime) {
        if (Math.abs(distX) >= threshold && Math.abs(distY) <= 100) {
          if (distX > 0) {
            scrollByCard(-1); // Swipe right
          } else {
            scrollByCard(1); // Swipe left
          }
        }
      }

      startX = startY = null;
    });

    // Autoplay with improved logic
    var autoplay = track.getAttribute('data-autoplay') === 'true';
    var interval = parseInt(track.getAttribute('data-interval')) || 4000;
    var autoplayTimer = null;
    var isPaused = false;

    function startAuto() {
      if (autoplay && !autoplayTimer && !isPaused) {
        autoplayTimer = setInterval(function() {
          var maxScroll = track.scrollWidth - track.clientWidth - 2;
          if (track.scrollLeft >= maxScroll) {
            track.scrollTo({ left: 0, behavior: 'smooth' });
          } else {
            scrollByCard(1);
          }
        }, interval);
      }
    }

    function stopAuto() {
      if (autoplayTimer) {
        clearInterval(autoplayTimer);
        autoplayTimer = null;
      }
    }

    function pauseAuto() {
      isPaused = true;
      stopAuto();
    }

    function resumeAuto() {
      isPaused = false;
      startAuto();
    }

    // Pause/resume autoplay on interaction
    track.addEventListener('pointerdown', pauseAuto);
    track.addEventListener('mouseenter', pauseAuto);
    track.addEventListener('mouseleave', resumeAuto);

    // IntersectionObserver for lazy load and video management
    var ioOptions = { root: track, threshold: 0.6 };
    var io = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        var card = entry.target;
        if (entry.isIntersecting) {
          lazyLoadMedia(card);

          var vid = card.querySelector('video.reel-video');
          if (vid && !vid.hasAttribute('controls')) {
            vid.muted = true;
            vid.loop = true;
            vid.play().catch(function() { /* autoplay blocked */ });
          }
        } else {
          var vid2 = card.querySelector('video.reel-video');
          if (vid2 && !vid2.hasAttribute('controls')) {
            try {
              vid2.pause();
              vid2.currentTime = 0;
            } catch(e) {}
          }
        }
      });
    }, ioOptions);

    // Card interactions
    var cards = track.querySelectorAll('.reel-card');
    cards.forEach(function(card) {
      io.observe(card);

      // Video click to open popup instead of playing inline
      var video = card.querySelector('video.reel-video');
      if (video) {
        video.addEventListener('click', function(e) {
          e.stopPropagation();
          openModal(card);
        });
      }

      // Product name click navigation (only product name, not entire card)
      var productTitle = card.querySelector('.reel-product-title');
      if (productTitle) {
        productTitle.style.cursor = 'pointer';
        productTitle.addEventListener('click', function(e) {
          e.stopPropagation();
          var link = card.querySelector('.reel-link');
          if (link) {
            window.location.href = link.href;
          }
        });
      }

      // Product price click navigation
      var productPrice = card.querySelector('.reel-product-price');
      if (productPrice) {
        productPrice.style.cursor = 'pointer';
        productPrice.addEventListener('click', function(e) {
          e.stopPropagation();
          var link = card.querySelector('.reel-link');
          if (link) {
            window.location.href = link.href;
          }
        });
      }

      // Keyboard navigation
      card.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          var expandBtn = card.querySelector('.reel-expand-btn');
          if (expandBtn) {
            expandBtn.click();
          } else {
            var link = card.querySelector('.reel-link');
            if (link) link.click();
          }
        }
      });

      // Expand button and play indicator both open modal
      var expandBtn = card.querySelector('.reel-expand-btn');
      var playIndicator = card.querySelector('.reel-play-indicator');

      if (expandBtn) {
        expandBtn.addEventListener('click', function(e) {
          e.stopPropagation();
          openModal(card);
        });
      }

      if (playIndicator) {
        playIndicator.addEventListener('click', function(e) {
          e.stopPropagation();
          openModal(card);
        });
      }
    });

    // Modal events
    var modal = container.querySelector('.reel-modal');
    if (modal) {
      var modalOverlay = modal.querySelector('.reel-modal-overlay');
      var modalClose = modal.querySelector('.reel-modal-close');

      if (modalOverlay) {
        modalOverlay.addEventListener('click', closeModal);
      }

      if (modalClose) {
        modalClose.addEventListener('click', closeModal);
      }
    }

    // Initialize dots
    createDots(track, container);
    handleScroll(track, dotsContainer);

    // Start autoplay
    startAuto();

    // Cleanup on page unload
    window.addEventListener('beforeunload', stopAuto);
  }

  // Initialize all reel sections
  function initAll() {
    var containers = document.querySelectorAll('.reels-section');
    containers.forEach(function(container) {
      initReels(container);
    });
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAll);
  } else {
    initAll();
  }

  // Re-initialize on theme editor changes
  if (window.Shopify && window.Shopify.designMode) {
    document.addEventListener('shopify:section:load', function(e) {
      if (e.target.classList.contains('reels-section')) {
        initReels(e.target);
      }
    });
  }
})();
