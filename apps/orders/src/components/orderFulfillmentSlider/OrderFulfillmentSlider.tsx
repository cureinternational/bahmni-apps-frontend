import { SaveAndCancelButtons } from '@bahmni/design-system';
import {
  useTranslation,
  Provider,
  createTask,
  getCurrentProvider,
  getPatientLmpData,
  getPatientMenstruationStatus,
  LmpData,
} from '@bahmni/services';
import { useNotification } from '@bahmni/widgets';
import { Close } from '@carbon/icons-react';
import { ComboBox, TextArea } from '@carbon/react';
import React, { useEffect, useState } from 'react';
import {
  RADIOLOGY_TAB_LABEL,
  LMP_WARNING_DAYS_THRESHOLD,
} from '../../constants/app';
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
import { isPatientLmpEligible } from '../../utils/lmpEligibility';
import styles from './styles/OrderFulfillmentSlider.module.scss';

interface OrderFulfillmentSliderProps {
  order: Order | null;
  onClose: () => void;
  isOpen: boolean;
  tabLabel?: string;
  onSaveSuccess?: () => void;
  prefetchedLmpData?: {
    lmpData: LmpData | null;
    menstruationStatus: string | null;
  } | null;
}

export const OrderFulfillmentSlider: React.FC<OrderFulfillmentSliderProps> = ({
  order,
  onClose,
  isOpen,
  tabLabel = '',
  onSaveSuccess,
  prefetchedLmpData = null,
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
  const [lmpData, setLmpData] = useState<LmpData | null>(null);
  const [menstruationStatus, setMenstruationStatus] = useState<string | null>(
    null,
  );

  const isRadiologyTab = tabLabel === RADIOLOGY_TAB_LABEL;
  const isLmpEligible =
    isRadiologyTab &&
    isPatientLmpEligible(order?.patient?.gender, order?.patient?.age);

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

    if (isOpen && isLmpEligible && order?.patientUuid) {
      if (prefetchedLmpData) {
        setLmpData(prefetchedLmpData.lmpData);
        setMenstruationStatus(prefetchedLmpData.menstruationStatus);
      } else {
        // Fallback: fetch if row was not expanded first (e.g., direct link to order)
        setLmpData(null);
        setMenstruationStatus(null);
        Promise.all([
          getPatientMenstruationStatus(order.patientUuid),
          getPatientLmpData(order.patientUuid),
        ])
          .then(([status, data]) => {
            if (isMounted) {
              setMenstruationStatus(status);
              setLmpData(data);
            }
          })
          .catch(() => {
            if (isMounted) {
              setMenstruationStatus(null);
              setLmpData(null);
            }
          });
      }
    } else if (!isOpen) {
      setLmpData(null);
      setMenstruationStatus(null);
    }

    return () => {
      isMounted = false;
    };
  }, [isOpen, isLmpEligible, order?.patientUuid, prefetchedLmpData]);

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

        {(patientDetailFields.length > 0 || isRadiologyTab) && (
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
              {isLmpEligible && (
                <div
                  className={styles.patientDetailItem}
                  data-testid="lmp-days-display"
                >
                  <span className={styles.label}>{t('DAYS_SINCE_LMP')}</span>
                  <span
                    className={`${styles.value} ${
                      menstruationStatus === 'Yes' &&
                      lmpData &&
                      lmpData.daysSinceLmp > LMP_WARNING_DAYS_THRESHOLD
                        ? styles.lmpWarning
                        : menstruationStatus === null
                          ? styles.lmpNotRecorded
                          : ''
                    }`}
                    data-testid="lmp-days-value"
                  >
                    {menstruationStatus === 'Yes' && lmpData
                      ? lmpData.daysSinceLmp
                      : menstruationStatus === 'No'
                        ? 'Not yet menstruating'
                        : 'LMP date not recorded'}
                  </span>
                </div>
              )}
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
