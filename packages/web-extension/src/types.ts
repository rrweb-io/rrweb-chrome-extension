import type { eventWithTime } from 'rrweb/typings/types';
export type SyncData = {
  settings: Settings;
};
export enum SyncDataKey {
  settings = 'settings',
}

export type Settings = {
  recorderURL: string;
  recorderVersion: string;
  playerURL: string;
  playerVersion: string;
};

export type LocalData = {
  recorder_code: string;
  player_code: string;
  sessions: Record<string, Session>;
};

export enum LocalDataKey {
  recorderCode = 'recorder_code',
  playerCode = 'player_code',
  sessions = 'sessions',
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
