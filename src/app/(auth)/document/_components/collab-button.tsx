'use client';

import { toast } from 'sonner';
import { Icon } from '@iconify/react';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { LoadingIcon } from '@/components/icons';
import { cn, copyToClipboard } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useCollabButtonStore } from '@/app/(auth)/document/_components/collab-button.state';
import {
  createFileStructurePublicShare,
  getFileStructurePublicShare,
  updateFileStructurePublicShare,
} from '@/lib/api/definitions';

export const CollabButton = () => {
  const collabButtonStore = useCollabButtonStore();
  const params = useParams<{ documentId: string }>();
  const [isCopied, setIsCopied] = useState(false);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  const enableSharingDocument = async () => {
    const documentId = parseInt(params.documentId);

    if (!documentId) {
      toast.warning('Something went wrong, please try again');
      return;
    }

    collabButtonStore.setIsLoading(true);

    // this is for toggling state if exists share data already
    if (collabButtonStore.data) {
      const isDisabled = !collabButtonStore.data.isDisabled;

      const { data, error } = await updateFileStructurePublicShare(collabButtonStore.data.id, {
        isDisabled,
      });

      if (error || !data) {
        collabButtonStore.setAll({
          isLoading: false,
        });

        return;
      }

      collabButtonStore.setAll({
        isLoading: false,
        data,
      });
      return;
    }

    // this is for creating only
    const { data, error } = await createFileStructurePublicShare(documentId);

    if (error || !data) {
      return collabButtonStore.setAll({ isLoading: false });
    }

    return collabButtonStore.setAll({ isLoading: false, data });
  };

  const getFileStructurePublicShareInit = useCallback(async () => {
    const documentId = parseInt(params.documentId);

    if (!documentId) {
      toast.warning('Something went wrong, please try again');
      return;
    }

    // to avoid unnecessary click from modal
    collabButtonStore.setModalDisabled(true);

    const { data, error } = await getFileStructurePublicShare(documentId);

    if (error || !data) {
      return collabButtonStore.setAll({ isModalDisabled: false, data: null });
    }

    return collabButtonStore.setAll({ isModalDisabled: false, data });
  }, [collabButtonStore, params.documentId]);

  useEffect(
    () => {
      getFileStructurePublicShareInit();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const onCopy = useCallback(async (value: string) => {
    setIsCopied(true);
    copyToClipboard(value);

    toast.success('Copied to clipboard');
  }, []);

  return (
    <>
      <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
        <PopoverTrigger asChild>
          <Button variant="default" className="rounded-full">
            <Icon icon="fluent:people-team-20-filled" className="mr-2 text-xl" />
            Collab
          </Button>
        </PopoverTrigger>

        <PopoverContent
          className="p-1.5 min-w-96 mr-16 mt-2"
          onCloseAutoFocus={() => setIsCopied(false)}
        >
          <div className={cn({ 'pointer-events-none': collabButtonStore.isModalDisabled })}>
            <Alert className="border-none">
              <Icon icon="mdi:invite" className="text-xl !top-3" />
              <AlertTitle className="flex">
                <p>Invite Link</p>
              </AlertTitle>

              <AlertDescription className="text-muted-foreground">
                {collabButtonStore.data && !collabButtonStore.data.isDisabled ? (
                  <>
                    <div>
                      Do not share this link with anyone you do not want to collaborate with !
                    </div>
                    <div className="flex w-full items-center space-x-2 mt-3">
                      <Input
                        className="flex-1 cursor-default"
                        value={collabButtonStore.data.joinLink}
                        tabIndex={-1}
                        autoFocus={false}
                        readOnly
                      />
                      <Button
                        onClick={() => onCopy(collabButtonStore?.data?.joinLink ?? '')}
                        className="w-16"
                        variant="outline"
                      >
                        {isCopied ? 'Copied' : 'Copy'}
                      </Button>
                    </div>
                  </>
                ) : (
                  <div>Make this document shareable with anyone</div>
                )}

                <div className="flex justify-end mt-4">
                  {collabButtonStore.data && !collabButtonStore.data.isDisabled ? (
                    <>
                      <Button disabled variant="outline">
                        Regen (soon)
                      </Button>
                    </>
                  ) : null}

                  <Button disabled={collabButtonStore.isLoading} onClick={enableSharingDocument}>
                    {collabButtonStore.isLoading ? <LoadingIcon className="mr-2" /> : null}
                    {collabButtonStore.data && !collabButtonStore.data.isDisabled
                      ? 'Disable'
                      : 'Enable'}
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          </div>
        </PopoverContent>
      </Popover>
    </>
  );
};
