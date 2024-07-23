'use client';

import { ReactChildren } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';
import { bus } from '@/lib/event-bus';
import { Card } from '@/components/ui/card';
import { CustomGlobalModal } from '@/components/ui/custom-global-modal';

export const SettingsProvider = ({ children }: ReactChildren): JSX.Element => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    bus.subscribe('open:settings', () => {
      console.log('open:settings');
      setIsOpen(() => true);
    });
  }, []);

  return (
    <>
      <CustomGlobalModal isOpen={isOpen} setIsOpen={setIsOpen}>
        <Card className="p-4 min-w-[650px]">
          <h1 className="text-xl font-semibold">Settings</h1>

          <p className="mt-2 text-sm/6">in progress ...</p>

          <div className="mt-4">
            <Button onClick={() => setIsOpen(false)}>Got it, thanks!</Button>
          </div>
        </Card>
      </CustomGlobalModal>

      {children}
    </>
  );
};
