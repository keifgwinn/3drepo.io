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

import api from './';

/**
 * Get issue
 * @param teamspace
 * @param modelId
 * @param issueId
 */
export const getIssue = (teamspace, modelId, issueId) => {
	return api.get(`${teamspace}/${modelId}/issues/${issueId}`);
};

/**
 * Save issue
 * @param teamspace
 * @param modelId
 * @param issue
 */
export const saveIssue = (teamspace, modelId, issue) => {
	if (issue.pickedPos !== null) {
		issue.position = issue.pickedPos;
		issue.norm = issue.pickedNorm;
	}

	if (issue.rev_id) {
		return api.post(`${teamspace}/${modelId}/revision/${issue.rev_id}/issues`, issue);
	}
	return api.post(`${teamspace}/${modelId}/issues`, issue);
};

/**
 * Update issue
 * @param teamspace
 * @param modelId
 * @param id
 * @param revId
 * @param issue
 */
export const updateIssue = (teamspace, modelId, id, revId, issue) => {
	if (issue.rev_id) {
		return api.patch(`${teamspace}/${modelId}/revision/${revId}/issues/${id}`, issue);
	}
	return api.patch(`${teamspace}/${modelId}/issues/${id}`, issue);
};

/**
 * Get issues list
 * @param teamspace
 * @param modelId
 * @param revision
 */
export const getIssues = (teamspace, modelId, revision?) => {
	const mainPath = `${teamspace}/${modelId}`;
	if (revision) {
		return api.get(`${mainPath}/revision/${revision}/issues`);
	}
	return api.get(`${mainPath}/issues`);
};

export const addIssueComment = (teamspace, modelId, id, comment) => {
	return api.post(`${teamspace}/${modelId}/issues/${id}/comments`, comment);
};

export const deleteIssueComment = (teamspace, modelId, id, guid) => {
	return api.delete(`${teamspace}/${modelId}/issues/${id}/comments`, {guid});
};

/**
 * Import BCF
 * @param teamspace
 * @param modelId
 * @param file
 * @param revision
 */
export const importBCF = (teamspace, modelId, file, revision?) => {
	const mainPath = `${teamspace}/${modelId}`;
	const formData = new FormData();
	formData.append('file', file);

	if (revision) {
		return api.post(`${mainPath}/revision/${revision}/issues`, formData);
	}
	return api.post(`${mainPath}/issues.bcfzip`, formData);
};
