// This file prevents Next.js from generating static _error pages
// The app router error.tsx and not-found.tsx handle all errors

export default function Error() {
  return null;
}

// Prevent static generation
export const dynamic = 'force-dynamic';
