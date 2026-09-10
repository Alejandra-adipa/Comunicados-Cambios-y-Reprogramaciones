# Brief · Comunicados de cambios y reprogramaciones

Flujo: desde que el área académica avisa un cambio en un programa hasta que el
comunicado llega a los estudiantes de todos los países afectados.

**App desplegada:** https://comunicados-cambios-y-reprogramacio.vercel.app
**Mapa del journey:** [`mapa-journey.excalidraw`](mapa-journey.excalidraw) · imagen en [`mapa-journey.png`](mapa-journey.png)

---

## Problema que resuelve

Cada vez que una clase se mueve, se suspende, cambia de docente o de horario, hay
que avisarle a los estudiantes. Hoy ese aviso se arma a mano y repartido en cinco
lugares distintos:

1. El pedido llega por dos vías, ninguna con formato ni campos fijos: lo que el
   área académica comenta por Slack, y lo que queda anotado en el tablero de
   Monday «Reprogramaciones y cambios». A veces por las dos a la vez, y no
   siempre con la misma información.
2. El texto se redacta buscando un comunicado parecido en la bandeja de enviados
   y adaptándolo a mano.
3. La validación con jefatura es un ida y vuelta por chat: se pierde el hilo de
   los ajustes y no queda registro de quién aprobó qué versión.
4. La lista de destinatarios sale de descargar los Excel de participantes de cada
   aula virtual, uno por país, y cuidar a mano que cada archivo vaya al envío
   correcto.
5. Los horarios de cada país se calculan de memoria, y cambian dos veces al año
   cuando Chile entra y sale del horario de verano.

Cada comunicado toma entre 15 y 20 minutos, y se envían varios al mes: cuántos
depende de las eventualidades de cada período, así que hay meses en que se
acumulan. Los errores que efectivamente ocurren son dos: **errores de redacción**
y **envíos a la base equivocada**. Y no queda ningún registro estructurado de qué
se envió, a quién y cuándo.

La aplicación reúne los cinco pasos en un solo recorrido, hace cumplir las reglas
que hoy dependen de que alguien se acuerde, y deja constancia de cada vuelta.

**Cómo se mide el éxito:** menos tiempo por comunicado y un proceso más expedito.
Contra los dos errores de hoy: la redacción pasa siempre por un validador antes de
salir, y cada base queda asociada a su país, con sus totales a la vista antes de
enviar.

---

## Usuario principal y roles

**Usuaria principal: Coordinadora de Experiencia del Cliente.** Es quien ejecuta
todo el recorrido, de principio a fin. Es el único rol que entra al asistente.
Al comienzo la usa solo ella; más adelante se sumará otra persona del equipo.

| Rol | Qué hace | Dónde interviene |
|---|---|---|
| **Área académica** | Origina la solicitud: avisa que una clase cambia y por qué. | Fuera de la aplicación. Avisa por Slack, o lo deja anotado en el tablero de Monday «Reprogramaciones y cambios». La coordinadora lo registra a mano. |
| **Coordinadora de Experiencia del Cliente** | Registra la solicitud, redacta, pide validación, arma la lista y envía. | Los seis pasos del asistente. |
| **Validación** | Aprueba el comunicado o lo devuelve con observaciones. No edita el texto. | Una pantalla propia, a la que llega por un link. No entra al asistente. |
| **Estudiantes** | Reciben el comunicado y responden si tienen dudas. | Su correo. El comunicado sale desde info@adipa.cl y las respuestas vuelven ahí, desde cualquier país. |

**Quién valida depende del programa**, y siempre firma una sola persona:

| Tipo de programa | Caso | Valida |
|---|---|---|
| Curso | Estándar | Daniel Oyarce |
| Acreditación | Estándar | Nicole Agüero |
| Diplomado · Postítulo | Estándar | Edwin Hernández |
| Cualquiera | Sensible | Nicole Agüero |

Un caso sensible es el que ya arrastra historia o tiene alcance internacional:
por ejemplo, un diplomado que se reprogramó dos veces, o una acreditación con un
cambio importante. Esos casos, además, se revisan con gerencia.

**Siempre hay un validador disponible:** si el que corresponde no está, valida
otro del equipo.

---

## Pantallas / piezas (lista, en orden del journey)

0. **Panel de comunicados** — punto de entrada. Lista los comunicados existentes
   con su estado, permite filtrarlos, eliminarlos y empezar uno nuevo.
1. **Solicitud** — formulario de datos. Los campos cambian según el tipo de
   programa y el tipo de comunicado.
2. **Redacción** — editor del asunto y el cuerpo, con borrador asistido,
   comunicado de referencia y biblioteca de plantillas propias.
3. **Validación** — genera el link de revisión, registra la respuesta y guarda el
   historial de cada vuelta.
