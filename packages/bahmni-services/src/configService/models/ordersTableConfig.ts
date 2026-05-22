/**
 * Represents a single column configuration
 */
export interface OrderColumnConfig {
  key: string;
  header: string;
  translationKey: string;
  visible: boolean;
  sortable: boolean;
}

/**
 * Represents a single patient detail field configuration
 */
export interface PatientDetailField {
  key: string;
  label: string;
  translationKey: string;
}

/**
 * Represents eligibility criteria for displaying observation fields in the order slider
 */
export interface SliderObservationEligibility {
  gender?: string;
  minAge?: number;
}

/**
 * Represents a configurable observation field to display in the order fulfillment slider
 */
export interface SliderObservationField {
  conceptName: string;
  type: 'days_since_date' | 'text';
  translationKey: string;
  warningThreshold?: number;
  conditionConceptName?: string;
  conditionPositiveValue?: string;
  eligibility?: SliderObservationEligibility;
  tabLabels?: string[];
}

/**
 * Represents the orders table configuration from app.json
 * Contains table-specific settings like column configurations for default and drug orders
 */
export interface OrdersTableConfig {
  ordersTableColumnHeadersGeneric: OrderColumnConfig[];
  ordersTableColumnHeadersCustom: OrderColumnConfig[];
  manageOrdersPanelPatientDetails?: PatientDetailField[];
  orderStatusesAvailable?: string[];
  orderStatusesPreSelected?: string[];
  fulfillmentEncounterTypeUuid?: string;
  sliderObservationFields?: SliderObservationField[];
}
