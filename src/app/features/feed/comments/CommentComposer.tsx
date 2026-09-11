import React, { KeyboardEventHandler, MouseEventHandler, useCallback, useState } from 'react';
import { IContent, MsgType, RelationType, Room } from 'matrix-js-sdk';
import { Editor } from 'slate';
import { ReactEditor } from 'slate-react';
import { isKeyHotkey } from 'is-hotkey';
import { Box, Icon, IconButton, Icons, Line, PopOut, RectCords } from 'folds';
import {
  AUTOCOMPLETE_PREFIXES,
  AutocompletePrefix,
  AutocompleteQuery,
  CustomEditor,
  EmoticonAutocomplete,
  RoomMentionAutocomplete,
  Toolbar,
  UserMentionAutocomplete,
  createEmoticonElement,
  customHtmlEqualsPlainText,
  getAutocompleteQuery,
  getMentions,
  getPrevWordRange,
  isEmptyEditor,
  moveCursor,
  resetEditor,
  resetEditorHistory,
  toMatrixCustomHTML,
  toPlainText,
  trimCustomHtml,
} from '../../../components/editor';
import { EmojiBoard } from '../../../components/emoji-board';
import { UseStateProvider } from '../../../components/UseStateProvider';
import { useMatrixClient } from '../../../hooks/useMatrixClient';
import { useComposingCheck } from '../../../hooks/useComposingCheck';
import { useSetting } from '../../../state/hooks/settings';
import { settingsAtom } from '../../../state/settings';
import { getMentionContent } from '../../../utils/room';
import { mobileOrTablet } from '../../../utils/user-agent';

