import { API, DynamicPlatformPlugin, Logger, PlatformAccessory, Service, Characteristic } from 'homebridge';
import { Config } from './models/config.model';
import { PLATFORM_NAME, PLUGIN_NAME } from './settings';
import { Preset } from './models/preset.model';
import { SyncBoxService } from './services/syncbox.service';
import { InputSourceAccessory } from './input-source.accessory';

/**
 * HomebridgePlatform
 * This class is the main constructor for your plugin, this is where you should
 * parse the user config and discover/register accessories with Homebridge.
 */
export class PhilipsHuePlayHDMISyncBoxPlatform implements DynamicPlatformPlugin {
    public readonly Service: typeof Service = this.api.hap.Service;
    public readonly Characteristic: typeof Characteristic = this.api.hap.Characteristic;

    // this is used to track restored cached accessories
    public readonly accessories: PlatformAccessory[] = [];

    private readonly syncBoxService!: SyncBoxService;

    constructor(
        public readonly log: Logger,
        private config: Config,
        public readonly api: API,
    ) {
        this.config = Object.assign(new Config(), config, {
            presets: config.presets?.map(x => new Preset(x.name, x.uniqueId, x)),
        });

        if (!this.config.syncBoxIpAddress) {
            this.log.error('No Sync Box IP Address configured');
            return;
        }
        if (!this.config.syncBoxApiAccessToken) {
            this.log.error('No Sync Box Access Token configured');
            return;
        }

        this.syncBoxService = new SyncBoxService(this.config.syncBoxIpAddress, this.config.syncBoxApiAccessToken, log);
        this.syncBoxService.refreshState();

        this.log.debug('Finished initializing platform: ', this.config.name);

        // When this event is fired it means Homebridge has restored all cached accessories from disk.
        // Dynamic Platform plugins should only register new accessories after this event was fired,
        // in order to ensure they weren't added to homebridge already. This event can also be used
        // to start discovery of new accessories.
        this.api.on('didFinishLaunching', () => {
            log.debug('Executed didFinishLaunching callback');
            // run the method to discover / register your devices as accessories
            this.discoverDevices();
        });
    }

    /**
     * This function is invoked when homebridge restores cached accessories from disk at startup.
     * It should be used to setup event handlers for characteristics and update respective values.
     */
    configureAccessory(accessory: PlatformAccessory): void {
        // this.deleteAllCachedAccesories();

        this.log.info('Loading accessory from cache:', accessory.displayName);

        // add the restored accessory to the accessories cache so we can track if it has already been registered
        this.accessories.push(accessory);
    }

    /**
     * This is an example method showing how to register discovered accessories.
     * Accessories must only be registered once, previously created accessories
     * must not be registered again to prevent "duplicate UUID" errors.
     */
    discoverDevices(): void {
        // this.deleteAllCachedAccesories();

        if (!this.config.presets) {
            return;
        }

        const inputSourceUuid = this.api.hap.uuid.generate('Sync Box Accessory');
        const existingAccessory = this.accessories.find(accessory => accessory.UUID === inputSourceUuid);

        if (existingAccessory) {
            this.log.info('Restoring existing accessory from cache');
            existingAccessory.context.device = this.config.presets;
            new InputSourceAccessory(this, existingAccessory, this.syncBoxService);
        }
        else {
            // the accessory does not yet exist, so we need to create it
            this.log.info('Adding new accessory');
            // create a new accessory
            const accessory = new this.api.platformAccessory('Sync Box', inputSourceUuid);
            // store a copy of the device object in the `accessory.context`
            // the `context` property can be used to store any data about the accessory you may need
            accessory.context.device = this.config.presets;
            // create the accessory handler for the newly create accessory
            // this is imported from `platformAccessory.ts`
            new InputSourceAccessory(this, accessory, this.syncBoxService);
            // link the accessory to your platform
            this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);
        }
    }

    deleteAllCachedAccesories(): void {
        // this.log.info(JSON.stringify(this.accessories));
        for (let i = this.accessories.length - 1; i >= 0; i--) {
            const accessory = this.accessories[i];
            this.api.unregisterPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);
        }
    }
}