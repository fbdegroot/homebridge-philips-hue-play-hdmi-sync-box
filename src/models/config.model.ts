import { BridgeConfiguration, PlatformConfig } from 'homebridge';
import { Preset } from './preset.model';

export class Config implements PlatformConfig {
    _bridge?: BridgeConfiguration | undefined;

    [x: string]: unknown;
    name?: string | undefined;
    platform!: string;
    presets?: Preset[];
    syncBoxApiAccessToken?: string;
    syncBoxIpAddress?: string;
}