import { CharacteristicGetCallback, CharacteristicSetCallback, CharacteristicValue, PlatformAccessory, Service } from 'homebridge';
import { InputSourceAccessoryState } from './models/input-source-accessory-state.model';
import { Preset } from './models/preset.model';
import { PhilipsHuePlayHDMISyncBoxPlatform } from './platform';
import { SyncBoxService } from './services/syncbox.service';

export class InputSourceAccessory {
    private presets: Preset[];
    private televionService: Service;

    private state: InputSourceAccessoryState = {
        active: false,
        activeIdentifier: 0,
        activePreset: null
    };

    constructor(private platform: PhilipsHuePlayHDMISyncBoxPlatform, private accessory: PlatformAccessory, private syncBoxService: SyncBoxService) {
        this.presets = accessory.context.device as Preset[];

        // set accessory information
        this.accessory.getService(this.platform.Service.AccessoryInformation)!
            .setCharacteristic(this.platform.Characteristic.Manufacturer, 'Fabian de Groot')
            .setCharacteristic(this.platform.Characteristic.Model, 'Philips Hue Play HDMI Sync Box')
            .setCharacteristic(this.platform.Characteristic.SerialNumber, '12-34-56-78');

        this.televionService = this.accessory
            .getService(this.platform.Service.Television) || this.accessory.addService(this.platform.Service.Television)
            .setCharacteristic(this.platform.Characteristic.Name, accessory.context.device.name || 'Sync Box')
            .setCharacteristic(this.platform.Characteristic.ConfiguredName, accessory.context.device.name || 'Sync Box')
            .setCharacteristic(this.platform.Characteristic.SleepDiscoveryMode, this.platform.Characteristic.SleepDiscoveryMode.ALWAYS_DISCOVERABLE)
            .setCharacteristic(this.platform.Characteristic.ActiveIdentifier, this.state.activeIdentifier);

        this.televionService
            .getCharacteristic(this.platform.Characteristic.Active)
            .on('set', this.setActive.bind(this))
            .on('get', this.getActive.bind(this));

        this.televionService
            .getCharacteristic(this.platform.Characteristic.ActiveIdentifier)
            .on('set', this.setActiveIdentifier.bind(this))
            .on('get', this.getActiveIdentifier.bind(this));

        this.televionService.setCharacteristic(this.platform.Characteristic.Name, 'Sync Box');

        for (const i in this.presets) {
            const preset = this.presets[i];
            const inputSourceService = this.accessory.getService(preset.uniqueId) || this.accessory.addService(this.platform.Service.InputSource, preset.uniqueId, preset.uniqueId);
            inputSourceService.setCharacteristic(this.platform.Characteristic.IsConfigured, this.platform.Characteristic.IsConfigured.CONFIGURED);
            inputSourceService.setCharacteristic(this.platform.Characteristic.ConfiguredName, preset.name);
            inputSourceService.setCharacteristic(this.platform.Characteristic.InputSourceType, this.platform.Characteristic.InputSourceType.HDMI);
            inputSourceService.setCharacteristic(this.platform.Characteristic.Identifier, parseInt(i) + 1);
            // inputSource.setCharacteristic(this.platform.Characteristic.CurrentVisibilityState, this.platform.Characteristic.CurrentVisibilityState.HIDDEN);
            this.televionService.addLinkedService(inputSourceService);
        }

        this.syncBoxService.syncBoxState$.subscribe(syncBoxState => {
            this.platform.log.info('Refresh response:');
            this.platform.log.info(JSON.stringify(syncBoxState));

            const isActive = syncBoxState.mode !== 'powersave';
            if (this.state.active !== isActive) {
                this.state.active = isActive;
                this.televionService.setCharacteristic(this.platform.Characteristic.Active, this.state.active);
            }

            if (syncBoxState.mode === 'powersave') {
                this.televionService.setCharacteristic(this.platform.Characteristic.ActiveIdentifier, 0);
            }
            else {
                this.presets.forEach((preset, index) => {
                    const presetActive = syncBoxState.mode === preset.mode
                        && syncBoxState.hdmiSource === preset.source
                        && preset.sync === syncBoxState.syncActive
                        && (syncBoxState.mode === 'passthrough' || (
                            syncBoxState[syncBoxState.mode]
                            && syncBoxState[syncBoxState.mode].intensity === preset.intensity
                            && syncBoxState.brightness === preset.brightness));

                    this.platform.log.info(`Preset ${this.presets[index].name} = ${presetActive}`);
                    this.platform.log.info(JSON.stringify(preset));

                    if (presetActive) {
                        this.state.activePreset = this.presets[index];
                        this.state.activeIdentifier = index + 1;
                        this.platform.log.info(`Enabled ${this.presets[index].name}`);
                        this.televionService.setCharacteristic(this.platform.Characteristic.ActiveIdentifier, index + 1);
                    }
                });
            }
        });
    }

    setActiveIdentifier(value: CharacteristicValue, callback: CharacteristicSetCallback): void {
        try {
            const index = Number(value) - 1;
            const preset = this.presets[index];

            if (!preset) {
                callback(null);
                return;
            }

            this.syncBoxService
                .enablePreset(preset)
                .then(() => {
                    this.platform.log.info(`Setting ${preset.name} on the device`);
                });

            callback(null);
        }
        catch (e) {
            this.platform.log.error('Cannot update active identifier', e);
            callback(e as Error);
        }
    }

    getActiveIdentifier(callback: CharacteristicGetCallback): void {
        this.syncBoxService.refreshState();
        if (!this.presets[this.state.activeIdentifier]) {
            this.platform.log.info(`ActiveIdentifier (${this.state.activeIdentifier}) ?`);
            this.platform.log.info(JSON.stringify(this.presets));
        }
        else {
            this.platform.log.info(`Get Characteristic ActiveIdentifier (${this.state.activeIdentifier}) ->`, this.presets[this.state.activeIdentifier].name);
        }

        // you must call the callback function
        // the first argument should be null if there were no errors
        // the second argument should be the value to return
        callback(null, this.state.activeIdentifier);
    }

    setActive(value: CharacteristicValue, callback: CharacteristicSetCallback): void {
        try {
            this.state.active = value === 1;
            this.platform.log.info('Set Characteristic Active ->', this.state.active);
            this.syncBoxService.togglePower(this.state.active);
            callback(null);
        }
        catch (e) {
            this.platform.log.error('Cannot update active', e);
            callback(e as Error);
        }
    }

    getActive(callback: CharacteristicGetCallback): void {
        this.syncBoxService.refreshState();
        this.platform.log.info('Get Characteristic Active ->', this.state.active);

        callback(null, this.state.active);
    }
}