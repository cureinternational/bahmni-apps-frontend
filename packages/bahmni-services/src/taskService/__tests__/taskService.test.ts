import { post } from '../../api';
import { FHIR_TASK_URL } from '../constants';
import { createTask } from '../taskService';

jest.mock('../../api');

describe('taskService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates a task with all fields (status, notes, and owner)', async () => {
    (post as jest.Mock).mockResolvedValueOnce({});

    await createTask(
      'order-uuid',
      'requested',
      'Patient ready',
      'provider-uuid',
    );

    expect(post).toHaveBeenCalledWith(FHIR_TASK_URL, {
      resourceType: 'Task',
      intent: 'order',
      status: 'requested',
      basedOn: [{ reference: 'ServiceRequest/order-uuid' }],
      note: [{ text: 'Patient ready' }],
      owner: { reference: 'Practitioner/provider-uuid' },
    });
  });

  it('creates a task with notes only (no owner)', async () => {
    (post as jest.Mock).mockResolvedValueOnce({});

    await createTask('order-uuid', 'accepted', 'In progress', undefined);

    expect(post).toHaveBeenCalledWith(FHIR_TASK_URL, {
      resourceType: 'Task',
      intent: 'order',
      status: 'accepted',
      basedOn: [{ reference: 'ServiceRequest/order-uuid' }],
      note: [{ text: 'In progress' }],
    });
    const payload = (post as jest.Mock).mock.calls[0][1];
    expect(payload.owner).toBeUndefined();
  });

  it('creates a task with owner only (no notes)', async () => {
    (post as jest.Mock).mockResolvedValueOnce({});

    await createTask('order-uuid', 'completed', undefined, 'provider-uuid');

    expect(post).toHaveBeenCalledWith(FHIR_TASK_URL, {
      resourceType: 'Task',
      intent: 'order',
      status: 'completed',
      basedOn: [{ reference: 'ServiceRequest/order-uuid' }],
      owner: { reference: 'Practitioner/provider-uuid' },
    });
    const payload = (post as jest.Mock).mock.calls[0][1];
    expect(payload.note).toBeUndefined();
  });

  it('creates a task with status only (no notes, no owner)', async () => {
    (post as jest.Mock).mockResolvedValueOnce({});

    await createTask('order-uuid', 'requested');

    expect(post).toHaveBeenCalledWith(FHIR_TASK_URL, {
      resourceType: 'Task',
      intent: 'order',
      status: 'requested',
      basedOn: [{ reference: 'ServiceRequest/order-uuid' }],
    });
    const payload = (post as jest.Mock).mock.calls[0][1];
    expect(payload.note).toBeUndefined();
    expect(payload.owner).toBeUndefined();
  });

  it('propagates errors from the API', async () => {
    (post as jest.Mock).mockRejectedValueOnce(new Error('API Error'));

    await expect(createTask('order-uuid', 'requested')).rejects.toThrow(
      'API Error',
    );
  });
});
