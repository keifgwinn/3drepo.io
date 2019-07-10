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

import { put, takeLatest, all, select } from 'redux-saga/effects';
import { push } from 'connected-react-router';

import * as API from '../../services/api';
import { ViewerGuiTypes, ViewerGuiActions } from './viewerGui.redux';
import { ModelActions, selectRevisions, selectSettings } from '../model';
import { TreeActions } from '../tree';
import { ViewpointsActions } from '../viewpoints';
import { IssuesActions, selectIssuesMap } from '../issues';
import { RisksActions, selectRisksMap } from '../risks';
import { GroupsActions } from '../groups';
import { StarredMetaActions } from '../starredMeta';
import { JobsActions } from '../jobs';
import { CurrentUserActions, selectCurrentUser } from '../currentUser';
import { CompareActions } from '../compare';
import {
	selectIsMetadataVisible,
	selectHelicopterSpeed,
	selectIsClipEdit,
	selectClipNumber
} from './viewerGui.selectors';
import { VIEWER_PANELS } from '../../constants/viewerGui';
import { BimActions } from '../bim';
import { MeasureActions } from '../measure';
import { DialogActions } from '../dialog';
import { dispatch } from '../store';
import { Viewer } from '../../services/viewer/viewer';
import { VIEWER_EVENTS, VIEWER_CLIP_MODES, INITIAL_HELICOPTER_SPEED, NEW_PIN_ID } from '../../constants/viewer';
import { selectUrlParams } from '../router/router.selectors';
import { MultiSelect } from '../../services/viewer/multiSelect';
import { ROUTES } from '../../constants/routes';

function* fetchData({ teamspace, model, revision }) {
	try {
		const { username } = yield select(selectCurrentUser);
		yield all([
			put(CurrentUserActions.fetchUser(username)),
			put(JobsActions.fetchJobs(teamspace)),
			put(JobsActions.getMyJob(teamspace)),
			put(TreeActions.startListenOnSelections()),
			put(ViewerGuiActions.startListenOnClickPin()),
			put(ViewerGuiActions.startListenOnModelLoaded()),
			put(ModelActions.fetchSettings(teamspace, model)),
			put(ModelActions.fetchMetaKeys(teamspace, model)),
			put(ModelActions.waitForSettingsAndFetchRevisions(teamspace, model)),
			put(TreeActions.fetchFullTree(teamspace, model, revision)),
			put(ViewpointsActions.fetchViewpoints(teamspace, model)),
			put(IssuesActions.fetchIssues(teamspace, model, revision)),
			put(RisksActions.fetchRisks(teamspace, model, revision)),
			put(GroupsActions.fetchGroups(teamspace, model, revision)),
			put(ViewerGuiActions.getHelicopterSpeed(teamspace, model)),
			put(StarredMetaActions.fetchStarredMeta())
		]);
	} catch (error) {
		yield put(DialogActions.showErrorDialog('fetch', 'initial model data', error));
	}
}

function* resetPanelsStates() {
	try {
		yield all([
			put(IssuesActions.resetComponentState()),
			put(RisksActions.resetComponentState()),
			put(GroupsActions.resetComponentState()),
			put(CompareActions.resetComponentState()),
			put(BimActions.resetBimState()),
			put(ViewerGuiActions.resetVisiblePanels())
		]);
	} catch (error) {
		yield put(DialogActions.showErrorDialog('reset', 'panels data', error));
	}
}

function* setMeasureVisibility({ visible }) {
	try {
		const metadataActive = yield select(selectIsMetadataVisible);

		if (visible && metadataActive) {
			yield put(BimActions.setIsActive(false));
		}
		yield put(MeasureActions.setMeasureActive(visible));
	} catch (error) {
		yield put(DialogActions.showErrorDialog('set', 'measure visibility', error));
	}
}

const setIsModelLoaded = () => {
	dispatch(ViewerGuiActions.setIsModelLoaded(true));
};

