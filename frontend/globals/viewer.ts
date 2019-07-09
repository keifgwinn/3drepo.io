/**
 **  Copyright (C) 2014 3D Repo Ltd
 **
 **  This program is free software= you can redistribute it and/or modify
 **  it under the terms of the GNU Affero General Public License as
 **  published by the Free Software Foundation, either version 3 of the
 **  License, or (at your option) any later version.
 **
 **  This program is distributed in the hope that it will be useful,
 **  but WITHOUT ANY WARRANTY; without even the implied warranty of
 **  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 **  GNU Affero General Public License for more details.
 **
 **  You should have received a copy of the GNU Affero General Public License
 **  along with this program.  If not, see <http=//www.gnu.org/licenses/>.
 **/
import EventEmitter from 'eventemitter3';

import { VIEWER_NAV_MODES, VIEWER_MAP_SOURCES, VIEWER_EVENTS, VIEWER_ERRORS } from '../constants/viewer';

declare const Pin;
declare const UnityUtil;
declare const ClientConfig;
declare const Module;

interface IViewerConstructor {
	name: string;
	container: HTMLElement;
	onEvent?: any; // deprecated (use .on instead)
	onError?: any; // deprecated (use .on instead)
}

export class Viewer {

	public static NAV_MODES = VIEWER_NAV_MODES;

	public static MAP_SOURCES = VIEWER_MAP_SOURCES;

	public static EVENT = VIEWER_EVENTS;

	public ERROR = VIEWER_ERRORS;

	public pins = {};

	public pickObject = {};
	public oneGrpNodes = [];
	public twoGrpNodes = [];

	public unityLoaderScript: any;
	public inline = null;
	public runtime = null;
	public fullscreen = false;
	public pinDropMode = false;
	public measureMode = false;
	public clickingEnabled = false;

	public previousHighLightedPin = null;

	public avatarRadius = 0.5;

	public pinSizeFromSettings = false;
	public pinSize = 1.0; // Initial size

	public defaultShowAll = true;

	public zNear = -1;
	public zFar = -1;

	public initialized = false;

	public downloadsLeft = 1;

	public defaultNavMode = Viewer.NAV_MODES.TURNTABLE;
	public lastMultipart = null;

	public selectionDisabled = false;

	public account = null;
	public model = null;
	public branch = null;
	public revision = null;
	public modelString = null;

	public rootName = 'model';
	public inlineRoots = {};
	public groupNodes = null;
	public multipartNodes = [];
	public multipartNodesByModel = {};

	public units = 'm';
	public convertToM = 1.0;
	public logos = [];
	public divId = 'unityViewer';

	public unityLoaderPath = 'unity/Build/UnityLoader.js';
	public unityScriptInserted = false;
	public viewer: HTMLElement;

	public handle;
	public unityLoaderReady: boolean;

	public options;
	public Module;
	public currentNavMode;
	public plugins;
	public broadcastClippingPlane;
	public settings;
	public nav;

	public numClips;

	public setSpeed;
	public currentViewpoint;
	public changeAvatarHeight;

	public name: string;
	public element: HTMLElement;
	public callback: any;
	public errCallback: any;

	private emitter = new EventEmitter();

	constructor(config: IViewerConstructor) {

		// If not given the tag by the manager create here
		this.element = config.container;

		if (!name) {
			this.name = 'viewer';
		} else {
			this.name = config.name;
		}

		this.errCallback = config.onError;

		UnityUtil.init(config.onError, this.onUnityProgress, this.onModelProgress);
		UnityUtil.hideProgressBar();

		this.unityLoaderReady = false;

		this.viewer = document.createElement('div');
		this.viewer.className = 'viewer';

		const unityHolder = document.createElement('div');
		unityHolder.className = 'emscripten';
		unityHolder.setAttribute('id', this.divId);
		unityHolder.removeAttribute('style');
		unityHolder.setAttribute('width', '100%');
		unityHolder.setAttribute('height', '100%');
		unityHolder.setAttribute('tabindex', '1'); // You need this for unityHolder to register keyboard events
		unityHolder.setAttribute('oncontextmenu', 'event.preventDefault()');

		unityHolder.onmousedown = () => {
			return false;
		};

		unityHolder.style['pointer-events'] = 'all';

		this.element.appendChild(this.viewer);
		this.viewer.appendChild(unityHolder);

		this.unityLoaderScript = document.createElement('script');

	}

