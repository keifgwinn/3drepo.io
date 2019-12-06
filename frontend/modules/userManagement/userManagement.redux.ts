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

import {get, omit, pick} from 'lodash';
import {createActions, createReducer} from 'reduxsauce';
import {PROJECT_ROLES_TYPES} from '../../constants/project-permissions';
import {TEAMSPACE_PERMISSIONS} from '../../constants/teamspace-permissions';
import { sortByField } from '../../helpers/sorting';

export const { Types: UserManagementTypes, Creators: UserManagementActions } = createActions({
	fetchQuotaAndInvitations: [],
	fetchQuotaAndInvitationsSuccess: [ 'invitations', 'collaboratorLimit'],
	fetchTeamspaceUsers: [],
	fetchTeamspaceUsersSuccess: ['users'],
	setPendingState: ['isPending'],
	addUser: ['user'],
	addUserSuccess: ['user'],
	removeUser: ['username'],
	removeUserCascade: ['username'],
	removeUserSuccess: ['username'],
	setUserNotExists: ['userNotExists'],
	setTeamspace: ['teamspace'],
	updateUserJob: ['username', 'job'],
	updateUserJobSuccess: ['username', 'job'],
	updatePermissions: ['permissions'],
	updatePermissionsSuccess: ['permissions', 'currentUser'],
	getUsersSuggestions: ['searchText'],
	getUsersSuggestionsSuccess: ['suggestions'],
	clearUsersSuggestions: [],
	fetchProject: ['project'],
	setProject: ['project'],
	updateProjectPermissions: ['permissions'],
	updateProjectPermissionsSuccess: ['permissions'],
	fetchModelsPermissions: ['models'],
	fetchModelPermissionsSuccess: ['selectedModels'],
	updateModelsPermissions: ['modelsWithPermissions', 'permissions'],
	updateModelsPermissionsPre: ['modelsWithPermissions', 'permissions'],
	updateModelPermissionsSuccess: ['updatedModels', 'permissions'],
	sendInvitation: ['email', 'job', 'isAdmin', 'permissions', 'onFinish', 'onError'],
	removeInvitationSuccess: ['email'],
	removeInvitation: ['email'],
	sendInvitationSuccess: ['savedInvitation']

}, { prefix: 'USER_MANAGEMENT/' });

export const INITIAL_STATE = {
	projects: [],
	permissions: [],
	models: [],
	fedModels: [],
	users: [],
	invitations: [],
	usersSuggestions: [],
	usersPermissions: [],
	jobs: [],
	jobsColors: [],
	isPending: true,
	currentProject: {
		permissions: [],
		modelsPermissions: [],
		currentModels: []
	},
	userNotExists: false
};

/**
 * Bind to users proper permissions` values
 * @param currentUsers
 * @param projectPermissions
 */
export const setProjectPermissionsToUsers = (state, { projectPermissions }) => {
	const usersWithPermissions = [...state.users].map((user) => {
		const isProjectAdmin = projectPermissions.some(({ user: {user: username}, permissions }) => {
			return permissions.includes(PROJECT_ROLES_TYPES.ADMINISTRATOR) && user === username;
		});

		return { ...user, isProjectAdmin };
	});

	return {...state, users: usersWithPermissions};
};

export const fetchQuotaAndInvitationsSuccess = (state = INITIAL_STATE, {invitations, collaboratorLimit}) => {
	return { ...state, invitations, collaboratorLimit };
};

export const fetchTeamspaceUsersSuccess = (state = INITIAL_STATE, { users }) => {
	return { ...state, users };
};

export const setPendingState = (state = INITIAL_STATE, { isPending }) => {
	return {...state, isPending};
};

export const addUserSuccess = (state = INITIAL_STATE, { user, currentUser }) => {
	return {...state, users: [ ...state.users, user ] };
};

export const removeUserSuccess = (state = INITIAL_STATE, { username }) => {
	const users = state.users.filter(({user}) => {
		return user !== username;
	});
	return {...state, users};
};

export const removeInvitationSuccess = (state = INITIAL_STATE, { email }) => {
	const invitations = state.invitations.filter(({ email: inviteEmail }) => {
		return inviteEmail !== email;
	});

	return {...state, invitations};
};

export const sendInvitationSuccess = (state = INITIAL_STATE, { savedInvitation }) => {
	const invitations = [...state.invitations.filter(({ email }) => email !== savedInvitation.email), savedInvitation];
	return {...state, invitations};
};

export const setTeamspace = (state = INITIAL_STATE, { teamspace }) => {
	return {...state, teamspace};
};

