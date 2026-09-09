# Sala de Comunicados

Recorrido completo de un comunicado institucional: desde el pedido del área
académica hasta la lista de envío, en un solo lugar.

## Cómo se levanta

```bash
npm install
npm run dev
```

Queda en http://localhost:3000.

## El recorrido

| Paso | Qué hace |
|---|---|
| 1 · Solicitud | Tipo de programa, tipo de comunicado, países, datos y horarios. |
| 2 · Redacción | Borrador asistido, con el comunicado anterior del mismo tipo como modelo. |
| 3 · Validación | Se genera el link de revisión; el validador aprueba o pide cambios desde ahí. |
| 4 · Bases | Listados de participantes, uno por país. |
| 5 · Destinatarios | Dos listas: incluidos y excluidos, con el motivo de cada exclusión. |
| 6 · Envío | Contenido para Yamm, vista del correo como lo recibe el estudiante, y envío simulado. |

## Los dos ejes de un comunicado

**Tipo de programa** —Curso, Diplomado, Acreditación, Postítulo— define qué datos
se piden y quién valida. **Tipo de comunicado** define la plantilla y el banner.
Son independientes: un mismo tipo de comunicado se pide distinto según dónde
ocurra.

Diplomado y Postítulo piden módulo y clase. Curso pregunta si el comunicado es
sobre el inicio del programa o sobre una clase puntual. Acreditación no pide
ninguno de los dos.

## Horarios por país

Los horarios habituales están en `lib/catalogos.ts`, con una tabla para lunes a
viernes y otra para sábados. **Son sugerencias, no reglas.** Chile cambia entre
horario de invierno y verano, y con ese cambio se mueven las equivalencias de
Argentina, México y Colombia: por eso todo horario se puede editar, y lo que
queda guardado es el texto escrito en ese comunicado, no una fórmula que se
recalcule después.

## Quién valida

Siempre firma una sola persona. Marcar un caso como sensible no agrega una
segunda firma: cambia de quién es.

| Programa | Caso | Valida |
|---|---|---|
| Curso | Estándar | Daniel Oyarce |
| Acreditación | Estándar | Nicole Agüero |
| Diplomado · Postítulo | Estándar | Edwin Hernández |
| Cualquiera | Sensible | Nicole Agüero |

El validador responde desde `/revision/<id>`. Esa vista solo permite aprobar o
dejar observaciones: el texto no se edita ahí. **Cualquiera con el link puede
responder**; esta versión no tiene sesiones ni permisos, igual que el resto de
la aplicación.

La respuesta se escribe por una ruta aparte que solo toca los campos de
validación, y el asistente consulta el estado mientras espera. Así, aunque la
coordinadora tenga el formulario abierto y autoguardando, una aprobación no
puede quedar pisada.

## La redacción es simulada

Esta versión **no llama a ningún servicio externo**. El texto lo arma
`lib/ia/mock.ts` a partir de una plantilla determinista, con latencia y entrega
por trozos para que la interfaz se comporte igual que frente a un modelo real.

La reunión informativa usa plantilla fija parametrizada: solo cambian los datos,
nunca la estructura ni el tono.

El campo **Motivo** es contexto interno. Nunca aparece en el comunicado ni
parafraseado: solo ajusta el tono del cierre.

Toda la aplicación habla con la interfaz `IAProvider` (`lib/ia/provider.ts`) y
nunca con un proveedor concreto. Para conectar un modelo de verdad:

1. Implementar `redactar` en `lib/ia/claude.ts` — el prompt ya está armado ahí.
2. Definir `IA_PROVIDER=claude` y la clave en `.env.local`.

## El envío también es simulado

`lib/envio/provider.ts` tiene la misma forma. `EnvioSimulado` no manda nada y
solo deja constancia. `EnvioGmail` es el punto de reemplazo, y `CORREO` ya fija
lo que no se puede improvisar el día que se conecte: sale desde la cuenta
institucional y **Reply-To apunta a la casilla de atención**, para que las
respuestas de los estudiantes sigan entrando al sistema de tickets.

El envío real de hoy se sigue haciendo desde Yamm con el CSV que exporta el
paso 6.

## Bases de participantes

