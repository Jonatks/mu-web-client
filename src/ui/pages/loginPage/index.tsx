import './style.less';
import { observer } from 'mobx-react-lite';
import { Store, UIState } from '../../../store';
import { useEventBus } from '../../../hooks/useEventBus';
import {
  LoginResponseLoginResultEnum,
  LoginResponsePacket,
} from '../../../common/packets/ServerToClientPackets';
import { MAX_PASSWORD_LENGTH, MAX_USERNAME_LENGTH } from '../../../consts';
import { RequestCharacterListPacket } from '../../../common/packets/ClientToServerPackets';
import { MenuBackdrop, MuLogo } from '../../shell/menu';

export const LoginPage = observer(() => {
  useEventBus('LoginResponse', async bytes => {
    Store.loginProcessing = false;

    const p = new LoginResponsePacket(bytes);

    switch (p.Success) {
      case LoginResponseLoginResultEnum.Okay: {
       Store.saveLoginData();
        await Store.disconnectFromConnectServer();
        Store.uiState = UIState.Characters;
        break;
      }

      case LoginResponseLoginResultEnum.InvalidPassword:
      case LoginResponseLoginResultEnum.AccountInvalid:
      case LoginResponseLoginResultEnum.AccountAlreadyConnected:
      case LoginResponseLoginResultEnum.ServerIsFull:
      case LoginResponseLoginResultEnum.AccountBlocked:
      case LoginResponseLoginResultEnum.WrongVersion:
      case LoginResponseLoginResultEnum.ConnectionError:
      case LoginResponseLoginResultEnum.ConnectionClosed3Fails:
      case LoginResponseLoginResultEnum.NoChargeInfo:
      case LoginResponseLoginResultEnum.SubscriptionTermOver:
      case LoginResponseLoginResultEnum.SubscriptionTimeOver:
      case LoginResponseLoginResultEnum.TemporaryBlocked:
      case LoginResponseLoginResultEnum.OnlyPlayersOver15Yrs:
      case LoginResponseLoginResultEnum.BadCountry:
      default: {
        Store.loginError = 'No se pudo iniciar sesión: ' + LoginResponseLoginResultEnum[p.Success];
      }
    }
  });

  const onLoginClicked = () => {
    Store.loginError = undefined;
    Store.loginProcessing = true;
    const username = Store.username;
    const password = Store.password;

    Store.loginRequest(username, password);
  };

  return (
    <div className="mu-screen mu-login">
      <MenuBackdrop />
      <div className="mu-split">
        <div className="mu-hero">
          <MuLogo />
          <p className="tag">Prueba cerrada · v0.1</p>
        </div>
        <form
          className="mu-frame"
          onSubmit={e => {
            e.preventDefault();
            onLoginClicked();
          }}
        >
          <h3>Iniciar sesión</h3>
          {!!Store.loginError && <p className="mu-error">{Store.loginError}</p>}
          <label>
            Usuario
            <input
              type="text"
              autoCapitalize="none"
              autoComplete="username"
              value={Store.username}
              onChange={e => {
                Store.username = e.target.value;
              }}
              maxLength={MAX_USERNAME_LENGTH}
            />
          </label>
          <label>
            Contraseña
            <input
              type="password"
              autoComplete="current-password"
              value={Store.password}
              onChange={e => {
                Store.password = e.target.value;
              }}
              maxLength={MAX_PASSWORD_LENGTH}
            />
          </label>
          <button className="mu-btn" type="submit" disabled={Store.loginProcessing}>
            {Store.loginProcessing ? 'Entrando…' : 'ENTRAR'}
          </button>
        </form>
      </div>
    </div>
  );
});
