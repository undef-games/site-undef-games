export interface SelectorContractSurface {
  flag: string
  hooks: Record<string, readonly string[]>
}

export interface SelectorContract {
  version: number
  surfaces: {
    account: SelectorContractSurface
    auth: SelectorContractSurface
    site: SelectorContractSurface
  }
}

export const scanlinesSelectorContract: SelectorContract = {
  version: 1,
  surfaces: {
    site: {
      flag: 'enable_test_ids',
      hooks: {
        shared: ['site-brand-home', 'site-login-link', 'site-theme-toggle', 'site-lab-link'],
      },
    },
    auth: {
      flag: 'AUTH_UI_TEST_IDS',
      hooks: {
        login: [
          'auth-shell',
          'auth-scanline-field',
          'auth-back-button',
          'auth-login-form',
          'auth-login-email',
          'auth-login-password',
          'auth-login-submit',
        ],
        forgot: ['auth-forgot-form', 'auth-forgot-email', 'auth-forgot-submit'],
        mfa: ['auth-mfa-form'],
        reset: ['auth-reset-form', 'auth-reset-password'],
        security: [
          'auth-shell',
          'auth-scanline-field',
          'auth-back-button',
          'auth-security-enable-form',
          'auth-security-password',
        ],
        signup: ['auth-signup-form', 'auth-signup-name', 'auth-signup-email', 'auth-signup-password', 'auth-signup-submit'],
      },
    },
    account: {
      flag: 'VITE_INCLUDE_TEST_IDS',
      hooks: {
        authError: ['account-auth-cta'],
        dashboard: [
          'account-nav',
          'account-nav-security',
          'account-action-security-settings',
          'account-action-save-handle',
          'account-action-save-profile',
          'account-action-verify-email',
          'account-action-verify-phone',
          'account-action-revoke-other-sessions',
        ],
        theme: ['account-theme-signal-blue'],
      },
    },
  },
}

export function contractHooks(
  surface: keyof SelectorContract['surfaces'],
  group: string,
): readonly string[] {
  const hooks = scanlinesSelectorContract.surfaces[surface].hooks[group]
  if (!hooks || hooks.length === 0) {
    throw new Error(`Missing selector contract hooks for ${surface}.${group}`)
  }
  return hooks
}

export function contractFlag(surface: keyof SelectorContract['surfaces']): string {
  return scanlinesSelectorContract.surfaces[surface].flag
}

export function contractHook(
  surface: keyof SelectorContract['surfaces'],
  group: string,
  hook: string,
): string {
  const hooks = contractHooks(surface, group)
  if (!hooks.includes(hook)) {
    throw new Error(`Missing selector contract hook ${surface}.${group}.${hook}`)
  }
  return hook
}
