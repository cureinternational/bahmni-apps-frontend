export {
  getClinicalConfig,
  getDashboardConfig,
  getMedicationConfig,
  getRegistrationConfig,
  getOrdersConfig,
} from './configService';
export {
  type ClinicalConfig,
  type DashboardConfig,
  type MedicationJSONConfig,
  type DashboardSectionConfig,
  type ControlConfig,
  type Dashboard,
  type Frequency,
  type RegistrationConfig,
  type PatientSearchConfig,
  type PatientSearchField,
  type PatientInformationConfig,
  type SearchActionConfig,
  type AppExtensionConfig,
  type ExtensionPoint,
} from './models';
export {
  type OrdersConfig,
  type OrderExtension,
  type OrderExtensionParams,
} from './models/ordersConfig';
