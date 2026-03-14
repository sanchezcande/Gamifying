import React from 'react';
import { AuthProvider } from './AuthProvider';
import { AvatarProvider } from './AvatarProvider';
import { LeaderboardProvider } from './LeaderboardProvider';
import { ShopProvider } from './ShopProvider';
import { BattleProvider } from './BattleProvider';

export default function AppProviders({ children }) {
  return (
    <AuthProvider>
      <AvatarProvider>
        <LeaderboardProvider>
          <ShopProvider>
            <BattleProvider>{children}</BattleProvider>
          </ShopProvider>
        </LeaderboardProvider>
      </AvatarProvider>
    </AuthProvider>
  );
}