type CommentComposerProps = {
  editor: Editor;
  room: Room;
  rootEventId: string;
  imagePackRooms: Room[];
};
export function CommentComposer({
  editor,
  room,
  rootEventId,
  imagePackRooms,
}: CommentComposerProps) {
  const mx = useMatrixClient();
  const [enterForNewline] = useSetting(settingsAtom, 'enterForNewline');
  const [globalToolbar] = useSetting(settingsAtom, 'editorToolbar');
  const [isMarkdown] = useSetting(settingsAtom, 'isMarkdown');
  const [toolbar, setToolbar] = useState(globalToolbar);
  const isComposing = useComposingCheck();

  const [autocompleteQuery, setAutocompleteQuery] =
    useState<AutocompleteQuery<AutocompletePrefix>>();

  const submit = useCallback(() => {
    if (isEmptyEditor(editor)) return;

    const plainText = toPlainText(editor.children, isMarkdown).trim();
    const customHtml = trimCustomHtml(
      toMatrixCustomHTML(editor.children, {
        allowTextFormatting: true,
        allowBlockMarkdown: isMarkdown,
        allowInlineMarkdown: isMarkdown,
      })
    );
    if (plainText === '') return;

    const mentionData = getMentions(mx, room.roomId, editor);
    const mMentions = getMentionContent(Array.from(mentionData.users), mentionData.room);

    const content: IContent = {
      msgtype: MsgType.Text,
      body: plainText,
      'm.mentions': mMentions,
      'm.relates_to': {
        rel_type: RelationType.Thread,
        event_id: rootEventId,
        is_falling_back: true,
        'm.in_reply_to': {
          event_id: rootEventId,
        },
      },
    };
    if (!customHtmlEqualsPlainText(customHtml, plainText)) {
      content.format = 'org.matrix.custom.html';
      content.formatted_body = customHtml;
    }

    mx.sendMessage(room.roomId, content as any);
    resetEditor(editor);
    resetEditorHistory(editor);
  }, [mx, room, rootEventId, editor, isMarkdown]);

  const handleKeyDown: KeyboardEventHandler = useCallback(
    (evt) => {
      if (
        (isKeyHotkey('mod+enter', evt) || (!enterForNewline && isKeyHotkey('enter', evt))) &&
        !isComposing(evt)
      ) {
        evt.preventDefault();
        submit();
      }
    },
    [submit, enterForNewline, isComposing]
  );

  const handleKeyUp: KeyboardEventHandler = useCallback(
    (evt) => {
      if (isKeyHotkey('escape', evt)) {
        evt.preventDefault();
        return;
      }
      const prevWordRange = getPrevWordRange(editor);
      const query = prevWordRange
        ? getAutocompleteQuery<AutocompletePrefix>(editor, prevWordRange, AUTOCOMPLETE_PREFIXES)
        : undefined;
      setAutocompleteQuery(query);
    },
    [editor]
  );

  const handleCloseAutocomplete = useCallback(() => {
    ReactEditor.focus(editor);
    setAutocompleteQuery(undefined);
  }, [editor]);

  const handleEmoticonSelect = (key: string, shortcode: string) => {
    editor.insertNode(createEmoticonElement(key, shortcode));
    moveCursor(editor);
  };

  return (
    <>
      {autocompleteQuery?.prefix === AutocompletePrefix.RoomMention && (
        <RoomMentionAutocomplete
          roomId={room.roomId}
          editor={editor}
          query={autocompleteQuery}
          requestClose={handleCloseAutocomplete}
        />
      )}
      {autocompleteQuery?.prefix === AutocompletePrefix.UserMention && (
        <UserMentionAutocomplete
          room={room}
          editor={editor}
          query={autocompleteQuery}
          requestClose={handleCloseAutocomplete}
        />
      )}
      {autocompleteQuery?.prefix === AutocompletePrefix.Emoticon && (
        <EmoticonAutocomplete
          imagePackRooms={imagePackRooms}
          editor={editor}
          query={autocompleteQuery}
          requestClose={handleCloseAutocomplete}
        />
      )}
      <CustomEditor
        editableName="CommentComposer"
        editor={editor}
        placeholder="Write a comment..."
        onKeyDown={handleKeyDown}
        onKeyUp={handleKeyUp}
        after={
          <>
            <IconButton
              variant="SurfaceVariant"
              size="300"
              radii="300"
              onClick={() => setToolbar(!toolbar)}
            >
              <Icon size="400" src={toolbar ? Icons.AlphabetUnderline : Icons.Alphabet} />
            </IconButton>
            <UseStateProvider initial={undefined}>
              {(anchor: RectCords | undefined, setAnchor) => (
                <PopOut
                  anchor={anchor}
                  alignOffset={-8}
                  position="Top"
                  align="End"
                  content={
                    <EmojiBoard
                      imagePackRooms={imagePackRooms}
                      returnFocusOnDeactivate={false}
                      onEmojiSelect={handleEmoticonSelect}
                      onCustomEmojiSelect={handleEmoticonSelect}
                      requestClose={() => {
                        setAnchor((v) => {
                          if (v) {
                            if (!mobileOrTablet()) ReactEditor.focus(editor);
                            return undefined;
                          }
                          return v;
                        });
                      }}
                    />
                  }
                >
                  <IconButton
                    aria-pressed={anchor !== undefined}
                    onClick={
                      ((evt) =>
                        setAnchor(
                          evt.currentTarget.getBoundingClientRect()
                        )) as MouseEventHandler<HTMLButtonElement>
                    }
                    variant="SurfaceVariant"
                    size="300"
                    radii="300"
                  >
                    <Icon size="400" src={Icons.Smile} filled={anchor !== undefined} />
                  </IconButton>
                </PopOut>
              )}
            </UseStateProvider>
            <IconButton onClick={submit} variant="SurfaceVariant" size="300" radii="300">
              <Icon src={Icons.Send} />
            </IconButton>
          </>
        }
        bottom={
          toolbar && (
            <Box direction="Column">
              <Line variant="SurfaceVariant" size="300" />
              <Toolbar />
            </Box>
          )
        }
      />
    </>
  );
}
