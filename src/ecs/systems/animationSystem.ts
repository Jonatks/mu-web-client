import type { IVector2Like } from '../../libs/babylon/exports';
import { MonsterActionType, PlayerAction } from '../../common/objects/enum';
import type { MUAttributeSystem } from '../../libs/attributeSystem';
import type { ISystemFactory } from '../world';
import type { PlayerObject } from '../../common/playerObject';

export const AnimationSystem: ISystemFactory = world => {
  const playersQuery = world.with(
    'playerAnimation',
    'modelObject',
    'attributeSystem',
    'movement'
  );

  const playerAnimatableQuery = world.with('modelObject', 'playerAnimation');
  const monsterAnimatableQuery = world.with(
    'modelObject',
    'monsterAnimation',
    'movement',
    'modelObject'
  );

  const animatableModelObjectsQuery = world.with('modelObject');

  function calculateAnimation(
    attributeSystem: MUAttributeSystem,
    velocity: IVector2Like
  ) {
    const inSafeZone = attributeSystem.isAboveZero('inSafeZone');
    const isFemale = attributeSystem.isAboveZero('isFemale');
    const isFlying = attributeSystem.isAboveZero('isFlying');
    const isSwimming = attributeSystem.isAboveZero('isSwimming');
    const isSpearEquipped = attributeSystem.isAboveZero('isSpearEquipped');
    const isMoving = velocity.x !== 0 || velocity.y !== 0;

    //
    // Female player animations
    //

    if (inSafeZone) {
      if (isFemale) {
        if (isMoving) {
          return PlayerAction.PLAYER_WALK_FEMALE;
        }

        return PlayerAction.PLAYER_STOP_FEMALE;
      }

      if (isMoving) {
        return PlayerAction.PLAYER_WALK_MALE;
      }

      return PlayerAction.PLAYER_STOP_MALE;
    }

    if (isSpearEquipped) {
      if (isMoving) {
        if (isFlying) {
          return PlayerAction.PLAYER_FLY;
        }

        if (isSwimming) {
          return PlayerAction.PLAYER_WALK_SWIM;
        }

        return PlayerAction.PLAYER_WALK_SPEAR;
      }

      return PlayerAction.PLAYER_STOP_SPEAR;
    }

    if (isFemale) {
      if (isMoving) {
        if (isFlying) {
          return PlayerAction.PLAYER_FLY;
        }

        if (isSwimming) {
          return PlayerAction.PLAYER_WALK_SWIM;
        }

        return PlayerAction.PLAYER_WALK_FEMALE;
      }

      if (isFlying) {
        return PlayerAction.PLAYER_STOP_FLY;
      }

      if (isSwimming) {
        return PlayerAction.PLAYER_STOP_FEMALE;
      }

      return PlayerAction.PLAYER_STOP_FEMALE;
    }

    //
    // Male player animations
    //

    if (isMoving) {
      if (isFlying) {
        return PlayerAction.PLAYER_FLY;
      }

      if (isSwimming) {
        return PlayerAction.PLAYER_WALK_SWIM;
      }

      return PlayerAction.PLAYER_WALK_MALE;
    }

    if (isFlying) {
      return PlayerAction.PLAYER_STOP_FLY;
    }
    if (isSwimming) {
      return PlayerAction.PLAYER_STOP_MALE;
    }

    return PlayerAction.PLAYER_STOP_MALE;
  }

  return {
    update: () => {
      // calculate current anim
      for (const {
        playerAnimation,
        movement,
        attributeSystem,
      } of playersQuery) {
        if (
          playerAnimation.action === PlayerAction.PLAYER_ATTACK_FIST ||
          playerAnimation.action === PlayerAction.PLAYER_DIE1
        ) {
          continue;
        }
        playerAnimation.action = calculateAnimation(
          attributeSystem,
          movement.velocity
        );
      }

      // update anim
      for (const { playerAnimation, modelObject } of playerAnimatableQuery) {
        const playerObject = modelObject as PlayerObject;
        if (!playerObject.Ready) continue;

        if (modelObject.ActionIterationWasFinished) {
        }

        if (
          playerAnimation.action >= PlayerAction.PLAYER_WALK_MALE &&
          playerAnimation.action <= PlayerAction.PLAYER_RUN_SWIM
        ) {
          playerObject.AnimationSpeed = 6; // TODO depends on movement speed;
        }

        playerObject.playAction(playerAnimation.action, true);

        if (playerObject.Wings) {
          if (playerObject.CurrentAction < 15) {
            playerObject.Wings.AnimationSpeed = 4;
          } else {
            playerObject.Wings.AnimationSpeed = 16;
          }
        }
      }

      //
      // Monsters
      //

      for (const {
        monsterAnimation,
        movement,
        modelObject,
      } of monsterAnimatableQuery) {
        const isMoving = movement.velocity.x !== 0 || movement.velocity.y !== 0;

        if (isMoving) {
          monsterAnimation.action = MonsterActionType.Walk;
        }
        // monsterAnimation.action = isMoving
        //   ? MonsterActionType.Walk
        //   : MonsterActionType.Stop1;

        modelObject.playAction(monsterAnimation.action, true);
      }
    },
  };
};
