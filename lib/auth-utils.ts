/**
 * Utility functions for handling authentication cleanup on the client side
 */

/**
 * Clear authentication cookies and local storage
 */
export function clearAuthData() {
  // Clear authentication cookie
  if (typeof document !== 'undefined') {
    document.cookie = 'auth-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Strict';
  }
  
  // Clear any auth-related local storage
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem('lastAuthCheck');
    localStorage.removeItem('authToken');
    // Add any other auth-related keys you might have
  }
  
  // Clear session storage as well
  if (typeof sessionStorage !== 'undefined') {
    sessionStorage.removeItem('authToken');
  }
}

/**
 * Force logout by clearing all auth data and redirecting
 */
export async function forceLogoutAndRedirect(redirectPath: string = '/auth') {
  // Clear client-side auth data
  clearAuthData();
  
  // Call logout API to clear server-side cookies
  try {
    await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include'
    });
  } catch (error) {
    console.error('Error calling logout API:', error);
    // Continue with redirect even if logout API fails
  }
  
  // Force redirect
  if (typeof window !== 'undefined') {
    window.location.href = redirectPath;
  }
}