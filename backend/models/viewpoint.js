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

"use strict";
const _ = require("lodash");

const utils = require("../utils");
const nodeuuid = require("uuid/v1");
const responseCodes = require("../response_codes.js");
const db = require("../handler/db");
const ChatEvent = require("./chatEvent");
const FileRef = require("./fileRef");

const fieldTypes = {
	"_id": "[object Object]",
	"name": "[object String]",
	"thumbnail": ["[object String]", "[object Object]"],
	"viewpoint": "[object Object]"
};

const getResponse = (responseCodeType) => (type) => responseCodes[responseCodeType + "_" + type];

class View {
	constructor() {
		this.collName = "views";
		this.response = getResponse("VIEW");
		this.fieldTypes = fieldTypes;
	}

	// TODO v2
	clean(account, model, viewToClean, targetType = "[object String]") {
		const viewFields = [
			"_id",
			"viewpoint.group_id",
			"viewpoint.guid",
			"viewpoint.highlighted_group_id",
			"viewpoint.hidden_group_id",
			"viewpoint.shown_group_id"
		];

		viewFields.forEach((field) => {
			if (_.get(viewToClean, field)) {
				if ("[object String]" === targetType && utils.isObject(_.get(viewToClean, field))) {
					_.set(viewToClean, field, utils.uuidToString(_.get(viewToClean, field)));
				} else if ("[object Object]" === targetType && utils.isString(_.get(viewToClean, field))) {
					_.set(viewToClean, field, utils.stringToUUID(_.get(viewToClean, field)));
				}
			}
		});

		if (viewToClean.viewpoint &&
			viewToClean.viewpoint.guid &&
			(viewToClean.viewpoint.screenshot || viewToClean.viewpoint.screenshot_ref)) {
			const id = utils.uuidToString(viewToClean._id);
			const viewpointId = utils.uuidToString(viewToClean.viewpoint.guid);
			viewToClean.viewpoint.screenshot = account + "/" + model + "/" + this.collName + "/" + id + "/viewpoints/" + viewpointId + "/screenshot.png";
		}

		if (viewToClean.thumbnail) {
			const id = utils.uuidToString(viewToClean._id);
			viewToClean.thumbnail = account + "/" + model + "/" + this.collName + "/" + id + "/thumbnail.png";
		} else {
			viewToClean.thumbnail = undefined;
		}

		// ===============================
		// DEPRECATED LEGACY SUPPORT START
		// ===============================
		if (viewToClean.thumbnail) {
			viewToClean.screenshot = { thumbnail: viewToClean.thumbnail };
		}

		if (viewToClean.viewpoint && viewToClean.viewpoint.clippingPlanes) {
			viewToClean.clippingPlanes = viewToClean.viewpoint.clippingPlanes;
		}

		if (viewToClean.viewpoint.screenshot && !viewToClean.viewpoint.screenshotSmall) {
			viewpoint.screenshotSmall = viewpoint.screenshot;
		}
		// =============================
		// DEPRECATED LEGACY SUPPORT END
		// =============================

		return viewToClean;
	}

	getCollection(account, model) {
		return db.getCollection(account, model + "." + this.collName);
	}

	async findByUID(account, model, uid, projection, noClean = false) {
		if (utils.isString(uid)) {
			uid = utils.stringToUUID(uid);
		}

		const views = await this.getCollection(account, model);
		const foundView = await views.findOne({ _id: uid }, projection);

		if (!foundView) {
			return Promise.reject(this.response("NOT_FOUND"));
		}

		if (!noClean) {
			return this.clean(account, model, foundView);
		}

		return foundView;
	}

	async getList(account, model) {
		const coll = await this.getCollection(account, model);
		const views = await coll.find().toArray();
		views.forEach((foundView, index) => {
			views[index] = this.clean(account, model, foundView);
		});

		return views;
	}