4. **Vista de revisión** *(pantalla del validador, fuera del asistente)* — muestra
   el comunicado completo y ofrece dos acciones: aprobar o solicitar cambios.
5. **Bases** — carga de los listados de participantes, con sus totales por país.
6. **Destinatarios** — lista final dividida en incluidos y excluidos, con el motivo
   de cada exclusión.
7. **Envío** — resumen, contenido para copiar, CSV para Yamm y vista previa del
   correo tal como lo recibe el estudiante.

---

## Datos por pantalla (qué entra, qué sale)

### 0 · Panel de comunicados

| Entra | Sale |
|---|---|
| Tipo de programa y tipo de comunicado del nuevo | Un comunicado creado, o uno existente abierto |
| Filtro por estado | La lista acotada a ese estado |

### 1 · Solicitud

| Entra | Sale |
|---|---|
| Tipo de programa: curso, diplomado, acreditación o postítulo | Solicitud registrada, con su validador ya determinado |
| Tipo de comunicado: reprogramación, cambio de docente, suspensión, cambio de horario, reunión informativa o aviso general | |
| Alcance: inicio del programa o clases específicas | |
| Países afectados (uno o varios de: Chile, Argentina, México, Colombia) | |
| Quién lo solicita, programa o asignatura, docente a cargo | |
| Módulo y su nombre, solo en diplomados y postítulos | |
| Clases afectadas: una fila por clase, con su número y sus fechas | |
| Horario de la sesión en hora local de cada país seleccionado | |
| ¿El enlace de Zoom se mantiene? Si no: enlace, ID y código de acceso | |
| Motivo, marcado como uso interno | |

### 2 · Redacción

| Entra | Sale |
|---|---|
| Todos los datos de la solicitud | Asunto y cuerpo del comunicado |
| El comunicado anterior del mismo tipo, como modelo | |
| Las observaciones del validador, si las hubo | |
| Una plantilla guardada, si se elige una | |

### 3 · Validación

| Entra | Sale |
|---|---|
| Asunto y cuerpo | Un link de revisión y un mensaje listo para copiar |
| Marca de caso sensible y su motivo, opcional | Estado: en revisión |
| | El validador asignado, según programa y sensibilidad |

### 4 · Vista de revisión

| Entra | Sale |
|---|---|
| El comunicado completo, en solo lectura | Aprobado, o con observaciones |
| Observaciones escritas por el validador | Una vuelta cerrada en el historial: fecha, validador, estado, observaciones |

### 5 · Bases

| Entra | Sale |
|---|---|
| Uno o varios archivos `.xlsx` o `.csv` de participantes | Lista consolidada de contactos |
| Los países a los que aplica cada archivo | Total por país y total consolidado |
| | Cantidad excluida |

Columnas que se leen del archivo: nombre, apellidos, dirección de correo, grupos
y rol. Los encabezados se detectan por alias, así que sirve el export del aula
virtual tal como sale.

### 6 · Destinatarios

| Entra | Sale |
|---|---|
| La lista consolidada | Lista de incluidos: quienes reciben el comunicado |
| Exclusiones hechas a mano | Lista de excluidos, cada uno con su motivo |

### 7 · Envío

| Entra | Sale |
|---|---|
| Comunicado aprobado y lista final | `destinatarios.csv` para Yamm |
| | Asunto y cuerpo para copiar |
| | Registro del envío: fecha y cantidad de destinatarios |

---

## Reglas de negocio

**Del origen del pedido**

1. Si el pedido llega por Slack o queda anotado en el tablero de Monday
   «Reprogramaciones y cambios», entonces la coordinadora lo registra a mano en
   el formulario. Ninguna de las dos vías entra sola.
2. Si el pedido llega por las dos vías con información distinta, entonces manda
   lo confirmado con el área académica, y esa es la versión que se registra.

**Del formulario**

3. Si el tipo de programa es diplomado o postítulo, entonces se piden número de
   módulo y nombre del módulo. El nombre es opcional.
4. Si el tipo de programa es curso o acreditación, entonces no se pide módulo.
5. Si el alcance es "inicio del programa", entonces no se piden clases ni sus
   fechas.
6. Si el alcance es "clases específicas", entonces se pide al menos una clase con
   su número y sus fechas, y se pueden agregar todas las que haga falta.
7. Si el tipo de comunicado es reunión informativa, entonces se piden siempre el
   enlace de Zoom, el ID y el código de acceso, y el comunicado usa una plantilla
   fija parametrizada.
8. Si el enlace de Zoom se mantiene, entonces el comunicado indica que el acceso
   es el habitual del aula virtual; si no se mantiene, entonces se publican el
   enlace, el ID y el código.
