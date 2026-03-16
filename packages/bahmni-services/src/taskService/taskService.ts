import { post } from '../api';
import { FHIR_TASK_URL } from './constants';
import { CreateTaskOptions, CreateTaskPayload } from './models';

/**
 * Creates a FHIR Task to record fulfillment action on an order.
 * The backend persists fulfiller_status and fulfiller_comment in the orders table.
 *
 * @param orderUuid - The UUID of the order (ServiceRequest) being acted upon
 * @param fhirStatus - FHIR Task status string (e.g. 'requested', 'accepted', 'completed')
 * @param options - Optional fields: notes, ownerUuid, encounterUuid, patientUuid
 */
export async function createTask(
  orderUuid: string,
  fhirStatus: string,
  options: CreateTaskOptions = {},
): Promise<void> {
  const { notes, ownerUuid, encounterUuid, patientUuid } = options;

  const payload: CreateTaskPayload = {
    resourceType: 'Task',
    intent: 'order',
    status: fhirStatus,
    basedOn: [{ reference: `ServiceRequest/${orderUuid}` }],
  };

  if (patientUuid) {
    payload.for = { reference: `Patient/${patientUuid}` };
  }

  if (notes) {
    payload.note = [{ text: notes }];
  }

  if (ownerUuid) {
    payload.owner = { reference: `Practitioner/${ownerUuid}` };
  }

  if (encounterUuid) {
    payload.encounter = { reference: `Encounter/${encounterUuid}` };
  }

  await post(FHIR_TASK_URL, payload);
}
