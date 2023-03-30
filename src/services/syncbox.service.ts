import { Logger } from 'homebridge';
import request from 'request';
import { Observable, ReplaySubject } from 'rxjs';
import { Execution } from '../models/philips-hue.models';
import { Preset } from '../models/preset.model';

export class SyncBoxService {
    public readonly syncBoxState$: Observable<Execution>;

    private readonly syncBoxStateSubject;
    private throttleId?;
    private readonly apiBasePath: string;
    private readonly apiExecutionPath: string;

    constructor(private ipAddress: string, private apiAccessToken: string, private log: Logger) {
        this.apiBasePath = '/api/v1';
        this.apiExecutionPath = '/execution';
        this.syncBoxStateSubject = new ReplaySubject(1);
        this.syncBoxState$ = this.syncBoxStateSubject.asObservable();
    }

    togglePower(active: boolean): Promise<void> {
        return this.request(this.apiBasePath + this.apiExecutionPath, 'PUT', {
            mode: active ? 'passthrough' : 'powersave',
            syncActive: false,
            hdmiActive: active
        });
    }

    enablePreset(preset: Preset): Promise<void> {
        const params: any = {};

        if (preset.uniqueId === 'sync-off') {
            params.syncActive = false;
        }
        else {
            if (preset.source) {
                params.hdmiSource = preset.source;
            }
            if (preset.brightness) {
                params.brightness = preset.brightness;
            }
            if (preset.mode) {
                params.mode = preset.mode;
                if (preset.intensity) {
                    params[preset.mode] = {
                        intensity: preset.intensity
                    };
                }
            }
        }

        return this.request('/api/v1/execution', 'PUT', params);
    }

    refreshState(): void {
        if (this.throttleId) {
            this.log.info('Ignore refresh call');
            return;
        }

        this.throttleId = setTimeout(() => {
            delete this.throttleId;
        }, 5000);

        this.log.info('Executing refresh call ...');
        this.request('/api/v1/execution', 'GET')
            .then(body => {
                this.syncBoxStateSubject.next(body);
            });
    }

    private request(path: string, method: string, params: any = null): Promise<void> {
        return new Promise((resolve, reject) => {
            request({
                uri: `https://${this.ipAddress}${path}`,
                method: method,
                headers: {
                    'Authorization': `Bearer ${this.apiAccessToken}`,
                    'Content-Type': 'application/json',
                },
                body: params,
                json: true,
                rejectUnauthorized: false,
            }, (error, response, body) => {
                if (!error && response.statusCode === 200) {
                    resolve(body);
                }
                else {
                    if (error) {
                        reject('Error while communicating with the Sync Box. Error: ' + error);
                    }
                    else if (response.statusCode !== 200) {
                        reject('Error while communicating with the Sync Box. Status Code: ' + response.statusCode);
                    }
                    else {
                        reject();
                    }
                }
            });
        });
    }
}