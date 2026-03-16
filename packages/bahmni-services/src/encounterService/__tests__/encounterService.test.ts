import { get, post } from '../../api';
import {
  getPatientVisits,
  getVisits,
  getActiveVisit,
  getFormsDataByEncounterUuid,
  createOrderFulfillmentEncounter,
} from '../../encounterService';
import {
  mockVisitBundle,
  mockActiveVisit,
  mockFormsEncounter,
} from '../__mocks__/mocks';
import {
  PATIENT_VISITS_URL,
  BAHMNI_ENCOUNTER_URL,
  CONSULTATION_BUNDLE_URL,
} from '../constants';

jest.mock('../../api');
const mockedGet = get as jest.MockedFunction<typeof get>;
const mockedPost = post as jest.MockedFunction<typeof post>;

Object.defineProperty(globalThis, 'crypto', {
  value: { randomUUID: jest.fn(() => 'test-uuid') },
  writable: true,
});

const baseEncounterParams = {
  patientUuid: 'patient-uuid-1',
  visitUuid: 'visit-uuid-1',
  practitionerUuid: 'practitioner-uuid-1',
  locationUuid: 'location-uuid-1',
  encounterTypeUuid: 'encounter-type-uuid-1',
};

describe('encounterService', () => {
  const patientUUID = '02f47490-d657-48ee-98e7-4c9133ea168b';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getPatientVisits', () => {
    it('should fetch visits from the correct endpoint', async () => {
      mockedGet.mockResolvedValueOnce(mockVisitBundle);

      await getPatientVisits(patientUUID);

      expect(mockedGet).toHaveBeenCalledWith(PATIENT_VISITS_URL(patientUUID));
    });

    it('should return the encounter bundle', async () => {
      mockedGet.mockResolvedValueOnce(mockVisitBundle);

      const result = await getPatientVisits(patientUUID);

      expect(result).toEqual(mockVisitBundle);
    });
  });

  describe('getEncounters', () => {
    it('should extract encounters from the bundle', async () => {
      mockedGet.mockResolvedValueOnce(mockVisitBundle);

      const encounters = await getVisits(patientUUID);

      expect(encounters).toEqual(
        mockVisitBundle.entry.map((entry) => entry.resource),
      );
    });

    it('should return empty array if no encounters are found', async () => {
      mockedGet.mockResolvedValueOnce({ entry: undefined });

      const encounters = await getVisits(patientUUID);

      expect(encounters).toEqual([]);
    });
  });

  describe('getActiveVisit', () => {
    it('should return the active visit', async () => {
      mockedGet.mockResolvedValueOnce(mockVisitBundle);

      const activeVisit = await getActiveVisit(patientUUID);

      expect(activeVisit).toEqual(mockActiveVisit);
    });

    it('should return null if no active visit is found', async () => {
      const bundleWithoutActiveVisit = {
        ...mockVisitBundle,
        entry: mockVisitBundle.entry.map((entry) => ({
          ...entry,
          resource: {
            ...entry.resource,
            period: {
              ...entry.resource.period,
              end: entry.resource.period.end ?? '2025-04-09T10:14:51+00:00',
            },
          },
        })),
      };

      mockedGet.mockResolvedValueOnce(bundleWithoutActiveVisit);

      const activeVisit = await getActiveVisit(patientUUID);

      expect(activeVisit).toBeNull();
    });
  });

  describe('getFormsDataByEncounterUuid', () => {
    const encounterUUID = 'e8c5eeb5-86d9-44d4-b37a-9de74a122a6e';

    it('should fetch forms encounter from the correct endpoint with includeAll=false', async () => {
      mockedGet.mockResolvedValueOnce(mockFormsEncounter);

      await getFormsDataByEncounterUuid(encounterUUID);

      expect(mockedGet).toHaveBeenCalledWith(
        BAHMNI_ENCOUNTER_URL(encounterUUID, false),
      );
    });

    it('should fetch forms encounter from the correct endpoint with includeAll=true', async () => {
      mockedGet.mockResolvedValueOnce(mockFormsEncounter);

      await getFormsDataByEncounterUuid(encounterUUID, true);

      expect(mockedGet).toHaveBeenCalledWith(
        BAHMNI_ENCOUNTER_URL(encounterUUID, true),
      );
    });

    it('should return the forms encounter data', async () => {
      mockedGet.mockResolvedValueOnce(mockFormsEncounter);

      const result = await getFormsDataByEncounterUuid(encounterUUID);

      expect(result).toEqual(mockFormsEncounter);
    });
  });

  describe('createOrderFulfillmentEncounter', () => {
    const createdEncounterUuid = 'created-encounter-uuid-1';

    const mockBundleResponse = {
      resourceType: 'Bundle',
      entry: [
        {
          resource: {
            resourceType: 'Encounter',
            id: createdEncounterUuid,
          },
          response: { status: '201' },
        },
      ],
    };

    it('posts to the ConsultationBundle URL', async () => {
      mockedPost.mockResolvedValueOnce(mockBundleResponse);

      await createOrderFulfillmentEncounter(baseEncounterParams);

      expect(mockedPost).toHaveBeenCalledWith(
        CONSULTATION_BUNDLE_URL,
        expect.objectContaining({ resourceType: 'ConsultationBundle' }),
      );
    });

    it('builds the encounter resource with correct references', async () => {
      mockedPost.mockResolvedValueOnce(mockBundleResponse);

      await createOrderFulfillmentEncounter(baseEncounterParams);

      const postedBundle = (mockedPost as jest.Mock).mock.calls[0][1];
      const encounter = postedBundle.entry[0].resource;
      expect(encounter.subject.reference).toBe(
        `Patient/${baseEncounterParams.patientUuid}`,
      );
      expect(encounter.partOf.reference).toBe(
        `Encounter/${baseEncounterParams.visitUuid}`,
      );
      expect(encounter.participant[0].individual.reference).toBe(
        `Practitioner/${baseEncounterParams.practitionerUuid}`,
      );
      expect(encounter.location[0].location.reference).toBe(
        `Location/${baseEncounterParams.locationUuid}`,
      );
      expect(encounter.type[0].coding[0].code).toBe(
        baseEncounterParams.encounterTypeUuid,
      );
    });

    it('extracts encounter UUID from entry[0].resource.id', async () => {
      mockedPost.mockResolvedValueOnce(mockBundleResponse);

      const result = await createOrderFulfillmentEncounter(baseEncounterParams);

      expect(result).toBe(createdEncounterUuid);
    });

    it('throws when the response has no encounter resource id', async () => {
      mockedPost.mockResolvedValueOnce({
        resourceType: 'Bundle',
        entry: [
          {
            resource: { resourceType: 'Encounter' },
            response: { status: '201' },
          },
        ],
      });

      await expect(
        createOrderFulfillmentEncounter(baseEncounterParams),
      ).rejects.toThrow(
        'Failed to extract encounter UUID from ConsultationBundle response',
      );
    });

    it('throws when the response entry is missing', async () => {
      mockedPost.mockResolvedValueOnce({ resourceType: 'Bundle', entry: [] });

      await expect(
        createOrderFulfillmentEncounter(baseEncounterParams),
      ).rejects.toThrow(
        'Failed to extract encounter UUID from ConsultationBundle response',
      );
    });

    it('propagates API errors', async () => {
      mockedPost.mockRejectedValueOnce(new Error('Network error'));

      await expect(
        createOrderFulfillmentEncounter(baseEncounterParams),
      ).rejects.toThrow('Network error');
    });
  });
});
