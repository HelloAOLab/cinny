import React, { useState } from 'react';
import { Icon, Icons } from 'folds';
import { SidebarAvatar, SidebarItem, SidebarItemTooltip } from '../../../components/sidebar';
import { useClientConfig } from '../../../hooks/useClientConfig';
import { RegistrationLinkDialog } from '../../../components/RegistrationLinkDialog';

export function InviteTab() {
  const { registrationBot } = useClientConfig();
  const [open, setOpen] = useState(false);

  if (!registrationBot) return null;

  return (
    <SidebarItem active={open}>
      <SidebarItemTooltip tooltip="Invite">
        {(triggerRef) => (
          <SidebarAvatar as="button" ref={triggerRef} outlined onClick={() => setOpen(true)}>
            <Icon src={Icons.UserPlus} />
          </SidebarAvatar>
        )}
      </SidebarItemTooltip>
      {open && (
        <RegistrationLinkDialog botConfig={registrationBot} requestClose={() => setOpen(false)} />
      )}
    </SidebarItem>
  );
}