export const updateUserJobSuccess = (state = INITIAL_STATE, { username, job }) => {
	const users = [...state.users].map((userData) => {
		if (userData.user === username) {
			userData.job = job;
		}

		return userData;
	});

	return {...state, users};
};

export const updatePermissionsSuccess = (state = INITIAL_STATE, { permissions }) => {
	const users = [...state.users].map((userData) => {
		if (userData.user === permissions.user) {
			return {...userData, ...permissions};
		}

		return userData;
	});

	return {...state, users};
};

export const getUsersSuggestionsSuccess = (state = INITIAL_STATE, { suggestions }) => {
	return {...state, usersSuggestions: suggestions};
};

export const clearUsersSuggestions = (state = INITIAL_STATE, { suggestions }) => {
	return {...state, usersSuggestions: []};
};

export const setUserNotExists = (state = INITIAL_STATE, { userNotExists }) => {
	return {...state, userNotExists};
};

export const setProject = (state = INITIAL_STATE, { project }) => {
	const models = get(state.projects.find(({_id}) => project._id === _id), 'models', []);
	project.models = [...models];
	return {...state, currentProject: project};
};

export const updateProjectPermissionsSuccess = (state = INITIAL_STATE, { permissions }) => {
	const currentProject = {...state.currentProject};

	currentProject.permissions = [...currentProject.permissions].map((currentPermissions) => {
		const updatedPermissions = permissions.find(({user}) => currentPermissions.user === user);
		if (updatedPermissions) {
			return updatedPermissions;
		}
		return currentPermissions;
	});

	return {...state, currentProject};
};

export const fetchModelPermissionsSuccess = (state = INITIAL_STATE, { selectedModels }) => {
	const permissions = selectedModels.length === 1 ? selectedModels[0].permissions : [];
	const currentProject = {
		...omit(state.currentProject, ['currentModels']),
		modelsPermissions: permissions,
		currentModels: selectedModels
	};
	return {...state, currentProject};
};

export const updateModelPermissionsSuccess = (state = INITIAL_STATE, { updatedModels, permissions }) => {
	const currentProject = {
		...state.currentProject,
		currentModels: updatedModels
	};
	const onlyOneModelWasChanged = updatedModels.length === 1;

	const modelPermissions = currentProject.currentModels[0].permissions.map(({ user, permission }) => {
		let updatedPermissionKey = onlyOneModelWasChanged ? permission : 'undefined';
		const updatedPermissionsData = permissions.find((userPermission) => userPermission.user === user);

		if (updatedPermissionsData) {
			updatedPermissionKey = updatedPermissionsData.key;
		}

		return {
			user,
			permission: updatedPermissionKey
		};
	});

	currentProject.modelsPermissions = modelPermissions;

	return {...state, currentProject};
};

export const reducer = createReducer(INITIAL_STATE, {
	[UserManagementTypes.FETCH_QUOTA_AND_INVITATIONS_SUCCESS]: fetchQuotaAndInvitationsSuccess,
	[UserManagementTypes.FETCH_TEAMSPACE_USERS_SUCCESS]: fetchTeamspaceUsersSuccess,

	[UserManagementTypes.SET_PENDING_STATE]: setPendingState,
	[UserManagementTypes.ADD_USER_SUCCESS]: addUserSuccess,
	[UserManagementTypes.REMOVE_USER_SUCCESS]: removeUserSuccess,
	[UserManagementTypes.SET_TEAMSPACE]: setTeamspace,
	[UserManagementTypes.UPDATE_USER_JOB_SUCCESS]: updateUserJobSuccess,
	[UserManagementTypes.UPDATE_PERMISSIONS_SUCCESS]: updatePermissionsSuccess,
	[UserManagementTypes.GET_USERS_SUGGESTIONS_SUCCESS]: getUsersSuggestionsSuccess,
	[UserManagementTypes.CLEAR_USERS_SUGGESTIONS]: clearUsersSuggestions,
	[UserManagementTypes.REMOVE_INVITATION_SUCCESS]: removeInvitationSuccess,
	[UserManagementTypes.SEND_INVITATION_SUCCESS]: sendInvitationSuccess,
	[UserManagementTypes.SET_USER_NOT_EXISTS]: setUserNotExists,

	// Project
	[UserManagementTypes.SET_PROJECT]: setProject,
	[UserManagementTypes.UPDATE_PROJECT_PERMISSIONS_SUCCESS]: updateProjectPermissionsSuccess,

	// Models
	[UserManagementTypes.FETCH_MODEL_PERMISSIONS_SUCCESS]: fetchModelPermissionsSuccess,
	[UserManagementTypes.UPDATE_MODEL_PERMISSIONS_SUCCESS]: updateModelPermissionsSuccess
});