9. Si hay más de un país seleccionado, entonces el comunicado lista el horario de
   cada uno por separado.
10. Si falta algún dato obligatorio, entonces el paso siguiente queda bloqueado y
   se indica exactamente qué falta.

**De la redacción**

11. Si el campo Motivo tiene contenido, entonces se usa solo para ajustar el tono
   del comunicado, y nunca aparece en el texto ni parafraseado.
12. Si el validador dejó observaciones, entonces al volver a redactar se
    incorporan al borrador.
13. Si el comunicado aplica solo a Chile, entonces el cierre lleva sac@adipa.cl.
    Si aplica a varios países, entonces nombra la casilla de cada uno:
    sac@adipa.cl, sac@adipa.co, sac@adipa.mx y sac@adipa.ar, para que el
    estudiante escriba a la que lo atiende.

**De la validación**

14. Si el tipo de programa es curso, entonces valida Daniel Oyarce.
15. Si el tipo de programa es acreditación, entonces valida Nicole Agüero.
16. Si el tipo de programa es diplomado o postítulo, entonces valida Edwin
    Hernández.
17. Si el caso está marcado como sensible, entonces valida Nicole Agüero, y
    reemplaza al validador que correspondía. No se suma una segunda firma.
18. Si el validador aprueba, entonces el comunicado queda habilitado para avanzar.
19. Si el validador solicita cambios, entonces el comunicado vuelve a redacción
    con sus observaciones, y el ciclo se repite hasta el visto bueno.
20. Si el comunicado se edita después de estar aprobado, entonces pierde la
    aprobación y hay que pedirla de nuevo.
21. Si no existe una aprobación válida, entonces no se puede avanzar al paso de
    bases.

**De las bases y los destinatarios**

22. Si el archivo trae columna de rol, entonces solo pasan quienes figuran como
    estudiante; profesores, gestores y monitores quedan fuera.
23. Si el rol no corresponde a ninguno conocido, entonces el contacto queda fuera
    marcado como rol no habilitado.
24. Si el correo no tiene formato válido, entonces el contacto queda fuera y no
    se puede reincorporar a mano.
25. Si un correo ya apareció antes, entonces se conserva la primera aparición y
    las siguientes quedan fuera como duplicado.
26. Si un archivo se asigna a varios países, entonces sus contactos cuentan en
    cada uno, y el consolidado cuenta a cada persona una sola vez.
27. Si un país del comunicado queda sin listado cargado, entonces aparece en cero
    en los totales y ese país no recibe el correo. La lectura del archivo igual
    verifica el encabezado de correo, como resguardo ante un export mal armado.

**Del envío**

28. Si no hay aprobación válida, entonces el botón de envío queda bloqueado, y el
    servidor también rechaza la operación.
29. Si no hay ningún destinatario en la lista final, entonces no se puede enviar.
30. Si el comunicado ya fue enviado, entonces no se puede volver a enviar.
31. El comunicado sale siempre desde info@adipa.cl. Si el estudiante responde,
    entonces la respuesta llega ahí, sin importar su país.

**De los horarios**

32. Si se selecciona un país, entonces aparece un campo de horario propio para ese
    país, editable siempre.
33. Si la fecha de la sesión cae sábado, entonces se sugiere la tabla de horarios
    de sábado; si no, la de lunes a viernes.
34. El horario que se guarda es el texto que se escribió en ese comunicado. Nunca
    se recalcula después, porque las equivalencias entre países cambian cuando
    Chile entra y sale del horario de verano.

---

## Fuera de alcance

Lo que **no** se construye en esta versión. Las cinco integraciones van en el orden
en que se conectarían: Monday, Slack, Moodle, Gmail y, al final, la IA.

1. **Integración con Monday.** El tablero «Reprogramaciones y cambios» no se lee:
   lo que está anotado ahí se vuelve a escribir a mano en el formulario. Los
   catálogos de programas y docentes tampoco vienen de Monday; son listas locales
   dentro de la aplicación.
2. **Integración con Slack.** El link de revisión se copia y se pega a mano. No se
   envía solo, ni lo que se comenta por Slack entra automáticamente al formulario.
3. **Integración con Moodle.** Los listados de participantes se descargan del aula
   virtual y se cargan a mano como archivo, uno por país.
4. **Envío directo desde la aplicación.** La idea es que la aplicación envíe los
   comunicados por su cuenta, desde info@adipa.cl. En esta versión no hay conexión
   con Gmail ni con Google Workspace: el envío queda registrado, pero el correo
   sale desde Yamm con el CSV exportado.
5. **Redacción con un modelo de lenguaje real.** El borrador se arma con
   plantillas deterministas. No hay llamada a ningún servicio de IA.
