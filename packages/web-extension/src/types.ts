import type { eventWithTime } from 'rrweb/typings/types';

export enum SyncDataKey {
  settings = 'settings',
}

export type SyncData = {
  settings: Settings;
};

export type Settings = {
  recorderURL: string;
  recorderVersion: string;
  playerURL: string;
  playerVersion: string;
};

export enum LocalDataKey {
  recorderCode = 'recorder_code',
  playerCode = 'player_code',
  sessions = 'sessions',
  recorderStatus = 'recorder_status',
}

export type LocalData = {
  recorder_code: string;
  player_code: string;
  sessions: Record<string, Session>;
  recorder_status: {
    status: RecorderStatus;
    startTimestamp?: number;
    duration?: number;
  };
};

export enum RecorderStatus {
  IDLE = 'IDLE',
  RECORDING = 'RECORDING',
  PAUSED = 'PAUSED',
}

export type Session = {
  id: string;
  name: string;
  tags: string[];
  events: eventWithTime[];
  createTimestamp: number;
  modifyTimestamp: number;
  recorderVersion: string;
  recorderURL: string;
};

export enum ServiceName {
  StartRecord = 'start-record',
  StopRecord = 'stop-record',
  PauseRecord = 'pause-record',
  ResumeRecord = 'resume-record',
}

export type StartRecordResponse = {
  message: 'start-record-response';
  startTimestamp: number;
};

export type StopRecordResponse = {
  message: 'stop-record-response';
  events: eventWithTime[];
  endTimestamp: number;
};
