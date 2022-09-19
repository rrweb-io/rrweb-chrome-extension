export type SyncData = {
  settings: Settings;
};

export type Settings = {
  recorderURL: string;
  recorderVersion: string;
  playerURL: string;
  playerVersion: string;
};

export type LocalData = {
  recorder_code: string;
  player_code: string;
};
