import {
  fetchOrders,
  getCurrentUser,
  fetchProvidersByTab,
  Provider,
  OrderResponseItem,
  getCookieByName,
} from '@bahmni/services';
import { renderHook, act, waitFor } from '@testing-library/react';
import { OrderTab } from '../../models/ordersConfig';
import useOrdersStore, { transformOrderData } from '../ordersStore';

jest.mock('@bahmni/services', () => ({
  fetchOrders: jest.fn(),
  getCurrentUser: jest.fn(),
  getCookieByName: jest.fn(),
  fetchProvidersByTab: jest.fn(),
  calculateAge: jest.fn(() => ({ years: 25, months: 3, days: 15 })),
}));

const mockFetchOrders = fetchOrders as jest.MockedFunction<typeof fetchOrders>;
const mockGetCurrentUser = getCurrentUser as jest.MockedFunction<
  typeof getCurrentUser
>;
const mockFetchProvidersByTab = fetchProvidersByTab as jest.MockedFunction<
  typeof fetchProvidersByTab
>;
const mockGetCookieByName = getCookieByName as jest.MockedFunction<
  typeof getCookieByName
>;

describe('ordersStore', () => {
  const mockTabs: OrderTab[] = [
    {
      id: 'radiology',
      label: 'Radiology Order',
      display: 'Radiology Orders',
      translationKey: 'RADIOLOGY_ORDERS',
      order: 1,
      searchHandler: 'emrapi.sqlSearch.patientsHasPendingOrders',
    },
    {
      id: 'lab',
      label: 'Lab Order',
      display: 'Laboratory Orders',
      translationKey: 'LAB_ORDERS',
      order: 2,
      searchHandler: 'emrapi.sqlSearch.patientsHasPendingLabOrders',
    },
  ];

  const mockOrderResponse: OrderResponseItem[] = [
    {
      uuid: 'patient-uuid-1',
      identifier: 'PAT001',
      name: 'John Doe',
      birthdate: '1998-05-15',
      gender: 'Male',
      orders: JSON.stringify([
        {
          orderUuid: 'order-1',
          orderName: 'X-Ray Chest',
          priority: 'STAT',
          providerName: 'Dr. Smith',
          dateTime: new Date('2026-02-10').getTime(),
          providerComments: 'Urgent',
        },
      ]),
    },
  ];

  const mockProviders: Provider[] = [
    { id: 'provider-1', name: 'Dr. Smith', uuid: 'uuid-1' },
    { id: 'provider-2', name: 'Dr. Jones', uuid: 'uuid-2' },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetCookieByName.mockReturnValue(
      encodeURIComponent(
        JSON.stringify({ name: 'Test Location', uuid: 'loc-1' }),
      ),
    );
    mockGetCurrentUser.mockResolvedValue({
      uuid: 'user-1',
      username: 'testuser',
      display: 'Test User',
      person: {
        uuid: 'person-1',
        display: 'Test User',
      },
    } as any);
  });

  describe('transformOrderData', () => {
    it('should transform order response correctly', () => {
      const result = transformOrderData(mockOrderResponse);

      expect(result).toHaveLength(1);
      expect(result[0].identifier).toBe('PAT001');
      expect(result[0].patientName).toBe('John Doe');
      expect(result[0].orders).toHaveLength(1);
      expect(result[0].orders[0].orderName).toBe('X-Ray Chest');
    });

    it('should calculate urgent count correctly', () => {
      const result = transformOrderData(mockOrderResponse);

      expect(result[0].urgentCount).toBe(1);
    });

    it('should format patient age correctly', () => {
      const result = transformOrderData(mockOrderResponse);

      expect(result[0].orders[0].patient.age).toBe('25 years 3 months 15 days');
    });

    it('should handle empty orders array', () => {
      const emptyResponse: OrderResponseItem[] = [];
      const result = transformOrderData(emptyResponse);

      expect(result).toEqual([]);
    });

    it('should handle orders with escaped newlines', () => {
      const responseWithNewlines: OrderResponseItem[] = [
        {
          ...mockOrderResponse[0],
          orders: JSON.stringify([
            {
              orderUuid: 'order-1',
              orderName: 'Test\nOrder',
              priority: 'ROUTINE',
              providerName: 'Dr. Smith',
              dateTime: new Date().getTime(),
              providerComments: 'Line1\nLine2',
            },
          ]).replace(/\\n/g, '\n'),
        },
      ];

      const result = transformOrderData(responseWithNewlines);

      expect(result).toHaveLength(1);
    });
  });

  describe('fetchProviders', () => {
    it('should fetch providers for a tab', async () => {
      mockFetchProvidersByTab.mockResolvedValueOnce(mockProviders);

      const { result } = renderHook(() => useOrdersStore());

      await act(async () => {
        await result.current.fetchProviders('Radiology Order');
      });

      await waitFor(() => {
        expect(mockFetchProvidersByTab).toHaveBeenCalledWith('Radiology Order');
        expect(result.current.providers['Radiology Order']).toEqual(
          mockProviders,
        );
      });
    });

    it('should not fetch providers if already cached', async () => {
      mockFetchProvidersByTab.mockResolvedValueOnce(mockProviders);

      const { result } = renderHook(() => useOrdersStore());

      await act(async () => {
        await result.current.fetchProviders('Radiology Order');
      });

      await waitFor(() => {
        expect(result.current.providers['Radiology Order']).toEqual(
          mockProviders,
        );
      });

      // Second call should not trigger API call
      await act(async () => {
        await result.current.fetchProviders('Radiology Order');
      });

      expect(mockFetchProvidersByTab).toHaveBeenCalledTimes(1);
    });

    it('should handle fetch providers error gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      mockFetchProvidersByTab.mockRejectedValueOnce(new Error('API Error'));

      const { result } = renderHook(() => useOrdersStore());

      await act(async () => {
        await result.current.fetchProviders('Lab Order');
      });

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          'Error fetching providers for tab Lab Order:',
          expect.any(Error),
        );
      });

      consoleSpy.mockRestore();
    });

    it('should fetch providers for multiple tabs independently', async () => {
      const radiologyProviders = [
        { id: 'rad-1', name: 'Radiologist 1', uuid: 'rad-uuid-1' },
      ];
      const labProviders = [
        { id: 'lab-1', name: 'Lab Tech 1', uuid: 'lab-uuid-1' },
      ];

      mockFetchProvidersByTab
        .mockResolvedValueOnce(radiologyProviders)
        .mockResolvedValueOnce(labProviders);

      const { result } = renderHook(() => useOrdersStore());

      await act(async () => {
        await result.current.fetchProviders('Radiology Order');
        await result.current.fetchProviders('Lab Order');
      });

      await waitFor(() => {
        expect(result.current.providers['Radiology Order']).toEqual(
          radiologyProviders,
        );
        expect(result.current.providers['Lab Order']).toEqual(labProviders);
      });
    });

    it('should handle empty providers response', async () => {
      mockFetchProvidersByTab.mockResolvedValueOnce([]);

      const { result } = renderHook(() => useOrdersStore());

      await act(async () => {
        await result.current.fetchProviders('Rehab Order');
      });

      await waitFor(() => {
        expect(result.current.providers['Rehab Order']).toEqual([]);
      });
    });
  });

  describe('fetchAllPendingOrders', () => {
    beforeEach(() => {
      mockFetchOrders.mockResolvedValue(mockOrderResponse);
    });

    it('should fetch orders for all tabs', async () => {
      const { result } = renderHook(() => useOrdersStore());

      act(() => {
        result.current.setCurrentLocation();
      });

      await act(async () => {
        await result.current.fetchCurrentUser();
      });

      await act(async () => {
        await result.current.fetchAllPendingOrders(mockTabs);
      });

      await waitFor(() => {
        expect(mockFetchOrders).toHaveBeenCalledTimes(2);
        expect(result.current.tabs).toEqual(mockTabs);
      });
    });

    it('should set tab counts correctly', async () => {
      const { result } = renderHook(() => useOrdersStore());

      act(() => {
        result.current.setCurrentLocation();
      });

      await act(async () => {
        await result.current.fetchCurrentUser();
      });

      await act(async () => {
        await result.current.fetchAllPendingOrders(mockTabs);
      });

      await waitFor(() => {
        expect(result.current.tabCounts['Radiology Order']).toBe(1);
        expect(result.current.tabCounts['Lab Order']).toBe(1);
      });
    });

    it('should handle failed order fetches', async () => {
      mockFetchOrders
        .mockResolvedValueOnce(mockOrderResponse)
        .mockRejectedValueOnce(new Error('API Error'));

      const { result } = renderHook(() => useOrdersStore());

      act(() => {
        result.current.setCurrentLocation();
      });

      await act(async () => {
        await result.current.fetchCurrentUser();
      });

      await act(async () => {
        await result.current.fetchAllPendingOrders(mockTabs);
      });

      await waitFor(() => {
        expect(result.current.tabCounts['Radiology Order']).toBe(1);
        expect(result.current.tabCounts['Lab Order']).toBe(0);
        expect(result.current.ordersData['Lab Order']).toEqual([]);
      });
    });

    it('should not fetch when location is missing', async () => {
      mockGetCookieByName.mockReturnValue('');

      const { result } = renderHook(() => useOrdersStore());

      await act(async () => {
        await result.current.fetchAllPendingOrders(mockTabs);
      });

      expect(mockFetchOrders).not.toHaveBeenCalled();
    });

    it('should not fetch when user is missing', async () => {
      mockGetCurrentUser.mockResolvedValue(null as any);

      const { result } = renderHook(() => useOrdersStore());

      act(() => {
        result.current.setCurrentLocation();
      });

      await act(async () => {
        await result.current.fetchCurrentUser();
      });

      await act(async () => {
        await result.current.fetchAllPendingOrders(mockTabs);
      });

      expect(mockFetchOrders).not.toHaveBeenCalled();
    });

    it('should not fetch when tabs array is empty', async () => {
      const { result } = renderHook(() => useOrdersStore());

      act(() => {
        result.current.setCurrentLocation();
      });

      await act(async () => {
        await result.current.fetchCurrentUser();
      });

      await act(async () => {
        await result.current.fetchAllPendingOrders([]);
      });

      expect(mockFetchOrders).not.toHaveBeenCalled();
    });

    it('should set isLoading correctly', async () => {
      const { result } = renderHook(() => useOrdersStore());

      act(() => {
        result.current.setCurrentLocation();
      });

      await act(async () => {
        await result.current.fetchCurrentUser();
      });

      expect(result.current.isLoading).toBe(false);

      const fetchPromise = act(async () => {
        await result.current.fetchAllPendingOrders(mockTabs);
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await fetchPromise;
    });
  });

  describe('fetchOrdersForTab', () => {
    it('should fetch orders for specific tab', async () => {
      mockFetchOrders.mockResolvedValueOnce(mockOrderResponse);

      const { result } = renderHook(() => useOrdersStore());

      act(() => {
        result.current.setCurrentLocation();
      });

      await act(async () => {
        await result.current.fetchCurrentUser();
        await result.current.fetchAllPendingOrders(mockTabs);
      });

      await act(async () => {
        await result.current.fetchOrdersForTab(0);
      });

      await waitFor(() => {
        expect(result.current.ordersData['Radiology Order']).toBeDefined();
      });
    });

    it('should not fetch when tab index is invalid', async () => {
      const { result } = renderHook(() => useOrdersStore());

      await act(async () => {
        await result.current.fetchOrdersForTab(99);
      });

      expect(mockFetchOrders).not.toHaveBeenCalled();
    });
  });

  describe('store state management', () => {
    it('should set selected index', () => {
      const { result } = renderHook(() => useOrdersStore());

      act(() => {
        result.current.setSelectedIndex(2);
      });

      expect(result.current.selectedIndex).toBe(2);
    });

    it('should set isLoading', () => {
      const { result } = renderHook(() => useOrdersStore());

      act(() => {
        result.current.setIsLoading(true);
      });

      expect(result.current.isLoading).toBe(true);

      act(() => {
        result.current.setIsLoading(false);
      });

      expect(result.current.isLoading).toBe(false);
    });

    it('should initialize with correct default values', () => {
      const { result } = renderHook(() => useOrdersStore());

      expect(result.current.selectedIndex).toBe(0);
      expect(result.current.tabs).toEqual([]);
      expect(result.current.tabCounts).toEqual({});
      expect(result.current.isLoading).toBe(false);
      expect(result.current.ordersData).toEqual({});
      expect(result.current.providers).toEqual({});
    });

    it('should maintain state across multiple operations', async () => {
      mockFetchProvidersByTab.mockResolvedValueOnce(mockProviders);

      const { result } = renderHook(() => useOrdersStore());

      act(() => {
        result.current.setSelectedIndex(1);
      });

      await act(async () => {
        await result.current.fetchProviders('Radiology Order');
      });

      expect(result.current.selectedIndex).toBe(1);
      await waitFor(() => {
        expect(result.current.providers['Radiology Order']).toEqual(
          mockProviders,
        );
      });
    });
  });

  describe('setCurrentLocation', () => {
    it('should parse location from cookie', () => {
      const mockLocation = { name: 'Main Hospital', uuid: 'loc-123' };
      mockGetCookieByName.mockReturnValue(
        encodeURIComponent(JSON.stringify(mockLocation)),
      );

      const { result } = renderHook(() => useOrdersStore());

      act(() => {
        result.current.setCurrentLocation();
      });

      expect(result.current.currentLocation).toEqual(mockLocation);
    });

    it('should handle empty cookie gracefully', () => {
      mockGetCookieByName.mockReturnValue('');

      const { result } = renderHook(() => useOrdersStore());

      act(() => {
        result.current.setCurrentLocation();
      });

      // Should not throw error
      expect(result.current.currentLocation).toBeDefined();
    });
  });

  describe('fetchCurrentUser', () => {
    it('should fetch and set current user', async () => {
      const mockUser = {
        uuid: 'user-123',
        username: 'testuser',
        display: 'Test User',
      };
      mockGetCurrentUser.mockResolvedValueOnce(mockUser as any);

      const { result } = renderHook(() => useOrdersStore());

      await act(async () => {
        await result.current.fetchCurrentUser();
      });

      expect(result.current.currentUser).toEqual(mockUser);
    });

    it('should handle null user response', async () => {
      mockGetCurrentUser.mockResolvedValueOnce(null as any);

      const { result } = renderHook(() => useOrdersStore());

      await act(async () => {
        await result.current.fetchCurrentUser();
      });

      // Should not update state when user is null
      expect(result.current.currentUser).toEqual({});
    });
  });
});
