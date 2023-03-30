import { Preset } from './preset.model';

export interface InputSourceAccessoryState {
    active: boolean;
    activeIdentifier: number;
    activePreset: Preset | null;
}