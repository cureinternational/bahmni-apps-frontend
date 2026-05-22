import { SaveAndCancelButtons } from '@bahmni/design-system';
import {
  useTranslation,
  Provider,
  createTask,
  getCurrentProvider,
  getObservationByConceptName,
  ObservationData,
} from '@bahmni/services';
import { useNotification } from '@bahmni/widgets';
import { Close } from '@carbon/icons-react';
import { ComboBox, TextArea } from '@carbon/react';
import React, { useEffect, useState } from 'react';
import {
  UI_STATUS_TO_FHIR_TASK_STATUS,
  DEFAULT_STATUS_FOR_NEW_ORDER,
} from '../../constants/orderStatusMappings';
import { ensureEncounterForActiveVisit } from '../../hooks/useEnsureEncounterForVisit';
import { useOrdersConfig } from '../../hooks/useOrdersConfig';
import {
  Order,
  OrderStatus,
  OrderStatusConfig,
} from '../../models/orderFulfillment';
import useOrdersStore from '../../stores/ordersStore';
import { parseAgeYears } from '../../utils/patientUtils';
import styles from './styles/OrderFulfillmentSlider.module.scss';

interface OrderFulfillmentSliderProps {
  order: Order | null;
  onClose: () => void;
  isOpen: boolean;
  tabLabel?: string;
  onSaveSuccess?: () => void;
  prefetchedObservations?: Record<
    string,
    ObservationData | string | null
  > | null;
}

