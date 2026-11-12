import { useState } from 'react';
import { createPortal } from 'react-dom';
import { observer } from 'mobx-react-lite';
import { i18n, t } from '@/i18n';
import { Session } from '@/modules/session';
import { Servers } from '@/modules/servers';

type Props = { onSubmit: () => void; onRegister?: () => void; signupPage?: string; notice?: string };

const MAX_USERNAME_LENGTH = 10;
const MAX_PASSWORD_LENGTH = 20;
const LANGS = ['es', 'en'] as const;

/**
 * The login of a touch screen (Mu Magdalena's): a framed dark card with the world's name, ES / EN, the account and the password
 * with icons (the password can be shown), a gold SIGN IN and the create account link. Same session calls as the original window.
 */
export const MobileLogin = observer(({ onSubmit, onRegister, signupPage, notice }: Props) => {
  const [show, setShow] = useState(false);
  const world = Servers.selectedServer?.name ?? 'MU';

  // On the body: the page sits inside the 640x480 stage, which is scaled and offset; the card is laid out in screen pixels.
  return createPortal(
    <form
      className="login-m"
      onSubmit={e => {
        e.preventDefault();
        onSubmit();
      }}
    >
      <i className="login-m-corner tl" />
      <i className="login-m-corner tr" />
      <div className="login-m-title">{world}</div>
      <div className="login-m-sub">{t('login.m.account', { world })}</div>
      <div className="login-m-langs">
        {LANGS.map(code => (
          <button
            key={code}
            type="button"
            className={i18n.language.startsWith(code) ? 'on' : ''}
            onClick={() => i18n.setLanguage(code)}
          >
            {code.toUpperCase()}
          </button>
        ))}
      </div>
      <label className="login-m-field">
        <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden>
          <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21c0-4 3.600-6.500 8-6.500s8 2.500 8 6.500" fill="none" stroke="currentColor" strokeWidth="1.6" />
        </svg>
        <input
          type="text"
          autoComplete="username"
          placeholder={t('login.id')}
          value={Session.username}
          maxLength={MAX_USERNAME_LENGTH}
          onChange={e => (Session.username = e.target.value)}
        />
      </label>
      <label className="login-m-field">
        <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden>
          <path d="M7 11V8a5 5 0 0 1 10 0v3M5 11h14v10H5z" fill="none" stroke="currentColor" strokeWidth="1.6" />
        </svg>
        <input
          type={show ? 'text' : 'password'}
          autoComplete="current-password"
          placeholder={Session.savedToken ? t('login.savedLogin') : t('login.password')}
          value={Session.password}
          maxLength={MAX_PASSWORD_LENGTH}
          onChange={e => (Session.password = e.target.value)}
        />
        <button type="button" className="login-m-eye" onClick={() => setShow(v => !v)} aria-label={t('login.m.show')}>
          {show ? '◉' : '○'}
        </button>
      </label>
      <button type="submit" className="login-m-submit" disabled={Session.loginProcessing}>
        {t('login.m.signIn')}
      </button>
      {!!Session.loginError && <p className="login-m-error">{Session.loginError}</p>}
      {!Session.loginError && !!notice && <p className="login-m-notice">{notice}</p>}
      {!!onRegister && (
        <button type="button" className="login-m-link" onClick={onRegister}>
          {t('login.createAccount')}
        </button>
      )}
      {!!signupPage && (
        <a className="login-m-link" href={signupPage} target="_blank" rel="noopener noreferrer">
          {t('login.createAccount')}
        </a>
      )}
    </form>,
    document.body
  );
});
