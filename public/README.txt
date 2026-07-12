SOLUTIOGENIZ — KIT DE LOGO PARA WEB

ARCHIVOS PRINCIPALES
- solutiogeniz-isotipo-dark.svg
  Para fondos claros.
- solutiogeniz-isotipo-light.svg
  Para fondos oscuros.
- solutiogeniz-wordmark-dark.svg
  Nombre solamente, para fondos claros.
- solutiogeniz-wordmark-light.svg
  Nombre solamente, para fondos oscuros.
- solutiogeniz-lockup-dark.svg
  Isotipo + nombre, para fondos claros.
- solutiogeniz-lockup-light.svg
  Isotipo + nombre, para fondos oscuros.
- favicon.svg / favicon.png
  Para favicon o accesos directos.
- BrandLogo.tsx
  Componente listo para Next.js + Tailwind.

RECOMENDACIÓN PARA EL HEADER
Usar el isotipo como SVG y el nombre como texto HTML:
- Isotipo: 34–40 px de alto.
- Nombre: 20–22 px.
- Separación: 10 px.
- object-contain.
- Sin placa, fondo, padding ni border-radius.

RUTAS SUGERIDAS
Copiar los SVG en:
  /public/brand/

Luego importar BrandLogo.tsx y utilizar:
  <BrandLogo variant="dark" />

Para un header oscuro:
  <BrandLogo variant="light" />

RECOMENDACIÓN PARA EL FOOTER
Usar:
  solutiogeniz-lockup-light.svg
si el fondo es oscuro, o:
  solutiogeniz-lockup-dark.svg
si el fondo es claro.

Todos los PNG exportados tienen fondo transparente.
Los SVG no incluyen fondo ni margen excesivo.
