import type { Contacto, Solicitud } from "../modelo";
import { solicitudNueva } from "../modelo";
import type { PaisKey } from "../catalogos";

/**
 * Datos de demostración.
 *
 * Son inventados de principio a fin: los nombres no corresponden a personas
 * reales y los correos usan dominios `ejemplo.*`, que no existen. Sirven para
 * recorrer el flujo completo en el despliegue de prueba sin exponer un solo
 * dato de estudiantes.
 */

const FIRMA = "Cordialmente,\nCoordinación de Experiencia del Cliente";

/** Fecha fija para que el historial se vea coherente en cualquier momento. */
const hace = (dias: number, horas = 0): string =>
  new Date(Date.now() - dias * 86_400_000 - horas * 3_600_000).toISOString();

type FilaDemo = [nombre: string, apellidos: string, correo: string, rol: string];

function contactos(archivo: string, paises: PaisKey[], filas: FilaDemo[]): Contacto[] {
  return filas.map(([nombre, apellidos, correo, rol], i) => ({
    id: `${archivo}#${i}`,
    nombre,
    apellidos,
    correo,
    grupos: i % 2 === 0 ? "Grupo A" : "Grupo B",
    rol,
    paises,
    origen: archivo,
  }));
}

const ESTUDIANTES_CL: FilaDemo[] = [
  ["Antonia", "Pérez Soto", "antonia.perez@ejemplo.cl", "Estudiante"],
  ["Benjamín", "Riquelme Díaz", "benjamin.riquelme@ejemplo.cl", "Estudiante"],
  ["Catalina", "Muñoz Vera", "catalina.munoz@ejemplo.cl", "Estudiante"],
  ["Diego", "Salazar Ríos", "diego.salazar@ejemplo.cl", "Estudiante"],
  ["Elena", "Tapia Bravo", "elena.tapia@ejemplo.cl", "Estudiante"],
  // Los tres siguientes existen para que la lista de excluidos muestre algo.
  ["Marcela", "Ibáñez Rojas", "marcela.ibanez@ejemplo.cl", "Profesor"],
  ["Rosa", "Delgado Pinto", "rosa.delgado@ejemplo.cl", "Gestor"],
  ["Ana", "Rojas Leiva", "ana.rojas-ejemplo.cl", "Estudiante"],
];

const ESTUDIANTES_AR: FilaDemo[] = [
  ["Martín", "Gómez Ruiz", "martin.gomez@ejemplo.ar", "Estudiante"],
  ["Sofía", "Benítez Luna", "sofia.benitez@ejemplo.ar", "Estudiante"],
  ["Joaquín", "Ferreyra Paz", "joaquin.ferreyra@ejemplo.ar", "Estudiante"],
  // Mismo correo que en Chile: aparece como duplicado.
  ["Antonia", "Pérez Soto", "antonia.perez@ejemplo.cl", "Estudiante"],
];

const ESTUDIANTES_MX: FilaDemo[] = [
  ["Regina", "Ortega Lira", "regina.ortega@ejemplo.mx", "Estudiante"],
  ["Emiliano", "Cortés Nava", "emiliano.cortes@ejemplo.mx", "Estudiante"],
  ["Ximena", "Vargas Pineda", "ximena.vargas@ejemplo.mx", "Estudiante"],
  ["Santiago", "Beltrán Cruz", "santiago.beltran@ejemplo.mx", "Monitor"],
];

