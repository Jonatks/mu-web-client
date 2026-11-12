// <copyright file="AddClassSkillsOnCreate.cs" company="MUnique">
// Licensed under the MIT License. See LICENSE file in the project root for full license information.
// </copyright>

namespace MUnique.OpenMU.GameLogic.CharacterCreated;

using System.Runtime.InteropServices;
using Microsoft.Extensions.Logging;
using MUnique.OpenMU.DataModel.Configuration;
using MUnique.OpenMU.DataModel.Entities;
using MUnique.OpenMU.GameLogic.PlugIns;
using MUnique.OpenMU.Persistence;
using MUnique.OpenMU.PlugIns;

/// <summary>
/// Gives a new character the class skills listed in the plugin's configuration.
/// </summary>
/// <remarks>
/// OpenMU's own "Add ... For ..." plugins give one skill each. This one reads a list per class,
/// so a server can make characters start with the skills a high exp server gives. The key is the
/// class number of the new character (0 Dark Wizard, 4 Dark Knight, 8 Fairy Elf, 12 Magic Gladiator,
/// 16 Dark Lord, 20 Summoner, 24 Rage Fighter), the value the skill numbers (SkillNumber in OpenMU).
/// A class with no key or an empty list gets nothing from here.
/// </remarks>
[PlugIn]
[Display(Name = "Add Class Skills On Create", Description = "Gives new characters the skills listed per class in the configuration.")]
[Guid("7d2c9e41-5b6a-4f83-a1d0-3e8b64c5f9a2")]
public class AddClassSkillsOnCreate : ICharacterCreatedPlugIn, ISupportCustomConfiguration<AddClassSkillsConfiguration>, ISupportDefaultCustomConfiguration
{
    /// <inheritdoc />
    public AddClassSkillsConfiguration? Configuration { get; set; }

    /// <inheritdoc />
    public void CharacterCreated(Account account, Character createdCharacter, IContext persistenceContext, GameConfiguration gameConfiguration, ILogger logger)
    {
        var characterClass = createdCharacter.CharacterClass;
        if (characterClass is null)
        {
            return;
        }

        var wanted = SkillsFor(this.Configuration ?? new AddClassSkillsConfiguration(), characterClass.Number);
        foreach (var number in wanted)
        {
            var skill = gameConfiguration.Skills.FirstOrDefault(s => s.Number == number);
            if (skill is null)
            {
                logger.LogWarning("Add Class Skills: skill {Number} does not exist, skipped.", number);
                continue;
            }

            if (!skill.QualifiedCharacters.Contains(characterClass))
            {
                logger.LogWarning("Add Class Skills: {Skill} is not a skill of {Class}, skipped.", skill.Name, characterClass.Name);
                continue;
            }

            // Also called for characters made on the database; the OpenMU one-skill plugins may have run too.
            if (createdCharacter.LearnedSkills.Any(entry => entry.Skill?.Number == skill.Number))
            {
                continue;
            }

            var entry = persistenceContext.CreateNew<SkillEntry>();
            entry.Skill = skill;
            createdCharacter.LearnedSkills.Add(entry);
        }
    }

    /// <inheritdoc />
    public object CreateDefaultConfig() => new AddClassSkillsConfiguration();

    /// <summary>
    /// Gets the distinct skill numbers the configuration lists for a class, in order.
    /// </summary>
    /// <param name="configuration">The configuration.</param>
    /// <param name="classNumber">The class number of the new character.</param>
    /// <returns>The skill numbers; empty when the class is not listed.</returns>
    public static IReadOnlyList<ushort> SkillsFor(AddClassSkillsConfiguration configuration, byte classNumber)
    {
        return configuration.SkillsByClass.TryGetValue(classNumber, out var list) && list is not null
            ? list.Where(n => n > 0 && n <= ushort.MaxValue).Select(n => (ushort)n).Distinct().ToList()
            : Array.Empty<ushort>();
    }
}

/// <summary>
/// The configuration of <see cref="AddClassSkillsOnCreate"/>: skill numbers per class number.
/// </summary>
public class AddClassSkillsConfiguration
{
    /// <summary>
    /// Gets or sets the skill numbers a new character of each class starts with.
    /// </summary>
    /// <remarks>
    /// The default is what a new character of the reference 300x exp server starts with, matched by
    /// skill icon. Skills a class cannot have are skipped with a log warning.
    /// </remarks>
    public Dictionary<int, List<int>> SkillsByClass { get; set; } = new()
    {
        [0] = new() { 17 },                       // Dark Wizard: Energy Ball
        [4] = new() { 44, 19, 20, 21, 22, 23 },   // Dark Knight: Crescent Moon Slash, Falling Slash, Lunge, Uppercut, Cyclone, Slash
        [8] = new() { 46, 24, 26, 27, 30, 28 },   // Fairy Elf: Starfall, Triple Shot, Heal, Greater Defense, Summon Goblin, Greater Damage
        [12] = new() { 41, 47, 55, 236 },         // Magic Gladiator: Twisting Slash, Impale, Fire Slash, Flame Strike
        [16] = new() { 60 },                      // Dark Lord: Force (the Raven and Horse commands are not skills)
        [20] = new(),                             // Summoner: none
        [24] = new() { 260, 261, 269, 270 },      // Rage Fighter: Killing Blow, Beast Uppercut, Charge, Phoenix Shot
    };
}
