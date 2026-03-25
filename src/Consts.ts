/**
 * @author hexxone / https://hexx.one
 *
 * @license
 * Copyright (c) 2026 hexxone All rights reserved.
 * Licensed under the GNU GENERAL PUBLIC LICENSE.
 * See LICENSE file in the project root for full license information.
 */

export const NEAR_DIST = 3;

export const FILE_PROTOCOL = 'file:///';
export const DEBUG_WINDOW_ID = 'debugwnd';

// Event Names
export const EVENT_TOUCH_START = 'touchstart';
export const EVENT_TOUCH_MOVE = 'touchmove';
export const EVENT_MOUSE_MOVE = 'mousemove';
export const EVENT_RESIZE = 'resize';
export const EVENT_VR_SELECT_START = 'selectstart';
export const EVENT_VR_SELECT_END = 'selectend';

// HTML Element IDs
export const RENDER_CONTAINER_ID = 'renderContainer';
export const MAIN_CANVAS_ID = 'mainCvs';

// Colors
export const COLOR_BLACK_HEX = 0x000000;

// Animation & Physics
export const LERP_FACTOR_CAMERA = 0.05;
export const MOUSE_PARALLAX_DIVISOR_X = 70;
export const MOUSE_PARALLAX_DIVISOR_Y = -90;
export const DEFAULT_FPS = 60;
export const ELLAPSED_TIME_MIN = 0.001;
// Max 1 second jump to prevent extreme changes
export const ELLAPSED_TIME_MAX = 1.0;

// WebGL Preferences
export const POWER_PREFERENCE_LOW = 'low-power';
export const POWER_PREFERENCE_HIGH = 'high-performance';
export const POWER_PREFERENCE_DEFAULT = 'default';
export const PRECISION_LOW = 'lowp';
export const PRECISION_MEDIUM = 'mediump';
export const PRECISION_HIGH = 'highp';

// Scene
export const FOG_NEAR_FACTOR = 100; // Used in old fog calculation: (viewDist * (100 - this.settings.fog_thickness)) / 250
export const FOG_FAR_DIVISOR = 250; // Used in old fog calculation

// Text Display
export const FANCY_TEXT_DEFAULT_Z = -20; // Default Z position for FancyText

// Math
export const DEG_TO_RAD = Math.PI / 180;
