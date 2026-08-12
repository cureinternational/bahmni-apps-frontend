import { CommandPaletteProvider as WidgetCommandPaletteProvider } from '@bahmni/widgets';
import React, { type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { COMMAND_PALETTE_ENABLED_STORAGE_KEY } from '../../constants/app';
import { useCommandPaletteConfig } from '../../hooks/useCommandPaletteConfig';

interface CommandPaletteProviderProps {
  children?: ReactNode;
  portalContainer?: Element | DocumentFragment;
}

const EnabledCommandPaletteProvider: React.FC<CommandPaletteProviderProps> = ({
  children,
  portalContainer,
}) => {
  const config = useCommandPaletteConfig();

  return (
    <WidgetCommandPaletteProvider {...config} portalContainer={portalContainer}>
      {children}
    </WidgetCommandPaletteProvider>
  );
};

export const CommandPaletteProvider: React.FC<CommandPaletteProviderProps> = ({
  children,
  portalContainer,
}) => {
  const { pathname } = useLocation();
  const isCommandPaletteEnabled =
    localStorage.getItem(COMMAND_PALETTE_ENABLED_STORAGE_KEY) === 'true';
  const isLoginLocationPage =
    pathname === '/loginLocation' || window.location.hash === '#/loginLocation';

  if (!isCommandPaletteEnabled || isLoginLocationPage) {
    return children;
  }

  return (
    <EnabledCommandPaletteProvider portalContainer={portalContainer}>
      {children}
    </EnabledCommandPaletteProvider>
  );
};

CommandPaletteProvider.displayName = 'BahmniCommandPaletteProvider';