Lee `.xlsx` y `.csv`. Los encabezados se detectan por alias, así que sirve el
listado del aula virtual tal cual sale (`Nombre`, `Apellido(s)`, `Dirección de
correo`, `Grupos`) y también variantes con columna de rol.

Cada carga se asigna a **uno o varios países**: un mismo listado puede servir a
más de uno, o a todos. Cuando eso pasa, sus contactos cuentan en cada país, así
que las filas por país pueden sumar más que el consolidado — que cuenta a cada
persona una sola vez. El panel lo advierte cuando ocurre.

Reglas de la lista final, en orden:

1. si el archivo trae rol, solo pasa quien figura como estudiante — profesores,
   gestores y monitores quedan fuera;
2. un correo mal formado no se puede enviar;
3. lo que la coordinadora deja fuera a mano;
4. un correo repetido conserva su primera aparición.

> El listado actual del aula virtual **no trae columna de rol**, así que ese
> primer filtro no excluye a nadie hasta que el aula la exporte. Está
> implementado y probado para cuando llegue.

## Catálogos

`lib/catalogos.ts` concentra solicitantes, docentes, asignaturas, países,
programas, validadores y horarios. Hoy son listas locales; el día que existan
Moodle o Monday se reemplaza la fuente ahí sin tocar las pantallas. Los
desplegables tienen opción **Otro…**: un catálogo siempre queda corto y no debe
bloquear el formulario.

## Dónde viven los datos

Un archivo JSON por solicitud en `data/solicitudes/`. La carpeta está fuera del
control de versiones porque guarda correos reales de estudiantes.

Cada guardado se escribe en un archivo temporal y recién ahí se mueve encima del
definitivo, y las escrituras de una misma solicitud se hacen de a una. Sin eso,
el autoguardado del asistente y la carga de bases pueden solaparse y dejar el
archivo a medio escribir: pasó una vez y dejó una solicitud ilegible. Además se
conserva la versión anterior en `.json.bak`, que se usa sola si el archivo
principal no parsea.

Los registros guardados con versiones anteriores se completan al leerlos
(`normalizar` en `lib/modelo.ts`), así que siguen abriendo sin migrar nada a
mano.

## Identidad visual y de marca

El frontend sigue `DESIGN.md`, `estilo-comunicativo.md` y `product-desk.md`.

- **Tipografía:** Poppins, con Helvetica como única alternativa aprobada. El peso
  máximo es Bold (700): en producto digital no se usa Extra Bold.
- **Color:** morado `#704EFD`, cian `#2CB7FF` y gris `#F3F4FF` como base, navy
  `#091E42` para texto fuerte. Los tokens sin equivalente en el manual —texto,
  bordes y estados de éxito/error— están marcados como `needs-brand-definition`
  en `app/globals.css`.
- **Superficies:** clase `.adipa-card` y radios de 4, 6 y 8 px. Nada de
  `rounded-2xl` ni cards anidadas.
- **Iconografía:** solo `@phosphor-icons/react`, con tamaño y color por clases
  de Tailwind.
- **Patrones:** los círculos del hero son un patrón de marca aprobado y viven
  solo ahí. No hay patrones detrás de formularios, tablas ni acciones críticas.
- **Sin modo oscuro:** el manual no define una paleta oscura, y inventarla sería
  aproximar colores de marca. La aplicación se ve igual con cualquier preferencia
  del sistema.

### El logo

`public/brand/logos/` está vacío a propósito: el manual prohíbe reconstruir el
logo con CSS, SVG o tipografía. Deja ahí los archivos oficiales
`adipa-logotype-full-color.svg` y `adipa-logotype-white.svg` y aparecen solos en
el hero. Mientras no estén, no se muestra ningún logo.

### Glosario aplicado

El copy respeta el glosario oficial: estudiante y participante (no alumno ni
cliente), docente (no profesor), aula virtual (no plataforma ni Moodle), sesión
y clase (no webinar), certificado (no diploma). Las mismas reglas están escritas
en el prompt de `lib/ia/claude.ts` para cuando se conecte un modelo real.

> **Pendiente para México:** el glosario indica "Constancia con valor curricular"
> en lugar de "Certificado". Cuando el comunicado tenga que cambiar por país, ese
> copy va en `lib/copy/{país}.ts`, no en el componente.
