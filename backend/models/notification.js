/**
 *  Copyright (C) 2018 3D Repo Ltd
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

"use strict";
const { hasWriteAccessToModelHelper, hasReadAccessToModelHelper } = require("../middlewares/checkPermissions");
const modelSettings = require("../models/modelSetting");
const job = require("./job");
const utils = require("../utils");
const uuid = require("node-uuid");
const db = require("../handler/db");
const _ = require("lodash");
const User = require("./user");

const types = {
	ISSUE_ASSIGNED : "ISSUE_ASSIGNED",
	ISSUE_CLOSED: "ISSUE_CLOSED",
	MODEL_UPDATED : "MODEL_UPDATED",
	MODEL_UPDATED_FAILED : "MODEL_UPDATED_FAILED"
};

const NOTIFICATIONS_DB = "notifications";

const generateNotification = function(type, data) {
	const timestamp = (new Date()).getTime();
	return Object.assign({_id:utils.stringToUUID(uuid.v1()), read:false, type, timestamp}, data);
};

const unionArrayMerger = function(objValue, srcValue) {
	if (_.isArray(objValue)) {
		return _.uniq(objValue.concat(srcValue));
	}
};

/**
 * Extract the teamspaceId/modelId info from an array of notifications
 *
 * @param {Notification[]} notifications The array of notifications which the data willl be extracted
 * @returns {{keys..:Array<string>}} An object which keys are teamspaceId and an array of modelsIds as value
 */
const extractTeamSpaceInfo = function(notifications) {
	return _.mapValues(_.groupBy(notifications, "teamSpace"), (notification) => _.map(notification, v => v.modelId));
};

const fillModelNames = function(notifications) {
	const teamSpaces = extractTeamSpaceInfo(notifications);
	return  modelSettings.getModelsName(teamSpaces).then((modelsData) => { // fills out the models name with data from the database
		return notifications.map(notification => {
			const teamSpace = (modelsData[notification.teamSpace] || {});
			const modelName = teamSpace[notification.modelId];
			return Object.assign(notification, {modelName});
		});
	});
};

const getNotification = (username, type, criteria) =>
	db.getCollection(NOTIFICATIONS_DB, username)
		.then((collection) => collection.find(Object.assign({type},  criteria)).toArray());

const getHistoricAssignedRoles = (issue) => {
	const comments = issue.comments;
	const rolesKey = "assigned_roles";
	const assignedRoles = new Set();

	// Add the user who created the issue.
	assignedRoles.add(issue.creator_role);

	// Add current assigned role.
	assignedRoles.add(issue.assigned_roles[0]);

	for (const item in comments) {
		const actionProperty = comments[item].action;
		// Check for additional roles that have been assigned using the issue comments.

		if (actionProperty && actionProperty.property === rolesKey) {
			assignedRoles.add(actionProperty.from);
		}
	}

	return assignedRoles;
};

