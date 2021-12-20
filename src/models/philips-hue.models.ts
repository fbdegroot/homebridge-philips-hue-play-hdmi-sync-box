export interface Wifi {
    ssid: string;
    strength: number;
}

export interface Update {
    autoUpdateEnabled: boolean;
    autoUpdateTime: number;
}

export interface Capabilities {
    maxIrCodes: number;
    maxPresets: number;
}

export interface Device {
    name: string;
    deviceType: string;
    uniqueId: string;
    apiLevel: number;
    firmwareVersion: string;
    buildNumber: number;
    termsAgreed: boolean;
    wifiState: string;
    ipAddress: string;
    wifi: Wifi;
    lastCheckedUpdate: Date;
    updatableBuildNumber?: any;
    updatableFirmwareVersion?: any;
    update: Update;
    ledMode: number;
    action: string;
    pushlink: string;
    capabilities: Capabilities;
    beta: boolean;
}

export interface Group {
    name: string;
    numLights: number;
    active: boolean;
}

export interface Groups {
    [x: string]: Group;
}

export interface Hue {
    bridgeUniqueId: string;
    bridgeIpAddress: string;
    groupId: string;
    groups: Groups;
    connectionState: string;
}

export interface Mode {
    intensity: string;
}

export interface Video extends Mode {
    backgroundLighting: boolean;
}

export interface Game extends Mode {
    backgroundLighting: boolean;
}

export interface Music extends Mode {
    palette: string;
}

export interface Execution {
    mode: string;
    syncActive: boolean;
    hdmiActive: boolean;
    hdmiSource: string;
    hueTarget: string;
    brightness: number;
    lastSyncMode: string;
    video: Video;
    game: Game;
    music: Music;
    preset?: any;
}

export interface Input1 {
    name: string;
    type: string;
    status: string;
    lastSyncMode: string;
}

export interface Input2 {
    name: string;
    type: string;
    status: string;
    lastSyncMode: string;
}

export interface Input3 {
    name: string;
    type: string;
    status: string;
    lastSyncMode: string;
}

export interface Input4 {
    name: string;
    type: string;
    status: string;
    lastSyncMode: string;
}

export interface Output {
    name: string;
    type: string;
    status: string;
    lastSyncMode: string;
}

export interface Hdmi {
    input1: Input1;
    input2: Input2;
    input3: Input3;
    input4: Input4;
    output: Output;
    contentSpecs: string;
    videoSyncSupported: boolean;
    audioSyncSupported: boolean;
}

export interface Input12 {
    cecInputSwitch: number;
    linkAutoSync: number;
    hdrMode: number;
}

export interface Input22 {
    cecInputSwitch: number;
    linkAutoSync: number;
    hdrMode: number;
}

export interface Input32 {
    cecInputSwitch: number;
    linkAutoSync: number;
    hdrMode: number;
}

export interface Input42 {
    cecInputSwitch: number;
    linkAutoSync: number;
    hdrMode: number;
}

export interface Behavior {
    inactivePowersave: number;
    cecPowersave: number;
    usbPowersave: number;
    hpdInputSwitch: number;
    hpdOutputEnableMs: number;
    arcBypassMode: number;
    forceDoviNative: number;
    input1: Input12;
    input2: Input22;
    input3: Input32;
    input4: Input42;
}

export interface Scan {
    scanning: boolean;
    code?: any;
    codes: any[];
}

export interface Codes {
}

export interface Ir {
    defaultCodes: boolean;
    scan: Scan;
    codes: Codes;
}

export interface Registration {
    appName: string;
    instanceName: string;
    role: string;
    verified: boolean;
    lastUsed: Date;
    created: Date;
}

export interface Registrations {
    [x: string]: Registration;
}

export interface Presets {
}

export interface PhilipsHueHDMIPlaySyncBoxState {
    device: Device;
    hue: Hue;
    execution: Execution;
    hdmi: Hdmi;
    behavior: Behavior;
    ir: Ir;
    registrations: Registrations;
    presets: Presets;
}