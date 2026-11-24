// <copyright file="S19NewCharacter.cs" company="MUnique">
// Licensed under the MIT License. See LICENSE file in the project root for full license information.
// </copyright>

namespace MUnique.OpenMU.GameLogic.Season19;

using System.Runtime.InteropServices;
using Microsoft.Extensions.Logging;
using MUnique.OpenMU.DataModel.Configuration;
using MUnique.OpenMU.DataModel.Entities;
using MUnique.OpenMU.GameLogic.PlugIns;
using MUnique.OpenMU.Persistence;
using MUnique.OpenMU.PlugIns;

/// <summary>
/// A new character starts as in Season 19 (Data/Character/CharacterBase.xml): 500 free points and 10,000,000 zen.
/// </summary>
[PlugIn]
[Display(Name = "Season 19 New Character", Description = "New characters get the Season 19 start: 500 points and 10kk zen.")]
[Guid("7c1d5e93-2b84-4f6a-a0e3-58d9c2b4f1a6")]
public class S19NewCharacter : ICharacterCreatedPlugIn
{
    private const int Points = 500;
    private const int Zen = 10_000_000;

    /// <inheritdoc />
    public void CharacterCreated(Account account, Character createdCharacter, IContext persistenceContext, GameConfiguration gameConfiguration, ILogger logger)
    {
        createdCharacter.LevelUpPoints += Points;
        if (createdCharacter.Inventory is { } inventory)
        {
            inventory.Money = Math.Max(inventory.Money, Zen);
        }
    }
}
