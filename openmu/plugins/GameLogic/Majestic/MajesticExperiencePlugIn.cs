// <copyright file="MajesticExperiencePlugIn.cs" company="MUnique">
// Licensed under the MIT License. See LICENSE file in the project root for full license information.
// </copyright>

namespace MUnique.OpenMU.GameLogic.Majestic;

using System.Runtime.CompilerServices;
using System.Runtime.InteropServices;
using Microsoft.Extensions.Logging;
using MUnique.OpenMU.GameLogic.Attributes;
using MUnique.OpenMU.GameLogic.PlugIns;
using MUnique.OpenMU.GameLogic.Views.Majestic;
using MUnique.OpenMU.GameLogic.Views.Character;
using MUnique.OpenMU.PlugIns;

/// <summary>
/// The Majestic levels of Season 19 (1 to 900) past the maximum master level: the master experience a kill gives once
/// the master level is at its top goes to the Majestic level instead. Kept in <see cref="MajesticStore"/>.
/// </summary>
[PlugIn]
[Display(Name = "Majestic Levels", Description = "Season 19 Majestic levels 1-900 after the maximum master level.")]
[Guid("6f2b8a64-3c1e-4d7a-9b25-0c8e4f1a7d93")]
public class MajesticExperiencePlugIn : IPlayerGainedExperiencePlugIn, IPlayerStateChangedPlugIn
{
    /// <summary>How often the progress of a character is written while it only gains experience.</summary>
    private static readonly TimeSpan SaveEvery = TimeSpan.FromMinutes(1);

    private static readonly ConditionalWeakTable<Player, MajesticProgress> Progress = new();

    /// <summary>The progress of the player's character, loaded once per character selection.</summary>
    public static async ValueTask<MajesticProgress?> GetAsync(Player player)
    {
        if (player.SelectedCharacter is not { } character)
        {
            return null;
        }

        if (Progress.TryGetValue(player, out var cached) && cached.CharacterId == character.Id)
        {
            return cached;
        }

        var loaded = await MajesticStore.Instance.LoadAsync(character.Id).ConfigureAwait(false);
        Progress.AddOrUpdate(player, loaded);
        return loaded;
    }

    /// <inheritdoc />
    public async ValueTask PlayerGainedExperienceAsync(Player player, int experience, IAttackable killedObject, bool isMasterExperience)
    {
        if (!isMasterExperience || player.Attributes is not { } attributes
            || attributes[Stats.MasterLevel] < player.GameContext.Configuration.MaximumMasterLevel)
        {
            return;
        }

        try
        {
            var progress = await GetAsync(player).ConfigureAwait(false);
            if (progress is null || progress.Level >= MajesticTable.MaximumLevel)
            {
                return;
            }

            var levelUp = progress.Add(experience);
            if (levelUp || DateTime.UtcNow - progress.SavedAt > SaveEvery)
            {
                await MajesticStore.Instance.SaveAsync(progress).ConfigureAwait(false);
                progress.SavedAt = DateTime.UtcNow;
            }

            await player.InvokeViewPlugInAsync<IMajesticViewPlugIn>(p => p.SendMajesticAsync(progress, levelUp)).ConfigureAwait(false);
            if (levelUp)
            {
                player.Logger.LogDebug("Character {0} reached Majestic level {1}", player.SelectedCharacter?.Name, progress.Level);
                await player.ForEachWorldObserverAsync<IShowEffectPlugIn>(p => p.ShowEffectAsync(player, IShowEffectPlugIn.EffectType.LevelUp), true).ConfigureAwait(false);
            }
        }
        catch (Exception ex)
        {
            player.Logger.LogError(ex, "Majestic experience of {0} could not be added.", player.SelectedCharacter?.Name);
        }
    }

    /// <inheritdoc />
    public async ValueTask PlayerStateChangedAsync(Player player, State previousState, State currentState)
    {
        try
        {
            if (currentState == PlayerState.EnteredWorld && previousState == PlayerState.CharacterSelection)
            {
                if (await GetAsync(player).ConfigureAwait(false) is { } progress)
                {
                    MajesticStats.Apply(player, progress);
                    await player.InvokeViewPlugInAsync<IMajesticViewPlugIn>(p => p.SendMajesticAsync(progress, false)).ConfigureAwait(false);
                }
            }
            else if ((currentState == PlayerState.CharacterSelection || currentState == PlayerState.Authenticated || currentState == PlayerState.Disconnected)
                     && Progress.TryGetValue(player, out var progress))
            {
                await MajesticStore.Instance.SaveAsync(progress).ConfigureAwait(false);
                Progress.Remove(player);
            }
        }
        catch (Exception ex)
        {
            player.Logger.LogError(ex, "Majestic progress of {0} could not be loaded or saved.", player.SelectedCharacter?.Name);
        }
    }
}
