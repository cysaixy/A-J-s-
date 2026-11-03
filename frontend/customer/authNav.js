import { auth, onAuthStateChanged, signOut } from './firebase-init.js';

const CACHE_KEY = 'ajsNavAccount';
const ACCOUNT_ICON = `
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>`;
const CARET_ICON = `
  <svg class="nav-account-caret" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <polyline points="6 9 12 15 18 9"/>
  </svg>`;

function readCachedAccount() {
  try {
    const cached = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null');
    return cached && typeof cached.displayName === 'string' ? cached : null;
  } catch {
    return null;
  }
}

function writeCachedAccount(user) {
  try {
    if (!user) {
      localStorage.removeItem(CACHE_KEY);
      return;
    }
    localStorage.setItem(CACHE_KEY, JSON.stringify({
      displayName: user.displayName || user.email || 'Account',
      photoURL: user.photoURL || '',
    }));
  } catch {
    // The cached label is an enhancement; Firebase remains the source of truth.
  }
}

function initAccountNav() {
  const accountLink = document.getElementById('navAccountLink');
  if (!accountLink) return;

  const accountItem = document.getElementById('navAccountItem') || accountLink.closest('li');
  if (!accountItem) return;

  accountItem.classList.add('nav-account-li');
  accountItem.insertAdjacentHTML('beforeend', `
    <div class="nav-account-dropdown" id="navAccountDropdown" role="menu" aria-label="Account menu">
      <a href="account.html" class="nav-account-item" role="menuitem">My Profile</a>
      <a href="my-orders.html" class="nav-account-item" role="menuitem">My Orders</a>
      <button type="button" class="nav-account-item nav-account-logout" id="navLogoutBtn" role="menuitem">Sign Out</button>
    </div>
  `);

  const dropdown = document.getElementById('navAccountDropdown');
  const logoutButton = document.getElementById('navLogoutBtn');
  const getButton = () => document.getElementById('navAccountLink');

  function closeDropdown() {
    dropdown.classList.remove('open');
    getButton()?.setAttribute('aria-expanded', 'false');
  }

  function setLoggedIn(displayName, photoURL) {
    const firstName = (displayName || 'Account').split(' ')[0].split('@')[0];
    let button = getButton();
    if (button.tagName === 'A') {
      const signedInButton = document.createElement('button');
      signedInButton.type = 'button';
      signedInButton.id = 'navAccountLink';
      signedInButton.className = 'nav-account-pill is-logged-in';
      signedInButton.setAttribute('aria-haspopup', 'menu');
      signedInButton.setAttribute('aria-expanded', 'false');
      while (button.firstChild) signedInButton.appendChild(button.firstChild);
      signedInButton.insertAdjacentHTML('beforeend', CARET_ICON);
      button.replaceWith(signedInButton);
      button = signedInButton;
    } else {
      button.classList.add('is-logged-in');
    }

    button.title = `My Account (${firstName})`;
    button.setAttribute('aria-label', `Account menu for ${firstName}`);
    const name = button.querySelector('.nav-account-name');
    if (name) name.textContent = firstName;
    const avatar = button.querySelector('.nav-account-avatar');
    if (avatar) {
      avatar.replaceChildren();
      if (photoURL) {
        const image = document.createElement('img');
        image.src = photoURL;
        image.alt = '';
        image.referrerPolicy = 'no-referrer';
        avatar.appendChild(image);
      } else {
        const initials = document.createElement('span');
        initials.className = 'nav-avatar-initials';
        initials.textContent = (displayName || 'A')
          .split(' ')
          .map((part) => part[0] || '')
          .join('')
          .slice(0, 2)
          .toUpperCase();
        avatar.appendChild(initials);
      }
    }
  }

  function setLoggedOut() {
    const button = getButton();
    if (button.tagName === 'BUTTON') {
      const link = document.createElement('a');
      link.href = 'account.html';
      link.id = 'navAccountLink';
      link.className = 'nav-account-pill nav-account-signin';
      while (button.firstChild) {
        const child = button.firstChild;
        if (child.classList?.contains('nav-account-caret')) {
          child.remove();
        } else {
          link.appendChild(child);
        }
      }
      button.replaceWith(link);
    }

    const link = getButton();
    link.title = 'Sign In / My Account';
    link.setAttribute('aria-label', 'Sign in or view your account');
    link.querySelector('.nav-account-name').textContent = 'Sign In';
    const avatar = link.querySelector('.nav-account-avatar');
    avatar.innerHTML = ACCOUNT_ICON;
    closeDropdown();
  }

  accountItem.addEventListener('click', (event) => {
    const button = getButton();
    if (button.tagName !== 'BUTTON' || !button.contains(event.target)) return;
    event.stopPropagation();
    const opening = !dropdown.classList.contains('open');
    dropdown.classList.toggle('open', opening);
    button.setAttribute('aria-expanded', String(opening));
  });

  document.addEventListener('click', (event) => {
    if (!accountItem.contains(event.target)) closeDropdown();
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeDropdown();
  });
  dropdown.querySelectorAll('a').forEach((link) => link.addEventListener('click', closeDropdown));

  logoutButton.addEventListener('click', async () => {
    closeDropdown();
    await signOut(auth);
    window.location.reload();
  });

  const cached = readCachedAccount();
  if (cached) setLoggedIn(cached.displayName, cached.photoURL);

  onAuthStateChanged(auth, (user) => {
    if (user) {
      const displayName = user.displayName || user.email || 'Account';
      setLoggedIn(displayName, user.photoURL || '');
      writeCachedAccount(user);
    } else {
      setLoggedOut();
      writeCachedAccount(null);
    }
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAccountNav, { once: true });
} else {
  initAccountNav();
}
