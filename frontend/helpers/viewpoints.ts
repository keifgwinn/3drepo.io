/**
 *  Copyright (C) 2020 3D Repo Ltd
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

// This merges a viewpoint
// TO BE REVIEWED.

const groupPropNameMap = {
	highlighted_group_id : 'highlighted_group',
	hidden_group_id : 'hidden_group',
	override_group_ids : 'override_groups',
	transformation_group_ids: 'transformation_groups'
};

export const mergeGroupsDataFromViewpoint = (viewpointTarget, viewpointOrigin) => {

	Object.keys(groupPropNameMap).forEach((groupPropNameById) => {
		const groupPropName =  groupPropNameMap[groupPropNameById];

		if (viewpointTarget[groupPropNameById] && viewpointOrigin[groupPropName]) {
			viewpointTarget[groupPropName] = viewpointOrigin[groupPropName];
		}
	});

};

const createGroupsArray = (groupIds, groupsMaps) => {
	const groupsArray = [];

	groupIds.forEach((id) => {
		if (groupsMaps[id]) {
			groupsArray.push(groupsMaps[id]);
		}
	});

	return groupsArray;
};

// Creates an object with properties: 'highlighted_group', 'hidden_group',
// 'override_groups' or  'transformation_groups' corresponding to the ones defined in the groups ids in viewpoint.
// using the information from groupsMaps
export const setGroupData = (viewpoint, groupsMaps): any => {
	const groupsData = {};

	if (viewpoint) {
		Object.keys(groupPropNameMap).forEach((groupPropNameById) => {
			const groupPropName =  groupPropNameMap[groupPropNameById];
			const propValue = viewpoint[groupPropNameById];
			if (propValue) {
				if (Array.isArray(propValue)) {
					groupsData[groupPropName] = createGroupsArray(propValue, groupsMaps);
				} else if (groupsMaps[propValue]) {
					groupsData[groupPropName] = groupsMaps[propValue];
				}
			}
		});
	}

	return groupsData;
};
