// Run by the .NET runtime before OpenMU's Main (DOTNET_STARTUP_HOOKS): loads this folder's assemblies,
// so OpenMU's plugin discovery, which scans loaded assemblies, registers our plugin.
using System.Runtime.Loader;

internal static class StartupHook
{
    public static void Initialize()
    {
        var dir = Path.GetDirectoryName(typeof(StartupHook).Assembly.Location)!;
        var context = AssemblyLoadContext.Default;
        foreach (var file in Directory.EnumerateFiles(dir, "*.dll"))
        {
            if (context.Assemblies.All(a => a.Location != file))
            {
                context.LoadFromAssemblyPath(file);
            }
        }
    }
}
