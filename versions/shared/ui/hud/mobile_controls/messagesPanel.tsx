import { useEffect, useRef, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { t } from '@/i18n';
import { Social } from '@/modules/social/social';
import { ChatLineType, chatSenderPrefix } from '@/modules/chat/chat';
import { MobileButton } from './mobileButton';
import { MobileMenu } from './menuState';
import { Icon } from './icons';

/** The colours of the original's chat rows, one per line type. */
const COLOUR: Partial<Record<ChatLineType, string>> = {
  [ChatLineType.Chat]: '#f2f2f2',
  [ChatLineType.Whisper]: '#ffc850',
  [ChatLineType.System]: '#78a0ff',
  [ChatLineType.Error]: '#ff7070',
  [ChatLineType.Party]: '#7ad6ff',
  [ChatLineType.Guild]: '#7affb0',
  [ChatLineType.Union]: '#b0ff7a',
  [ChatLineType.Gens]: '#ffa07a',
  [ChatLineType.GM]: '#ffd24a',
};

/** How many of the newest lines the panel keeps in the page. */
const SHOWN = 40;

/**
 * Mu Magdalena's "MESSAGES": a translucent panel at the top with the latest lines in large text, an input and a close x. It sends
 * through the chat module (`Social.sendChat`), so commands, whispers and the party / guild prefixes work as in the chat window.
 */
export const MessagesPanel = observer(() => {
  const [text, setText] = useState('');
  const log = useRef<HTMLDivElement>(null);
  const lines = Social.chatLines;
  const last = lines.length ? lines[lines.length - 1].id : 0;
  const open = MobileMenu.chat;

  useEffect(() => {
    if (open && log.current) log.current.scrollTop = log.current.scrollHeight;
  }, [open, last]);

  if (!open) return null;

  const send = () => {
    if (Social.sendChat(text)) setText('');
  };

  return (
    <div className="mobile-messages">
      <div className="mobile-messages-head">
        <span>{t('mobile.messages')}</span>
        <MobileButton className="mobile-close" onTap={() => (MobileMenu.chat = false)}>
          {() => <Icon name="close" size={18} />}
        </MobileButton>
      </div>
      <div className="mobile-messages-log" ref={log}>
        {lines.slice(-SHOWN).map(line => (
          <div key={line.id} className="mobile-message" style={{ color: COLOUR[line.type] ?? '#f2f2f2' }}>
            {chatSenderPrefix(line)}
            {line.text}
          </div>
        ))}
      </div>
      <form
        className="mobile-messages-input"
        onSubmit={e => {
          e.preventDefault();
          send();
        }}
      >
        <input
          value={text}
          maxLength={60}
          placeholder={t('mobile.writeMessage')}
          onChange={e => setText(e.target.value)}
          enterKeyHint="send"
          autoComplete="off"
        />
        <button type="submit" disabled={!text.trim()}>
          {t('mobile.send')}
        </button>
      </form>
    </div>
  );
});
