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
(function() {

	const express = require("express");
	const router = express.Router({mergeParams: true});
	const responseCodes = require("../response_codes");
	const middlewares = require("../middlewares/middlewares");
	const User = require("../models/user");
	const utils = require("../utils");

	router.get("/quota", middlewares.loggedIn, getQuotaInfo);

	router.get("/members", middlewares.loggedIn, getMemberList);
	router.get("/members/:user", middlewares.isTeamspaceMember, getTeamMemberInfo);
	router.delete("/members/:user", middlewares.isAccountAdmin, removeTeamMember);
	router.get("/members/search/:searchString", middlewares.isAccountAdmin, findUsersWithoutMembership);
	router.post("/members", middlewares.isAccountAdmin, addTeamMember);

	function getQuotaInfo(req, res, next) {

		User.findByUserName(req.session.user.username).then(user => {

			if(!user) {
				return Promise.reject(responseCodes.USER_NOT_FOUND);
			}

			if(user.isMemberOfTeamspace(req.params.account)) {
				return User.getQuotaInfo(req.params.account);

			} else {
				return Promise.reject(responseCodes.NOT_AUTHORIZED);
			}
		}).then(quotaInfo => {
			responseCodes.respond(utils.APIInfo(req), req, res, next, responseCodes.OK, quotaInfo);
		}).catch(err => {
			responseCodes.respond(utils.APIInfo(req), req, res, next, err, err);
		});
	}

	function findUsersWithoutMembership(req, res, next) {
		User.findUsersWithoutMembership(req.params.account, req.params.searchString).then((notMembers) => {
			responseCodes.respond(utils.APIInfo(req), req, res, next, responseCodes.OK, notMembers);
		}).catch(err => {
			responseCodes.respond(utils.APIInfo(req), req, res, next, err, err);
		});
	}

	function getTeamMemberInfo(req, res, next) {
		User.getTeamMemberInfo(
			req.params.account,
			req.params.user
		).then(info => {
			responseCodes.respond(utils.APIInfo(req), req, res, next, responseCodes.OK, info);
		}).catch(err => {
			responseCodes.respond(utils.APIInfo(req), req, res, next, err, err);
		});

	}

	function getMemberList(req, res, next) {
		User.findByUserName(req.session.user.username).then(user => {
			if(!user) {
				return Promise.reject(responseCodes.USER_NOT_FOUND);
			}

			if(user.isMemberOfTeamspace(req.params.account)) {
				return User.getMembers(req.params.account);
			} else {
				return Promise.reject(responseCodes.NOT_AUTHORIZED);
			}
		}).then(memArray => {
			const members = memArray.map((userData) => {
				userData.isCurrentUser = req.session.user.username === userData.user;
				return userData;
			});
			responseCodes.respond(utils.APIInfo(req), req, res, next, responseCodes.OK, {members});
		}).catch(err => {
			responseCodes.respond(utils.APIInfo(req), req, res, next, err, err);
		});
	}

	function addTeamMember(req, res, next) {
		const responsePlace = utils.APIInfo(req);
		User.findByUserName(req.params.account)
			.then(dbUser => {
				if(req.body.user) {
					return dbUser.addTeamMember(req.body.user, req.body.job, req.body.permissions);
				} else {
					return Promise.reject(responseCodes.USER_NOT_FOUND);
				}
			})
			.then((user) => {
				responseCodes.respond(responsePlace, req, res, next, responseCodes.OK, user);
			})
			.catch(err => {
				responseCodes.respond(responsePlace, req, res, next,
					err.resCode || utils.mongoErrorToResCode(err), err.resCode ? {} : err);
			});
	}

	function removeTeamMember(req, res, next) {

		const responsePlace = utils.APIInfo(req);
		User.findByUserName(req.params.account)
			.then(dbUser => {
				return dbUser.removeTeamMember(req.params.user, req.query.cascadeRemove);
			})
			.then(() => {
				responseCodes.respond(responsePlace, req, res, next, responseCodes.OK, {user: req.params.user});
			})
			.catch(err => {
				responseCodes.respond(responsePlace, req, res, next,
					err.resCode || utils.mongoErrorToResCode(err), err.resCode ? err.info : err);
			});
	}

	module.exports = router;
}());