module.exports = {
	types,

	/**
	 * Creates a notification in the database
	 *
	 * @param {string} username The username of the account thats's gonna receive the notification
	 * @param {string} type	The type of notification: should be one of the notifications that is in the types constants
	 * @param {Object} data The particular data for notification. should be relevant data for the particular type of notification.
	 * @returns {Promise} Returns a promise with the recently created notification
	 */
	insertNotification: function(username, type, data) {
		return db.getCollection(NOTIFICATIONS_DB, username).then((collection) =>
			collection.insertOne(generateNotification(type, data))
		).then((o) => utils.objectIdToString(o.ops[0]));
	},

	updateNotification: function(username, _id, data) {
		_id =  utils.stringToUUID(_id);
		return db.getCollection(NOTIFICATIONS_DB, username).then((collection) =>
			collection.update({_id}, { $set: data })
		);
	},

	updateAllNotifications: function(username, data) {
		return db.getCollection(NOTIFICATIONS_DB, username).then((collection) =>
			collection.update({}, { $set: data }, {multi: true})
		);
	},

	upsertNotification: function(username, data, type, criteria) {
		return getNotification(username, type, criteria).then(notifications => {
			if (notifications.length === 0) {
				return this.insertNotification(username, type, Object.assign(criteria, data));
			} else {
				const n = notifications[0];
				const timestamp = (new Date()).getTime();
				const mergedData = Object.assign(_.mergeWith(n, data, unionArrayMerger), {read:false,timestamp});
				return this.updateNotification(username, n._id, mergedData).then(() => {
					const notification =  Object.assign(n, mergedData);
					return utils.objectIdToString(notification);
				});
			}
		});
	},

	upsertIssueClosedNotification: function (username, teamSpace, modelId, issueId) {
		const criteria = { teamSpace, modelId };
		const data = { issuesId: [issueId] };
		return this.upsertNotification(username, data, types.ISSUE_CLOSED, criteria);
	},

	upsertIssueAssignedNotification: function(username, teamSpace, modelId, issueId) {
		const criteria = {teamSpace,  modelId};
		const data = {issuesId: [issueId] };
		return this.upsertNotification(username,data,types.ISSUE_ASSIGNED,criteria);
	},

	insertModelUpdatedNotification: function(username, teamSpace, modelId, revision) {
		const data = {teamSpace,  modelId, revision};
		return this.insertNotification(username, types.MODEL_UPDATED, data);
	},

	removeIssueFromNotification: function(username, teamSpace, modelId, issueId, issueType) {
		const criteria = {teamSpace,  modelId, issuesId:{$in: [issueId]}};

		return getNotification(username, issueType, criteria).then(notifications => {
			if (notifications.length === 0) {
				return null;
			} else {
				const n = notifications[0];
				const index = n.issuesId.findIndex(i => i === issueId);
				n.issuesId.splice(index, 1);
				const data = {issuesId : n.issuesId};

				if (data.issuesId.length === 0) {
					return this.deleteNotification(username, n._id)
						.then(() => ({deleted:true , notification: {_id: utils.objectIdToString(n._id) }}));
				}
				return this.updateNotification(username, n._id, data).then(() => {
					return {deleted:false , notification: utils.objectIdToString(n)};
				});
			}
		});
	},

	deleteNotification: function(username, _id) {
		_id = utils.stringToUUID(_id);

		return db.getCollection(NOTIFICATIONS_DB, username)
			.then(c => c.deleteOne({_id}));
	},

	deleteAllNotifications: function(username) {
		return db.getCollection(NOTIFICATIONS_DB, username)
			.then(c => c.deleteMany({}));
	},

	/**
	 * This function is used for upserting the assign issue notifications.
	 * When someone (username) asigns an issue to a new role this function should be
	 * called to create the new notification for every user that has that role or update the one that already exist, except
	 * for the user that is assigning it
	 * @param {string} username The username of the user that is actually asigning the issue
	 * @param {string} teamSpace The teamspace corresponding to the model of the issue
	 * @param {string} modelId The model of the issue
	 * @param {Issue} issue The issue in shich the assignation is happening
	 * @returns {Promise< Array<username:string,notification:Notification> >} It contains the newly created notifications and usernames
	 */
	upsertIssueAssignedNotifications : function(username, teamSpace, modelId, issue) {
		const assignedRole = issue.assigned_roles[0];

		return job.findByJob(teamSpace,assignedRole)
			.then(rs => {
				if (!rs || !rs.users) {
					return [];
				}

				const users = rs.users.filter(m => m !== username); // Leave out the user that is assigning the issue

				// For all the users with that assigned job we need
				// to find those that can modify the model
				return Promise.all(
					users.map(user => hasWriteAccessToModelHelper(user, teamSpace, modelId)
						.then(canWrite => ({user, canWrite}))
					)
				);
			})
			.then((users) => {
				const assignedUsers = users.filter(u => u.canWrite).map(u=> u.user);
				return Promise.all(
					assignedUsers.map(u => this.upsertIssueAssignedNotification(u, teamSpace, modelId, issue._id).then(n=>({username:u, notification:n})))
				).then(usersNotifications => {
					return fillModelNames(usersNotifications.map(un => un.notification)).then(()=> usersNotifications);
				});
			});
	},

	/**
	 * This function inserts a modelUpdateNotification for
	 *
	 * @param {*} teamSpace
	 * @param {*} modelId
	 * @param {*} revision
	 * @returns {Promise< Array<username:string,notification:Notification> >} It contains the newly created notifications and usernames
	 *
	 */
	insertModelUpdatedNotifications: async function(teamSpace, modelId, revision) {
		const allUsers = await User.getAllUsersInTeamspace(teamSpace);
		const users = [];
		await Promise.all(allUsers.map(async user => {
			const access = await hasReadAccessToModelHelper(user, teamSpace, modelId);
			if (access) {
				users.push(user);
			}
		}));

		const notifications = await Promise.all(users.map(async username => {
			const notification = await this.insertModelUpdatedNotification(username, teamSpace, modelId, revision);
			return ({username, notification});
		}));

		await fillModelNames(notifications.map(un => un.notification));

		return notifications;
	},

	/**
	 * This function inserts model update failed notifications
	 *
	 * @param {*} teamSpace
	 * @param {*} modelId
	 * @param {*} user
	 * @returns {Promise< Array<username:string,notification:Notification> >} It contains the newly created notifications and usernames
	 *
	 */
	insertModelUpdatedFailedNotifications :  async function(teamSpace, modelId,  username, errorMessage) {
		const data = {teamSpace,  modelId, errorMessage};
		const notification = await this.insertNotification(username, types.MODEL_UPDATED_FAILED, data);
		const notifications = [{username, notification}];
		await fillModelNames([notification]);
		return notifications;
	},

	removeAssignedNotifications : function(username, teamSpace, modelId, issue) {
		if (!issue) {
			return Promise.resolve([]);
		}

		const assignedRole = issue.assigned_roles[0];

		return job.findByJob(teamSpace,assignedRole)
			.then(rs => {
				if (!rs || !rs.users) {
					return [];
				}

				return rs.users.filter(m => m !== username); // Leave out the user that is assigning the issue
			})
			.then((users) => {
				return Promise.all(
					users.map(u => this.removeIssueFromNotification(u, teamSpace, modelId, utils.objectIdToString(issue._id), types.ISSUE_ASSIGNED).then(n =>
						Object.assign({username:u}, n))))
					.then(notifications => notifications.reduce((a,c) => ! c.notification ? a : a.concat(c), []))
					.then(usersNotifications => {
						return fillModelNames(usersNotifications.map(un => un.notification)).then(()=> usersNotifications);
					});
			});
	},

	removeClosedNotifications: async function (username, teamSpace, modelId, issue) {
		if (!issue) {
			return Promise.resolve([]);
		}

		const assignedRoles = getHistoricAssignedRoles(issue);
		const issueType = types.ISSUE_CLOSED;

		const matchedUsers = await job.findUsersWithJobs(teamSpace, [...assignedRoles]);

		// Leave out the current user , closing the issue.
		const users = matchedUsers.filter(m => m !== username);

		// Filter the notifications, for each user to delete.
		const filterRolesToNotifications = await Promise.all(
			users.map(u => {
				return this.removeIssueFromNotification(u, teamSpace, modelId, utils.objectIdToString(issue._id), issueType)
					.then((n) => {
						return Object.assign({ username: u }, n);
					});
			})).then(notifications => notifications.reduce((a, c) => !c.notification ? a : a.concat(c), []));

		// Fill model names for the deleted, issues/notifications.
		const modelNameClosedNotifications = await fillModelNames(filterRolesToNotifications.map(un => un.notification)).then(() => filterRolesToNotifications);

		return modelNameClosedNotifications;
	},

	upsertIssueClosedNotifications: async function (username, teamSpace, modelId, issue) {
		const assignedRoles = getHistoricAssignedRoles(issue);
		const matchedUsers = await job.findUsersWithJobs(teamSpace, [...assignedRoles]);

		const users = [];
		const getUserPromises = [];

		for(const user of matchedUsers) {
			if(user !== username) {
				getUserPromises.push(hasWriteAccessToModelHelper(user, teamSpace, modelId).then((canWrite) => {
					const authUsers = { user, canWrite };
					if (authUsers.canWrite) {
						users.push(authUsers.user);
					}
				}));
			}
		}

		await Promise.all(getUserPromises);

		const userNotifications = await Promise.all(users.map(u => {
			return this.upsertIssueClosedNotification(u, teamSpace, modelId,  issue._id)
				.then((n) => {
					return ({ username: u, notification: n });
				});
		}));

		const notifiWithModelNames = await fillModelNames(userNotifications.map(un => un.notification)).then(() => userNotifications);

		return notifiWithModelNames;
	},

	/**
	 * This function is used for retrieving a list of notifications for a particular user
	 *
	 * @param {string} username The username of the user which the notificatons belongs to
	 * @returns {Promise<Notification[]>} It contains the notifications for the user passed through parameter
 	 */
	getNotifications: function(username, criteria = {}) {
		if (criteria._id) {
			criteria._id = utils.stringToUUID(criteria._id);
		}

		return db.getCollection(NOTIFICATIONS_DB, username).then((collection) => collection.find(criteria, {sort: {timestamp: -1}}).toArray())
			.then(fillModelNames);
	}
};
