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
const FSHandler = require("./fs");
const S3Handler = require("./s3");
const GridFSHandler = require("./gridfs");
const ResponseCodes = require("../response_codes");
const SystemLogger = require("../logger.js").systemLogger;

const ExternalServices = {};

ExternalServices.getFileStream = (account, collection, type, key) => {
	switch(type) {
		case "fs" :
			return Promise.resolve(FSHandler.getFileStream(key));
		case "s3" :
			return Promise.resolve(S3Handler.getFileStream(key));
		case "gridfs" :
			return GridFSHandler.getFileStream(account, collection, key);
		default:
			SystemLogger.logError(`Unrecognised external service: ${type}`);
			return Promise.reject(ResponseCodes.UNRECOGNISED_STORAGE_TYPE);
	}
};

ExternalServices.getFile = (account, collection, type, key) => {
	switch(type) {
		case "fs" :
			return FSHandler.getFile(key);
		case "s3" :
			return S3Handler.getFile(key);
		case "gridfs" :
			return GridFSHandler.getFile(account, collection, key);
		default:
			SystemLogger.logError(`Unrecognised external service: ${type}`);
			return Promise.reject(ResponseCodes.UNRECOGNISED_STORAGE_TYPE);
	}
};

ExternalServices.removeFiles = (account, collection, type, keys) => {
	switch(type) {
		case "fs" :
			return FSHandler.removeFiles(keys);
		case "s3" :
			return S3Handler.removeFiles(keys);
		case "gridfs" :
			return GridFSHandler.removeFiles(account, collection, keys);
		default:
			SystemLogger.logError(`Unrecognised external service: ${type}`);
			return Promise.reject(ResponseCodes.UNRECOGNISED_STORAGE_TYPE);
	}
};

module.exports = ExternalServices;
