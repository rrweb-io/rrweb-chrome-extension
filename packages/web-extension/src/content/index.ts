import Browser from 'webextension-polyfill';
import { nanoid } from 'nanoid';
import type { eventWithTime } from 'rrweb/typings/types';
import {
  LocalData,
  LocalDataKey,
  ServiceName,
  Session,
  SyncData,
} from '../types';
import Channel from '../utils/channel';

const channel = new Channel();
type StartRecordResponse = {
  message: 'start-record-response';
  startTimeStamp: number;
};
type StopRecordResponse = {
  message: 'stop-record-response';
  events: eventWithTime[];
  endTimestamp: number;
};
void (async () => {
  const data = await Browser.storage.local.get('recorder_code');
  const recorderCode = data['recorder_code'] as string | undefined;
  if (!recorderCode || recorderCode.length === 0) return;

  const scriptEl = document.createElement('script');
  scriptEl.textContent = `
	${recorderCode}
  let events = [];
  let stopFn = null;
  let recording = false;
  
  function record() {
    if (stopFn) stopFn();
    events = [];
    let recorder;
    try {
      recorder = rrwebRecord;
    } catch (e) {
      recorder = rrweb.record;
    }
    stopFn = recorder({
      emit: (event) => {
        events.push(event);
      },
    });
  }
  
  window.addEventListener('message', (event) => {
    const data = event.data;
    if (data.message === 'start-record') {
      if (!recording) record();
      window.postMessage({
        message: 'start-record-response',
        startTimestamp: Date.now(),
      });
    } else if (data.message === 'stop-record') {
      if (stopFn) stopFn();
      window.postMessage({
        message: 'stop-record-response',
        events,
        endTimestamp: Date.now(),
      });
    }
  });
  `;
  document.documentElement.appendChild(scriptEl);

  let startResponseCb: ((response: StartRecordResponse) => void) | undefined =
    undefined;
  channel.provide(ServiceName.StartRecord, () => {
    window.postMessage({ message: 'start-record' });
    return new Promise((resolve) => {
      startResponseCb = (response) => {
        resolve(response);
      };
    });
  });
  let stopResponseCb: ((response: StopRecordResponse) => void) | undefined =
    undefined;
  channel.provide(ServiceName.StopRecord, () => {
    window.postMessage({ message: 'stop-record' });
    return new Promise((resolve) => {
      stopResponseCb = (response: StopRecordResponse) => {
        resolve(response);
      };
    });
  });

  window.addEventListener('message', (event) => {
    const data = event.data as StartRecordResponse | StopRecordResponse;
    if (data.message === 'start-record-response' && startResponseCb)
      startResponseCb(data);
    else if (data.message === 'stop-record-response' && stopResponseCb) {
      stopResponseCb(data);
      void saveEvents(data.events);
    }
  });
})();

async function saveEvents(events: eventWithTime[]) {
  const recorderSettings = (await Browser.storage.sync.get(
    'settings',
  )) as SyncData;
  const { recorderVersion, recorderURL } = recorderSettings.settings;
  const newSession: Session = {
    id: nanoid(),
    name: document.title,
    tags: [],
    events,
    createTimestamp: Date.now(),
    modifyTimestamp: Date.now(),
    recorderVersion,
    recorderURL,
  };
  const data = (await Browser.storage.local.get(
    LocalDataKey.sessions,
  )) as LocalData;
  if (!data.sessions) data.sessions = {};
  data.sessions[newSession.id] = newSession;
  await Browser.storage.local.set(data);
}
