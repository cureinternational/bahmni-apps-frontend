import { useTranslation } from '@bahmni/services';
import { Close } from '@carbon/icons-react';
import { TextArea } from '@carbon/react';
import React, { useState } from 'react';
import { FormattedMessage } from 'react-intl';
import { Button } from '../../../../../packages/bahmni-design-system/src/atoms/button';
import { useOrdersConfig } from '../../hooks/useOrdersConfig';
import { Order } from '../../models/orderFulfillment';
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

  const patientDetailFields =
    ordersTableConfig?.manageOrdersPanelPatientDetails;

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
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>{t('PROVIDER_COMMENTS')}</h3>
          <p className={styles.commentsText}>
            Post-operative X-ray for assessing healing or implant position |
            Monitoring of progress for alignment / comparative purposes | High
            Risk | Request from ward | Request from clinic | Pre-operative X-ray
            for diagnostic or planning purposes
          </p>
        </section>

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
            <label className={styles.formLabel}>Rehab order owner</label>
            <select className={styles.dropdown} defaultValue="">
              <option value="" disabled>
                Choose an option
              </option>
              <option value="provider1">Dr. Smith</option>
              <option value="provider2">Dr. Johnson</option>
              <option value="provider3">Dr. Williams</option>
            </select>
          </div>

          <div className={styles.formField}>
            <label className={styles.formLabel}>{t('STATUS')}</label>
            <select className={styles.dropdown} defaultValue="">
              <option value="" disabled>
                Choose an option
              </option>
              <option value="new">New</option>
              <option value="in-progress">In Progress</option>
              <option value="acknowledged">Acknowledged</option>
              <option value="completed">Completed</option>
            </select>
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

      <div className={styles.actionButtons}>
        <Button
          kind="secondary"
          data-testid="cancel"
          onClick={onClose}
          className={styles.cancelButton}
        >
          <span>
            <FormattedMessage id={'CANCEL'} defaultMessage={'Cancel'} />
          </span>
        </Button>
        <Button kind="primary" data-testid="save" className={styles.saveButton}>
          <span>
            <FormattedMessage id={'SAVE'} defaultMessage={'Save'} />
          </span>
        </Button>
      </div>
    </div>
  );
};
