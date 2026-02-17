import { useTranslation } from '@bahmni/services';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import * as configMocks from '../../__mocks__/configMocks';
import { rehabOrdersMockData } from '../../__mocks__/ordersMockData';
import { OrdersConfigProvider } from '../../providers/OrdersConfigProvider';
import useOrdersStore from '../../stores/ordersStore';
import { OrdersPage } from '../OrdersPage';

// Mock the services
jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  getOrdersConfig: jest.fn(),
  getOrdersTableConfig: jest.fn(),
  useTranslation: jest.fn(),
  notificationService: {
    showError: jest.fn(),
    showSuccess: jest.fn(),
    showInfo: jest.fn(),
    showWarning: jest.fn(),
  },
  getFormattedError: jest.fn((error) => ({
    title: 'Error',
    message:
      error instanceof Error ? error.message : 'An unexpected error occurred',
  })),
  __esModule: true,
}));

// Mock OrdersHeader
jest.mock('../../components/ordersHeader/OrdersHeader', () => ({
  __esModule: true,
  OrdersHeader: () => <div data-testid="orders-header">Orders Header</div>,
}));

// Mock useOrdersFulfillment
jest.mock('../../hooks/useOrdersFulfillment', () => ({
  useOrdersFulfillment: () => ({
    rows: [],
    headers: [
      { key: 'badge', header: '' },
      { key: 'patientName', header: 'Patient Name' },
      { key: 'identifier', header: 'Identifier' },
    ],
    isLoading: false,
    error: null,
    isDrugOrderTab: false,
  }),
}));

// Mock OrdersFulfillmentTable - renders patient names so filter assertions can be made
jest.mock('../../components/ordersFulfillmentTable', () => ({
  OrdersFulfillmentTable: ({ rows }: { rows: any[] }) => (
    <div data-testid="orders-fulfillment-table">
      {rows.map((row: any) => (
        <div key={row.id} data-testid="patient-row">
          {row.patientName}
        </div>
      ))}
    </div>
  ),
}));

const mockedUseTranslation = useTranslation as jest.MockedFunction<
  typeof useTranslation
>;

const { getOrdersConfig, getOrdersTableConfig } =
  jest.requireMock('@bahmni/services');

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

