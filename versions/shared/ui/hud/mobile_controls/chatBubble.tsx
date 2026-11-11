import { useEffect, useRef } from 'react';
import { observer } from 'mobx-react-lite';
import { t } from '@/i18n';
import { Social } from '@/modules/social/social';
import { MobileButton } from './mobileButton';
import { MobileMenu } from './menuState';

/**
 * Mu Magdalena's chat: a 32 px bubble over the bar with a red counter of what arrived since the log was last open. A tap opens the
 * messages panel (`messagesPanel.tsx`), so the passive log stays small and the 3D free.
 */
export const ChatBubble = observer(() => {
  const lines = Social.chatLines;
  const open = MobileMenu.chat;
  const last = lines.length ? lines[lines.length - 1].id : 0;
  const seen = useRef(last);

  // While the input is up everything has been read.
  useEffect(() => {
    if (open) seen.current = last;
  }, [open, last]);

  const unread = open ? 0 : lines.filter(l => l.id > seen.current).length;

  return (
    <MobileButton
      className="mobile-chat-bubble"
      title={t('mobile.chat')}
      onTap={() => (MobileMenu.chat = !MobileMenu.chat)}
    >
      {() => (
        <>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M4 5h16v11H9l-5 4z" />
          </svg>
          {unread > 0 && <span className="mobile-chat-count">{Math.min(unread, 99)}</span>}
        </>
      )}
    </MobileButton>
  );
});