	public on = (event, fn, ...args) => {
		this.emitter.on(event, fn, ...args);
	}

	public once = (event, fn, ...args) => {
		this.emitter.once(event, fn, ...args);
	}

	public off = (event, ...args) => {
		this.emitter.off(event, ...args);
	}

	public emit = (event, ...args) => {
		this.emitter.emit(event, ...args);
	}

	public setUnits(units) {
		this.units = units;

		if (units === 'mm') {
			this.convertToM = 0.001;
		} else if (units === 'ft') {
			this.convertToM = 0.0032;
		}

		// Set the units in unity for the measure tool
		if (this.units) {
			UnityUtil.setUnits(this.units);
		}
	}

	public setHandle(handle) {
		this.handle = handle;
	}

	public insertUnityLoader(memory) {
		return new Promise((resolve, reject) => {
			this.unityLoaderScript.addEventListener ('load', () => {
				console.debug('Loaded UnityLoader.js succesfully');
				UnityUtil.loadUnity(this.divId, undefined, memory);
				resolve();
			}, false);
			this.unityLoaderScript.addEventListener ('error', (error) => {
				console.error('Error loading UnityLoader.js', error);
				reject('Error loading UnityLoader.js');
			}, false);

			// Event handlers MUST come first before setting src
			this.unityLoaderScript.src = this.unityLoaderPath;

			// This kicks off the actual loading of Unity
			this.viewer.appendChild(this.unityLoaderScript);
			this.unityScriptInserted = true;
		});
	}

	public init(options) {

		return new Promise((resolve, reject) => {

			if (this.initialized) {
				resolve();
			}

			// Set option param from viewerDirective
			this.options = options;
			this.emit(Viewer.EVENT.VIEWER_INIT);
			document.body.style.cursor = 'wait';

			// Shouldn't need this, but for something it is not being recognised from unitySettings!
			Module.errorhandler = UnityUtil.onUnityError;

			this.currentNavMode = null;
			this.numClips = 0;

			if (this.options && this.options.plugins) {
				this.plugins = this.options.plugins;
				Object.keys(this.plugins).forEach((key) => {
					if (this.plugins[key].initCallback) {
						this.plugins[key].initCallback(this);
					}
				});
			}

			UnityUtil.setAPIHost(options.getAPI);
			this.setNavMode(this.defaultNavMode, false);

			UnityUtil.onReady().then(() => {
				this.initialized = true;
				this.emit(Viewer.EVENT.UNITY_READY, {
					model: this.modelString,
					name: this.name
				});
				resolve();
			}).catch((error) => {
				this.emit(Viewer.EVENT.VIEWER_INIT, error);
				console.error('UnityUtil.onReady failed: ', error);
				reject(error);
			});

		});

	}

	public onUnityProgress = (progress) => {
		if (progress === 1) {
			this.emit(Viewer.EVENT.VIEWER_INIT_SUCCESS, progress);
		} else {
			this.emit(Viewer.EVENT.VIEWER_INIT_PROGRESS, progress);
		}
	}

	public onModelProgress = (progress) => {
		if (progress === 1) {
			this.emit(Viewer.EVENT.MODEL_LOADED, progress);
		} else {
			this.emit(Viewer.EVENT.MODEL_LOADING_PROGRESS, progress);
		}
	}

	public getDefaultHighlightColor() {
		return UnityUtil.defaultHighlightColor;
	}

	public handleError(message) {
		this.errCallback(message);
	}

	public destroy() {
		this.emitter.removeAllListeners();
		this.reset();
	}

	public showAll() {
		UnityUtil.resetCamera();
	}

	public centreToPoint(params) {
		UnityUtil.centreToPoint(params);
	}

	public setUnity() {
		UnityUtil.viewer = this;
	}

	public getScreenshot() {
		return UnityUtil.requestScreenShot();
	}

	public diffToolSetAsComparator(account: string, model: string) {
		UnityUtil.diffToolSetAsComparator(account, model);
	}

