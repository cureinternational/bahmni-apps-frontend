import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { useRef } from 'react';
import { OrderStatusConfig } from '../../../models/orderFulfillment';
import { StatusFilter } from '../StatusFilter';

jest.mock('@bahmni/services', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

const statuses: OrderStatusConfig[] = [
  { value: 'PENDING', translationKey: 'PENDING' },
  { value: 'COMPLETED', translationKey: 'COMPLETED' },
] as OrderStatusConfig[];

// Mimics the real usage: dropdown (portaled) is nested inside the same
// clickable header span that toggles the filter open/closed.
const Harness = ({ onToggle }: { onToggle: () => void }) => {
  const anchorRef = useRef<HTMLSpanElement>(null);
  return (
    <span ref={anchorRef} onClick={onToggle} data-testid="header">
      <StatusFilter
        availableStatuses={statuses}
        selectedStatuses={[]}
        onApply={jest.fn()}
        isOpen
        onToggle={onToggle}
        anchorRef={anchorRef}
      />
    </span>
  );
};

describe('StatusFilter', () => {
  it('does not bubble clicks inside the dropdown to the header toggle handler', () => {
    const onToggle = jest.fn();
    render(<Harness onToggle={onToggle} />);

    fireEvent.click(screen.getByText('PENDING'));

    expect(onToggle).not.toHaveBeenCalled();
  });

  it('still toggles when the header itself is clicked', () => {
    const onToggle = jest.fn();
    render(<Harness onToggle={onToggle} />);

    fireEvent.click(screen.getByTestId('header'));

    expect(onToggle).toHaveBeenCalledTimes(1);
  });
});
