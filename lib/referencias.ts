import type { TipoKey } from "./tipos";

/**
 * Comunicados enviados anteriormente, uno por tipo.
 * Reemplazan la búsqueda manual en la bandeja de enviados: son el ejemplo
 * de tono y estructura que la redacción asistida toma como modelo.
 */

export type Referencia = {
  titulo: string;
  asunto: string;
  cuerpo: string;
};

export const FIRMA = "Cordialmente,\nCoordinación de Experiencia del Cliente";

export const REFERENCIAS: Record<TipoKey, Referencia> = {
  reprogramacion: {
    titulo: "Reprogramación · Taller de Innovación · 12 de junio",
    asunto: "Reprogramación de la clase de Taller de Innovación del jueves 12 de junio",
    cuerpo: `Estimado/a estudiante:

Junto con saludar, le informamos que la clase de Taller de Innovación, programada para el jueves 12 de junio a las 19:00 hrs, ha sido reprogramada para el martes 17 de junio en el mismo horario, de 19:00 a 21:30 hrs (hora Chile), a través de Zoom.

El enlace de acceso es el mismo que utiliza habitualmente y lo encontrará disponible en su aula virtual.

Agradecemos su comprensión y quedamos atentos a cualquier consulta a través de este mismo correo.

${FIRMA}`,
  },
  cambio_docente: {
    titulo: "Cambio de docente · Derecho Laboral · 3 de abril",
    asunto: "Cambio de docente en la asignatura Derecho Laboral",
    cuerpo: `Estimado/a estudiante:

Junto con saludar, le informamos que a partir del lunes 3 de abril la asignatura Derecho Laboral será dictada por la docente Andrea Lillo, quien reemplaza al docente Luis Cárdenas.

Andrea Lillo es abogada de la Universidad de Chile y cuenta con amplia experiencia en relaciones laborales. La planificación, las evaluaciones y el horario de la asignatura se mantienen sin cambios.

Quedamos atentos a cualquier consulta a través de este mismo correo.

${FIRMA}`,
  },
  suspension: {
    titulo: "Suspensión · Estadística Aplicada · 8 de mayo",
    asunto: "Suspensión de la clase de Estadística Aplicada del miércoles 8 de mayo",
    cuerpo: `Estimado/a estudiante:

Junto con saludar, le informamos que la clase de Estadística Aplicada del miércoles 8 de mayo, de 19:00 a 21:30 hrs, ha sido suspendida por motivos de fuerza mayor.

La sesión se recuperará el sábado 11 de mayo de 10:00 a 12:30 hrs, por la misma vía de siempre. El material de la unidad quedará disponible en el aula virtual durante esta semana.

Lamentamos los inconvenientes y agradecemos su comprensión.

${FIRMA}`,
  },
  cambio_horario: {
    titulo: "Cambio de horario · Finanzas Corporativas · 1 de agosto",
    asunto: "Nuevo horario de la asignatura Finanzas Corporativas",
    cuerpo: `Estimado/a estudiante:

Junto con saludar, le informamos que a partir del lunes 1 de agosto la asignatura Finanzas Corporativas cambia su horario. Las sesiones, que se dictaban de 18:30 a 21:00 hrs, se realizarán de 19:30 a 22:00 hrs los días lunes y miércoles.

El cambio responde a la disponibilidad de la docente y se mantiene por el resto del semestre. El lugar de conexión y los enlaces de acceso no cambian.

Quedamos atentos a cualquier consulta a través de este mismo correo.

${FIRMA}`,
  },
  reunion_informativa: {
    titulo: "Reunión informativa · Acreditación ADOS-2 · 5 de marzo",
    asunto: "Reunión informativa de la Acreditación ADOS-2 · miércoles 5 de marzo",
    cuerpo: `Estimado/a estudiante:

Junto con saludar, le invitamos a la reunión informativa de la Acreditación ADOS-2, que se realizará el miércoles 5 de marzo.

Horario según su país:
- Chile: 18:00 a 19:00 hrs
- Argentina: 18:00 a 19:00 hrs
- México: 15:00 a 16:00 hrs
- Colombia: 16:00 a 17:00 hrs

En esta sesión revisaremos la organización del programa, la modalidad de trabajo y los aspectos prácticos que necesita conocer antes de comenzar. Habrá un espacio final para responder sus consultas.

Los datos de conexión son los siguientes:
- Enlace: https://zoom.us/j/00000000000
- ID de reunión: 000 0000 0000
- Código de acceso: 123456

Le recomendamos conectarse unos minutos antes del inicio. Quedamos atentos a cualquier consulta a través de este mismo correo.

${FIRMA}`,
  },
  aviso_general: {
    titulo: "Aviso general · Mantención del aula virtual · 22 de febrero",
    asunto: "Mantención programada del aula virtual el domingo 22 de febrero",
    cuerpo: `Estimado/a estudiante:

Junto con saludar, le informamos que el domingo 22 de febrero, entre las 08:00 y las 14:00 hrs, el aula virtual no estará disponible por una mantención programada.

Le recomendamos descargar con anticipación los materiales que necesite durante ese día. Las actividades con fecha de entrega en ese período fueron extendidas hasta el lunes 23 de febrero a las 23:59 hrs.

Agradecemos su comprensión.

${FIRMA}`,
  },
};