6. **Gestión de usuarios y permisos.** No hay cuentas ni contraseñas. Cualquiera
   con la dirección entra, y cualquiera con el link de revisión puede aprobar. Hoy
   la usa una sola persona; cuando se sume otra, deja de ser opcional.
7. **Reasignar el validador.** La aplicación asigna el validador por regla. Si el
   asignado no está y aprueba otro con el mismo link, la aprobación vale, pero el
   historial registra el nombre del asignado y no el de quien aprobó.
8. **Historial y analítica en el tiempo.** Se ve qué se envió y cuándo, pero no
   hay reportes de volumen, de tiempos de aprobación ni de tasas de apertura.
9. **Edición del comunicado por parte del validador.** Solo puede aprobar o dejar
   observaciones en texto.
10. **Formato enriquecido en el correo.** El comunicado sale como texto plano, que
    es lo que se pega en Yamm. La vista previa muestra cómo se vería con formato,
    pero ese formato no viaja.

---

## Retrospectiva

### 1. ¿Qué pregunta de Claude te hizo dar cuenta de algo que no tenías claro del flujo?

La pregunta sobre **cómo se distingue a un profesor de un estudiante en el Excel**.
Di por hecho que había una columna de rol. Al revisar el archivo real apareció que
no existe: solo trae nombre, apellidos, correo y grupos, con la columna de grupos
vacía en las 44 filas.

Eso me obligó a precisar algo que sabía pero no había dicho: los Excel que
descargamos traen solo estudiantes, nunca profesores, monitores ni gestores. El
filtro por rol quedó implementado como resguardo, pero el riesgo real no estaba
ahí: estaba en **subir una base al país equivocado**, que es justamente uno de los
errores que hoy ocurren. Por eso la aplicación pide el país antes de cargar cada
archivo y muestra los totales por país antes de enviar.

La segunda pregunta que movió algo fue la de **los horarios por país**. Al
responderla me di cuenta de que no son un dato fijo que se pueda guardar una vez:
cambian dos veces al año cuando Chile entra y sale del horario de verano, y con
ellos cambian las equivalencias de Argentina, México y Colombia. Por eso la
aplicación sugiere pero nunca impone, y guarda el texto exacto de cada comunicado
en vez de una fórmula.

### 2. ¿Qué diferencia hubo entre tu mapa inicial y lo que terminaste construyendo?

Me enredé un poco en los pasos. Al seguir la lógica del flujo iban apareciendo
varios puntos intermedios que el mapa inicial no tenía:

- **Una clase pasó a ser varias.** El mapa tenía una fecha original y una fecha
  nueva. En la práctica, mover la clase 2 arrastra la 3 y la 4, cada una a su
  propia fecha. La aplicación terminó con una lista de clases afectadas y un
  calendario clase por clase dentro del comunicado.
- **"Jefatura" pasó a ser tres personas y una regla.** El mapa decía "se valida
  con jefatura". Al aterrizarlo aparecieron tres validadores según el tipo de
  programa, más la figura del caso sensible, donde Nicole reemplaza a Edwin en vez
  de sumarse.
- **El país pasó a ser un eje del comunicado, no solo del archivo.** En el mapa
  los países servían para juntar bases. Terminaron definiendo el horario que ve
  cada estudiante.
- **El tipo de comunicado se partió en dos ejes.** El mapa tenía un solo selector.
  Terminaron siendo dos independientes: tipo de programa —que define qué datos se
  piden y quién valida— y tipo de comunicado —que define la plantilla—.

Si partiera de nuevo, cambiaría el orden: primero identificaría de manera puntual
cada error que hoy ocurre, haría prácticas con casos reales, y recién después
armaría el mapa.

### 3. Si tuvieras que hacer este flujo de verdad para ADIPA, ¿cuál sería el primer riesgo o pieza faltante?

**El primer riesgo es que no hay control de acceso.** Hoy la aplicación la uso solo
yo, pero más adelante la va a usar otra persona del equipo, y maneja correos de
estudiantes y aprobaciones institucionales. Tal como está, cualquiera con la
dirección puede entrar y descargar el CSV completo, y cualquiera con el link de
revisión puede aprobar a nombre de otro. En la versión desplegada lo mitigamos
usando solo datos inventados, pero eso es un parche, no una solución.

**La primera pieza faltante es la conexión con Monday.** Es donde nace el pedido, y
hoy se vuelve a escribir a mano en el formulario: cada transcripción es una
oportunidad de error. Después vendrían Slack, Moodle, Gmail —para que la
aplicación envíe directo desde info@adipa.cl— y al final la IA.

### Cierre

Tomar un proyecto así requiere tiempo y paciencia, pero es una tarea muy
entretenida, que ayuda a aprender muchísimas cosas y a innovar.
