import test from 'node:test';
import assert from 'node:assert/strict';
import {
  extractFirebaseAuthCode,
  formatFirebaseAuthError,
  isPopupFallbackError,
} from './auth-errors';

test('extractFirebaseAuthCode parses code property and message fallback', () => {
  assert.equal(
    extractFirebaseAuthCode({ code: 'auth/unauthorized-domain' }),
    'auth/unauthorized-domain',
  );
  assert.equal(
    extractFirebaseAuthCode(
      new Error('Firebase: Error (auth/popup-blocked).'),
    ),
    'auth/popup-blocked',
  );
  assert.equal(extractFirebaseAuthCode(new Error('Unknown failure')), '');
});

test('formatFirebaseAuthError explains unauthorized-domain with exact hostname', () => {
  const msg = formatFirebaseAuthError(
    { code: 'auth/unauthorized-domain' },
    'google',
    'juxi.vercel.app',
  );
  assert.match(msg, /juxi\.vercel\.app/);
  assert.match(msg, /Authorized domains/);
});

test('formatFirebaseAuthError ignores user-closed popup silently', () => {
  assert.equal(
    formatFirebaseAuthError({ code: 'auth/popup-closed-by-user' }, 'google'),
    '',
  );
  assert.equal(
    formatFirebaseAuthError(
      { code: 'auth/cancelled-popup-request' },
      'google',
    ),
    '',
  );
});

test('formatFirebaseAuthError handles email/password and popup errors accurately', () => {
  assert.match(
    formatFirebaseAuthError({ code: 'auth/invalid-credential' }, 'email'),
    /غير صحيحة/,
  );
  assert.match(
    formatFirebaseAuthError({ code: 'auth/popup-blocked' }, 'google'),
    /المنبثقة/,
  );
  assert.match(
    formatFirebaseAuthError({ code: 'auth/operation-not-allowed' }, 'email'),
    /Sign-in method/,
  );
  assert.match(
    formatFirebaseAuthError({ code: 'auth/internal-error' }, 'google'),
    /auth\/internal-error/,
  );
});

test('isPopupFallbackError detects popup-blocked and unsupported popup environments', () => {
  assert.equal(isPopupFallbackError({ code: 'auth/popup-blocked' }), true);
  assert.equal(
    isPopupFallbackError({
      code: 'auth/operation-not-supported-in-this-environment',
    }),
    true,
  );
  assert.equal(
    isPopupFallbackError({ code: 'auth/unauthorized-domain' }),
    false,
  );
});
