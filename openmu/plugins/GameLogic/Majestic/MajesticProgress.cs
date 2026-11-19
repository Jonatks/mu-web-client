// <copyright file="MajesticProgress.cs" company="MUnique">
// Licensed under the MIT License. See LICENSE file in the project root for full license information.
// </copyright>

namespace MUnique.OpenMU.GameLogic.Majestic;

/// <summary>
/// The Majestic level, experience (counted from Majestic level 0) and unspent points of one character.
/// </summary>
public sealed class MajesticProgress
{
    /// <summary>Initializes a new instance of the <see cref="MajesticProgress"/> class.</summary>
    /// <param name="characterId">The character id.</param>
    public MajesticProgress(Guid characterId) => this.CharacterId = characterId;

    /// <summary>Gets the character id.</summary>
    public Guid CharacterId { get; }

    /// <summary>Gets or sets the level, 0 to <see cref="MajesticTable.MaximumLevel"/>.</summary>
    public int Level { get; set; }

    /// <summary>Gets or sets the experience.</summary>
    public long Experience { get; set; }

    /// <summary>Gets or sets the unspent points.</summary>
    public int Points { get; set; }

    /// <summary>Gets or sets when it was last written.</summary>
    public DateTime SavedAt { get; set; } = DateTime.UtcNow;

    /// <summary>Gets the experience of the next level (that of the maximum at the maximum).</summary>
    public long ExperienceOfNextLevel => MajesticTable.ExperienceFor(Math.Min(this.Level + 1, MajesticTable.MaximumLevel));

    /// <summary>
    /// Adds experience and the levels it reaches, as OpenMU's master experience does: one level at most per gain, the
    /// rest of the gain is dropped. Returns whether the level went up.
    /// </summary>
    public bool Add(long experience)
    {
        if (experience <= 0 || this.Level >= MajesticTable.MaximumLevel)
        {
            return false;
        }

        var next = MajesticTable.ExperienceFor(this.Level + 1);
        if (this.Experience + experience < next)
        {
            this.Experience += experience;
            return false;
        }

        this.Experience = next;
        this.Level++;
        this.Points += MajesticTable.PointsPerLevel;
        return true;
    }
}
