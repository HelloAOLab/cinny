import React from 'react';
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
  Chip,
} from 'folds';
import { stopPropagation } from '../utils/keyboard';
import { RegistrationBotConfig } from '../plugins/registration-bot';
import { useRegistrationLink } from '../hooks/useRegistrationLink';

type RegistrationLinkDialogProps = {
  botConfig: RegistrationBotConfig;
  requestClose: () => void;
};

export function RegistrationLinkDialog({ botConfig, requestClose }: RegistrationLinkDialogProps) {
  const {
    clients,
    clientsLoading,
    clientId,
    setClientId,
    loading,
    link,
    error,
    getLink,
    copied,
    copyLink,
  } = useRegistrationLink(botConfig);

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
              {clients && clients.length > 1 && !link && (
                <Box direction="Column" gap="200">
                  <Text size="L400">Client</Text>
                  <Box wrap="Wrap" gap="100">
                    {clients.map((client) => (
                      <Chip
                        key={client.id}
                        variant={clientId === client.id ? 'Primary' : 'SurfaceVariant'}
                        aria-pressed={clientId === client.id}
                        outlined={clientId === client.id}
                        radii="300"
                        onClick={() => setClientId(client.id)}
                        type="button"
                        disabled={loading}
                      >
                        <Text truncate size="T300">
                          {client.id}
                        </Text>
                      </Chip>
                    ))}
                  </Box>
                </Box>
              )}
              {error && (
                <Text style={{ color: color.Critical.Main }} size="T300">
                  {error}
                </Text>
              )}
              {link && (
                <Box direction="Column" gap="200">
                  <Input readOnly variant="SurfaceVariant" value={link} />
                  <Button
                    variant="Secondary"
                    fill="Soft"
                    onClick={copyLink}
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
                      <QRCodeSVG value={link} size={200} marginSize={0} />
                    </Box>
                  </Box>
                </Box>
              )}
              <Box direction="Column" gap="200">
                {!link && (
                  <Button
                    variant="Primary"
                    onClick={getLink}
                    disabled={loading || clientsLoading}
                    before={loading && <Spinner variant="Primary" fill="Solid" size="200" />}
                  >
                    <Text size="B400">{loading ? 'Getting Link…' : 'Get Registration Link'}</Text>
                  </Button>
                )}
                <Button variant="Secondary" fill="Soft" onClick={requestClose} disabled={loading}>
                  <Text size="B400">{link ? 'Close' : 'Cancel'}</Text>
                </Button>
              </Box>
            </Box>
          </Dialog>
        </FocusTrap>
      </OverlayCenter>
    </Overlay>
  );
}
