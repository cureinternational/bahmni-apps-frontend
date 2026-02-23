import { OrderStatus } from '../models/orderFulfillment';

/**
 * Maps UI order statuses to FHIR Task status values for saving.
 * If a selected UI status has no entry here, the save is blocked.
 */
export const UI_STATUS_TO_FHIR_TASK_STATUS: Partial<
  Record<OrderStatus, string>
> = {
  New: 'requested',
  Acknowledged: 'requested',
  'In Progress': 'accepted',
  Completed: 'completed',
};

/**
 * Maps DB fulfiller_status values to UI order statuses for display.
 * Null/missing DB values are handled by the caller (default: 'New').
 */
export const DB_FULFILLER_STATUS_TO_UI_STATUS: Record<string, OrderStatus> = {
  RECEIVED: 'Acknowledged',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
  EXCEPTION: 'New',
};
