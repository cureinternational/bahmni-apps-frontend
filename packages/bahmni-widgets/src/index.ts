import '@bahmni/design-system/styles';

// Widget Components
export { PatientDetails } from './patientDetails';
export { AllergiesTable } from './allergies';
export { ConditionsTable } from './conditions';
export { DiagnosesTable } from './diagnoses';
export { MedicationsTable } from './medications';
export { RadiologyInvestigationTable } from './radiologyInvestigation';
export { LabInvestigation } from './labinvestigation';
export { SearchPatient } from './searchPatient';
export { VitalFlowSheet } from './vitalFlowSheet';
export { GenericServiceRequestTable } from './genericServiceRequest';
export { PatientProgramsTable } from './patientPrograms';

export {
  CommandPaletteProvider,
  useCommandPalette,
  type CommandPaletteContextType,
  type AnnotationSearchType,
  type NavItem,
  type PatientAction,
  type PatientActionContext,
  type PatientFieldKey,
  type PatientFieldsConfig,
  type SearchAnnotation,
  type TriggerConfig,
} from './commandPalette';

// Notification System
export {
  useNotification,
  NotificationProvider,
  NotificationServiceComponent,
} from './notification';

// Hooks
export { useDebounce } from './commandPalette/useDebounce';
export { usePatientUUID } from './hooks/usePatientUUID';
export { useUserPrivilege } from './userPrivileges/useUserPrivilege';

// User Privileges
export { UserPrivilegeProvider } from './userPrivileges/UserPrivilegeProvider';

// Active Practitioner
export {
  ActivePractitionerProvider,
  useActivePractitioner,
  ActivePractitionerContext,
  type ActivePractitionerContextType,
} from './activePractitioner';

// Widget Registry
export {
  registerWidget,
  getWidget,
  getWidgetConfig,
  hasWidget,
  getAllWidgetTypes,
  getAllWidgetConfigs,
  resetWidgetRegistry,
  type WidgetConfig,
} from './registry';
