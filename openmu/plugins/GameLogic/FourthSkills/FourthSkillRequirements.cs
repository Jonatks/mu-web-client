// <copyright file="FourthSkillRequirements.cs" company="MUnique">
// Licensed under the MIT License. See LICENSE file in the project root for full license information.
// </copyright>

namespace MUnique.OpenMU.GameLogic.FourthSkills;

/// <summary>
/// What each Season 19 fourth-class skill asks before its scroll teaches it (Skill/SkillRequire.xml), made by
/// mu-web-client ops/fase2/gen_skills4.py: a base skill, and a master skill at a level.
/// </summary>
public static class FourthSkillRequirements
{
    /// <summary>Skill number to (base skill, master skill, master level).</summary>
    public static readonly IReadOnlyDictionary<int, (int BaseSkill, int MasterSkill, int MasterLevel)> Of = new Dictionary<int, (int, int, int)>
    {
        [724] = (2, 390, 10),
        [725] = (2, 390, 10),
        [726] = (9, 385, 10),
        [723] = (43, 339, 10),
        [1501] = (43, 339, 10),
        [727] = (24, 418, 10),
        [2023] = (24, 411, 10),
        [2025] = (28, 422, 10),
        [731] = (55, 490, 10),
        [732] = (55, 490, 10),
        [2012] = (55, 490, 10),
        [733] = (13, 484, 10),
        [734] = (2, 484, 10),
        [2013] = (13, 484, 10),
        [737] = (238, 523, 10),
        [2095] = (61, 508, 10),
        [288] = (225, 778, 10),
        [729] = (215, 455, 10),
        [730] = (215, 455, 10),
        [282] = (262, 558, 10),
        [739] = (263, 559, 10),
    };
}