function* startListenOnModelLoaded() {
	try {
		Viewer.on(VIEWER_EVENTS.MODEL_LOADED, setIsModelLoaded);
	} catch (error) {
		yield put(DialogActions.showErrorDialog('start listen on', 'model loaded', error));
	}
}

function* stopListenOnModelLoaded() {
	try {
		Viewer.off(VIEWER_EVENTS.MODEL_LOADED, setIsModelLoaded);
	} catch (error) {
		yield put(DialogActions.showErrorDialog('stop listen on', 'model loaded', error));
	}
}

function* handlePinClick({ id }) {
	try {
		const risksMap = yield select(selectRisksMap);
		const issuesMap = yield select(selectIssuesMap);
		const revisions = yield select(selectRevisions);
		const defaultRevision = revisions[0].tag || revisions[0]._id;
		const { teamspace, model, revision = defaultRevision } = yield select(selectUrlParams);

		if (risksMap[id]) {
			yield put(ViewerGuiActions.setPanelVisibility(VIEWER_PANELS.RISKS, true));
			yield put(RisksActions.showDetails(teamspace, model, revision, risksMap[id]));
		}

		if (issuesMap[id]) {
			yield put(ViewerGuiActions.setPanelVisibility(VIEWER_PANELS.ISSUES, true));
			yield put(IssuesActions.showDetails(teamspace, model, revision, issuesMap[id]));
		}
	} catch (error) {
		yield put(DialogActions.showErrorDialog('handle', 'pin click', error));
	}
}

function* startListenOnClickPin() {
	try {
		Viewer.on(VIEWER_EVENTS.CLICK_PIN, ({ id }) => {
			dispatch(ViewerGuiActions.handlePinClick(id));
		});
	} catch (error) {
		yield put(DialogActions.showErrorDialog('start listen on', 'model loaded', error));
	}
}

function* stopListenOnClickPin() {
	try {
		Viewer.off(VIEWER_EVENTS.MODEL_LOADED, setIsModelLoaded);
	} catch (error) {
		yield put(DialogActions.showErrorDialog('stop listen on', 'click pin', error));
	}
}

const updateClipStateCallback = (clipNumber) => {
	dispatch(ViewerGuiActions.updateClipState(clipNumber));
};

function* initialiseToolbar() {
	try {
		yield put(ViewerGuiActions.startListenOnNumClip());
	} catch (error) {
		yield put(DialogActions.showErrorDialog('initialise', 'toolbar', error));
	}
}

function* startListenOnNumClip() {
	try {
		Viewer.on(VIEWER_EVENTS.UPDATE_NUM_CLIP, updateClipStateCallback);
	} catch (error) {
		yield put(DialogActions.showErrorDialog('start listen on', 'num clip', error));
	}
}

function* stopListenOnNumClip() {
	try {
		Viewer.off(VIEWER_EVENTS.UPDATE_NUM_CLIP, updateClipStateCallback);
	} catch (error) {
		yield put(DialogActions.showErrorDialog('stop listen on', 'num clip', error));
	}
}

function* updateClipState({clipNumber}) {
	try {
		const isClipEdit = yield select(selectIsClipEdit);
		const currentClipNumber = yield select(selectClipNumber);

		if (currentClipNumber !== clipNumber) {
			yield put(ViewerGuiActions.setClipNumber(clipNumber));
		}

		if (clipNumber === 0 && isClipEdit) {
			yield put(ViewerGuiActions.setClipEdit(false));
			yield put(ViewerGuiActions.setClippingMode(null));
		}
	} catch (error) {
		yield put(DialogActions.showErrorDialog('update', 'clip state', error));
	}
}

function* goToExtent() {
	try {
		yield Viewer.goToExtent();
	} catch (error) {
		yield put(DialogActions.showErrorDialog('go', 'to extent', error));
	}
}

function* setNavigationMode({mode}) {
	try {
		yield Viewer.setNavigationMode(mode);
		yield put(ViewerGuiActions.setNavigationModeSuccess(mode));
	} catch (error) {
		yield put(DialogActions.showErrorDialog('set', 'navigation mode', error));
	}
}

