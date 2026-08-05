import { Tag } from '@bahmni/design-system';
import { useTranslation } from '@bahmni/services';
import React from 'react';
import { OrderStatusConfig } from '../../models/orderFulfillment';
import styles from './styles/FilterChips.module.scss';

interface FilterChipsProps {
  selectedStatuses: OrderStatusConfig[];
  availableStatuses: OrderStatusConfig[];
}

export const FilterChips: React.FC<FilterChipsProps> = ({
  selectedStatuses,
  availableStatuses,
}) => {
  const { t } = useTranslation();

  const selectedValues = new Set(selectedStatuses.map((s) => s.value));
  const orderedStatuses = availableStatuses.filter((status) =>
    selectedValues.has(status.value),
  );

  const statusesToRender =
    orderedStatuses.length === selectedStatuses.length
      ? orderedStatuses
      : selectedStatuses;

  return (
    <div
      className={styles.filterChips}
      data-testid="filter-chips"
      role="status"
    >
      {statusesToRender.length > 0 && (
        <h3 className={styles.filterHeading}>Status selected :</h3>
      )}
      {statusesToRender.map((status) => (
        <Tag key={status.value} type="cool-gray" className={styles.chip}>
          {t(status.translationKey)}
        </Tag>
      ))}
    </div>
  );
};
