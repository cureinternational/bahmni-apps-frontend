import { ExpandableSortableDataTable, Link } from '@bahmni/design-system';
import { useTranslation } from '@bahmni/services';
import { DataTableHeader } from '@carbon/react';
import React, { useMemo } from 'react';
import { PatientOrderRow } from '../../models/orderFulfillment';
import { ExpandedOrderRow } from '../expandedOrderRow';
import { NewBadge } from '../newBadge';
import { PriorityBadge } from '../priorityBadge';
// Dummy caret SVG for Status header
import styles from './styles/OrdersFulfillmentTable.module.scss';

interface OrdersFulfillmentTableProps {
  rows: PatientOrderRow[];
  headers: DataTableHeader[];
  loading?: boolean;
  isDrugOrderTab?: boolean;
  onPatientClick?: (patientId: string) => void;
  onOrderClick?: (orderId: string) => void;
}

export const OrdersFulfillmentTable: React.FC<OrdersFulfillmentTableProps> = ({
  rows,
  headers,
  loading = false,
  isDrugOrderTab = false,
  onPatientClick,
  onOrderClick,
}) => {
  const { t } = useTranslation();

  // Custom header renderer for Status column with dummy caret
  const customHeaders = useMemo(
    () =>
      headers.map((h) =>
        h.key === 'status'
          ? {
              ...h,
              header: (
                <span className={styles.statusHeader}>
                  Status
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className={styles.statusCaret}
                    aria-hidden="true"
                  >
                    <path
                      d="M4 6L8 10L12 6"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
              ),
            }
          : h,
      ),
    [headers],
  );

  const renderCell = (row: PatientOrderRow, cellId: string) => {
    switch (cellId) {
      case 'badge':
        return row.recentOrdersCount > 0 ? (
          <NewBadge count={row.recentOrdersCount} />
        ) : null;
      case 'patientName':
        return row.patientName;
      case 'identifier':
        return (
          <Link
            href="#"
            onClick={(e: React.MouseEvent) => {
              e.preventDefault();
              onPatientClick?.(row.id);
            }}
            className={styles.identifierLink}
          >
            {row.identifier}
          </Link>
        );
      case 'ordersPending':
        return row.totalOrdersCount;
      case 'priority':
        return (
          <div className={styles.priorityCell}>
            {row.urgentCount > 0 ? (
              <PriorityBadge priority="Urgent" count={row.urgentCount} />
            ) : null}
          </div>
        );
      case 'status':
        return null;
      case 'provider':
      case 'dateTime':
      case 'owner':
        return null;
      default:
        return null;
    }
  };

  const renderExpandedContent = (row: PatientOrderRow) => (
    <div className={styles.expandedContent}>
      {row.orders.map((order) => (
        <ExpandedOrderRow
          key={order.id}
          order={order}
          onOrderClick={onOrderClick}
        />
      ))}
    </div>
  );

  if (isDrugOrderTab) {
    return (
      <ExpandableSortableDataTable
        headers={customHeaders}
        rows={rows.map((row) => ({ ...row, isExpandable: false }))}
        ariaLabel={t('DRUG_ORDERS_TABLE')}
        renderCell={renderCell}
        renderExpandedContent={renderExpandedContent}
        loading={loading}
        emptyStateMessage={t('NO_ORDERS_FOUND')}
        className={styles.ordersTable}
      />
    );
  }

  return (
    <ExpandableSortableDataTable
      headers={customHeaders}
      rows={rows}
      ariaLabel={t('ORDERS_FULFILLMENT_TABLE')}
      renderCell={renderCell}
      renderExpandedContent={renderExpandedContent}
      loading={loading}
      emptyStateMessage={t('NO_ORDERS_FOUND')}
      className={styles.ordersTable}
      expandedRowClassName={styles.expandedRow}
    />
  );
};