function* resetHelicopterSpeed({teamspace, modelId, updateDefaultSpeed}) {
	try {
		yield Viewer.helicopterSpeedReset();
		if (updateDefaultSpeed) {
			yield API.editHelicopterSpeed(teamspace, modelId, INITIAL_HELICOPTER_SPEED);
		}
		yield put(ViewerGuiActions.setHelicopterSpeed(INITIAL_HELICOPTER_SPEED));
	} catch (error) {
		yield put(DialogActions.showErrorDialog('reset', 'helicopter speed', error));
	}
}

function* getHelicopterSpeed({teamspace, modelId}) {
	try {
		yield Viewer.isViewerReady();
		const { data: { heliSpeed } } = yield API.getHelicopterSpeed(teamspace, modelId);
		const currentHeliSpeed = yield select(selectHelicopterSpeed);
		const diff = heliSpeed - currentHeliSpeed;
		const slower = diff > 0;

		for (let i = 0; i < Math.abs(diff); ++i) {
			if (slower) {
				yield Viewer.helicopterSpeedUp();
			} else {
				yield Viewer.helicopterSpeedDown();
			}
		}

		yield put(ViewerGuiActions.setHelicopterSpeed(heliSpeed));
	} catch (error) {
		yield put(DialogActions.showErrorDialog('get', 'helicopter speed', error));
	}
}

function* increaseHelicopterSpeed({teamspace, modelId}) {
	try {
		const helicopterSpeed = yield select(selectHelicopterSpeed);
		const speed = helicopterSpeed + 1;

		yield Viewer.helicopterSpeedUp();
		yield API.editHelicopterSpeed(teamspace, modelId, speed);
		yield put(ViewerGuiActions.setHelicopterSpeed(speed));
	} catch (error) {
		yield put(DialogActions.showErrorDialog('increase', 'helicopter speed', error));
	}
}

function* decreaseHelicopterSpeed({teamspace, modelId}) {
	try {
		const helicopterSpeed = yield select(selectHelicopterSpeed);
		const speed = helicopterSpeed - 1;

		yield Viewer.helicopterSpeedDown();
		yield API.editHelicopterSpeed(teamspace, modelId, speed);
		yield put(ViewerGuiActions.setHelicopterSpeed(speed));
	} catch (error) {
		yield put(DialogActions.showErrorDialog('decrease', 'helicopter speed', error));
	}
}

function* setClippingMode({mode}) {
	try {
		if (mode) {
			const isSingle = mode === VIEWER_CLIP_MODES.SINGLE;
			yield Viewer.startClip(isSingle);
		}
		yield put(ViewerGuiActions.setClippingModeSuccess(mode));
	} catch (error) {
		yield put(DialogActions.showErrorDialog('set', 'clipping mode', error));
	}
}

function* setClipEdit({isClipEdit}) {
	try {
		if (isClipEdit) {
			yield Viewer.startClipEdit();
		} else {
			yield Viewer.stopClipEdit();
		}
		yield put(ViewerGuiActions.setClipEditSuccess(isClipEdit));
	} catch (error) {
		yield put(DialogActions.showErrorDialog('toggle', 'clip edit', error));
	}
}

function* clearHighlights() {
	try {
		Viewer.clearHighlights();
	} catch (error) {
		yield put(DialogActions.showErrorDialog('clear', 'highlights', error));
	}
}

function* setCamera({ params }) {
	try {
		Viewer.setCamera(params);
	} catch (error) {
		yield put(DialogActions.showErrorDialog('set', 'camera', error));
	}
}

function* changePinColor({ params }) {
	try {
		const { id, colours } = params;
		Viewer.changePinColor({ id, colours });
	} catch (error) {
		yield put(DialogActions.showErrorDialog('change', 'pin colour', error));
	}
}

function* removeUnsavedPin() {
	try {
		Viewer.removePin({ id: NEW_PIN_ID });
		yield put(ViewerGuiActions.setPinData(null));
	} catch (error) {
		yield put(DialogActions.showErrorDialog('remove', 'unsaved pin', error));
	}
}

