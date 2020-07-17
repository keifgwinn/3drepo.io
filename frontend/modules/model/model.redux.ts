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

import { cloneDeep } from 'lodash';
import { createActions, createReducer } from 'reduxsauce';

export const { Types: ModelTypes, Creators: ModelActions } = createActions({
	fetchSettings: ['teamspace', 'modelId'],
	fetchSettingsSuccess: ['settings', 'metaKeys'],
	updateSettings: ['modelData', 'settings'],
	waitForSettingsAndFetchRevisions: ['teamspace', 'modelId'],
	fetchRevisions: ['teamspace', 'modelId', 'showVoid'],
	fetchRevisionsSuccess: ['revisions'],
	setModelRevisionState: ['teamspace', 'modelId', 'revision', 'isVoid'],
	setModelRevisionStateSuccess: ['revision', 'isVoid'],
	setPendingRevision: ['revision'],
	resetRevisions: [],
	downloadModel: ['teamspace', 'modelId'],
	uploadModelFile: ['teamspace', 'project', 'modelData', 'fileData'],
	setPendingState: ['pendingState'],
	onModelStatusChanged: ['modelData', 'teamspace', 'project', 'modelId', 'modelName'],
	subscribeOnStatusChange: ['teamspace', 'project', 'modelData'],
	unsubscribeOnStatusChange: ['teamspace', 'project', 'modelData'],
	fetchMaps: ['teamspace', 'modelId'],
	fetchMapsSuccess: ['maps'],
	updateSettingsSuccess: ['settings'],
	fetchMetaKeys: ['teamspace', 'modelId'],
	fetchMetaKeysSuccess: ['metaKeys'],
	reset: [],
	setSubmodelLoaded: ['teamspace', 'modelId', 'loaded'],
	setSubmodelLoading: ['teamspace', 'modelId', 'loading'],
}, { prefix: 'MODEL/' });

export const INITIAL_STATE = {
	settings: {
		properties: {
			unit: 'mm',
		},
		permissions: [],
		subModels: [],
	},
	metaKeys: [],
	revisions: [],
	isPending: true,
	pendingRevision: null,
	maps: []
};

const setPendingState = (state = INITIAL_STATE, { pendingState }) => {
	return { ...state, isPending: pendingState };
};

const setPendingRevision = (state = INITIAL_STATE, { revision }) => {
	return { ...state, pendingRevision: revision };
};

const fetchSettingsSuccess = (state = INITIAL_STATE, { settings }) => {
	return { ...state, settings };
};

const fetchMetaKeysSuccess = (state = INITIAL_STATE, { metaKeys }) => {
	return { ...state, metaKeys };
};

const fetchRevisionsSuccess = (state = INITIAL_STATE, { revisions }) => {
	return { ...state, revisions };
};

const resetRevisions = (state = INITIAL_STATE) => {
	return { ...state, revisions: INITIAL_STATE.revisions };
};

const fetchMapsSuccess = (state = INITIAL_STATE, { maps }) => {
	return { ...state, maps };
};

const updateSettingsSuccess = (state = INITIAL_STATE, { settings }) => {
	return { ...state, settings: { ...state.settings, ...settings} };
};

const reset = (state = INITIAL_STATE) => ({...INITIAL_STATE});

const setModelRevisionStateSuccess = (state = INITIAL_STATE, { revision, isVoid }) => {
	const revisions = cloneDeep(state.revisions);
	const changedRevisionIndex = revisions.findIndex(((rev) => rev._id === revision));

	revisions[changedRevisionIndex].void = isVoid;
	return { ...state, revisions };
};

const setSubModelProps = (subModels, teamspace, modelId, props) => {
	return subModels.map((submodel) => {
		if (submodel.database === teamspace && submodel.model === modelId) {
			return {...submodel, ...props};
		}
		return submodel;
	});
};

const setSubmodelLoaded = (state = INITIAL_STATE, { teamspace, modelId, loaded }) => {
	const subModels = setSubModelProps(state.settings.subModels, teamspace, modelId, {loaded});
	return updateSettingsSuccess(state, { settings: {subModels}});
};

const setSubmodelLoading = (state = INITIAL_STATE, { teamspace, modelId, loading }) => {
	const subModels = setSubModelProps(state.settings.subModels, teamspace, modelId, { loading});
	return updateSettingsSuccess(state, { settings: {subModels}});
};

export const reducer = createReducer(INITIAL_STATE, {
	[ModelTypes.FETCH_META_KEYS_SUCCESS]: fetchMetaKeysSuccess,
	[ModelTypes.FETCH_SETTINGS_SUCCESS]: fetchSettingsSuccess,
	[ModelTypes.FETCH_REVISIONS_SUCCESS]: fetchRevisionsSuccess,
	[ModelTypes.RESET_REVISIONS]: resetRevisions,
	[ModelTypes.SET_PENDING_STATE]: setPendingState,
	[ModelTypes.SET_PENDING_REVISION]: setPendingRevision,
	[ModelTypes.FETCH_MAPS_SUCCESS]: fetchMapsSuccess,
	[ModelTypes.UPDATE_SETTINGS_SUCCESS]: updateSettingsSuccess,
	[ModelTypes.RESET]: reset,
	[ModelTypes.SET_MODEL_REVISION_STATE_SUCCESS]: setModelRevisionStateSuccess,
	[ModelTypes.SET_SUBMODEL_LOADED]: setSubmodelLoaded,
	[ModelTypes.SET_SUBMODEL_LOADING]: setSubmodelLoading
});
