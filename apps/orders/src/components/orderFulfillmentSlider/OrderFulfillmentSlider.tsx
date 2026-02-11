import { useTranslation } from '@bahmni/services';
import { Close } from '@carbon/icons-react';
import { Select, SelectItem, TextArea } from '@carbon/react';
import React, { useState } from 'react';
import { SaveAndCancelButtons } from '../../../../../packages/bahmni-design-system/src/molecules/saveAndCancelButtons';
import { availableProviders } from '../../__mocks__/ordersMockData';
import { useOrdersConfig } from '../../hooks/useOrdersConfig';
import { Order, OrderStatus } from '../../models/orderFulfillment';
import styles from './styles/OrderFulfillmentSlider.module.scss';

interface OrderFulfillmentSliderProps {
  order: Order | null;
  onClose: () => void;
  isOpen: boolean;
}

export const OrderFulfillmentSlider: React.FC<OrderFulfillmentSliderProps> = ({
  order,
  onClose,
  isOpen,
}) => {
  const { t } = useTranslation();
  const { ordersTableConfig } = useOrdersConfig();
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<OrderStatus | ''>('');
  const [owner, setOwner] = useState('');

  const availableStatuses: OrderStatus[] =
    ordersTableConfig?.orderStatusesAvailable as OrderStatus[];

  const patientDetailFields =
    ordersTableConfig?.manageOrdersPanelPatientDetails ?? [];

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
        <div className={styles.orderName}>{order.orderName}</div>
      </div>
      <div className={styles.sliderContent}>
        {order.providerComments && (
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>{t('PROVIDER_COMMENTS')}</h3>
            <p className={styles.commentsText}>{order.providerComments}</p>
          </section>
        )}

        {patientDetailFields.length > 0 && (
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
            </div>
          </section>
        )}

        <div className={styles.separator} />

        <section className={styles.formSection}>
          <div className={styles.formField}>
            <Select
              id="order-owner-select"
              data-testid="order-owner-select"
              labelText="Rehab order owner"
              value={owner}
              onChange={(e) => setOwner(e.target.value)}
            >
              <SelectItem value="" text={t('CHOOSE_AN_OPTION')} />
              {availableProviders.map((provider) => (
                <SelectItem
                  key={provider.id}
                  value={provider.id}
                  text={provider.name}
                />
              ))}
            </Select>
          </div>

          <div className={styles.formField}>
            <Select
              id="order-status-select"
              data-testid="order-status-select"
              labelText={t('STATUS')}
              value={status}
              onChange={(e) => setStatus(e.target.value as OrderStatus)}
            >
              <SelectItem value="" text={t('CHOOSE_AN_OPTION')} />
              {availableStatuses.map((statusOption) => (
                <SelectItem
                  key={statusOption}
                  value={statusOption}
                  text={statusOption}
                />
              ))}
            </Select>
          </div>

          <TextArea
            id="order-notes"
            data-testid="order-notes"
            rows={4}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Notes"
          />
        </section>
      </div>

      <SaveAndCancelButtons onSave={() => {}} onClose={onClose} />
    </div>
  );
};
