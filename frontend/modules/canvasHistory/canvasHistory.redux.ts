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

export const { Types: CanvasHistoryTypes, Creators: CanvasHistoryActions } = createActions({
	setActiveSuccess: ['isActive'],
	setDisabledSuccess: ['isDisabled'],
	add: ['element'],
	remove: ['elementName'],
	update: ['elementName', 'property'],
	undo: [],
	redo: [],
	clearHistory: []
}, { prefix: 'CANVAS_HISTORY/' });

export const INITIAL_STATE = {
	elements: []
};

export const setActiveSuccess = (state = INITIAL_STATE, { isActive }) => ({ ...state, isActive });

export const add = (state = INITIAL_STATE, { element }) => {
	const elements = [...state.elements, element];
	return { ...state, elements };
};

export const update = (state = INITIAL_STATE, { elementName, property }) => {
	const selectedIndex = state.elements.findIndex((el) => el.name === elementName);
	const elements = [...state.elements];
	const fill = property.fill !== 'transparent' ? property.color : 'transparent';
	property.fill = fill;

	elements[selectedIndex] = {
		...elements[selectedIndex],
		...property
	};
	return { ...state, elements };
};

export const remove = (state = INITIAL_STATE, { elementName }) => {
	const elements = [...state.elements].filter((el) => el.name !== elementName);
	return { ...state, elements };
};

export const setDisabledSuccess = (state = INITIAL_STATE, { isDisabled }) => ({ ...state, isDisabled });

export const undo = (state = INITIAL_STATE, {}) => {
	return { ...state };
};

export const redo = (state = INITIAL_STATE, {}) => {
	return { ...state };
};

export const clear = (state = INITIAL_STATE, {}) => {
	return { ...state };
};

export const reducer = createReducer(INITIAL_STATE, {
	[CanvasHistoryTypes.SET_ACTIVE_SUCCESS]: setActiveSuccess,
	[CanvasHistoryTypes.SET_DISABLED_SUCCESS]: setDisabledSuccess,
	[CanvasHistoryTypes.UNDO]: undo,
	[CanvasHistoryTypes.REDO]: redo,
	[CanvasHistoryTypes.CLEAR_HISTORY]: clear,
	[CanvasHistoryTypes.ADD]: add,
	[CanvasHistoryTypes.UPDATE]: update,
	[CanvasHistoryTypes.REMOVE]: remove
});
