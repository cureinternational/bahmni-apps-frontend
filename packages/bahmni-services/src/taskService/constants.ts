export const FHIR_TASK_URL = '/openmrs/ws/fhir2/R4/Task';

export const TASKS_BY_BASED_ON_URL = (basedOnRefs: string[]) =>
  `${FHIR_TASK_URL}?based-on=${basedOnRefs.join(',')}&_include=Task:owner&_count=${basedOnRefs.length}`;
