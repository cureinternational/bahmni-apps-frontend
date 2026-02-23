import { post } from '../api';
import { FHIR_TASK_URL } from './constants';
import { CreateTaskPayload } from './models';

/**
 * Creates a FHIR Task to record fulfillment action on an order.
 * The backend persists fulfiller_status and fulfiller_comment in the orders table.
 *
 * @param orderUuid - The UUID of the order (ServiceRequest) being acted upon
 * @param fhirStatus - FHIR Task status string (e.g. 'requested', 'accepted', 'completed')
 * @param notes - Optional fulfiller comment text
 * @param ownerUuid - Optional provider UUID to set as the task owner
 */
export async function createTask(
  orderUuid: string,
  fhirStatus: string,
  notes?: string,
  ownerUuid?: string,
): Promise<void> {
  const payload: CreateTaskPayload = {
    resourceType: 'Task',
    intent: 'order',
    status: fhirStatus,
    basedOn: [{ reference: `ServiceRequest/${orderUuid}` }],
  };

  if (notes) {
    payload.note = [{ text: notes }];
  }

  if (ownerUuid) {
    payload.owner = { reference: `Practitioner/${ownerUuid}` };
  }

  await post(FHIR_TASK_URL, payload);
}
