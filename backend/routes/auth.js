/**
 *  Copyright (C) 2014 3D Repo Ltd
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

(function() {
	"use strict";
	var express = require("express");
	var router = express.Router({mergeParams: true});
	// var dbInterface = require("../db/db_interface.js");
	var responseCodes = require("../response_codes.js");
	var C = require("../constants");
	var middlewares = require("./middlewares");
	var config = require('../config');
	var systemLogger    = require("../logger.js").systemLogger;
	var utils = require("../utils");
	var User = require("../models/user");
	var Mailer = require("../mailer/mailer");

	router.post("/login", login);
	router.get("/login", checkLogin);
	router.post("/logout", logout);
	router.get("/:account.jpg", middlewares.loggedIn, getAvatar);
	router.post('/:account', signUp);
	router.post('/:account/verify', verify);
	router.post('/:account/forgot-password', forgotPassword);
	router.put("/:account", middlewares.loggedIn, updateUser);
	router.put("/:account/password", resetPassword);

	function expireSession(req) {
		req.session.cookie.expires = new Date(0);
		req.session.cookie.maxAge = 0;
	}

	function createSession(place, req, res, next, user){

		req.session.regenerate(function(err) {
			if(err) {
				responseCodes.respond(place, responseCodes.EXTERNAL_ERROR(err), res, {username: user.username});
			} else {
				systemLogger.logDebug("Authenticated user and signed token.", req);

				req.session[C.REPO_SESSION_USER] = user;
				req.session.cookie.domain = req.host;

				if (config.cookie.maxAge)
				{
					req.session.cookie.maxAge = config.cookie.maxAge;
				}
				responseCodes.respond(place, req, res, next, responseCodes.OK, {username: user.username, roles: user.roles});
			}
		});
	}

	function login(req, res, next){
		let responsePlace = utils.APIInfo(req);

		req[C.REQ_REPO].logger.logInfo("Authenticating user", req.body.username);


		User.authenticate(req[C.REQ_REPO].logger, req.body.username, req.body.password).then(user => {

			req[C.REQ_REPO].logger.logInfo("User is logged in", req.body.username);

			expireSession(req);
			createSession(responsePlace, req, res, next, {username: user.user, roles: user.roles});
		}).catch(err => {
			responseCodes.respond(responsePlace, req, res, next, err.resCode ? err.resCode: err, err.resCode ? err.resCode: err);
		});

	}

	function checkLogin(req, res, next){
		if (!req.session.user) {
			responseCodes.respond(utils.APIInfo(req), req, res, next, responseCodes.NOT_LOGGED_IN, {});
		} else {
			responseCodes.respond(utils.APIInfo(req), req, res, next, responseCodes.OK, {username: req.session.user.username});
		}
	}

	function logout(req, res, next){
		if(!req.session.user){
			return responseCodes.respond(utils.APIInfo(req), req, res, next, responseCodes.NOT_LOGGED_IN, {});
		}

		var username = req.session.user.username;

		req.session.destroy(function() {
			req[C.REQ_REPO].logger.logDebug("User has logged out.", req);
			res.clearCookie("connect.sid", { path: "/" + config.api_server.host_dir });

			responseCodes.respond("Logout POST", req, res, next, responseCodes.OK, {username: username});
		});
	}

	function updateUser(req, res, next){
		let responsePlace = utils.APIInfo(req);

		if(req.body.oldPassword){

			// Update password
			User.updatePassword(req[C.REQ_REPO].logger, req.params[C.REPO_REST_API_ACCOUNT], req.body.oldPassword, null, req.body.newPassword).then(() => {
				responseCodes.respond(responsePlace, req, res, next, responseCodes.OK, { account: req.params[C.REPO_REST_API_ACCOUNT] });
			}).catch(err => {
				responseCodes.respond(responsePlace, req, res, next, err.resCode ? err.resCode: err, err.resCode ? err.resCode: err);
			});

		} else {

			// Update user info
			User.findByUserName(req.params[C.REPO_REST_API_ACCOUNT]).then(user => {
				user.updateInfo(req.body);
			}).then(() => {
				responseCodes.respond(responsePlace, req, res, next, responseCodes.OK, { account: req.params[C.REPO_REST_API_ACCOUNT] });
			}).catch(err => {
				responseCodes.respond(responsePlace, req, res, next, err.resCode || utils.mongoErrorToResCode(err), err.resCode ? {} : err);
			});
		}


	}

	function signUp(req, res, next){

		let responsePlace = utils.APIInfo(req);

		if(!req.body.password){
			let err = responseCodes.SIGN_UP_PASSWORD_MISSING;
			return responseCodes.respond(responsePlace, req, res, next, err, err);
		}

		User.createUser(req[C.REQ_REPO].logger, req.params.account, req.body.password, {
			email: req.body.email,
			firstName: req.body.firstName,
			lastName: req.body.lastName
		}, config.tokenExpiry.emailVerify).then( data => {
			//send verification email
			return Mailer.sendVerifyUserEmail(req.body.email, {
				token : data.token,
				email: req.body.email
			}).catch( err => {
				// catch email error instead of returning to client
				systemLogger.logDebug(`Email error - ${err.message}`, req);
				return Promise.reject(responseCodes.PROCESS_ERROR('Internal Email Error'));
			});

		}).then(emailRes => {

			systemLogger.logInfo('Email info - ' + JSON.stringify(emailRes), req);
			responseCodes.respond(responsePlace, req, res, next, responseCodes.OK, { account: req.params[C.REPO_REST_API_ACCOUNT] });
		}).catch(err => {
			responseCodes.respond(responsePlace, req, res, next, err.resCode ? err.resCode: err, err.resCode ? err.resCode: err);
		});
	}

	function verify(req, res, next){
		
		let responsePlace = utils.APIInfo(req);

		User.verify(req.params[C.REPO_REST_API_ACCOUNT], req.body.token).then(() => {
			responseCodes.respond(responsePlace, req, res, next, responseCodes.OK, {});
		}).catch(err => {
			responseCodes.respond(responsePlace, req, res, next, err.resCode || err , err.resCode ? err.resCode : err);
		});

	}

	function forgotPassword(req, res, next){
		let responsePlace = utils.APIInfo(req);

		User.getForgotPasswordToken(req.params[C.REPO_REST_API_ACCOUNT], req.body.email, config.tokenExpiry.forgotPassword).then(data => {

			//send forgot password email
			return Mailer.sendResetPasswordEmail(req.body.email, {
				token : data.token,
				email: req.body.email
			}).catch( err => {
				// catch email error instead of returning to client
				systemLogger.logDebug(`Email error - ${err.message}`, req);
				return Promise.reject(responseCodes.PROCESS_ERROR('Internal Email Error'));
			});
		
		}).then(emailRes => {
			
			systemLogger.logInfo('Email info - ' + JSON.stringify(emailRes), req);
			responseCodes.respond(responsePlace, req, res, next, responseCodes.OK, {});
		}).catch(err => {
			console.log(err);
			responseCodes.respond(responsePlace, req, res, next, err.resCode || err , err.resCode ? err.resCode : err);
		});
	}

	function getAvatar(req, res, next){
		let responsePlace = utils.APIInfo(req);

		// Update user info
		User.findByUserName(req.params[C.REPO_REST_API_ACCOUNT]).then(user => {


			if(!user.getAvatar()){
				return Promise.reject({resCode: responseCodes.USER_DOES_NOT_HAVE_AVATAR });
			}

			return Promise.resolve(user.getAvatar());

		}).then(avatar => {

			res.write(avatar.data.buffer);
			res.end();

		}).catch(() => {

			responseCodes.respond(responsePlace, req, res, next, err.resCode || utils.mongoErrorToResCode(err), err.resCode ? {} : err);
		});
	}

	function resetPassword(req, res, next){
		let responsePlace = utils.APIInfo(req);

		User.updatePassword(req[C.REQ_REPO].logger, req.params[C.REPO_REST_API_ACCOUNT], null, req.body.token, req.body.newPassword).then(() => {
			responseCodes.respond(responsePlace, req, res, next, responseCodes.OK, { account: req.params[C.REPO_REST_API_ACCOUNT] });
		}).catch(err => {
			responseCodes.respond(responsePlace, req, res, next, err.resCode ? err.resCode: err, err.resCode ? err.resCode: err);
		});
	}

	module.exports = router;
}());