	public diffToolLoadComparator(account: string, model: string, revision: string) {
		return UnityUtil.diffToolLoadComparator(account, model, revision);
	}

	public diffToolEnableWithDiffMode() {
		UnityUtil.diffToolEnableWithDiffMode();
	}

	public diffToolEnableWithClashMode() {
		UnityUtil.diffToolEnableWithClashMode();
	}

	public diffToolDisableAndClear() {
		UnityUtil.diffToolDisableAndClear();
	}

	public diffToolShowBaseModel() {
		UnityUtil.diffToolShowBaseModel();
	}

	public diffToolShowComparatorModel() {
		UnityUtil.diffToolShowComparatorModel();
	}

	public diffToolDiffView() {
		UnityUtil.diffToolDiffView();
	}

	public pickPointEvent(pointInfo) {
		// User clicked a mesh
		this.emit(Viewer.EVENT.PICK_POINT, {
			id : pointInfo.id,
			normal : pointInfo.normal,
			position: pointInfo.position,
			screenPos : pointInfo.mousePos,
			selectColour : Pin.pinColours.yellow
		});

	}

	public hideHiddenByDefaultObjects() {
		UnityUtil.hideHiddenByDefaultObjects();
	}

	public showHiddenByDefaultObjects() {
		UnityUtil.showHiddenByDefaultObjects();
	}

	public objectSelected(pointInfo) {
		if (!this.selectionDisabled && !this.pinDropMode && !this.measureMode) {
			if (pointInfo.id) {
				if (pointInfo.pin) {
					// User clicked a pin
					this.emit(Viewer.EVENT.CLICK_PIN, {
						id: pointInfo.id
					});
				} else {
					this.emit(Viewer.EVENT.OBJECT_SELECTED, {
						account: pointInfo.database,
						id: pointInfo.id,
						model: pointInfo.model,
						source: 'viewer'
					});
				}
			} else {
				this.emit(Viewer.EVENT.BACKGROUND_SELECTED);
			}
		} else {
			if (!pointInfo.id) {
				this.emit(Viewer.EVENT.BACKGROUND_SELECTED_PIN_MODE);
			}
		}

	}

	public objectsSelected(nodes) {
		if (!this.selectionDisabled && !this.pinDropMode && !this.measureMode) {
			if (nodes) {
				this.emit(Viewer.EVENT.MULTI_OBJECTS_SELECTED, {selectedNodes: nodes});
			} else {
				this.emit(Viewer.EVENT.BACKGROUND_SELECTED);
			}

		}
	}

	public clearHighlights() {
		UnityUtil.clearHighlights();
	}

	public unhighlightObjects(account, model, idsIn) {

		if (idsIn) {
			const uniqueIds = Array.from(new Set(idsIn));
			if (uniqueIds.length) {
				UnityUtil.unhighlightObjects(account, model, uniqueIds);
				return;
			}
		}

	}

	public highlightObjects(account, model, idsIn, zoom, colour, multiOverride, forceReHighlight) {

		const canHighlight = this.initialized && !this.pinDropMode && !this.measureMode;

		if (canHighlight) {

			if (idsIn) {
				const uniqueIds = Array.from(new Set(idsIn));
				if (uniqueIds.length) {
					UnityUtil.highlightObjects(account, model, uniqueIds, colour, multiOverride, forceReHighlight);
					return;
				}
			}

			UnityUtil.clearHighlights();

		}

	}

	public switchObjectVisibility(account, model, ids, visibility) {
		UnityUtil.toggleVisibility(account, model, ids, visibility);
	}

	public getObjectsStatus(account, model) {
		return UnityUtil.getObjectsStatus(account, model);
	}

	public updateSettings(settings) {
		if (settings) {
			this.settings = settings;
			if (this.settings.properties && this.settings.properties.unit) {
				this.setUnits(this.settings.properties.unit);
			}
		}
	}

	public setNavMode(mode, force) {
		if (this.currentNavMode !== mode || force) {
			// If the navigation mode has changed

			this.currentNavMode = mode;
			UnityUtil.setNavigation(mode);

		}
	}

	public navMethodChanged(newNavMode) {
		this.currentNavMode = newNavMode;
	}

