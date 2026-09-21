import React, { useCallback, useState } from 'react';
import FocusTrap from 'focus-trap-react';
import { QRCodeSVG } from 'qrcode.react';
import {
  Dialog,
  Overlay,
  OverlayCenter,
  OverlayBackdrop,
  Header,
  config,
  Box,
  Text,
  Button,
  Spinner,
  color,
  Input,
  IconButton,
  Icon,
  Icons,
} from 'folds';
import { useMatrixClient } from '../hooks/useMatrixClient';
import { AsyncStatus, useAsyncCallback } from '../hooks/useAsyncCallback';
import { stopPropagation } from '../utils/keyboard';
import {
  RegistrationBotConfig,
  RegistrationLinkResult,
  requestRegistrationLink,
} from '../plugins/registration-bot';
import { copyToClipboard } from '../utils/dom';

type RegistrationLinkDialogProps = {
  botConfig: RegistrationBotConfig;
  requestClose: () => void;
};

export function RegistrationLinkDialog({ botConfig, requestClose }: RegistrationLinkDialogProps) {
  const mx = useMatrixClient();
  const [copied, setCopied] = useState(false);

  const [linkState, getLink] = useAsyncCallback<RegistrationLinkResult, Error, []>(
    useCallback(() => requestRegistrationLink(mx, botConfig), [mx, botConfig])
  );

  const loading = linkState.status === AsyncStatus.Loading;
  const result = linkState.status === AsyncStatus.Success ? linkState.data : undefined;

  const handleCopy = () => {
    if (!result?.success) return;
    copyToClipboard(result.link);
    setCopied(true);
  };

  return (
    <Overlay open backdrop={<OverlayBackdrop />}>
      <OverlayCenter>
        <FocusTrap
          focusTrapOptions={{
            initialFocus: false,
            onDeactivate: requestClose,
            clickOutsideDeactivates: true,
            escapeDeactivates: stopPropagation,
          }}
        >
          <Dialog variant="Surface">
            <Header
              style={{
                padding: `0 ${config.space.S200} 0 ${config.space.S400}`,
                borderBottomWidth: config.borderWidth.B300,
              }}
              variant="Surface"
              size="500"
            >
              <Box grow="Yes">
                <Text size="H4">Get Registration Link</Text>
              </Box>
              <IconButton size="300" onClick={requestClose} radii="300">
                <Icon src={Icons.Cross} />
              </IconButton>
            </Header>
            <Box style={{ padding: config.space.S400 }} direction="Column" gap="400">
              <Text priority="400">
                Ask the registration bot for a single-use link you can send to someone to invite
                them to this homeserver.
              </Text>
              {linkState.status === AsyncStatus.Error && (
                <Text style={{ color: color.Critical.Main }} size="T300">
                  {linkState.error.message}
                </Text>
              )}
              {result && !result.success && (
                <Text style={{ color: color.Critical.Main }} size="T300">
                  {result.error.message}
                </Text>
              )}
              {result?.success && (
                <Box direction="Column" gap="200">
                  <Input readOnly variant="SurfaceVariant" value={result.link} />
                  <Button
                    variant="Secondary"
                    fill="Soft"
                    onClick={handleCopy}
                    before={<Icon size="100" src={Icons.Link} />}
                  >
                    <Text size="B400">{copied ? 'Copied!' : 'Copy Link'}</Text>
                  </Button>
                  <Box justifyContent="Center" style={{ padding: config.space.S200 }}>
                    <Box
                      style={{
                        background: color.Surface.Container,
                        padding: config.space.S200,
                        borderRadius: config.radii.R400,
                      }}
                    >
                      <QRCodeSVG value={result.link} size={200} marginSize={0} />
                    </Box>
                  </Box>
                </Box>
              )}
              <Box direction="Column" gap="200">
                {!result?.success && (
                  <Button
                    variant="Primary"
                    onClick={getLink}
                    disabled={loading}
                    before={loading && <Spinner variant="Primary" fill="Solid" size="200" />}
                  >
                    <Text size="B400">{loading ? 'Getting Link…' : 'Get Registration Link'}</Text>
                  </Button>
                )}
                <Button variant="Secondary" fill="Soft" onClick={requestClose} disabled={loading}>
                  <Text size="B400">{result?.success ? 'Close' : 'Cancel'}</Text>
                </Button>
              </Box>
            </Box>
          </Dialog>
        </FocusTrap>
      </OverlayCenter>
    </Overlay>
  );
}
