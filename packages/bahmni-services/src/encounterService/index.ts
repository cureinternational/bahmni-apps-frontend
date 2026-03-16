export {
  getActiveVisit,
  getPatientVisits,
  getVisits,
  getFormsDataByEncounterUuid,
  createOrderFulfillmentEncounter,
} from './encounterService';

export { shouldEnableEncounterFilter } from './encounterFilterUtils';

export {
  type FormsEncounter,
  type OrderFulfillmentEncounterParams,
} from './models';