	public setCamera(pos, viewDir, upDir, lookAt, animate, rollerCoasterMode, account, model) {
		this.updateCamera(pos, upDir, viewDir, lookAt, animate, rollerCoasterMode, account, model);
	}

	public updateCamera(pos, up, viewDir, lookAt, animate, rollerCoasterMode, account, model) {
		UnityUtil.setViewpoint(pos, up, viewDir, lookAt, account, model);
	}

	public reset() {
		this.setMeasureMode(false);
		this.setPinDropMode(false);
		this.initialized = false;
		UnityUtil.reset();
	}

	public cancelLoadModel() {
		document.body.style.cursor = 'initial';
		UnityUtil.cancelLoadModel();
		this.emit(Viewer.EVENT.MODEL_LOADING_CANCEL);
	}

	public async isModelLoaded() {
		await UnityUtil.onReady();
		return UnityUtil.onLoaded();
	}

	public async loadModel(account, model, branch, revision) {
		await UnityUtil.onReady();
		this.emit(Viewer.EVENT.MODEL_LOADING_START);
		this.initialized = true;
		this.account = account;
		this.model = model;
		this.branch = branch;
		this.revision = revision;
		document.body.style.cursor = 'wait';

		UnityUtil.loadModel(account, model, branch, revision);

		UnityUtil.onLoaded().then((bbox) => {
			document.body.style.cursor = 'initial';

			this.emit(Viewer.EVENT.MODEL_LOADED, 1);
			this.emit(Viewer.EVENT.BBOX_READY, bbox);
		}).catch((error) => {
			document.body.style.cursor = 'initial';
			if (error !== 'cancel') {
				console.error('Unity error loading model= ', error);
			}
		});

		return UnityUtil.onLoading();
	}

	public getCurrentViewpointInfo(account, model) {
		return UnityUtil.requestViewpoint(account, model);
	}

	public switchFullScreen(vrDisplay) {
		vrDisplay = vrDisplay || {};

		if (!this.fullscreen) {
			if (this.viewer.hasOwnProperty('mozRequestFullScreen')) {
				// this.viewer.mozRequestFullScreen({
				// 	vrDisplay,
				// });
			// @ts-ignore
		} else if (this.viewer.webkitRequestFullscreen) {
				// @ts-ignore
				this.viewer.webkitRequestFullscreen();
			}

			this.fullscreen = true;
		} else {
			// if (document.mozCancelFullScreen) {
			// 	document.mozCancelFullScreen();
			// } else

			// @ts-ignore
			if (document.webkitCancelFullScreen) {
				// @ts-ignore
				document.webkitCancelFullScreen();
			}

			this.fullscreen = false;
		}
	}

	public setPinDropMode(on: boolean) {
		this.pinDropMode = on;
	}

	public setMeasureMode(on: boolean) {
		this.measureMode = on;
		if (on === true) {
			UnityUtil.enableMeasuringTool();
		} else {
			UnityUtil.disableMeasuringTool();
		}
	}

	public startAreaSelect() {
		UnityUtil.startAreaSelection();
	}

	public stopAreaSelect() {
		UnityUtil.stopAreaSelection();
	}

	public zoomToHighlightedMeshes() {
		UnityUtil.zoomToHighlightedMeshes();
	}

	/****************************************************************************
	 * Clipping planes
	 ****************************************************************************/

	/*
		* NOTE= Clipping planes are now all managed by unity use broadcast events to retrieve its info
	*/

	public clipBroadcast(clip) {
		this.emit(Viewer.EVENT.CLIPPING_PLANE_BROADCAST, clip);
	}

	public updateClippingPlanes(clipPlanes: any, account, model) {
		UnityUtil.updateClippingPlanes(clipPlanes ?  clipPlanes : [], false, account, model);
	}

	public startBoxClip() {
		UnityUtil.startBoxClip();
	}

	public startSingleClip() {
		UnityUtil.startSingleClip();
	}

	public startClipEdit() {
		UnityUtil.startClipEdit();
	}

	public stopClipEdit() {
		UnityUtil.stopClipEdit();
	}

	public numClipPlanesUpdated(nPlanes) {
		this.numClips = nPlanes;
		this.emit(Viewer.EVENT.UPDATE_NUM_CLIP, nPlanes);
	}

