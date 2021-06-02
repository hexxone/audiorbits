/**
* @author hexxone / https://hexx.one
*
* @license
* Copyright (c) 2021 hexxone All rights reserved.
* Licensed under the GNU GENERAL PUBLIC LICENSE.
* See LICENSE file in the project root for full license information.
*/

/**
* AudiOrbits Eventlistener Object
* @see https://docs.wallpaperengine.io/en/web/api/propertylistener.html
*/
interface WEventListener {

	/**
	* Apply system settings
	* @param {Object} props Wallpaper Engine general properties
	* @see https://docs.wallpaperengine.io/en/web/performance/fps.html
	*/
	applyGeneralProperties(props): void;

	/**
	* Apply custom settings
	* @param {Object} props Wallpaper Custom properties
	* @see https://docs.wallpaperengine.io/en/web/customization/properties.html
	*/
	applyUserProperties(props): void;

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
	userDirectoryFilesAddedOrChanged(propertyName: string, changedFiles: []): void;

	/**
	 * This event can be used whenever you use a user property of the type directory with fetchall mode enabled.
	 * The event will include all full file paths to files that have been removed by the user.
	 * @param {string} propertyName
	 * @param {Array} removedFiles
	 */
	userDirectoryFilesRemoved(propertyName: string, removedFiles: []): void;
}

export default WEventListener;
