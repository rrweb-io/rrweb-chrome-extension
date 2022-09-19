import Browser from 'webextension-polyfill';
import type { PackageJson } from 'type-fest';
import { Settings, SyncData } from '~/types';

void (async () => {
  const recorderVersions = await fetchPackageVersions('rrweb');
  const playerVersions = await fetchPackageVersions('rrweb-player');
  // Use the latest version.
  const defaultRecorderVersion = recorderVersions[0];
  const defaultPlayerVersion = playerVersions[0];
  // assign default value to settings of this extension
  const result =
    ((await Browser.storage.sync.get('settings')) as SyncData) || undefined;
  //   chrome.storage.sync.set(buffer);
  const defaultSettings: Settings = {
    recorderURL: `https://cdn.jsdelivr.net/npm/rrweb@${defaultRecorderVersion}/dist/record/rrweb-record.min.js`,
    recorderVersion: defaultRecorderVersion,
    playerURL: `https://cdn.jsdelivr.net/npm/rrweb-player@${defaultPlayerVersion}/dist/index.js`,
    playerVersion: defaultPlayerVersion,
  };
  let settings = defaultSettings;
  if (result && result['settings']) {
    setDefaultSettings(result['settings'], defaultSettings);
    settings = result['settings'];
  }
  await Browser.storage.sync.set({
    settings,
  } as SyncData);
  void fetchSourceCode(settings);
})();

Browser.storage.onChanged.addListener((changes, area) => {
  if (area === 'sync' && changes.settings) {
    const newValue = changes.settings.newValue as Settings;
    void fetchSourceCode(newValue);
  }
});

async function fetchPackageVersions(packageName: string) {
  type Meta = {
    name: string;
    author: string;
    versions: Record<string, PackageJson>;
  };
  const meta = (await (
    await fetch(`https://registry.npmjs.org/${packageName}`)
  ).json()) as Meta;
  const versions = [];
  for (const version in meta.versions) versions.push(version);
  return versions.reverse();
}

/**
 * Update existed settings with new settings.
 * Set new setting values if these properties don't exist in older versions.
 */
function setDefaultSettings(
  existedSettings: Record<string, unknown>,
  newSettings: Record<string, unknown>,
) {
  for (const i in newSettings) {
    // settings[i] contains key-value settings
    if (
      typeof newSettings[i] === 'object' &&
      !(newSettings[i] instanceof Array) &&
      Object.keys(newSettings[i] as Record<string, unknown>).length > 0
    ) {
      if (existedSettings[i]) {
        setDefaultSettings(
          existedSettings[i] as Record<string, unknown>,
          newSettings[i] as Record<string, unknown>,
        );
      } else {
        // settings[i] contains several setting items but these have not been set before
        existedSettings[i] = newSettings[i];
      }
    } else if (existedSettings[i] === undefined) {
      // settings[i] is a single setting item and it has not been set before
      existedSettings[i] = newSettings[i];
    }
  }
}

/**
 * Fetch rrweb source code from recorder URL and player URL.
 */
async function fetchSourceCode(settings: Settings) {
  if (settings.recorderURL) {
    const code = await (await fetch(settings.recorderURL)).text();
    await Browser.storage.local.set({
      recorder_code: code,
    });
  }
  if (settings.playerURL) {
    const code = await (await fetch(settings.recorderURL)).text();
    await Browser.storage.local.set({
      player_code: code,
    });
  }
}
