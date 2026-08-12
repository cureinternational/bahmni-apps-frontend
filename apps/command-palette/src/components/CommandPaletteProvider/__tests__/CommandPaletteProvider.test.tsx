import { render, screen } from '@testing-library/react';
import { ReactNode } from 'react';
import { MemoryRouter } from 'react-router-dom';
import {
  DEFAULT_TRIGGER,
  DEFAULT_PATIENT_FIELDS,
} from '../../../constants/app';
import { useCommandPaletteConfig } from '../../../hooks/useCommandPaletteConfig';
import { CommandPaletteProvider } from '../CommandPaletteProvider';

jest.mock('../../../hooks/useCommandPaletteConfig');

jest.mock('@bahmni/widgets', () => ({
  CommandPaletteProvider: ({ children }: { children: ReactNode }) => (
    <div data-testid="widget-provider">{children}</div>
  ),
}));

const mockUseCommandPaletteConfig =
  useCommandPaletteConfig as jest.MockedFunction<
    typeof useCommandPaletteConfig
  >;

const defaultConfig = {
  navItems: [],
  patientActions: [],
  patientFieldsConfig: DEFAULT_PATIENT_FIELDS,
  trigger: DEFAULT_TRIGGER,
  searchAnnotations: [],
};

describe('CommandPaletteProvider', () => {
  beforeEach(() => {
    localStorage.setItem('enableCommandPalette', 'true');
    mockUseCommandPaletteConfig.mockReturnValue(defaultConfig);
  });
  afterEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  it('renders children inside the widget provider', () => {
    render(
      <MemoryRouter>
        <CommandPaletteProvider>
          <span>child content</span>
        </CommandPaletteProvider>
      </MemoryRouter>,
    );

    expect(screen.getByTestId('widget-provider')).toBeInTheDocument();
    expect(screen.getByText('child content')).toBeInTheDocument();
  });

  it('does not render the widget provider when command palette is disabled', () => {
    localStorage.setItem('enableCommandPalette', 'false');

    render(
      <MemoryRouter>
        <CommandPaletteProvider>
          <span>child content</span>
        </CommandPaletteProvider>
      </MemoryRouter>,
    );

    expect(screen.queryByTestId('widget-provider')).not.toBeInTheDocument();
    expect(screen.getByText('child content')).toBeInTheDocument();
  });
});
