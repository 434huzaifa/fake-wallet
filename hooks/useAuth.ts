'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { checkAuthStatus, forceLogout } from '../store/slices/authSlice';
import { forceLogoutAndRedirect } from '../lib/auth-utils';

interface UseAuthRedirectOptions {
  redirectTo?: string;
  requireAuth?: boolean;
}

export function useAuthRedirect(options: UseAuthRedirectOptions = {}) {
  const { 
    redirectTo = '/auth', 
    requireAuth = true 
  } = options;
  
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAppSelector((state) => state.auth);
  const [authCheckStarted, setAuthCheckStarted] = useState(false);
  const hasCheckedAuth = useRef(false);

  useEffect(() => {
    // Check auth status when component mounts if user is not authenticated
    // Only run once on mount
    if (!hasCheckedAuth.current && !isAuthenticated && !user && requireAuth && !isLoading) {
      hasCheckedAuth.current = true;
      setAuthCheckStarted(true);
      
      dispatch(checkAuthStatus()).unwrap().catch(async (error) => {
        // If checkAuthStatus fails (user not found, invalid token, etc.)
        console.log('Auth check failed, forcing logout:', error);
        dispatch(forceLogout());
        await forceLogoutAndRedirect(redirectTo);
      });
    }
  }, []); // Run only once on mount

  useEffect(() => {
    // Only redirect after auth check has completed and failed
    if (requireAuth && !isLoading && !isAuthenticated && !user && authCheckStarted) {
      console.log('User not authenticated after check, forcing logout and redirect');
      dispatch(forceLogout());
      forceLogoutAndRedirect(redirectTo);
    }
  }, [dispatch, isAuthenticated, user, isLoading, redirectTo, requireAuth, authCheckStarted]);

  return {
    user,
    isAuthenticated,
    isLoading: isLoading || (authCheckStarted && !isAuthenticated && requireAuth && !user),
    shouldRedirect: requireAuth && !isLoading && !isAuthenticated && !user && authCheckStarted
  };
}

export function useAuthProtection() {
  return useAuthRedirect({ requireAuth: true, redirectTo: '/auth' });
}