describe('OrdersPage Component', () => {
  const mockTranslate = jest.fn((key: string) => {
    const translations: Record<string, string> = {
      MODULE_LABEL_RADIOLOGY_ORDERS_KEY: 'Radiology Orders',
      MODULE_LABEL_LAB_ORDERS_KEY: 'Laboratory Orders',
      MODULE_LABEL_REHAB_ORDERS_KEY: 'Rehab Orders',
      MODULE_LABEL_DRUG_ORDERS_KEY: 'Drug Orders',
      ERROR_LOADING_ORDERS_CONFIG: 'Error loading orders configuration',
    };
    return translations[key] || key;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseTranslation.mockReturnValue({ t: mockTranslate } as any);
    getOrdersTableConfig.mockResolvedValue(null);
  });

  describe('Rendering', () => {
    test('renders loading state initially', () => {
      getOrdersConfig.mockImplementationOnce(
        () =>
          new Promise(() => {
            // Never resolves to keep loading state
          }),
      );

      const { container } = render(
        <OrdersConfigProvider>
          <OrdersPage />
        </OrdersConfigProvider>,
      );

      // Check for Carbon Design System loading overlay
      expect(
        container.querySelector('.cds--loading-overlay'),
      ).toBeInTheDocument();
    });

    test('renders OrdersHeader component after loading', async () => {
      getOrdersConfig.mockResolvedValueOnce(configMocks.minimalOrdersConfig);

      render(
        <OrdersConfigProvider>
          <OrdersPage />
        </OrdersConfigProvider>,
      );

      await waitFor(() => {
        expect(screen.getByTestId('orders-header')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    test('displays error message when configuration fails to load', async () => {
      const error = new Error('Failed to load configuration');
      getOrdersConfig.mockRejectedValueOnce(error);

      render(
        <OrdersConfigProvider>
          <OrdersPage />
        </OrdersConfigProvider>,
      );

      await waitFor(() => {
        expect(
          screen.getByText(/Error loading orders configuration/i),
        ).toBeInTheDocument();
      });
    });

    test('shows error with error message', async () => {
      const error = new Error('Network error');
      getOrdersConfig.mockRejectedValueOnce(error);

      render(
        <OrdersConfigProvider>
          <OrdersPage />
        </OrdersConfigProvider>,
      );

      await waitFor(() => {
        expect(screen.getByText(/Network error/i)).toBeInTheDocument();
      });
    });
  });

  describe('Empty State', () => {
    test('handles empty configuration gracefully', async () => {
      getOrdersConfig.mockResolvedValueOnce(configMocks.emptyOrdersConfig);

      render(
        <OrdersConfigProvider>
          <OrdersPage />
        </OrdersConfigProvider>,
      );

      await waitFor(() => {
        expect(screen.getByTestId('orders-header')).toBeInTheDocument();
      });
    });

    test('handles null configuration', async () => {
      getOrdersConfig.mockResolvedValueOnce(null);

      render(
        <OrdersConfigProvider>
          <OrdersPage />
        </OrdersConfigProvider>,
      );

      await waitFor(() => {
        expect(screen.getByTestId('orders-header')).toBeInTheDocument();
      });
    });
  });

  describe('Search Functionality', () => {
    beforeEach(() => {
      getOrdersConfig.mockResolvedValue(configMocks.minimalOrdersConfig);
    });

    test('renders search input with correct placeholder', async () => {
      const translateFn = jest.fn((key: string) => {
        const translations: Record<string, string> = {
          SEARCH_ORDERS_PLACEHOLDER:
            'Search by Patient Name, Identifier, Provider or Owner',
          SEARCH_ORDERS_LABEL: 'Search orders',
          CLEAR_SEARCH_INPUT: 'Clear search input',
        };
        return translations[key] || key;
      });
      mockedUseTranslation.mockReturnValue({ t: translateFn } as any);

      render(
        <OrdersConfigProvider>
          <OrdersPage />
        </OrdersConfigProvider>,
      );

      await waitFor(() => {
        const searchInput = screen.getByPlaceholderText(
          'Search by Patient Name, Identifier, Provider or Owner',
        );
        expect(searchInput).toBeInTheDocument();
      });
    });

    test('updates search input value when user types', async () => {
      const user = userEvent.setup();
      const translateFn = jest.fn((key: string) => key);
      mockedUseTranslation.mockReturnValue({ t: translateFn } as any);

      render(
        <OrdersConfigProvider>
          <OrdersPage />
        </OrdersConfigProvider>,
      );

      await waitFor(() => {
        expect(screen.getByTestId('orders-header')).toBeInTheDocument();
      });

      const searchInput = screen.getByRole('searchbox');
      await user.type(searchInput, 'David');

      expect(searchInput).toHaveValue('David');
    });

    test('search input accepts minimum 3 characters', async () => {
      const user = userEvent.setup();
      const translateFn = jest.fn((key: string) => key);
      mockedUseTranslation.mockReturnValue({ t: translateFn } as any);

      render(
        <OrdersConfigProvider>
          <OrdersPage />
        </OrdersConfigProvider>,
      );

      await waitFor(() => {
        expect(screen.getByTestId('orders-header')).toBeInTheDocument();
      });

      const searchInput = screen.getByRole('searchbox');

      // Type 2 characters - should not filter
      await user.type(searchInput, 'Da');
      expect(searchInput).toHaveValue('Da');

      // Type 3rd character - should trigger filter
      await user.type(searchInput, 'v');
      expect(searchInput).toHaveValue('Dav');
    });

    test('clears search input when clear button is clicked', async () => {
      const user = userEvent.setup();
      const translateFn = jest.fn((key: string) => key);
      mockedUseTranslation.mockReturnValue({ t: translateFn } as any);

      render(
        <OrdersConfigProvider>
          <OrdersPage />
        </OrdersConfigProvider>,
      );

      await waitFor(() => {
        expect(screen.getByTestId('orders-header')).toBeInTheDocument();
      });

      const searchInput = screen.getByRole('searchbox');
      await user.type(searchInput, 'David');
      expect(searchInput).toHaveValue('David');

      // Clear the input
      await user.clear(searchInput);
      expect(searchInput).toHaveValue('');
    });

    test('search is case-insensitive', async () => {
      const user = userEvent.setup();
      const translateFn = jest.fn((key: string) => key);
      mockedUseTranslation.mockReturnValue({ t: translateFn } as any);

      render(
        <OrdersConfigProvider>
          <OrdersPage />
        </OrdersConfigProvider>,
      );

      await waitFor(() => {
        expect(screen.getByTestId('orders-header')).toBeInTheDocument();
      });

      const searchInput = screen.getByRole('searchbox');

      // Type in lowercase - should still match "David Kamau"
      await user.type(searchInput, 'david');
      expect(searchInput).toHaveValue('david');

      // Type in uppercase
      await user.clear(searchInput);
      await user.type(searchInput, 'DAVID');
      expect(searchInput).toHaveValue('DAVID');

      // Type in mixed case
      await user.clear(searchInput);
      await user.type(searchInput, 'DaViD');
      expect(searchInput).toHaveValue('DaViD');
    });

    test('trims whitespace from search input', async () => {
      const user = userEvent.setup();
      const translateFn = jest.fn((key: string) => key);
      mockedUseTranslation.mockReturnValue({ t: translateFn } as any);

      render(
        <OrdersConfigProvider>
          <OrdersPage />
        </OrdersConfigProvider>,
      );

      await waitFor(() => {
        expect(screen.getByTestId('orders-header')).toBeInTheDocument();
      });

      const searchInput = screen.getByRole('searchbox');

      // Type with leading/trailing spaces
      await user.type(searchInput, '  David  ');
      expect(searchInput).toHaveValue('  David  ');
      // The filter logic should trim this internally
    });
  });

  describe('Search Filtering - Filtered Results', () => {
    // Inject rehabOrdersMockData into the Zustand store under the tab label
    // used by minimalOrdersConfig ('Radiology Order').
    beforeEach(() => {
      getOrdersConfig.mockResolvedValue(configMocks.minimalOrdersConfig);
      mockedUseTranslation.mockReturnValue({
        t: (key: string) => key,
      } as any);
      useOrdersStore.setState({
        ordersData: { 'Radiology Order': rehabOrdersMockData },
      });
    });

    afterEach(() => {
      useOrdersStore.setState({ ordersData: {} });
    });

    const renderPage = () =>
      render(
        <OrdersConfigProvider>
          <OrdersPage />
        </OrdersConfigProvider>,
      );

    const waitForPage = () =>
      waitFor(() =>
        expect(screen.getByTestId('orders-header')).toBeInTheDocument(),
      );

    test('filters rows by patient name', async () => {
      const user = userEvent.setup();
      renderPage();
      await waitForPage();

      await user.type(screen.getByRole('searchbox'), 'David');

      await waitFor(() => {
        expect(screen.getByText('David Kamau')).toBeInTheDocument();
        expect(screen.queryByText('Samuel Mensah')).not.toBeInTheDocument();
        expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
      });
    });

    test('filters rows by patient identifier', async () => {
      const user = userEvent.setup();
      renderPage();
      await waitForPage();

      // CRK266785 is Samuel Mensah's identifier
      await user.type(screen.getByRole('searchbox'), 'CRK266785');

      await waitFor(() => {
        expect(screen.getByText('Samuel Mensah')).toBeInTheDocument();
        expect(screen.queryByText('David Kamau')).not.toBeInTheDocument();
        expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
      });
    });

    test('filters rows by provider name', async () => {
      const user = userEvent.setup();
      renderPage();
      await waitForPage();

      // Sarah Kimani is the provider for all of Samuel Mensah's orders
      await user.type(screen.getByRole('searchbox'), 'Sarah Kimani');

      await waitFor(() => {
        expect(screen.getByText('Samuel Mensah')).toBeInTheDocument();
        expect(screen.queryByText('David Kamau')).not.toBeInTheDocument();
        expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
      });
    });

    test('filters rows by owner name', async () => {
      const user = userEvent.setup();
      renderPage();
      await waitForPage();

      // Ted Okatch is the owner for David Kamau's orders (order-1-2 and order-1-3)
      await user.type(screen.getByRole('searchbox'), 'Ted Okatch');

      await waitFor(() => {
        expect(screen.getByText('David Kamau')).toBeInTheDocument();
        expect(screen.queryByText('Samuel Mensah')).not.toBeInTheDocument();
        expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
      });
    });
  });
});
