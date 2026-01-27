import {
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  Loading,
  SortableDataTable,
  Search,
} from '@bahmni/design-system';
import { useTranslation } from '@bahmni/services';
import React, { useState } from 'react';
import { OrdersHeader } from '../components/ordersHeader/OrdersHeader';
import { useOrdersConfig } from '../hooks/useOrdersConfig';
import styles from './styles/OrdersPage.module.scss';

export const OrdersPage: React.FC = () => {
  const { t } = useTranslation();
  const { tabs, isLoading, error } = useOrdersConfig();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const tabCounts = useOrdersTabCounts(tabs);

  if (isLoading) {
    return <Loading />;
  }
  if (error) {
    return (
      <div className={styles.errorContainer}>
        <div className={styles.errorMessage}>
          {t('ERROR_LOADING_ORDERS_CONFIG')}: {error.message}
        </div>
      </div>
    );
  }
  return (
    <div className={styles.pageContainer}>
      <OrdersHeader />
      <div className={styles.contentContainer}>
        <div className={styles.ordersContainer}>
          <Tabs
            selectedIndex={selectedIndex}
            onChange={(evt) => setSelectedIndex(evt.selectedIndex)}
          >
            <TabList aria-label={t('ORDERS_TABS')} className={styles.tabList}>
              {tabs.map((tab) => (
                <Tab key={tab.id}>
                  {t(tab.translationKey) || tab.display} (
                  {tabCounts[tab.label] ?? 0})
                </Tab>
              ))}
            </TabList>
            <TabPanels>
              {tabs.map((tab, index) => (
                <TabPanel key={tab.id}>
                  {index === selectedIndex && (
                    <OrdersTabContent tabLabel={tab.label} />
                  )}
                </TabPanel>
              ))}
            </TabPanels>
          </Tabs>
        </div>
      </div>
    </div>
  );
};
