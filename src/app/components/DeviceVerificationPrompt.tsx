import React, { CSSProperties, useState } from 'react';
import {
  Box,
  config,
  Dialog,
  Header,
  Icon,
  IconButton,
  Icons,
  Overlay,
  OverlayBackdrop,
  OverlayCenter,
  Text,
} from 'folds';
import FocusTrap from 'focus-trap-react';
import { useMatrixClient } from '../hooks/useMatrixClient';
import { useCrossSigningActive } from '../hooks/useCrossSigning';
import {
  useDeviceVerificationStatus,
  VerificationStatus,
} from '../hooks/useDeviceVerificationStatus';
import { useDeviceList, useSplitCurrentDevice } from '../hooks/useDeviceList';
import {
  useSecretStorageDefaultKeyId,
  useSecretStorageKeyContent,
} from '../hooks/useSecretStorage';
import { ManualVerificationTile } from './ManualVerification';
import { LearnStartVerificationFromOtherDevice } from '../features/settings/devices/Verification';

const DialogHeaderStyles: CSSProperties = {
  padding: `0 ${config.space.S200} 0 ${config.space.S400}`,
  borderBottomWidth: config.borderWidth.B300,
};

export function DeviceVerificationPrompt() {
  const mx = useMatrixClient();
  const crypto = mx.getCrypto();
  const crossSigningActive = useCrossSigningActive();

  const [devices] = useDeviceList();
  const [currentDevice] = useSplitCurrentDevice(devices);
  const verificationStatus = useDeviceVerificationStatus(
    crypto,
    mx.getSafeUserId(),
    currentDevice?.device_id
  );

  const defaultSecretStorageKeyId = useSecretStorageDefaultKeyId();
  const defaultSecretStorageKeyContent = useSecretStorageKeyContent(
    defaultSecretStorageKeyId ?? ''
  );

  const [dismissed, setDismissed] = useState(false);

  const shouldShow =
    !dismissed && crossSigningActive && verificationStatus === VerificationStatus.Unverified;

  if (!shouldShow) return null;

  return (
    <Overlay open backdrop={<OverlayBackdrop />}>
      <OverlayCenter>
        <FocusTrap
          focusTrapOptions={{
            initialFocus: false,
            clickOutsideDeactivates: false,
            escapeDeactivates: false,
          }}
        >
          <Dialog variant="Surface">
            <Header style={DialogHeaderStyles} variant="Surface" size="500">
              <Box grow="Yes">
                <Text size="H4">Verify This Session</Text>
              </Box>
              <IconButton size="300" radii="300" onClick={() => setDismissed(true)}>
                <Icon src={Icons.Cross} />
              </IconButton>
            </Header>
            <Box style={{ padding: config.space.S400 }} direction="Column" gap="400">
              <Text size="T300">
                This session is not verified. Verify it to access your encrypted message history and
                confirm your identity to the people you chat with.
              </Text>
              <LearnStartVerificationFromOtherDevice />
              {defaultSecretStorageKeyId && defaultSecretStorageKeyContent && (
                <ManualVerificationTile
                  secretStorageKeyId={defaultSecretStorageKeyId}
                  secretStorageKeyContent={defaultSecretStorageKeyContent}
                />
              )}
            </Box>
          </Dialog>
        </FocusTrap>
      </OverlayCenter>
    </Overlay>
  );
}
