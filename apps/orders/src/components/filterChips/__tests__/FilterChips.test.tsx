import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { OrderStatusConfig } from '../../models/orderFulfillment';
import { FilterChips } from '../FilterChips';

jest.mock('@bahmni/services', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

const availableStatuses: OrderStatusConfig[] = [
  { value: 'New', label: 'New', translationKey: 'STATUS_NEW' },
  {
    value: 'Acknowledged',
    label: 'Acknowledged',
    translationKey: 'STATUS_ACKNOWLEDGED',
  },
  {
    value: 'In Progress',
    label: 'In Progress',
    translationKey: 'STATUS_IN_PROGRESS',
  },
];

describe('FilterChips', () => {
  it('renders an empty container when no filters are selected', () => {
    render(
      <FilterChips
        selectedStatuses={[]}
        availableStatuses={availableStatuses}
      />,
    );
    const container = screen.getByTestId('filter-chips');
    expect(container).toBeInTheDocument();
    expect(container).toBeEmptyDOMElement();
  });

  it('renders a chip for each selected status in dropdown order', () => {
    render(
      <FilterChips
        selectedStatuses={[availableStatuses[2], availableStatuses[0]]}
        availableStatuses={availableStatuses}
      />,
    );
    const chipsContainer = screen.getByTestId('filter-chips');
    expect(screen.getByText('Status selected :')).toBeInTheDocument();
    const chipElements = Array.from(
      chipsContainer.querySelectorAll('.cds--tag'),
    );
    expect(chipElements).toHaveLength(2);
    expect(chipElements[0].textContent).toBe('STATUS_NEW');
    expect(chipElements[1].textContent).toBe('STATUS_IN_PROGRESS');
  });

  it('falls back to selected order when statuses are missing from available list', () => {
    const unknownStatus: OrderStatusConfig = {
      value: 'On Hold',
      label: 'On Hold',
      translationKey: 'STATUS_ON_HOLD',
    };
    render(
      <FilterChips
        selectedStatuses={[unknownStatus, availableStatuses[0]]}
        availableStatuses={availableStatuses}
      />,
    );
    const chipsContainer = screen.getByTestId('filter-chips');
    const chipElements = Array.from(
      chipsContainer.querySelectorAll('.cds--tag'),
    );
    expect(chipElements).toHaveLength(2);
    expect(chipElements[0].textContent).toBe('STATUS_ON_HOLD');
    expect(chipElements[1].textContent).toBe('STATUS_NEW');
  });

  it('exposes the filters applied status role', () => {
    render(
      <FilterChips
        selectedStatuses={[availableStatuses[0]]}
        availableStatuses={availableStatuses}
      />,
    );
    expect(screen.getByTestId('filter-chips')).toHaveAttribute(
      'role',
      'status',
    );
  });
});
