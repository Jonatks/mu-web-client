// <copyright file="IMajesticViewPlugIn.cs" company="MUnique">
// Licensed under the MIT License. See LICENSE file in the project root for full license information.
// </copyright>

namespace MUnique.OpenMU.GameLogic.Views.Majestic;

using MUnique.OpenMU.GameLogic.Majestic;

/// <summary>
/// Tells the client the Majestic level, points and experience of its character.
/// </summary>
public interface IMajesticViewPlugIn : IViewPlugIn
{
    /// <summary>Sends the progress.</summary>
    /// <param name="progress">The progress.</param>
    /// <param name="levelUp">Whether it just went up a level.</param>
    ValueTask SendMajesticAsync(MajesticProgress progress, bool levelUp);
}
