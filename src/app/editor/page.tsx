'use client';

import * as themes from '@uiw/codemirror-themes-all';
import CodeMirror, {
  Extension,
  Prec,
  ReactCodeMirrorProps,
  basicSetup,
  keymap,
} from '@uiw/react-codemirror';
import { insertTab, indentLess, insertNewlineKeepIndent } from '@codemirror/commands';
import {
  CompletionContext,
  CompletionResult,
  autocompletion,
  startCompletion,
} from '@codemirror/autocomplete';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useMemo, useState } from 'react';

const highestPredesenceKeymapExtensions = Prec.highest(
  keymap.of([
    {
      key: 'Tab',
      preventDefault: true,
      run: insertTab,
    },
    {
      key: 'Shift-Tab',
      preventDefault: true,
      run: indentLess,
    },
    {
      key: 'Enter',
      preventDefault: true,
      run: ({ state, dispatch }) => {
        if (state.readOnly) {
          return false;
        }

        return insertNewlineKeepIndent({ state, dispatch });
      },
    },
    {
      key: 'Alt-Space',
      run: startCompletion,
    },
  ])
);

async function myCompletions(context: CompletionContext): Promise<CompletionResult | null> {
  let word = context.matchBefore(/\w*/);

  if (word?.from == word?.to && !context.explicit) return null;

  return {
    from: word?.from as number,
    options: [
      { label: `custom`, type: `custom` },
      { label: `class`, type: `class` },
      { label: `constant`, type: `constant` },
      { label: `enum`, type: `enum` },
      { label: `function`, type: `function` },
      { label: `interface`, type: `interface` },
      { label: `keyword`, type: `keyword` },
      { label: `method`, type: `method` },
      { label: `namespace`, type: `namespace` },
      { label: `property`, type: `property` },
      { label: `text`, type: `text` },
      { label: `type`, type: `type` },
      { label: `variable`, type: `variable`, info: 'Addiotional', detail: 'Addiotional text' },
      { label: `variable1`, type: `variable`, info: 'Addiotional', detail: 'Addiotional text' },
      { label: `variable2`, type: `variable`, info: 'Addiotional', detail: 'Addiotional text' },
      { label: `variable3`, type: `variable`, info: 'Addiotional', detail: 'Addiotional text' },

      {
        label: 'username',
        type: 'keyword',
        apply: '{{ username }}',
        info: 'primitive wordlist - usernames from danielmiessler seclist',
      },

      { label: 'now', type: 'util', apply: new Date().toISOString() },
      { label: 'now2', type: 'util', apply: new Date().toUTCString() },
      { label: 'l unique', type: 'class', apply: 'l unique' },
      { label: 'match something', type: 'keyword', apply: 'haha' },
      { label: 'magic', type: 'text', apply: '⠁⭒*.✩.*⭒⠁', detail: 'macro' },
      { label: 'maaaa2', type: 'text', apply: 'test2', detail: 'Override' },
      { label: 'maaaa1', type: 'text', apply: 'test1', detail: 'macro' },
      { label: 'hello', type: 'variable', info: '(World)' },
      { label: '/x', type: 'variable', info: '(World)', apply: 'Hello World!' },
    ],
  };
}

const extensions: Extension[] = [
  basicSetup({
    foldGutter: true,
    allowMultipleSelections: true,
    highlightActiveLine: true,
    lineNumbers: true,
    defaultKeymap: true,
    autocompletion: true,
    completionKeymap: true,
  }),
  highestPredesenceKeymapExtensions,
  autocompletion({
    defaultKeymap: true,
    activateOnTyping: true,
    activateOnTypingDelay: 0,
    override: [myCompletions],
  }),
];

// gear f013
// gears f085
// wrench f0ad
// toolbox f552

export default function EditorPage(): JSX.Element {
  const [theme, setTheme] = useState<ReactCodeMirrorProps['theme']>('dark');
  const themeOptions = useMemo(
    () =>
      ['dark', 'light']
        .concat(Object.keys(themes))
        .filter(item => typeof themes[item as keyof typeof themes] !== 'function')
        .filter(item => !/^(defaultSettings)/.test(item as keyof typeof themes)),
    []
  );

  return (
    <>
      <div className="mb-5 flex gap-2">
        <Select onValueChange={e => setTheme(e as ReactCodeMirrorProps['theme'])}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Theme" />
          </SelectTrigger>
          <SelectContent>
            {themeOptions.map(e => (
              <SelectItem key={Math.random() + e} value={e}>
                {e}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="max-w-[850px]">
        <CodeMirror
          value={'hello'}
          height="600px"
          autoFocus
          spellCheck
          readOnly={false}
          extensions={extensions}
          //
          theme={(themes[theme as keyof typeof themes] || theme) as ReactCodeMirrorProps['theme']}
        />
      </div>
    </>
  );
}
