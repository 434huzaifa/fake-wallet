/**
 * Browser Console Utility to Clear Authentication State
 * 
 * Instructions:
 * 1. Open browser developer tools (F12)
 * 2. Go to Console tab
 * 3. Paste this entire script and press Enter
 * 4. The page will automatically redirect to login
 */

console.log('🔧 Clearing authentication state...');

// Clear authentication cookies
document.cookie = 'auth-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Strict';
console.log('✅ Cleared auth-token cookie');

// Clear local storage
try {
  localStorage.removeItem('lastAuthCheck');
  localStorage.removeItem('authToken');
  localStorage.clear(); // Clear all localStorage
  console.log('✅ Cleared localStorage');
} catch (e) {
  console.log('⚠️  Could not clear localStorage:', e);
}

// Clear session storage
try {
  sessionStorage.clear();
  console.log('✅ Cleared sessionStorage');
} catch (e) {
  console.log('⚠️  Could not clear sessionStorage:', e);
}

// Clear Redux store by calling logout API
fetch('/api/auth/logout', {
  method: 'POST',
  credentials: 'include'
})
.then(() => {
  console.log('✅ Called logout API');
})
.catch(e => {
  console.log('⚠️  Logout API failed:', e);
})
.finally(() => {
  console.log('🔄 Redirecting to login...');
  // Force redirect to login
  window.location.href = '/auth';
});