/* Reels section JS: handle prev/next and autoplay */
(function(){
  // Helpers
  function debounce(fn, wait){ var t; return function(){ clearTimeout(t); t = setTimeout(fn, wait||100); }; }

  function setColsFromData(track){
    if(!track) return;
    var desktop = parseInt(track.getAttribute('data-desktop-cols')) || 5;
    var tablet = parseInt(track.getAttribute('data-tablet-cols')) || Math.max(2, Math.min(4, desktop-1));
    var mobile = parseInt(track.getAttribute('data-mobile-cols')) || 2;

    function apply(){
      var w = window.innerWidth;
      var cols = desktop;
      if(w < 768) cols = mobile;
      else if(w < 1024) cols = tablet;
      track.style.setProperty('--cols', cols);
    }

    apply();
    window.addEventListener('resize', debounce(apply, 120));
  }

  function lazyLoadMedia(card){
    if(!card) return;
    var img = card.querySelector('img.reel-image');
    if(img && img.dataset && img.dataset.src && img.src !== img.dataset.src){ img.src = img.dataset.src; }

    var vid = card.querySelector('video.reel-video');
    if(vid && vid.dataset && vid.dataset.src && !vid.getAttribute('src')){ vid.setAttribute('src', vid.dataset.src); }
  }

  function initReels(container){
    var track = container.querySelector('.reels-track');
    if(!track) return;

    setColsFromData(track);

    var prev = container.querySelector('.reels-prev');
    var next = container.querySelector('.reels-next');

    function scrollByCard(direction){
      var card = track.querySelector('.reel-card');
      if(!card) return;
      var gap = parseFloat(getComputedStyle(track).gap) || 16;
      var cardWidth = card.getBoundingClientRect().width + gap;
      track.scrollBy({left: direction * cardWidth, behavior: 'smooth'});
    }

    if(prev) prev.addEventListener('click', function(e){ e.preventDefault(); scrollByCard(-1); });
    if(next) next.addEventListener('click', function(e){ e.preventDefault(); scrollByCard(1); });

    // Autoplay horizontal scroll
    var autoplay = track.getAttribute('data-autoplay') === 'true' || track.getAttribute('data-autoplay') === '1';
    var interval = parseInt(track.getAttribute('data-interval')) || 3000;
    var autoplayTimer = null;

    function startAuto(){ if(autoplay && !autoplayTimer){ autoplayTimer = setInterval(function(){ var maxScroll = track.scrollWidth - track.clientWidth - 2; if(track.scrollLeft >= maxScroll){ track.scrollTo({left:0, behavior:'smooth'}); } else { scrollByCard(1); } }, interval); }}
    function stopAuto(){ if(autoplayTimer){ clearInterval(autoplayTimer); autoplayTimer = null; }}

    // Pause autoplay on interaction
    track.addEventListener('pointerdown', stopAuto);
    track.addEventListener('mouseenter', stopAuto);
    track.addEventListener('mouseleave', startAuto);

    // IntersectionObserver for lazy load and video play/pause
    var ioOptions = { root: track, threshold: 0.6 };
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        var card = entry.target;
        if(entry.isIntersecting){
          // load media
          lazyLoadMedia(card);
          var vid = card.querySelector('video.reel-video');
          if(vid){
            // try to play muted video when visible
            vid.play().catch(function(){ /* autoplay blocked */ });
          }
        } else {
          var vid2 = card.querySelector('video.reel-video');
          if(vid2){ try{ vid2.pause(); }catch(e){} }
        }
      });
    }, ioOptions);

    var cards = track.querySelectorAll('.reel-card');
    cards.forEach(function(c){ io.observe(c); });

    // Start autoplay if enabled
    startAuto();
  }

  function initAll(){
    var containers = document.querySelectorAll('.reels-section');
    containers.forEach(function(c){ initReels(c); });
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initAll);
  else initAll();
})();
