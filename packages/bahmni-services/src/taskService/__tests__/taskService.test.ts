import { post } from '../../api';
import { FHIR_TASK_URL } from '../constants';
import { createTask } from '../taskService';

jest.mock('../../api');

describe('taskService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates a task with all fields (status, notes, owner, encounter, and patient)', async () => {
    (post as jest.Mock).mockResolvedValueOnce({});

    await createTask('order-uuid', 'requested', {
      notes: 'Patient ready',
      ownerUuid: 'provider-uuid',
      encounterUuid: 'encounter-uuid',
      patientUuid: 'patient-uuid',
    });

    expect(post).toHaveBeenCalledWith(FHIR_TASK_URL, {
      resourceType: 'Task',
      intent: 'order',
      status: 'requested',
      basedOn: [{ reference: 'ServiceRequest/order-uuid' }],
      for: { reference: 'Patient/patient-uuid' },
      note: [{ text: 'Patient ready' }],
      owner: { reference: 'Practitioner/provider-uuid' },
      encounter: { reference: 'Encounter/encounter-uuid' },
    });
  });

  it('creates a task with patient reference only', async () => {
    (post as jest.Mock).mockResolvedValueOnce({});

    await createTask('order-uuid', 'requested', {
      patientUuid: 'patient-uuid',
    });

    expect(post).toHaveBeenCalledWith(FHIR_TASK_URL, {
      resourceType: 'Task',
      intent: 'order',
      status: 'requested',
      basedOn: [{ reference: 'ServiceRequest/order-uuid' }],
      for: { reference: 'Patient/patient-uuid' },
    });
    const payload = (post as jest.Mock).mock.calls[0][1];
    expect(payload.note).toBeUndefined();
    expect(payload.owner).toBeUndefined();
    expect(payload.encounter).toBeUndefined();
  });

  it('creates a task with notes and owner (no patient, no encounter)', async () => {
    (post as jest.Mock).mockResolvedValueOnce({});

    await createTask('order-uuid', 'accepted', {
      notes: 'In progress',
      ownerUuid: 'provider-uuid',
    });

    expect(post).toHaveBeenCalledWith(FHIR_TASK_URL, {
      resourceType: 'Task',
      intent: 'order',
      status: 'accepted',
      basedOn: [{ reference: 'ServiceRequest/order-uuid' }],
      note: [{ text: 'In progress' }],
      owner: { reference: 'Practitioner/provider-uuid' },
    });
    const payload = (post as jest.Mock).mock.calls[0][1];
    expect(payload.for).toBeUndefined();
    expect(payload.encounter).toBeUndefined();
  });

  it('creates a task with encounter reference', async () => {
    (post as jest.Mock).mockResolvedValueOnce({});

    await createTask('order-uuid', 'completed', {
      encounterUuid: 'encounter-uuid',
    });

    expect(post).toHaveBeenCalledWith(FHIR_TASK_URL, {
      resourceType: 'Task',
      intent: 'order',
      status: 'completed',
      basedOn: [{ reference: 'ServiceRequest/order-uuid' }],
      encounter: { reference: 'Encounter/encounter-uuid' },
    });
    const payload = (post as jest.Mock).mock.calls[0][1];
    expect(payload.for).toBeUndefined();
    expect(payload.note).toBeUndefined();
    expect(payload.owner).toBeUndefined();
  });

  it('creates a task with status only (no optional fields)', async () => {
    (post as jest.Mock).mockResolvedValueOnce({});

    await createTask('order-uuid', 'requested');

    expect(post).toHaveBeenCalledWith(FHIR_TASK_URL, {
      resourceType: 'Task',
      intent: 'order',
      status: 'requested',
      basedOn: [{ reference: 'ServiceRequest/order-uuid' }],
    });
    const payload = (post as jest.Mock).mock.calls[0][1];
    expect(payload.for).toBeUndefined();
    expect(payload.note).toBeUndefined();
    expect(payload.owner).toBeUndefined();
    expect(payload.encounter).toBeUndefined();
  });

  it('propagates errors from the API', async () => {
    (post as jest.Mock).mockRejectedValueOnce(new Error('API Error'));

    await expect(createTask('order-uuid', 'requested')).rejects.toThrow(
      'API Error',
    );
  });
});
