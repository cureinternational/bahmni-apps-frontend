import { BundleEntry, Encounter, Bundle, FhirResource } from 'fhir/r4';
import { get, post } from '../api';
import { FHIR_ENCOUNTER_TYPE_CODE_SYSTEM } from '../constants/fhir';
import {
  PATIENT_VISITS_URL,
  BAHMNI_ENCOUNTER_URL,
  CONSULTATION_BUNDLE_URL,
} from './constants';
import { FormsEncounter, OrderFulfillmentEncounterParams } from './models';

/**
 * Fetches visits for a given patient UUID from the FHIR R4 endpoint
 * @param patientUUID - The UUID of the patient
 * @returns Promise resolving to a FhirEncounterBundle
 */
export async function getPatientVisits(
  patientUUID: string,
): Promise<Bundle<Encounter>> {
  return await get<Bundle<Encounter>>(PATIENT_VISITS_URL(patientUUID));
}

/**
 * Fetches and transforms visits for a given patient UUID
 * @param patientUUID - The UUID of the patient
 * @returns Promise resolving to an array of FhirEncounter
 */
export async function getVisits(patientUUID: string): Promise<Encounter[]> {
  const fhirEncounterBundle = await getPatientVisits(patientUUID);
  return (
    fhirEncounterBundle.entry
      ?.map((entry) => entry.resource)
      .filter((resource): resource is Encounter => resource !== undefined) ?? []
  );
}

/**
 * Gets the active visit for a patient (encounter with no end date)
 * @param patientUUID - The UUID of the patient
 * @returns Promise resolving to the current FhirEncounter or null if not found
 */
export async function getActiveVisit(
  patientUUID: string,
): Promise<Encounter | null> {
  const encounters = await getVisits(patientUUID);
  return encounters.find((encounter) => !encounter.period?.end) ?? null;
}

/**
 * Fetches Bahmni encounter details by encounter UUID
 * @param encounterUUID - The UUID of the encounter
 * @param includeAll - Whether to include all details (default: false)
 * @returns Promise resolving to FormsEncounter
 */
export async function getFormsDataByEncounterUuid(
  encounterUUID: string,
  includeAll: boolean = false,
): Promise<FormsEncounter> {
  return await get<FormsEncounter>(
    BAHMNI_ENCOUNTER_URL(encounterUUID, includeAll),
  );
}

/**
 * Creates a FHIR Encounter linked to an existing visit via ConsultationBundle.
 * Used to associate an order fulfillment action with a clinical session.
 *
 * @param params - Patient, visit, practitioner, location, and encounter type details
 * @returns Promise resolving to the created encounter UUID
 */
export async function createOrderFulfillmentEncounter(
  params: OrderFulfillmentEncounterParams,
): Promise<string> {
  const {
    patientUuid,
    visitUuid,
    practitionerUuid,
    locationUuid,
    encounterTypeUuid,
  } = params;

  const encounterResource: Encounter = {
    resourceType: 'Encounter',
    class: {
      system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode',
      code: 'AMB',
      display: 'ambulatory',
    },
    status: 'in-progress',
    meta: {
      tag: [
        {
          system: 'http://fhir.openmrs.org/ext/encounter-tag',
          code: 'encounter',
          display: 'Encounter',
        },
      ],
    },
    type: [
      {
        coding: [
          {
            system: FHIR_ENCOUNTER_TYPE_CODE_SYSTEM,
            code: encounterTypeUuid,
          },
        ],
      },
    ],
    subject: { reference: `Patient/${patientUuid}` },
    participant: [
      {
        individual: {
          reference: `Practitioner/${practitionerUuid}`,
          type: 'Practitioner',
        },
      },
    ],
    partOf: { reference: `Encounter/${visitUuid}` },
    location: [{ location: { reference: `Location/${locationUuid}` } }],
    period: { start: new Date(Date.now() - 1000).toISOString() },
  };

  const fullUrl = `urn:uuid:${crypto.randomUUID()}`;
  const bundleEntry: BundleEntry<FhirResource> = {
    fullUrl,
    resource: encounterResource,
    request: { method: 'POST', url: 'Encounter' },
  };

  const consultationBundle = {
    resourceType: 'ConsultationBundle' as const,
    type: 'transaction' as const,
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    entry: [bundleEntry],
  };

  const response = await post<Bundle>(
    CONSULTATION_BUNDLE_URL,
    consultationBundle,
  );

  const encounterUuid = (response?.entry?.[0]?.resource as Encounter)?.id;
  if (!encounterUuid) {
    throw new Error(
      'Failed to extract encounter UUID from ConsultationBundle response',
    );
  }
  return encounterUuid;
}
