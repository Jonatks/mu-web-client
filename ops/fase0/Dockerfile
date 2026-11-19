# Fase 0, punto 3: nuestro OpenMU en la VM. La imagen actual (mu-openmu-admin, guardada como :pre-fase0, = OpenMU
# oficial + el puente del editor) + todos los plugins de openmu/plugins, compilados contra los DLL de esa misma imagen.
# Contexto: la carpeta openmu/ del repo. Lo arma y lo despliega deploy.sh.
ARG BASE=mu-openmu-admin:pre-fase0
FROM ${BASE} AS openmu

FROM mcr.microsoft.com/dotnet/sdk:10.0-alpine AS build
COPY --from=openmu /app /openmu
WORKDIR /src
COPY plugins/ ./
RUN dotnet publish MuPlugins.csproj -c Release -o /out -p:OpenMuDir=/openmu

FROM ${BASE}
COPY --from=build /out/MUnique.OpenMU.MuPlugins.dll /app/plugins/mu/
ENV DOTNET_STARTUP_HOOKS=/app/plugins/MUnique.OpenMU.MuAdminBridge.dll:/app/plugins/mu/MUnique.OpenMU.MuPlugins.dll
