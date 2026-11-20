// <copyright file="MajesticStore.cs" company="MUnique">
// Licensed under the MIT License. See LICENSE file in the project root for full license information.
// </copyright>

namespace MUnique.OpenMU.GameLogic.Majestic;

using MUnique.OpenMU.Persistence.EntityFramework;
using Npgsql;

/// <summary>
/// The Majestic progress of each character: the table <c>mu_plugins.majestic</c> in OpenMU's database (our own schema,
/// as <c>LoginTokenStore</c>), through OpenMU's admin connection.
/// </summary>
public sealed class MajesticStore
{
    private const string CreateSql = """
        CREATE SCHEMA IF NOT EXISTS mu_plugins;
        CREATE TABLE IF NOT EXISTS mu_plugins.majestic (
            character_id uuid PRIMARY KEY,
            level integer NOT NULL DEFAULT 0,
            experience bigint NOT NULL DEFAULT 0,
            points integer NOT NULL DEFAULT 0,
            updated_at timestamptz NOT NULL DEFAULT now());
        ALTER TABLE mu_plugins.majestic ADD COLUMN IF NOT EXISTS stat_points integer[] NOT NULL DEFAULT '{}';
        """;

    private readonly object _sync = new();

    private Task? _created;

    private string? _connectionString;

    private MajesticStore()
    {
    }

    /// <summary>Gets the instance.</summary>
    public static MajesticStore Instance { get; } = new();

    private string ConnectionString => this._connectionString ??=
        new ConfigFileDatabaseConnectionStringProvider().GetConnectionSetting(typeof(EntityDataContext)).ConnectionString
        ?? throw new InvalidOperationException("OpenMU has no admin connection string.");

    /// <summary>Creates the table once.</summary>
    public Task EnsureCreatedAsync()
    {
        lock (this._sync)
        {
            if (this._created is null || this._created.IsFaulted || this._created.IsCanceled)
            {
                this._created = this.CreateAsync();
            }

            return this._created;
        }
    }

    /// <summary>The progress of a character, or a new one at level 0.</summary>
    public async ValueTask<MajesticProgress> LoadAsync(Guid characterId)
    {
        await this.EnsureCreatedAsync().ConfigureAwait(false);
        await using var connection = await this.OpenAsync().ConfigureAwait(false);
        await using var command = new NpgsqlCommand("SELECT level, experience, points, stat_points FROM mu_plugins.majestic WHERE character_id = @id", connection);
        command.Parameters.AddWithValue("id", characterId);
        await using var reader = await command.ExecuteReaderAsync().ConfigureAwait(false);
        var progress = new MajesticProgress(characterId);
        if (await reader.ReadAsync().ConfigureAwait(false))
        {
            progress.Level = reader.GetInt32(0);
            progress.Experience = reader.GetInt64(1);
            progress.Points = reader.GetInt32(2);
            var stats = reader.GetFieldValue<int[]>(3);
            Array.Copy(stats, progress.StatPoints, Math.Min(stats.Length, progress.StatPoints.Length));
        }

        return progress;
    }

    /// <summary>Writes the progress of a character.</summary>
    public async ValueTask SaveAsync(MajesticProgress progress)
    {
        await this.EnsureCreatedAsync().ConfigureAwait(false);
        await using var connection = await this.OpenAsync().ConfigureAwait(false);
        await using var command = new NpgsqlCommand(
            """
            INSERT INTO mu_plugins.majestic (character_id, level, experience, points, stat_points) VALUES (@id, @level, @exp, @points, @stats)
            ON CONFLICT (character_id) DO UPDATE SET level = @level, experience = @exp, points = @points, stat_points = @stats, updated_at = now()
            """,
            connection);
        command.Parameters.AddWithValue("id", progress.CharacterId);
        command.Parameters.AddWithValue("level", progress.Level);
        command.Parameters.AddWithValue("exp", progress.Experience);
        command.Parameters.AddWithValue("points", progress.Points);
        command.Parameters.AddWithValue("stats", progress.StatPoints);
        await command.ExecuteNonQueryAsync().ConfigureAwait(false);
    }

    private async Task CreateAsync()
    {
        await using var connection = await this.OpenAsync().ConfigureAwait(false);
        await using var command = new NpgsqlCommand(CreateSql, connection);
        await command.ExecuteNonQueryAsync().ConfigureAwait(false);
    }

    private async ValueTask<NpgsqlConnection> OpenAsync()
    {
        var connection = new NpgsqlConnection(this.ConnectionString);
        await connection.OpenAsync().ConfigureAwait(false);
        return connection;
    }
}
