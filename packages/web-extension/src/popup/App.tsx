import { useState } from 'react';
import {
  Box,
  Button,
  Center,
  Flex,
  IconButton,
  Spacer,
  Stack,
  Text,
} from '@chakra-ui/react';
import { FiSettings, FiList } from 'react-icons/fi';
import Channel from '../utils/channel';
import { ServiceName } from '../types';
import Browser from 'webextension-polyfill';
const RECORD_BUTTON_SIZE = 5;

const channel = new Channel();

export function App() {
  const [errorMessage, setErrorMessage] = useState('');
  return (
    <Stack spacing={8} direction="column" w={300} padding="5%">
      <Flex>
        <Text fontSize="md" fontWeight="bold">
          RRWeb Recorder
        </Text>
        <Spacer />
        <Stack direction="row">
          <IconButton
            onClick={() => {
              void Browser.tabs.create({ url: '/pages/index.html#/' });
            }}
            size="xs"
            icon={<FiList />}
            aria-label={'Session List'}
          ></IconButton>
          <IconButton
            size="xs"
            icon={<FiSettings />}
            aria-label={'Settings button'}
          ></IconButton>
        </Stack>
      </Flex>
      <Center>
        <Button
          w={`${RECORD_BUTTON_SIZE}rem`}
          h={`${RECORD_BUTTON_SIZE}rem`}
          padding={`${RECORD_BUTTON_SIZE / 2}rem`}
          borderRadius={9999}
          textAlign="center"
          bgColor="gray.100"
          boxSizing="content-box"
          onClick={() => {
            setErrorMessage('');
            void channel.getCurrentTabId().then((tabId) => {
              if (tabId === -1) return;
              void channel
                .requestToTab(tabId, ServiceName.StartRecord, {})
                .then((res) => {
                  console.log(res);
                })
                .catch((error: Error) => {
                  setErrorMessage(error.message);
                });
            });
          }}
        >
          <Box
            bgColor="red.500"
            w={`${RECORD_BUTTON_SIZE}rem`}
            h={`${RECORD_BUTTON_SIZE}rem`}
            borderRadius={9999}
            margin="0"
          />
        </Button>
      </Center>
      {errorMessage !== '' && (
        <Text color="red.500" fontSize="md">
          {errorMessage}
          <br />
          Maybe refresh your current tab.
        </Text>
      )}
      <Button
        onClick={() => {
          void channel.getCurrentTabId().then((tabId) => {
            if (tabId === -1) return;
            void channel
              .requestToTab(tabId, ServiceName.StopRecord, {})
              .then((res) => {
                console.log(res);
              })
              .catch((error: Error) => {
                setErrorMessage(error.message);
              });
          });
        }}
      >
        Stop
      </Button>
    </Stack>
  );
}
