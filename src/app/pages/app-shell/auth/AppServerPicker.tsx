import React, {
  ChangeEventHandler,
  KeyboardEventHandler,
  useEffect,
  useRef,
  useState,
} from 'react';
import { useDebounce } from '../../../hooks/useDebounce';
import * as css from './AppServerPicker.css';

const CHEVRON_ICON = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

type AppServerPickerProps = {
  server: string;
  serverList: string[];
  allowCustomServer?: boolean;
  onServerChange: (server: string) => void;
};

export function AppServerPicker({
  server,
  serverList,
  allowCustomServer,
  onServerChange,
}: AppServerPickerProps) {
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceServerSelect = useDebounce(onServerChange, { wait: 700 });

  useEffect(() => {
    if (inputRef.current && inputRef.current.value !== server) {
      inputRef.current.value = server;
    }
  }, [server]);

  const handleChange: ChangeEventHandler<HTMLInputElement> = (evt) => {
    const value = evt.target.value.trim();
    if (value) debounceServerSelect(value);
  };

  const handleKeyDown: KeyboardEventHandler<HTMLInputElement> = (evt) => {
    if (evt.key === 'Enter') {
      evt.preventDefault();
      const value = evt.currentTarget.value.trim();
      if (value) onServerChange(value);
    }
  };

  const handleSelect = (selected: string) => {
    onServerChange(selected);
    setOpen(false);
  };

  const showToggle = serverList.length > 0 && (allowCustomServer || serverList.length > 1);

  return (
    <div className={css.Wrapper}>
      <div className={css.InputRow}>
        <input
          ref={inputRef}
          className={css.Input}
          defaultValue={server}
          readOnly={!allowCustomServer}
          onChange={allowCustomServer ? handleChange : undefined}
          onKeyDown={allowCustomServer ? handleKeyDown : undefined}
          onClick={!allowCustomServer ? () => setOpen((o) => !o) : undefined}
        />
        {showToggle && (
          <button
            type="button"
            aria-label="Choose homeserver"
            className={css.ToggleButton}
            onClick={() => setOpen((o) => !o)}
          >
            {CHEVRON_ICON}
          </button>
        )}
      </div>
      {open && showToggle && (
        <div className={css.List}>
          {serverList.map((serverName) => (
            <button
              key={serverName}
              type="button"
              className={css.ListItem}
              onClick={() => handleSelect(serverName)}
            >
              {serverName}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
