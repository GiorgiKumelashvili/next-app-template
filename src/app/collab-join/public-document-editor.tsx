'use client';
// 'use client';

// import { useCollabStore } from '@/app/collab-join/state';

// export const PublicDocumentEditor = (): JSX.Element => {
//   const x = useCollabStore();

//   return (
//     <>
//       <p>Trying to join</p>
//       <pre>{JSON.stringify(x, null, 2)}</pre>
//     </>
//   );
// };

import * as themes from '@uiw/codemirror-themes-all';
import { toast } from 'sonner';
import { useParams, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import CodeMirror, { ChangeSet, EditorView, Extension, Text } from '@uiw/react-codemirror';

import { bus } from '@/lib/bus';
import { Button } from '@/components/ui/button';
import { markdown } from '@codemirror/lang-markdown';
import { languages } from '@codemirror/language-data';
import { EditorTheme, SocketError } from '@/lib/types';
import { docConfigBundle } from '@/components/app/editor/extensions';
import { copyToClipboard, sleep } from '@/lib/utils';
import { docEditSocketPublic } from '@/app/(auth)/document/[documentId]/_components/socket';
import { getDocumentText, replaceFileStructureText } from '@/lib/api/definitions';
import {
  PeerPlugin,
  peerExtensionCompartment,
} from '@/app/(auth)/document/[documentId]/_components/peer-extensions';
import { constants } from '@/lib/constants';
import {
  useDocStore,
  useDocumentShareStore,
  useDocumentStore,
  useSocketStore,
} from '@/app/(auth)/document/[documentId]/state';
import { useUserStore } from '@/app/(auth)/state';

/**
 * @important
 * ! state given from useRef is only initial state
 * ! if you want to access state current from codemirror 6 then access it view editor.view.state
 */
export const PublicDocumentEditor = (): JSX.Element => {
  const [theme, _setTheme] = useState<EditorTheme>('dark');
  const searchParams = useSearchParams();
  const sharedUniqueHash = searchParams.get(constants.general.querySharedUniqueHash);

  const params = useParams<{ documentId: string }>();
  const editorRef = useRef<{ view: EditorView }>(null);
  const isInitPullDocFull = useRef(true);

  const socketStore = useSocketStore();

  const extensions: Extension[] = useMemo(
    () =>
      docConfigBundle
        .getAllExtension()
        .concat(markdown({ codeLanguages: languages }), peerExtensionCompartment.of([])),
    [],
  );

  const activeTheme = useMemo(
    () => (themes[theme as keyof typeof themes] || theme) as EditorTheme,
    [theme],
  );

  const view = useCallback(
    () => {
      if (!editorRef.current) {
        throw new Error('Editor not found');
      }

      return editorRef.current.view;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [editorRef.current?.view],
  );

  const selectAll = useCallback(() => {
    view().dispatch({
      selection: { anchor: 0, head: view().state.doc.toString().length },
    });

    // focus after selecting all from menubar
    view().focus();
  }, [view]);

  const copySelected = useCallback(() => {
    const selection = view().state.selection.main;

    if (!selection || selection.empty) {
      toast.warning('Nothing was selected');
      return;
    }

    const text = view().state.sliceDoc(selection.from, selection.to);
    copyToClipboard(text);

    toast.success('Copied to clipboard');
    return;
  }, [view]);

  const handleKeyDownGlobally = async (e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 's') {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  useEffect(() => {
    bus.on('editor:select-all', selectAll);
    bus.on('editor:copy', copySelected);
  }, [copySelected, selectAll]);

  useEffect(
    () => {
      window.addEventListener('keydown', handleKeyDownGlobally);

      if (!docEditSocketPublic.connected) {
        docEditSocketPublic.connect();
      }

      docEditSocketPublic.on('connect', async () => {
        console.log('CONNECTEd');
        useSocketStore.getState().setStatus('connected');
      });

      docEditSocketPublic.on('disconnect', () => {
        console.log('CONNECTEd');
        useSocketStore.getState().setStatus('disconnected');
      });

      docEditSocketPublic.on('error', (err: SocketError) => {
        console.log('Socket error', err);
      });

      docEditSocketPublic.io.on('reconnect_attempt', reconnectNumber => {
        console.log('RECONNECT_ATTEMPT', reconnectNumber);
        useSocketStore.getState().setStatus('reconnecting');
      });

      docEditSocketPublic.io.on('reconnect_failed', () => {
        toast.warning('Sorry reconnection failed, click connection indicator to try reconnecting', {
          duration: 10000,
        });

        useSocketStore.getState().setStatus('disconnected');
      });

      // User defined events
      docEditSocketPublic.on(constants.socket.events.PullDocFull, async () => {
        // const { data: text, error } = await getDocumentText(parseInt(params.documentId));
        // if (error || text === undefined) {
        //   toast.error('Sorry, could not load document');
        //   return;
        // }
        // if (isInitPullDocFull.current) {
        //   docStore.setInitDoc(Text.of([text])); // this only works on init
        // } else {
        //   // replace all with new text
        //   view().dispatch({
        //     changes: {
        //       from: 0,
        //       to: view().state.doc.length,
        //       insert: text,
        //     },
        //   });
        // }
        // // disable initial
        // isInitPullDocFull.current = false;
        // // loading state for modal button and also readonly state for editor will be resolved in socket event response
        // docStore.setReadonly(false);
        // documentShareStore.setIsLoading(false);
      });

      docEditSocketPublic.on(constants.socket.events.PullDoc, (data: unknown) => {
        //! Here we might need some kind of locker so that while pulldocfull is running we can't dispatch anything
        // view().dispatch({
        //   scrollIntoView: false,
        //   changes: ChangeSet.fromJSON(data),
        // });
      });

      docEditSocketPublic.on(constants.socket.events.RetryConnection, async () => {
        docEditSocketPublic.disconnect();
        await sleep(1000);
        docEditSocketPublic.connect();
      });

      return () => {
        window.removeEventListener('keydown', handleKeyDownGlobally);

        // native events
        docEditSocketPublic.off('connect');
        docEditSocketPublic.off('disconnect');
        docEditSocketPublic.off('error');

        docEditSocketPublic.io.off('reconnect_attempt');
        docEditSocketPublic.io.off('reconnect_failed');

        docEditSocketPublic.off(constants.socket.events.PullDocFull);
        docEditSocketPublic.off(constants.socket.events.RetryConnection);

        docEditSocketPublic.disconnect();

        socketStore.clear();
      };
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  return (
    <>
      <>
        {/* <p>readonly: {!!docStore.readonly ? 'yes' : 'no'}</p> */}
        {/* <p>doc share: {JSON.stringify(documentShareStore)} </p> */}
        <div className="flex">
          <p>sock status: {socketStore.status} </p>
          {socketStore.status === 'connected' ? (
            <div className="w-5 h-5 bg-green-500 rounded-full"></div>
          ) : (
            <div className="w-5 h-5 bg-red-500 rounded-full"></div>
          )}
        </div>

        <Button
          onClick={() => {
            // insert new text at the end of line
            view().dispatch({
              changes: {
                from: view().state.doc.toString().length,
                insert: Text.of([
                  'Hello',
                  'World',
                  'Hello'.repeat(10),
                  ...Array.from({ length: 100 }, (_, i) => `Test ${i}`),
                ]).toString(),
              },
            });
          }}
        >
          instert big text
        </Button>
        <Button onClick={() => selectAll()}>select all</Button>
        <Button
          onClick={() => {
            docEditSocketPublic.connect();
          }}
        >
          connect
        </Button>
        <Button onClick={() => docEditSocketPublic.emit('test')}>test</Button>
        <Button onClick={() => docEditSocketPublic.disconnect()}>disconnect</Button>
        <Button onClick={() => docEditSocketPublic.io.engine.close()}>low-level diconnect</Button>
        <Button
          onClick={() => {
            bus.emit('open:global-model', {
              type: 'notification',
              message: 'this is message',
              title: 'this is ttitle',
              onClose: () => {
                console.log(123);
              },
            });
          }}
        >
          test (open:global-model)
        </Button>
      </>

      <CodeMirror
        ref={editorRef}
        value=""
        // value={docStore.initDoc?.toString()}
        width="1050px"
        className="w-fit mx-auto h-full cm-custom"
        autoFocus
        onUpdate={update => {
          if (update.docChanged && update.selectionSet) {
            if (!update.changes.length) {
              return;
            }

            const data = {
              changes: update.changes.toJSON(),
              sharedUniqueHash,
            };

            docEditSocketPublic.emit(constants.socket.events.PushDoc, data);
          }
        }}
        spellCheck
        // editable={!docStore.readonly}
        // readOnly={docStore.readonly}
        basicSetup={{
          ...docConfigBundle.basicSetupOption,
          lineNumbers: false,
          // highlightActiveLine: !docStore.readonly,
          // highlightActiveLineGutter: !docStore.readonly,
        }}
        extensions={extensions}
        theme={activeTheme}
      />
    </>
  );
};
