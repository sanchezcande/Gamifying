import React from 'react';
import { I18nProvider } from '../i18n/I18nProvider';
import { AuthProvider } from './AuthProvider';
import { AvatarProvider } from './AvatarProvider';
import { LeaderboardProvider } from './LeaderboardProvider';
import { ShopProvider } from './ShopProvider';
import { BattleProvider } from './BattleProvider';

export default function AppProviders({ children }) {
  return (
    <I18nProvider>
      <AuthProvider>
        <AvatarProvider>
          <LeaderboardProvider>
            <ShopProvider>
              <BattleProvider>{children}</BattleProvider>
            </ShopProvider>
          </LeaderboardProvider>
        </AvatarProvider>
      </AuthProvider>
    </I18nProvider>
  );
}