	public getNumPlanes() {
		return this.numClips;
	}

	/****************************************************************************
	 * Pins
	 ****************************************************************************/

	public addPin(account, model, id, type, position, norm, colours, viewpoint) {

		// TODO= Commented this out because it was causing error with reloading models
		// is it needed for anything?
		// if (this.pins.hasOwnProperty(id)) {
		// 	errCallback(this.ERROR.PIN_ID_TAKEN);
		// } else {
		this.pins[id] = new Pin(id, type, position, norm, colours, viewpoint, account, model);
		// }
	}

	public setPinVisibility(id, visibility) {
		if (this.pins.hasOwnProperty(id)) {
			const pin = this.pins[id];

			pin.setAttribute('render', visibility.toString());
		}
	}

	public removePin(id) {
		if (this.pins.hasOwnProperty(id)) {
			this.pins[id].remove(id);
			delete this.pins[id];
		}
	}

	public highlightPin(id) {

		// If a pin was previously highlighted
		// switch it off
		if (this.previousHighLightedPin) {
			this.previousHighLightedPin.highlight();
			this.previousHighLightedPin = null;
		}

		// If the pin exists switch it on
		if (id && this.pins.hasOwnProperty(id)) {
			this.pins[id].highlight();
			this.previousHighLightedPin = this.pins[id];
		}

	}

	public changePinColours(id, colours) {
		if (this.pins.hasOwnProperty(id)) {
			this.pins[id].changeColour(colours);
		}
	}

	/**
	 * Resets map sources
	 */
	public resetMapSources() {
		UnityUtil.resetMapSources();
	}

	/**
	 * Add map source
	 * @param source Map source
	 */
	public addMapSource(source) {
		UnityUtil.addMapSource(source);
	}

	/**
	 * Remove map source
	 * @param source Map source
	 */
	public removeMapSource(source) {
		UnityUtil.removeMapSource(source);
	}

	/**
	 * Initialise map creator within unity
	 * @param {Object[]} surveyPoints - array of survey points and it's respective latitude and longitude value
	 */
	public mapInitialise(surveyPoints) {
		UnityUtil.mapInitialise(surveyPoints);
	}

	/**
	 * Start map generation
	 */
	public mapStart() {
		UnityUtil.mapStart();
	}

	/**
	 * Stop map generation
	 */
	public mapStop() {
		UnityUtil.mapStop();
	}

	public overrideMeshColor(account, model, meshIDs, color) {
		UnityUtil.overrideMeshColor(account, model, meshIDs, color);
	}

	public resetMeshColor(account, model, meshIDs) {
		UnityUtil.resetMeshColor(account, model, meshIDs);
	}

	// Navigation

	public helicopterSpeedDown() {
		UnityUtil.helicopterSpeedDown();
	}

	public helicopterSpeedUp() {
		UnityUtil.helicopterSpeedUp();
	}

	public helicopterSpeedReset() {
		UnityUtil.helicopterSpeedReset();
	}

	public enableSoftShadows() {
		UnityUtil.enableSoftShadows();
	}

	public enableHardShadows() {
		UnityUtil.enableHardShadows();
	}

	public disableShadows() {
		UnityUtil.disableShadows();
	}

	public toggleStats() {
		UnityUtil.toggleStats();
	}

	public setDefaultNearPlane(nearplane: number) {
		UnityUtil.setDefaultNearPlane(nearplane);
	}

	public setFarPlaneSampleSize(farplaneSample: number) {
		UnityUtil.setFarPlaneSampleSize(farplaneSample);
	}

	public setRenderingQualityDefault() {
		UnityUtil.setRenderingQualityDefault();
	}

	public setRenderingQualityHigh() {
		UnityUtil.setRenderingQualityHigh();
	}

	public setXRayHighlightOn() {
		UnityUtil.setXRayHighlightOn();
	}

	public setXRayHighlightOff() {
		UnityUtil.setXRayHighlightOff();
	}

	public useBoundingBoxFarPlaneAlgorithm() {
		UnityUtil.useBoundingBoxFarPlaneAlgorithm();
	}

	public useBoundingSphereFarPlaneAlgorithm() {
		UnityUtil.useBoundingSphereFarPlaneAlgorithm();
	}

}
