/**
 *  Copyright (C) 2017 3D Repo Ltd
 *
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU Affero General Public License as
 *  published by the Free Software Foundation, either version 3 of the
 *  License, or (at your option) any later version.
 *
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU Affero General Public License for more details.
 *
 *  You should have received a copy of the GNU Affero General Public License
 *  along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

import { createActions, createReducer } from 'reduxsauce';
import { cloneDeep } from 'lodash';
import { DEFAULT_SETTINGS, VIEWER_NAV_MODES, VIEWER_CLIP_MODES, VIEWER_PANELS } from '../../constants/viewer';

export const { Types: ViewerTypes, Creators: ViewerActions } = createActions({
	waitForViewer: [],
	mapInitialise: ['surveyPoints', 'sources'],
	resetMapSources: ['source'],
	addMapSource: ['source'],
	removeMapSource: ['source'],
	mapStart: [],
	mapStop: [],
	getScreenshot: [],
	updateSettings: ['settings'],
	saveSettings: ['settings'],
	loadSettings: [],
	setNavigationMode: ['mode'],
	setNavigationModeSuccess: ['mode'],
	initialiseToolbar: [],
	goToExtent: [],
	setHelicopterSpeed: ['speed'],
	resetHelicopterSpeed: ['teamspace', 'modelId', 'updateDefaultSpeed'],
	increaseHelicopterSpeed: ['teamspace', 'modelId'],
	decreaseHelicopterSpeed: ['teamspace', 'modelId'],
	setIsFocusMode: ['isFocusMode'],
	setClippingMode: ['mode'],
	setClippingModeSuccess: ['mode'],
	toggleClipEdit: [],
	setIsClipEdit: ['isClipEdit'],
	setClipNumber: ['clipNumber'],
	setMetadataVisibility: ['visible'],
	setMeasureVisibility: ['visible'],
	setMeasureState: ['measureState'],
	setPanelVisibility: ['panelName', 'isVisible'],
	deactivateMeasure: []
}, { prefix: 'VIEWER/' });

export const INITIAL_STATE = {
	settings: window.localStorage.getItem('visualSettings') ?
			JSON.parse(window.localStorage.getItem('visualSettings')) : DEFAULT_SETTINGS,
	navigationMode: VIEWER_NAV_MODES.TURNTABLE,
	clippingMode: null,
	helicopterSpeed: null,
	isFocusMode: false,
	isClipEdit: false,
	clipNumber: 0,
	measureState: {
		active: false,
		disabled: false
	},
	visiblePanels: {
		[VIEWER_PANELS.METADATA]: false
	}
};

const updateSettings = (state = INITIAL_STATE, {settings}) => {
	window.localStorage.setItem('visualSettings', JSON.stringify(settings));
	return {...state, settings};
};

const setNavigationModeSuccess = (state = INITIAL_STATE, {mode}) => {
	return {...state, navigationMode: mode};
};

const setClippingModeSuccess = (state = INITIAL_STATE, {mode}) => {
	return {...state, clippingMode: mode, isClipEdit: true};
};

const setHelicopterSpeed = (state = INITIAL_STATE, {speed}) => {
	return {...state, helicopterSpeed: speed};
};

const setIsFocusMode = (state = INITIAL_STATE, {isFocusMode}) => {
	return {...state, isFocusMode};
};

const setIsClipEdit = (state = INITIAL_STATE, {isClipEdit}) => {
	return {...state, isClipEdit};
};

const setClipNumber = (state = INITIAL_STATE, {clipNumber}) => {
	return {...state, clipNumber};
};

const setPanelVisibility = (state = INITIAL_STATE, {panelName, isVisible}) => {
	const visiblePanels = cloneDeep(state.visiblePanels);
	return {...state, visiblePanels: {...visiblePanels, [panelName]: isVisible}};
};

export const setMeasureState = (state = INITIAL_STATE, { measureState = {} }) => {
	return { ...state, measureState: { ...state.measureState, ...measureState } };
};

export const reducer = createReducer(INITIAL_STATE, {
	[ViewerTypes.UPDATE_SETTINGS] : updateSettings,
	[ViewerTypes.SET_NAVIGATION_MODE_SUCCESS] : setNavigationModeSuccess,
	[ViewerTypes.SET_CLIPPING_MODE_SUCCESS] : setClippingModeSuccess,
	[ViewerTypes.SET_HELICOPTER_SPEED] : setHelicopterSpeed,
	[ViewerTypes.SET_IS_FOCUS_MODE] : setIsFocusMode,
	[ViewerTypes.SET_IS_CLIP_EDIT] : setIsClipEdit,
	[ViewerTypes.SET_CLIP_NUMBER] : setClipNumber,
	[ViewerTypes.SET_PANEL_VISIBILITY] : setPanelVisibility,
	[ViewerTypes.SET_MEASURE_STATE] : setMeasureState
});