export const OrderFulfillmentSlider: React.FC<OrderFulfillmentSliderProps> = ({
  order,
  onClose,
  isOpen,
  tabLabel = '',
  onSaveSuccess,
  prefetchedObservations = null,
}) => {
  const { t } = useTranslation();
  const { addNotification } = useNotification();
  const { ordersTableConfig } = useOrdersConfig();
  const { fetchProviders, providers, currentUser, currentLocation } =
    useOrdersStore();
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<OrderStatus | ''>('');
  const [owner, setOwner] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [currentProviders, setCurrentProviders] = useState<Provider[]>([]);
  const [observationData, setObservationData] = useState<
    Record<string, ObservationData | string | null>
  >({});

  const { sliderObservationFields = [] } = ordersTableConfig ?? {};

  const activeFields = sliderObservationFields.filter((field) => {
    const tabMatch =
      !field.tabLabels?.length || field.tabLabels.includes(tabLabel);
    const genderMatch =
      !field.eligibility?.gender ||
      field.eligibility.gender === order?.patient?.gender;
    const ageMatch =
      field.eligibility?.minAge == null ||
      parseAgeYears(order?.patient?.age) >= field.eligibility.minAge;
    return tabMatch && genderMatch && ageMatch;
  });

  const availableStatuses: OrderStatusConfig[] = (
    (ordersTableConfig?.orderStatusesAvailable as OrderStatusConfig[]) ?? []
  ).filter((s) => s.value !== 'New');

  const patientDetailFields =
    ordersTableConfig?.manageOrdersPanelPatientDetails ?? [];

  useEffect(() => {
    if (isOpen && order) {
      if (tabLabel) {
        fetchProviders(tabLabel);
      }
      const initialStatus =
        order.status === 'New'
          ? DEFAULT_STATUS_FOR_NEW_ORDER
          : (order.status ?? '');
      setStatus(initialStatus);
      setOwner(order.ownerUuid ?? '');
      setNotes(order?.note ?? '');
    } else if (!isOpen) {
      setNotes('');
      setStatus('');
      setOwner('');
    }
  }, [isOpen, order, tabLabel, fetchProviders]);

  useEffect(() => {
    if (tabLabel && providers[tabLabel] && providers[tabLabel].length > 0) {
      setCurrentProviders(providers[tabLabel]);
    }
  }, [tabLabel, providers]);

  useEffect(() => {
    let isMounted = true;

    if (isOpen && activeFields.length > 0 && order?.patientUuid) {
      if (prefetchedObservations) {
        setObservationData(prefetchedObservations);
      } else {
        // Fallback: fetch if row was not expanded first (e.g., direct link to order)
        setObservationData({});
        const conceptsToFetch = [
          ...new Set(
            activeFields.flatMap(
              (f) =>
                [f.conceptName, f.conditionConceptName].filter(
                  Boolean,
                ) as string[],
            ),
          ),
        ];
        Promise.all(
          conceptsToFetch.map((c) =>
            getObservationByConceptName(order.patientUuid, c),
          ),
        )
          .then((results) => {
            if (isMounted) {
              setObservationData(
                Object.fromEntries(
                  conceptsToFetch.map((c, i) => [c, results[i]]),
                ),
              );
            }
          })
          .catch(() => {
            if (isMounted) {
              setObservationData({});
            }
          });
      }
    } else if (!isOpen) {
      setObservationData({});
    }

    return () => {
      isMounted = false;
    };
  }, [isOpen, order?.patientUuid, prefetchedObservations, activeFields.length]);

  const getNestedValue = (obj: Order, key: string): string => {
    const keys = key.split('.');
    let value: unknown = obj;
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = (value as Record<string, unknown>)[k];
      } else {
        return '';
      }
    }
    return value !== undefined && value !== null ? String(value) : '';
  };

  const hasChanges =
    status !== (order?.status ?? '') ||
    owner !== (order?.ownerUuid ?? '') ||
    Boolean(notes.trim());

  const handleSave = async () => {
    const fhirStatus = UI_STATUS_TO_FHIR_TASK_STATUS[status as OrderStatus];
    if (!fhirStatus || !order) {
      return;
    }
    try {
      setIsSaving(true);

      const encounterTypeUuid =
        ordersTableConfig?.fulfillmentEncounterTypeUuid ?? '';

      let encounterUuid: string | null = null;
      if (encounterTypeUuid && currentUser?.uuid && currentLocation?.uuid) {
        const provider = await getCurrentProvider(currentUser.uuid);
        if (provider?.uuid) {
          encounterUuid = await ensureEncounterForActiveVisit({
            patientUuid: order.patientUuid,
            practitionerUuid: provider.uuid,
            locationUuid: currentLocation.uuid,
            encounterTypeUuid,
          });
        }
      }

      await createTask(order.id, fhirStatus, {
        notes: notes.trim() || undefined,
        ownerUuid: owner || undefined,
        encounterUuid: encounterUuid ?? undefined,
        patientUuid: order.patientUuid,
      });
      addNotification({
        title: t('ORDER_SAVE_SUCCESS'),
        message: '',
        type: 'success',
        timeout: 5000,
      });
      onSaveSuccess?.();
    } catch {
      addNotification({
        title: t('ORDER_SAVE_ERROR'),
        message: '',
        type: 'error',
        timeout: 5000,
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen || !order) {
    return null;
  }

  return (
    <div
      className={styles.orderFulfillmentSlider}
      data-testid="order-fulfillment-slider"
    >
      <div className={styles.sliderHeader}>
        <div className={styles.headerTop}>
          <div className={styles.sliderTitle}>{t('MANAGE_ORDER')}</div>
          <button
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Close sidebar"
            type="button"
          >
            <Close size={20} />
          </button>
        </div>
        <div className={styles.sliderTitle}>{order.orderName}</div>
      </div>
      <div className={styles.sliderContent}>
        {order.providerComments && (
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>{t('PROVIDER_COMMENTS')}</h3>
            <p className={styles.commentsText}>{order.providerComments}</p>
          </section>
        )}

        {(patientDetailFields.length > 0 || activeFields.length > 0) && (
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>{t('PATIENT_DETAILS')}</h3>
            <div className={styles.patientDetailsGrid}>
              {patientDetailFields.map((field) => {
                const value = getNestedValue(order, field.key);
                return (
                  <div key={field.key} className={styles.patientDetailItem}>
                    <span className={styles.label}>
                      {t(field.translationKey) || field.label}
                    </span>
                    <span className={styles.value}>{value || '-'}</span>
                  </div>
                );
              })}
              {activeFields.map((field) => {
                if (field.type === 'days_since_date') {
                  const dateObs = observationData[field.conceptName] as
                    | typeof ObservationData
                    | null
                    | undefined;
                  const conditionVal = field.conditionConceptName
                    ? (observationData[field.conditionConceptName] as
                        | string
                        | null
                        | undefined)
                    : field.conditionPositiveValue;

                  const isConditionMet =
                    !field.conditionConceptName ||
                    conditionVal === field.conditionPositiveValue;
                  const isNotRecorded = dateObs == null;
                  const isWarning =
                    isConditionMet && dateObs && field.warningThreshold != null
                      ? (dateObs as ObservationData).daysSince >
                        field.warningThreshold
                      : false;

                  return (
                    <div
                      key={field.conceptName}
                      className={styles.patientDetailItem}
                      data-testid="observation-days-display"
                    >
                      <span className={styles.label}>
                        {t(field.translationKey)}
                      </span>
                      <span
                        className={`${styles.value} ${
                          isWarning ? styles.observationWarning : ''
                        } ${
                          isNotRecorded ? styles.observationNotRecorded : ''
                        }`}
                        data-testid="observation-days-value"
                      >
                        {isConditionMet && dateObs
                          ? (dateObs as ObservationData).daysSince
                          : !isConditionMet && conditionVal != null
                            ? t('OBSERVATION_CONDITION_NOT_MET')
                            : t('OBSERVATION_NOT_RECORDED')}
                      </span>
                    </div>
                  );
                }
                return null;
              })}
            </div>
          </section>
        )}

        <div className={styles.separator} />

        <section className={styles.formSection}>
          <div className={styles.formField}>
            <ComboBox
              id="order-owner-select"
              data-testid="order-owner-select"
              titleText={t('ORDER_OWNER')}
              placeholder={t('CHOOSE_AN_OPTION')}
              items={currentProviders}
              itemToString={(item) => (item ? item.name : '')}
              shouldFilterItem={({ item, inputValue }) => {
                if (!inputValue) return true;
                return item.name
                  .toLowerCase()
                  .includes(inputValue.toLowerCase());
              }}
              selectedItem={
                currentProviders.find((p) => p.id === owner) ?? null
              }
              onChange={({ selectedItem }) =>
                setOwner(selectedItem ? selectedItem.id : '')
              }
            />
          </div>

          <div className={styles.formField}>
            <ComboBox
              id="order-status-select"
              data-testid="order-status-select"
              titleText={
                <span>
                  {t('STATUS')} <span className={styles.required}>*</span>
                </span>
              }
              placeholder={t('CHOOSE_AN_OPTION')}
              items={availableStatuses}
              itemToString={(item) => (item ? t(item.translationKey) : '')}
              selectedItem={
                availableStatuses.find((s) => s.value === status) ?? null
              }
              onChange={({ selectedItem }) =>
                setStatus(selectedItem ? selectedItem.value : '')
              }
              onKeyDown={(e: React.KeyboardEvent) => {
                const allowedKeys = [
                  'ArrowDown',
                  'ArrowUp',
                  'Enter',
                  'Escape',
                  'Tab',
                ];
                if (!allowedKeys.includes(e.key) && e.key.length === 1) {
                  e.preventDefault();
                }
              }}
              className={styles.statusComboBox}
            />
          </div>

          <TextArea
            id="order-notes"
            data-testid="order-notes"
            labelText={t('NOTES')}
            rows={4}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={t('NOTES')}
          />
        </section>
      </div>

      <SaveAndCancelButtons
        onSave={handleSave}
        onClose={onClose}
        isSaveDisabled={!status || !hasChanges || isSaving}
        primaryButtonText={t('SAVE')}
        cancelButtonText={t('CANCEL')}
      />
    </div>
  );
};
