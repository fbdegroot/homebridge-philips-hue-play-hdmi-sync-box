export class Preset {
    name!: string;
    uniqueId!: string;
    source?: string;
    mode?: string;
    intensity?: string;
    brightness?: number;
    uuid?: string;

    constructor(name: string, uniqueId: string, init?: Partial<Preset>) {
        if (init) {
            Object.assign(this, init);
        }
        else {
            this.name = name;
            this.uniqueId = uniqueId;
        }
    }

    isValid(): boolean {
        return !!this.name && this.name !== '' &&
            !!this.uniqueId && this.uniqueId !== '' &&
            !!this.source && this.source !== '' &&
            !!this.mode && this.mode !== '' &&
            !!this.intensity && this.intensity !== '' &&
            !!this.brightness;
    }
}