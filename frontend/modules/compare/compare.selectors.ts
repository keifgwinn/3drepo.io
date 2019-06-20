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

import { createSelector } from 'reselect';
import { isEqual, values, orderBy, omitBy, size } from 'lodash';
import { searchByFilters } from '../../helpers/searching';
import { DIFF_COMPARE_TYPE, COMPARE_SORT_TYPES } from '../../constants/compare';
import { selectIsModelLoaded } from '../viewer';

export const selectCompareDomain = (state) => Object.assign({}, state.compare);

export const selectComponentState = createSelector(
	selectCompareDomain, (state) => state.componentState
);

export const selectCompareType = createSelector(
	selectCompareDomain, (state) => state.compareType
);

export const selectModelType = createSelector(
	selectCompareDomain, (state) => state.modelType
);

export const selectIsComparePending = createSelector(
	selectCompareDomain, (state) => state.isComparePending
);

export const selectIsCompareProcessed = createSelector(
	selectCompareDomain, (state) => state.isCompareProcessed
);

export const selectIsCompareActive = createSelector(
	selectCompareDomain, (state) => state.isCompareActive
);

export const selectIsModelVisible = createSelector(
	selectCompareDomain, (state) => state.isModelVisible
);

export const selectCompareModels = createSelector(
	selectComponentState, (state) => state.compareModels
);

export const selectSelectedFilters = createSelector(
	selectComponentState, (state) => state.selectedFilters
);

export const selectActiveTab = createSelector(
	selectComponentState, (state) => state.activeTab
);

export const selectSelectedModelsMap = createSelector(
	selectComponentState, selectActiveTab, (state, activeTab) => {
		const isDiff = activeTab === DIFF_COMPARE_TYPE;
		const selectedModelsMap = isDiff ? state.selectedDiffModelsMap : state.selectedClashModelsMap;
		return selectedModelsMap;
	}
);

export const selectSortOrder = createSelector(
	selectComponentState, (state) => state.sortOrder
);

export const selectSortType = createSelector(
	selectComponentState, (state) => state.sortType
);

export const selectTargetClashModels = createSelector(
	selectComponentState, (state) => state.targetClashModels
);

export const selectIsAnyTargetClashModel = createSelector(
	selectTargetClashModels, (targetClashModels) => {
		const allTargetAreFalse = values(targetClashModels).every((model) => !model);
		return !allTargetAreFalse;
	}
);

export const selectTargetDiffModels = createSelector(
	selectComponentState, (state) => state.targetDiffModels
);

export const selectIsDiff = createSelector(
	selectActiveTab, (activeTab) => (activeTab === DIFF_COMPARE_TYPE)
);

export const selectTargetModels = createSelector(
	selectIsDiff, selectTargetClashModels, selectTargetDiffModels,
	(isDiff, targetClashModelsMap, targetDiffModelsMap) => {
		return isDiff ? targetDiffModelsMap : targetClashModelsMap;
	}
);

const getSortValue = (field, targetModels) => (model) => {
	if (field === COMPARE_SORT_TYPES.TYPE) {
		return !!targetModels[model._id];
	}
	return model[field];
};

export const selectFilteredCompareModels = createSelector(
	selectCompareModels, selectSelectedFilters, selectSortType, selectSortOrder, selectTargetModels,
	(compareModels, selectedFilters, sortType, sortOrder, targetModelsMap) => {
		return orderBy(
			searchByFilters(compareModels, selectedFilters),
			[getSortValue(sortType, targetModelsMap)],
			[sortOrder]
		);
	}
);

export const selectTargetModelsList = createSelector(
	selectCompareModels, selectTargetModels,
	(models, targetModelsMap) => models.filter(({ _id }) => targetModelsMap[_id])
);

export const selectBaseModelsList = createSelector(
	selectCompareModels, selectSelectedModelsMap, selectIsDiff, selectTargetModels,
	(models, selectedModelsMap, isDiff, targetModelsMap) => {
		let baseModels = selectedModelsMap;

		if (!isDiff) {
			baseModels = omitBy(baseModels, (value, key) => targetModelsMap[key]);
		}

		return models.filter(({ _id }) => baseModels[_id]);
	}
);

const isAllSelected = (allModels, selectedModelsMap) => isEqual(
	allModels.length,
	values(selectedModelsMap).filter((selectedModel) => selectedModel).length
);

export const selectIsAllSelected = createSelector(
	selectCompareModels, selectSelectedModelsMap,
	(compareModels, selectedModelsMap) => isAllSelected(compareModels, selectedModelsMap)
);

export const selectRenderingType = createSelector(
	selectComponentState, (state) => state.renderingType
);

export const selectIsPending = createSelector(
	selectComponentState, (state) => state.isPending
);

export const selectIsCompareButtonDisabled = createSelector(
	selectSelectedModelsMap, selectIsCompareProcessed, selectIsModelLoaded,
	(selectedModelsMap, isCompareProcessed, isModelLoaded) => {
		const areSelectedModels = values(selectedModelsMap).filter((selectedModel) => selectedModel).length;
		return !areSelectedModels || isCompareProcessed || !isModelLoaded;
	}
);