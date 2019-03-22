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
import { DEFAULT_SETTINGS, VIEWER_NAV_MODES } from '../../constants/viewer';

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
	setIsFocusMode: ['isFocusMode']
}, { prefix: 'VIEWER/' });

export const INITIAL_STATE = {
	settings: window.localStorage.getItem('visualSettings') ?
			JSON.parse(window.localStorage.getItem('visualSettings')) : DEFAULT_SETTINGS,
	navigationMode: VIEWER_NAV_MODES.TURNTABLE,
	helicopterSpeed: null,
	isFocusMode: false
};

const updateSettings = (state = INITIAL_STATE, {settings}) => {
	window.localStorage.setItem('visualSettings', JSON.stringify(settings));
	return {...state, settings};
};

const setNavigationModeSuccess = (state = INITIAL_STATE, {mode}) => {
	return {...state, navigationMode: mode};
};

const setHelicopterSpeed = (state = INITIAL_STATE, {speed}) => {
	return {...state, helicopterSpeed: speed};
};

const setIsFocusMode = (state = INITIAL_STATE, {isFocusMode}) => {
	return {...state, isFocusMode};
};

export const reducer = createReducer(INITIAL_STATE, {
	[ViewerTypes.UPDATE_SETTINGS] : updateSettings,
	[ViewerTypes.SET_NAVIGATION_MODE_SUCCESS] : setNavigationModeSuccess,
	[ViewerTypes.SET_HELICOPTER_SPEED] : setHelicopterSpeed,
	[ViewerTypes.SET_IS_FOCUS_MODE] : setIsFocusMode
});
