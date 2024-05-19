/**
 * @author hexxone / https://hexx.one
 *
 * @license
 * Copyright (c) 2024 hexxone All rights reserved.
 * Licensed under the GNU GENERAL PUBLIC LICENSE.
 * See LICENSE file in the project root for full license information.
 */

export type WEPropType =
    | 'none'
    | 'combo'
    | 'text'
    | 'slider'
    | 'bool'
    | 'color';

/**
 * Options list for 'combo'-type user settings
 * @public
 */
export type WEPropOption = {
    label: string;
    value: string;
};

/**
 * Interfacing with Wallpaper-settings, cant be renamed
 * project.json -> general -> properties
 * @public
 */
export type WEProperty = {
    condition: string;
    editable: boolean;
    max: number;
    min: number;
    options: WEPropOption[];
    order: number;
    text: string;
    type: WEPropType;
    value: string | number | boolean;
};

/**
 * AudiOrbits Eventlistener Object
 * @see https://docs.wallpaperengine.io/en/web/api/propertylistener.html
 * @public
 */
export type WEventListener = {

    /**
     * Apply system settings
     * @param {WEProperty[]} props Wallpaper Engine general properties
     * @see https://docs.wallpaperengine.io/en/web/performance/fps.html
     */
    applyGeneralProperties(props: WEProperty[]): void;

    /**
     * Apply custom settings
     * @param {WEProperty[]} props Wallpaper Custom properties
     * @see https://docs.wallpaperengine.io/en/web/customization/properties.html
     */
    applyUserProperties(props: { [key: string]: WEProperty }): void;

    /**
     * Set paused
     * @param {boolean} isPaused
     */
    setPaused(isPaused: boolean): void;

    /**
     * This event can be used whenever you use a user property of the type directory with fetchall mode enabled.
     * The event will include all full file paths to files that have been added or changed by the user.
     * Mainly to mass import images into the wallpaper.
     * @param {string} propertyName
     * @param {Array} changedFiles
     */
    userDirectoryFilesAddedOrChanged(
        propertyName: string,
        changedFiles: []
    ): void;

    /**
     * This event can be used whenever you use a user property of the type directory with fetchall mode enabled.
     * The event will include all full file paths to files that have been removed by the user.
     * @param {string} propertyName
     * @param {Array} removedFiles
     */
    userDirectoryFilesRemoved(propertyName: string, removedFiles: []): void;
};
