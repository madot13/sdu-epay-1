(function () {
  'use strict';

  const PAYMENT_BASE_URL = 'https://ems.optims.app';

  // Find the script tag to read data attributes
  const scriptTag =
    document.currentScript ||
    document.querySelector('script[data-department-id]');

  const config = {
    departmentId: scriptTag ? scriptTag.getAttribute('data-department-id') : '',
    eventId: scriptTag ? scriptTag.getAttribute('data-event-id') : '',
    color: scriptTag ? scriptTag.getAttribute('data-color') || '#006799' : '#006799',
    label: scriptTag ? scriptTag.getAttribute('data-label') || 'Оплатить' : 'Оплатить',
    position: scriptTag ? scriptTag.getAttribute('data-position') || 'bottom-right' : 'bottom-right',
  };

  // Inject styles
  const style = document.createElement('style');
  style.textContent = `
    #sdu-epay-widget-btn {
      position: fixed;
      z-index: 999998;
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 14px 22px;
      background: ${config.color};
      color: #fff;
      border: none;
      border-radius: 50px;
      font-size: 15px;
      font-weight: 600;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      cursor: pointer;
      box-shadow: 0 4px 24px rgba(0,0,0,0.18);
      transition: transform 0.2s ease, box-shadow 0.2s ease, opacity 0.2s ease;
      letter-spacing: 0.3px;
      ${config.position === 'bottom-right' ? 'bottom: 28px; right: 28px;' : ''}
      ${config.position === 'bottom-left' ? 'bottom: 28px; left: 28px;' : ''}
      ${config.position === 'top-right' ? 'top: 28px; right: 28px;' : ''}
      ${config.position === 'top-left' ? 'top: 28px; left: 28px;' : ''}
    }

    #sdu-epay-widget-btn:hover {
      transform: translateY(-2px) scale(1.03);
      box-shadow: 0 8px 32px rgba(0,0,0,0.22);
    }

    #sdu-epay-widget-btn:active {
      transform: scale(0.97);
    }

    #sdu-epay-widget-btn svg {
      flex-shrink: 0;
    }

    #sdu-epay-overlay {
      position: fixed;
      inset: 0;
      z-index: 999999;
      background: rgba(0, 0, 0, 0.55);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.25s ease;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    }

    #sdu-epay-overlay.sdu-epay-open {
      opacity: 1;
      pointer-events: all;
    }

    #sdu-epay-modal {
      position: relative;
      width: 100%;
      max-width: 680px;
      max-height: 90vh;
      background: #fff;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 24px 80px rgba(0,0,0,0.3);
      transform: translateY(24px) scale(0.97);
      transition: transform 0.28s cubic-bezier(0.34, 1.56, 0.64, 1);
      margin: 16px;
      display: flex;
      flex-direction: column;
    }

    #sdu-epay-overlay.sdu-epay-open #sdu-epay-modal {
      transform: translateY(0) scale(1);
    }

    #sdu-epay-modal-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 20px;
      border-bottom: 1px solid #f0f0f0;
      background: #fff;
      flex-shrink: 0;
    }

    #sdu-epay-modal-header-title {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 16px;
      font-weight: 700;
      color: #1a1a1a;
    }

    #sdu-epay-modal-header-logo {
      width: 32px;
      height: 32px;
      border-radius: 8px;
      background: ${config.color};
      display: flex;
      align-items: center;
      justify-content: center;
    }

    #sdu-epay-close-btn {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      border: none;
      background: #f5f5f5;
      color: #666;
      font-size: 18px;
      line-height: 1;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.15s ease, color 0.15s ease;
      flex-shrink: 0;
    }

    #sdu-epay-close-btn:hover {
      background: #ffe5e5;
      color: #e53e3e;
    }

    #sdu-epay-iframe-wrapper {
      flex: 1;
      overflow: auto;
      -webkit-overflow-scrolling: touch;
    }

    #sdu-epay-iframe {
      width: 100%;
      height: 100%;
      min-height: 600px;
      border: none;
      display: block;
    }

    #sdu-epay-loader {
      position: absolute;
      inset: 60px 0 0 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 14px;
      background: #fff;
      z-index: 1;
      transition: opacity 0.3s ease;
    }

    #sdu-epay-loader.sdu-epay-hidden {
      opacity: 0;
      pointer-events: none;
    }

    .sdu-epay-spinner {
      width: 40px;
      height: 40px;
      border: 3px solid #f0f0f0;
      border-top-color: ${config.color};
      border-radius: 50%;
      animation: sdu-epay-spin 0.7s linear infinite;
    }

    .sdu-epay-loader-text {
      font-size: 14px;
      color: #888;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    }

    @keyframes sdu-epay-spin {
      to { transform: rotate(360deg); }
    }

    @media (max-width: 600px) {
      #sdu-epay-modal {
        max-height: 95vh;
        margin: 0;
        border-radius: 16px 16px 0 0;
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        max-width: 100%;
      }

      #sdu-epay-overlay {
        align-items: flex-end;
      }

      #sdu-epay-widget-btn {
        bottom: 16px !important;
        right: 16px !important;
        padding: 12px 18px;
        font-size: 14px;
      }
    }
  `;
  document.head.appendChild(style);

  // Build iframe URL
  function buildPaymentUrl(extraParams) {
    const params = new URLSearchParams();
    if (config.departmentId) params.set('department_id', config.departmentId);
    if (config.eventId) params.set('event_id', config.eventId);
    if (extraParams) {
      Object.entries(extraParams).forEach(([k, v]) => {
        if (v) params.set(k, v);
      });
    }
    const query = params.toString();
    return `${PAYMENT_BASE_URL}/payment${query ? '?' + query : ''}`;
  }

  // Create floating button
  const btn = document.createElement('button');
  btn.id = 'sdu-epay-widget-btn';
  btn.setAttribute('aria-label', config.label);
  btn.innerHTML = `
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
      <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
      <line x1="1" y1="10" x2="23" y2="10"/>
    </svg>
    ${config.label}
  `;

  // Create overlay + modal
  const overlay = document.createElement('div');
  overlay.id = 'sdu-epay-overlay';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-label', 'Форма оплаты');

  overlay.innerHTML = `
    <div id="sdu-epay-modal">
      <div id="sdu-epay-modal-header">
        <div id="sdu-epay-modal-header-title">
          <div id="sdu-epay-modal-header-logo">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
              <line x1="1" y1="10" x2="23" y2="10"/>
            </svg>
          </div>
          SDU Epay
        </div>
        <button id="sdu-epay-close-btn" aria-label="Закрыть">✕</button>
      </div>
      <div id="sdu-epay-iframe-wrapper">
        <div id="sdu-epay-loader">
          <div class="sdu-epay-spinner"></div>
          <span class="sdu-epay-loader-text">Загрузка формы оплаты...</span>
        </div>
        <iframe
          id="sdu-epay-iframe"
          src=""
          title="Форма оплаты SDU Epay"
          allow="payment"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-top-navigation"
        ></iframe>
      </div>
    </div>
  `;

  document.body.appendChild(btn);
  document.body.appendChild(overlay);

  const iframe = overlay.querySelector('#sdu-epay-iframe');
  const loader = overlay.querySelector('#sdu-epay-loader');
  const closeBtn = overlay.querySelector('#sdu-epay-close-btn');

  // Open modal
  function openModal(extraParams) {
    const url = buildPaymentUrl(extraParams);
    iframe.src = url;
    overlay.classList.add('sdu-epay-open');
    document.body.style.overflow = 'hidden';

    // Hide loader when iframe loads
    loader.classList.remove('sdu-epay-hidden');
    iframe.onload = function () {
      loader.classList.add('sdu-epay-hidden');
    };
  }

  function closeModal() {
    overlay.classList.remove('sdu-epay-open');
    document.body.style.overflow = '';
    setTimeout(function () {
      iframe.src = '';
      loader.classList.remove('sdu-epay-hidden');
    }, 300);
  }

  // Events
  btn.addEventListener('click', function () {
    openModal();
  });

  closeBtn.addEventListener('click', closeModal);

  overlay.addEventListener('click', function (e) {
    if (e.target === overlay) closeModal();
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeModal();
  });

  // Public API — можно вызвать из внешнего скрипта
  window.SduEpay = {
    open: function (params) { openModal(params); },
    close: closeModal,
  };

}());