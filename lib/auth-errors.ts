export type AuthActionMode = 'google' | 'email';

export function extractFirebaseAuthCode(error: unknown): string {
  if (!error) return '';
  if (typeof error === 'object' && 'code' in error) {
    const code = (error as { code?: unknown }).code;
    if (typeof code === 'string' && code.trim()) {
      return code.trim();
    }
  }
  const msg = error instanceof Error ? error.message : String(error);
  const match = msg.match(/\(?(auth\/[a-z0-9-]+)\)?/i);
  return match ? match[1].toLowerCase() : '';
}

export function isPopupFallbackError(error: unknown): boolean {
  const code = extractFirebaseAuthCode(error);
  return (
    code === 'auth/popup-blocked' ||
    code === 'auth/operation-not-supported-in-this-environment'
  );
}

export function formatFirebaseAuthError(
  error: unknown,
  mode: AuthActionMode,
  hostname?: string,
): string {
  const code = extractFirebaseAuthCode(error);

  if (
    code === 'auth/popup-closed-by-user' ||
    code === 'auth/cancelled-popup-request'
  ) {
    return '';
  }

  if (code === 'auth/unauthorized-domain') {
    const domainLabel = hostname ? ` (${hostname})` : '';
    return `النطاق الحالي${domainLabel} غير مضاف إلى النطاقات المصرح بها في Firebase. أضفه من Firebase Console ← Authentication ← Settings ← Authorized domains ثم أعد المحاولة.`;
  }

  if (code === 'auth/popup-blocked') {
    return 'قام المتصفح بحظر نافذة تسجيل الدخول المنبثقة. اسمح بالنوافذ المنبثقة لهذا الموقع ثم أعد المحاولة.';
  }

  if (
    code === 'auth/operation-not-allowed' ||
    code === 'auth/configuration-not-found'
  ) {
    if (mode === 'email') {
      return 'مزود البريد وكلمة المرور غير مُفعّل بعد في Firebase Console. فعّله من Authentication ← Sign-in method، أو سجّل الدخول بحساب Google أدناه.';
    }
    return 'مزود تسجيل الدخول بحساب Google غير مُفعّل في Firebase Console. فعّله من Authentication ← Sign-in method.';
  }

  if (code === 'auth/network-request-failed') {
    return 'تعذر الاتصال بخوادم المصادقة. تحقق من اتصال الإنترنت وحاول مرة أخرى.';
  }

  if (code === 'auth/too-many-requests') {
    return 'تم حظر المحاولات مؤقتاً بسبب كثرة الطلبات. انتظر قليلاً ثم أعد المحاولة.';
  }

  if (
    code === 'auth/invalid-credential' ||
    code === 'auth/wrong-password' ||
    code === 'auth/user-not-found' ||
    code === 'auth/invalid-email'
  ) {
    return 'البريد الإلكتروني أو كلمة المرور غير صحيحة.';
  }

  if (code === 'auth/account-exists-with-different-credential') {
    return 'يوجد حساب مسجل بنفس البريد بطريقة دخول أخرى. جرّب تسجيل الدخول بالبريد وكلمة المرور أو بحساب Google المرتبط.';
  }

  const codeHint = code ? ` (${code})` : '';
  if (mode === 'google') {
    return `تعذر تسجيل الدخول بحساب Google${codeHint}. يرجى التحقق من إعدادات Firebase والمحاولة مرة أخرى.`;
  }

  return `تعذر تسجيل الدخول${codeHint}. يرجى التحقق من البيانات والمحاولة مرة أخرى.`;
}
