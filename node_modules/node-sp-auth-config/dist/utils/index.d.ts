import { IAuthContext, IAuthContextSettings, IAuthConfigSettings } from '../interfaces';
export declare const convertAuthContextToSettings: (authContext: IAuthContext, settings?: IAuthConfigSettings) => IAuthContextSettings;
export declare const convertSettingsToAuthContext: (configObject: IAuthContextSettings, settings?: IAuthConfigSettings) => IAuthContext;
export declare const saveConfigOnDisk: (authContext: IAuthContext, settings: IAuthConfigSettings) => Promise<any>;
export declare const defaultPasswordMask: string;
export declare const getHiddenPropertyName: (data: {
    [key: string]: string;
}) => string;
export declare const isOnPrem: (siteUrl: string) => boolean;