/** Cada llamada devuelve copias nuevas: el almacén las puede modificar sin miedo. */
export function solicitudesDemo(): Solicitud[] {
  const reunion: Solicitud = {
    ...solicitudNueva("demo-reunion-informativa", "reunion_informativa", "postitulo"),
    creada: hace(2),
    actualizada: hace(0, 3),
    paso: 3,
    alcance: "inicio",
    clases: [],
    paises: ["cl", "ar", "mx"],
    horarios: {
      cl: "18:00 a 19:30 hrs",
      ar: "18:00 a 19:30 hrs",
      mx: "15:00 a 16:30 hrs",
    },
    solicitante: "Coordinación Académica",
    datos: {
      nombrePrograma:
        "Postítulo de Especialización en Trauma Complejo. La Complejidad del Trauma Complejo a través de las trayectorias vitales: Un modelo de complejidad integral de comprensión, evaluación e intervención",
      fechaSesion: "2026-09-24",
      motivo: "Primera cohorte del programa, conviene alinear expectativas antes de partir.",
    },
    zoomSeMantiene: false,
    zoom: {
      link: "https://zoom.us/j/00000000001",
      id: "000 0000 0001",
      codigo: "482913",
    },
    asunto: "Reunión informativa del Postítulo de Especialización en Trauma Complejo · jueves 24 de septiembre",
    cuerpo: `Estimado/a estudiante:

Junto con saludar, le invitamos a la reunión informativa del Postítulo de Especialización en Trauma Complejo, que se realizará el jueves 24 de septiembre, en el horario que corresponde a su país.

Horario según su país:
- Chile: 18:00 a 19:30 hrs
- Argentina: 18:00 a 19:30 hrs
- México: 15:00 a 16:30 hrs

En esta sesión revisaremos la organización del programa, la modalidad de trabajo y los aspectos prácticos que necesita conocer antes de comenzar. Habrá un espacio final para responder sus consultas.

Los datos de conexión son los siguientes:
- Enlace: https://zoom.us/j/00000000001
- ID de reunión: 000 0000 0001
- Código de acceso: 482913

Le recomendamos conectarse unos minutos antes del inicio. Quedamos atentos a cualquier consulta a través de este mismo correo.

${FIRMA}`,
    fuente: "Borrador asistido · 09:41",
    estado: "en_revision",
    sensible: true,
    motivoSensibilidad: "Primera cohorte del postítulo; jefatura pidió revisar el tono de la convocatoria.",
    historial: [
      {
        n: 1,
        enviado: hace(0, 3),
        validador: "Nicole Agüero",
        asunto: "Reunión informativa del Postítulo de Especialización en Trauma Complejo · jueves 24 de septiembre",
        cuerpo: "…",
      },
    ],
  };

  const reprogramacion: Solicitud = {
    ...solicitudNueva("demo-reprogramacion", "reprogramacion", "diplomado"),
    creada: hace(5),
    actualizada: hace(1),
    paso: 5,
    clases: [
      { numero: "2", fechaOriginal: "2026-09-17", fechaNueva: "2026-09-24" },
      { numero: "3", fechaOriginal: "2026-09-18", fechaNueva: "2026-09-25" },
    ],
    paises: ["cl", "ar"],
    horarios: { cl: "18:00 a 22:00 hrs", ar: "18:00 a 22:00 hrs" },
    solicitante: "Equipo Académico",
    datos: {
      asignatura:
        "Diplomado en Abordaje Multidisciplinario de los Trastornos de la Conducta Alimentaria (TCA)",
      docente: "Mg. Ps. Daniela Ibacache",
      moduloNumero: "3",
      moduloNombre: "Intervención en crisis",
      motivo: "Licencia médica de la docente.",
    },
    asunto: "Reprogramación de las clases del Diplomado en TCA del jueves 17 de septiembre",
    cuerpo: `Estimado/a estudiante:

Junto con saludar, le informamos que la clase de Diplomado en TCA (módulo 3, Intervención en crisis · clases 2 y 3), programada para el jueves 17 de septiembre, ha sido reprogramada para el jueves 24 de septiembre, en el horario que corresponde a su país.

Horario según su país:
- Chile: 18:00 a 22:00 hrs
- Argentina: 18:00 a 22:00 hrs

La sesión se mantiene a cargo de Mg. Ps. Daniela Ibacache. El enlace de acceso es el mismo que utiliza habitualmente y lo encontrará disponible en su aula virtual.

Agradecemos su comprensión ante una situación de fuerza mayor. Quedamos atentos a cualquier consulta a través de este mismo correo.

${FIRMA}`,
    fuente: "Borrador asistido · 16:20",
    estado: "aprobado",
    historial: [
      {
        n: 1,
        enviado: hace(3),
        respondido: hace(3),
        respuesta: "observaciones",
        comentario: "Agrega una disculpa por el cambio de fecha.",
        validador: "Edwin Hernández",
        asunto: "Reprogramación de las clases del Diplomado en TCA",
        cuerpo: "…",
      },
      {
        n: 2,
        enviado: hace(2),
        respondido: hace(1),
        respuesta: "aprobado",
        validador: "Edwin Hernández",
        asunto: "Reprogramación de las clases del Diplomado en TCA del jueves 17 de septiembre",
        cuerpo: "…",
      },
    ],
    archivos: [
      {
        id: "demo-archivo-cl",
        nombre: "participantes-chile.csv",
        paises: ["cl"],
        filas: ESTUDIANTES_CL.length,
        cargado: hace(1),
      },
      {
        id: "demo-archivo-ar",
        nombre: "participantes-argentina.csv",
        paises: ["ar"],
        filas: ESTUDIANTES_AR.length,
        cargado: hace(1),
      },
    ],
    contactos: [
      ...contactos("participantes-chile.csv", ["cl"], ESTUDIANTES_CL),
      ...contactos("participantes-argentina.csv", ["ar"], ESTUDIANTES_AR),
    ],
  };

  const cambioDocente: Solicitud = {
    ...solicitudNueva("demo-cambio-docente", "cambio_docente", "curso"),
    creada: hace(0, 1),
    actualizada: hace(0, 1),
    paso: 1,
    alcance: "inicio",
    clases: [],
    paises: ["cl"],
    solicitante: "Coordinación Académica",
    datos: {
      asignatura:
        "Neurociencias de los vínculos afectivos y las relaciones de pareja: claves para la evaluación e intervención clínica",
      docenteSaliente: "Mg. Ps. Jonathan Martínez",
      docenteEntrante: "Mg. Ps. Nicolás Lorenzini",
      fechaEfectiva: "2026-09-21",
    },
  };

  const suspension: Solicitud = {
    ...solicitudNueva("demo-suspension", "suspension", "acreditacion"),
    creada: hace(12),
    actualizada: hace(8),
    paso: 6,
    clases: [{ numero: "5", fechaOriginal: "2026-08-28", fechaNueva: "" }],
    paises: ["mx"],
    horarios: { mx: "15:00 a 19:00 hrs" },
    solicitante: "Coordinación Académica",
    datos: {
      asignatura: "Acreditación Oficial Clínica Internacional ADOS-2",
      docente: "Mg. Ps. Hermann Thomas Ehrenfeld",
      motivoPublico: "un corte de energía programado en la sede",
      recuperacion: "La sesión se recupera el sábado 5 de septiembre de 10:00 a 14:00 hrs.",
      motivo: "Aviso de la administradora del edificio con 24 horas de anticipación.",
    },
    asunto: "Suspensión de la clase de Acreditación Oficial Clínica Internacional ADOS-2 del viernes 28 de agosto",
    cuerpo: `Estimado/a estudiante:

Junto con saludar, le informamos que la clase de Acreditación Oficial Clínica Internacional ADOS-2 del viernes 28 de agosto, de 15:00 a 19:00 hrs (hora de México), ha sido suspendida por un corte de energía programado en la sede.

La sesión se recupera el sábado 5 de septiembre de 10:00 a 14:00 hrs.

Lamentamos los inconvenientes y agradecemos su comprensión.

Quedamos atentos a cualquier consulta a través de este mismo correo.

${FIRMA}`,
    fuente: "Borrador asistido · 11:05",
    estado: "aprobado",
    historial: [
      {
        n: 1,
        enviado: hace(10),
        respondido: hace(10),
        respuesta: "aprobado",
        validador: "Nicole Agüero",
        asunto: "Suspensión de la clase de Acreditación Oficial Clínica Internacional ADOS-2 del viernes 28 de agosto",
        cuerpo: "…",
      },
    ],
    archivos: [
      {
        id: "demo-archivo-mx",
        nombre: "participantes-mexico.csv",
        paises: ["mx"],
        filas: ESTUDIANTES_MX.length,
        cargado: hace(9),
      },
    ],
    contactos: contactos("participantes-mexico.csv", ["mx"], ESTUDIANTES_MX),
    envio: { enviado: true, fecha: hace(8), total: 3 },
  };

  return [reunion, reprogramacion, cambioDocente, suspension];
}