function* loadModel() {
	try {
		const { teamspace, model, revision } = yield select(selectUrlParams);
		const modelSettings = yield select(selectSettings);

		yield Viewer.loadViewerModel(teamspace, model, 'master', revision || 'head');
		yield Viewer.updateViewerSettings(modelSettings);
	} catch (error) {
		const content = 'The model was either not found, failed to load correctly ' +
			'or you are not authorized to view it. ' +
			' You will now be redirected to the teamspace page.';
		yield put(DialogActions.showDialog({ title: 'Model Error', content }));
		yield put(push(ROUTES.TEAMSPACES));
	}
}

function* setIsPinDropMode({ mode }: { mode: boolean }) {
	try {
		yield put(ViewerGuiActions.setIsPinDropModeSuccess(mode));

		if (mode) {
			MultiSelect.toggleAreaSelect(false);
		}
	} catch (error) {
		yield put(DialogActions.showErrorDialog('set', 'pin drop mode', error));
	}
}

export default function* ViewerGuiSaga() {
	yield takeLatest(ViewerGuiTypes.FETCH_DATA, fetchData);
	yield takeLatest(ViewerGuiTypes.RESET_PANELS_STATES, resetPanelsStates);
	yield takeLatest(ViewerGuiTypes.SET_MEASURE_VISIBILITY, setMeasureVisibility);
	yield takeLatest(ViewerGuiTypes.START_LISTEN_ON_MODEL_LOADED, startListenOnModelLoaded);
	yield takeLatest(ViewerGuiTypes.STOP_LISTEN_ON_MODEL_LOADED, stopListenOnModelLoaded);
	yield takeLatest(ViewerGuiTypes.START_LISTEN_ON_CLICK_PIN, startListenOnClickPin);
	yield takeLatest(ViewerGuiTypes.STOP_LISTEN_ON_CLICK_PIN, stopListenOnClickPin);
	yield takeLatest(ViewerGuiTypes.HANDLE_PIN_CLICK, handlePinClick);
	yield takeLatest(ViewerGuiTypes.INITIALISE_TOOLBAR, initialiseToolbar);
	yield takeLatest(ViewerGuiTypes.SET_NAVIGATION_MODE, setNavigationMode);
	yield takeLatest(ViewerGuiTypes.RESET_HELICOPTER_SPEED, resetHelicopterSpeed);
	yield takeLatest(ViewerGuiTypes.GET_HELICOPTER_SPEED, getHelicopterSpeed);
	yield takeLatest(ViewerGuiTypes.INCREASE_HELICOPTER_SPEED, increaseHelicopterSpeed);
	yield takeLatest(ViewerGuiTypes.DECREASE_HELICOPTER_SPEED, decreaseHelicopterSpeed);
	yield takeLatest(ViewerGuiTypes.GO_TO_EXTENT, goToExtent);
	yield takeLatest(ViewerGuiTypes.SET_CLIPPING_MODE, setClippingMode);
	yield takeLatest(ViewerGuiTypes.UPDATE_CLIP_STATE, updateClipState);
	yield takeLatest(ViewerGuiTypes.SET_CLIP_EDIT, setClipEdit);
	yield takeLatest(ViewerGuiTypes.START_LISTEN_ON_NUM_CLIP, startListenOnNumClip);
	yield takeLatest(ViewerGuiTypes.STOP_LISTEN_ON_NUM_CLIP, stopListenOnNumClip);
	yield takeLatest(ViewerGuiTypes.CLEAR_HIGHLIGHTS, clearHighlights);
	yield takeLatest(ViewerGuiTypes.SET_CAMERA, setCamera);
	yield takeLatest(ViewerGuiTypes.CHANGE_PIN_COLOR, changePinColor);
	yield takeLatest(ViewerGuiTypes.REMOVE_UNSAVED_PIN, removeUnsavedPin);
	yield takeLatest(ViewerGuiTypes.LOAD_MODEL, loadModel);
	yield takeLatest(ViewerGuiTypes.SET_IS_PIN_DROP_MODE, setIsPinDropMode);
}