	async setExternalScreenshotRef(viewpoint, account, model, collName) {
		const screenshot = viewpoint.screenshot;
		const ref = await FileRef.storeFile(account, model + "." + collName + ".ref", null, null, screenshot);
		delete viewpoint.screenshot;
		viewpoint.screenshot_ref = ref._id;
		return viewpoint;
	}

	setViewpointScreenshotURL(collName, account, model, id, viewpoint) {
		if (!viewpoint || (!viewpoint.screenshot && !viewpoint.screenshot_ref)) {
			return viewpoint;
		}

		id = utils.uuidToString(id);
		const viewpointId = utils.uuidToString(viewpoint.guid);

		viewpoint.screenshot = account + "/" + model + "/" + collName + "/" + id + "/viewpoints/" + viewpointId + "/screenshot.png";

		return viewpoint;
	}

	getThumbnail(account, model, uid) {
		if (utils.isString(uid)) {
			uid = utils.stringToUUID(uid);
		}

		return this.findByUID(account, model, uid, { "screenshot.buffer": 1, thumbnail: 1 }, true).then((foundView) => {
			// the 'content','screenshot' field is for legacy reasons
			if (!_.get(foundView, "thumbnail.buffer") &&
				!_.get(foundView, "thumbnail.content.buffer") &&
				!_.get(foundView, "screenshot.buffer")) {
				return Promise.reject(responseCodes.SCREENSHOT_NOT_FOUND);
			} else {
				return (foundView.thumbnail.content ||
					foundView.screenshot.buffer ||
					foundView.thumbnail).buffer;
			}
		});
	}

	async update(sessionId, account, model, uid, data) {
		if (utils.isString(uid)) {
			uid = utils.stringToUUID(uid);
		}

		// 1. Get old view
		// const oldView = await this.findByUID(account, model, uid, {}, true);

		// 2. Pick whitelisted attributes and leave proper attrs
		const attributeWhitelist = ["name"];
		data = _.pick(data, attributeWhitelist);

		if (_.isEmpty(data)) {
			throw responseCodes.INVALID_ARGUMENTS;
		}

		const views = await this.getCollection(account, model);
		await views.update({ _id: uid }, { $set: data });

		ChatEvent.viewpointsChanged(sessionId, account, model, Object.assign({ _id: utils.uuidToString(uid) }, data));

		return { _id: utils.uuidToString(uid) };
	}

	async create(sessionId, account, model, newView) {
		if (!newView.name) {
			return Promise.reject({ resCode: responseCodes.INVALID_ARGUMENTS });
		}

		// ===============================
		// DEPRECATED LEGACY SUPPORT START
		// ===============================
		if (newView.screenshot && newView.screenshot.base64) {
			const croppedScreenshot = await utils.getCroppedScreenshotFromBase64(newView.screenshot.base64, 79, 79);
			newView.thumbnail = new Buffer.from(croppedScreenshot, "base64");
		}

		if (newView.clippingPlanes && newView.viewpoint && !newView.viewpoint.clippingPlanes) {
			newView.viewpoint.clippingPlanes = newView.clippingPlanes;
		}
		// =============================
		// DEPRECATED LEGACY SUPPORT END
		// =============================

		newView = _.pick(newView, Object.keys(fieldTypes));

		newView._id = utils.stringToUUID(newView._id || nodeuuid());
		const coll = await this.getCollection(account, model);
		await coll.insert(newView);

		newView = this.clean(account, model, newView);

		if (sessionId) {
			ChatEvent.viewpointsCreated(sessionId, account, model, newView);
		}

		return newView;
	}

	async deleteViewpoint(account, model, uid, sessionId) {
		if (utils.isString(uid)) {
			uid = utils.stringToUUID(uid);
		}

		const coll = await this.getCollection(account, model);
		return coll.findOneAndDelete({ _id: uid }).then((deleteResponse) => {
			if (!deleteResponse.value) {
				return Promise.reject(this.response("NOT_FOUND"));
			}
			if(sessionId) {
				ChatEvent.viewpointsDeleted(sessionId, account, model, utils.uuidToString(uid));
			}
		});
	}
}

module.exports = View;
