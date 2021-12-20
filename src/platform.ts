import { API, DynamicPlatformPlugin, Logger, PlatformAccessory, Service, Characteristic } from 'homebridge';
import { Config } from './models/config.model';
import { Observable, ReplaySubject } from 'rxjs';
import { PhilipsHueHDMIPlaySyncBoxState } from './models/philips-hue.models';
import { PhilipsHuePlayHDMISyncBoxPlatformAccessory } from './platformAccessory';
import { PLATFORM_NAME, PLUGIN_NAME } from './settings';
import { Preset } from './models/preset.model';
import request from 'request';

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

    public readonly config: Config;

    public readonly syncBoxStateSubject: ReplaySubject<PhilipsHueHDMIPlaySyncBoxState>;
    public readonly syncBoxState$: Observable<PhilipsHueHDMIPlaySyncBoxState>;

    constructor(
        public readonly log: Logger,
        config: Config,
        public readonly api: API,
    ) {
        this.config = Object.assign(new Config(), config, {
            presets: config.presets?.map(x => new Preset(x.name, x.uniqueId, x)),
        });

        this.syncBoxStateSubject = new ReplaySubject<PhilipsHueHDMIPlaySyncBoxState>(1);
        this.syncBoxState$ = this.syncBoxStateSubject.asObservable();

        this.refresh();

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
    configureAccessory(accessory: PlatformAccessory) {
        this.log.info('Loading accessory from cache:', accessory.displayName);

        // add the restored accessory to the accessories cache so we can track if it has already been registered
        this.accessories.push(accessory);
    }

    /**
     * This is an example method showing how to register discovered accessories.
     * Accessories must only be registered once, previously created accessories
     * must not be registered again to prevent "duplicate UUID" errors.
     */
    discoverDevices() {
        if (!this.config.presets) {
            return;
        }

        // loop over the discovered devices and register each one if it has not already been registered
        for (const preset of this.config.presets) {
            if (!preset.isValid()) {
                this.log.debug('Preset invalid');
                this.log.debug(JSON.stringify(preset));
                continue;
            }

            // generate a unique id for the accessory this should be generated from
            // something globally unique, but constant, for example, the device serial
            // number or MAC address
            preset.uuid = this.api.hap.uuid.generate(preset.uniqueId);

            // see if an accessory with the same uuid has already been registered and restored from
            // the cached devices we stored in the `configureAccessory` method above
            const existingAccessory = this.accessories.find(accessory => accessory.UUID === preset.uuid);

            if (existingAccessory) {
                // the accessory already exists
                this.log.info('Restoring existing accessory from cache:', existingAccessory.displayName);

                // if you need to update the accessory.context then you should run `api.updatePlatformAccessories`. eg.:
                // existingAccessory.context.device = device;
                // this.api.updatePlatformAccessories([existingAccessory]);

                // create the accessory handler for the restored accessory
                // this is imported from `platformAccessory.ts`
                new PhilipsHuePlayHDMISyncBoxPlatformAccessory(this, existingAccessory);

                // it is possible to remove platform accessories at any time using `api.unregisterPlatformAccessories`, eg.:
                // remove platform accessories when no longer present
                // this.api.unregisterPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [existingAccessory]);
                // this.log.info('Removing existing accessory from cache:', existingAccessory.displayName);
            }
            else {
                // the accessory does not yet exist, so we need to create it
                this.log.info('Adding new accessory:', preset.name);

                // create a new accessory
                const accessory = new this.api.platformAccessory(preset.name, preset.uuid);

                // store a copy of the device object in the `accessory.context`
                // the `context` property can be used to store any data about the accessory you may need
                accessory.context.device = preset;

                // create the accessory handler for the newly create accessory
                // this is imported from `platformAccessory.ts`
                new PhilipsHuePlayHDMISyncBoxPlatformAccessory(this, accessory);

                // link the accessory to your platform
                this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);
            }
        }

        for (let i = this.accessories.length - 1; i >= 0; i--) {
            const accessory = this.accessories[i];

            const preset = this.config.presets?.find(p => accessory.UUID === p.uuid);
            if (!preset) {
                this.log.info('Removing existing accessory from cache:', accessory.displayName);
                this.api.unregisterPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);
                this.accessories.splice(i, 1);
            }
        }
    }


    private throttleId?: NodeJS.Timeout;

    refresh() {
        if (this.throttleId) {
            this.log.info('Ignoring refresh call');
            return;
        }

        this.throttleId = setTimeout(() => {
            delete this.throttleId;
        }, 5000);

        this.log.info('Executing refresh call');

        request({
            uri: 'https://' + this.config.syncBoxIpAddress + '/api/v1',
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${this.config.syncBoxApiAccessToken}`,
                'Content-Type': 'application/json',
            },
            body: {
                syncActive: false,
            },
            json: true,
            rejectUnauthorized: false,
        }, (error, response, body) => {
            if (error) {
                this.log.error('Error while communicating with the Sync Box. Error: ' + error);
                throw new this.api.hap.HapStatusError(this.api.hap.HAPStatus.SERVICE_COMMUNICATION_FAILURE);
            }

            if (response.statusCode !== 200) {
                this.log.error('Error while communicating with the Sync Box. Status Code: ' + response.statusCode);
                throw new this.api.hap.HapStatusError(this.api.hap.HAPStatus.SERVICE_COMMUNICATION_FAILURE);
            }

            this.syncBoxStateSubject.next(body as PhilipsHueHDMIPlaySyncBoxState);
        });
    }
}