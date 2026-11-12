# Compiles the plugin against the assemblies of the OpenMU image it will run in; `--target out` leaves just the DLL.
ARG OPENMU_IMAGE=munique/openmu
FROM ${OPENMU_IMAGE} AS openmu

FROM mcr.microsoft.com/dotnet/sdk:10.0-alpine AS build
COPY --from=openmu /app /openmu
WORKDIR /src
COPY AdminBridge.csproj StartupHook.cs AdminBridgePlugIn.cs ./
RUN dotnet publish AdminBridge.csproj -c Release -o /out -p:OpenMuDir=/openmu

FROM scratch AS out
COPY --from=build /out/MUnique.OpenMU.MuAdminBridge.dll /
