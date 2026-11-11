import { CREATE_MESSAGES } from '@/modules/character_select/messages';
import { CharSelect } from '@/modules/character_select';
import { addNotification } from '@/modules/chat';
import { isReservedName } from '@/modules/servers/reservedNames';
import { hasSpecialCharacters, NAME_MIN_LENGTH, type CreatableClass } from './layout';

/** The checks and the request of the Create button; the touch card uses it too. */
export function tryCreateCharacter(netClass: CreatableClass['netClass']): void {
  if (CharSelect.charCreationPending) return;

  const name = CharSelect.newCharName;

  if (name.length < NAME_MIN_LENGTH) {
    addNotification(CREATE_MESSAGES.minLength, 'error');
    return;
  }

  if (hasSpecialCharacters(name)) {
    addNotification(CREATE_MESSAGES.specialName, 'error');
    return;
  }

  if (isReservedName(name)) {
    addNotification(CREATE_MESSAGES.reservedName, 'error');
    return;
  }

  CharSelect.createCharacterRequest(name, netClass);
}
