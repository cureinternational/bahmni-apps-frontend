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
  'Ready for Pickup': 'ready',
};

/**
 * Maps FHIR task status values (lowercase) to UI order statuses for display.
 * SQL returns ft_latest.status lowercased via LOWER().
 */
export const DB_FULFILLER_STATUS_TO_UI_STATUS: Record<string, OrderStatus> = {
  requested: 'Acknowledged',
  accepted: 'In Progress',
  completed: 'Completed',
  rejected: 'New',
  ready: 'Ready for Pickup',
};

/**
 * Default status pre-populated in the slider when a 'New' order is opened.
 * 'New' orders require immediate acknowledgement, so the slider auto-selects
 * 'Acknowledged' to prompt the user to confirm they have seen the order.
 */
export const DEFAULT_STATUS_FOR_NEW_ORDER: OrderStatus = 'Acknowledged';
