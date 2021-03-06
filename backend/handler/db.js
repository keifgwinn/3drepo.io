/**
 *	Copyright (C) 2014 3D Repo Ltd
 *
 *	This program is free software: you can redistribute it and/or modify
 *	it under the terms of the GNU Affero General Public License as
 *	published by the Free Software Foundation, either version 3 of the
 *	License, or (at your option) any later version.
 *
 *	This program is distributed in the hope that it will be useful,
 *	but WITHOUT ANY WARRANTY; without even the implied warranty of
 *	MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *	GNU Affero General Public License for more details.
 *
 *	You should have received a copy of the GNU Affero General Public License
 *	along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

"use strict";
(function() {
	const config	  = require("../config.js");
	const MongoClient = require("mongodb").MongoClient;
	const GridFSBucket = require("mongodb").GridFSBucket;
	const { PassThrough } = require("stream");
	const responseCodes = require("../response_codes");

	const connConfig = {
		autoReconnect: true
	};

	const Handler = {};

	let db;

	Handler.authenticate = async function (database, password) {
		const authDB = await Handler.getAuthDB();

		try {
			await authDB.authenticate(database, password);
		} catch (err) {
			if (authDB) {
				authDB.close();
			}

			throw err;
		}

		authDB.close();
	};

	Handler.disconnect = function () {
		if(db) {
			db.close();
			db = null;
		}
	};

	Handler.dropCollection = function (database, collection) {
		Handler.getDB(database).then(dbConn => {
			dbConn.dropCollection(collection.name);
		}).catch(err => {
			Handler.disconnect();
			return Promise.reject(err);
		});
	};

	/**
	 * @param {string} database
	 * @param {string} colName
	 * @param {object} query
	 * @param {object} projection
	 * @param {object} sort
	 * @returns {Promise<Array<Object>}
	 */
	Handler.find = async function (database, colName, query, projection = {}, sort = {}) {
		const collection = await Handler.getCollection(database, colName);
		// NOTE: v3.6 driver find take sort/projection as 2nd argument like findOne
		return collection.find(query).project(projection).sort(sort).toArray();
	};

	Handler.findOne = async function (database, colName, query, projection = {}, sort) {
		const collection = await Handler.getCollection(database, colName);
		// NOTE: documentation states it should be { projection, sort } so when we upgrade we may have to change.
		//       Also: projection stops working if you pass in a sort with empty obj.
		if(sort) {
			projection.sort = sort;
		}

		return collection.findOne(query, projection);
	};

	Handler.findOneAndDelete = async function (database, colName, query, projection = {}) {
		const collection = await Handler.getCollection(database, colName);
		const findResult = await collection.findOneAndDelete(query, projection);
		return findResult.value;
	};

	Handler.deleteMany = async function (database, colName, query) {
		const collection = await Handler.getCollection(database, colName);
		const findResult = await collection.deleteMany(query);
		return findResult.value;
	};

	function getURL(database) {
		// Generate connection string that could include multiple hosts that
		// represent a replica set.
		let connectString = "mongodb://" + config.db.username + ":" + config.db.password + "@";
		const hostPorts = [];

		for(const host in config.db.host) {
			hostPorts.push(config.db.host[host] + ":" + config.db.port[host]);
		}

		connectString += hostPorts.join(",");
		connectString += "/" + database + "?authSource=admin";
		connectString += config.db.replicaSet ? "&replicaSet=" + config.db.replicaSet : "";

		if(Number.isInteger(config.db.timeout)) {
			connectString += "&socketTimeoutMS=" + config.db.timeout;
		}

		return connectString;
	}

	Handler.getDB = function (database) {
		if(db) {
			return Promise.resolve(db.db(database));
		} else {
			return MongoClient.connect(getURL(database), connConfig).then(_db => {
				db = _db;
				return db;
			});
		}
	};

	Handler.getAuthDB = function () {
		return MongoClient.connect(getURL("admin"), connConfig).then(_db => {
			return _db;
		});
	};

	Handler.getCollection = function (database, colName) {
		return Handler.getDB(database).then(dbConn => {
			return dbConn.collection(colName);
		}).catch(err => {
			Handler.disconnect();
			return Promise.reject(err);
		});
	};

	Handler.getCollectionStats = function (database, colName) {
		return Handler.getDB(database).then(dbConn => {
			return dbConn.collection(colName).stats();
		}).catch(err => {
			Handler.disconnect();
			return Promise.reject(err);
		});
	};

	function getGridFSBucket(database, collection, chunksize = null) {
		return Handler.getDB(database).then(dbConn => {
			const options = {bucketName: collection};
			if (chunksize) {
				options.chunksize =  chunksize;
			}

			return new GridFSBucket(dbConn, options);
		}).catch(err => {
			Handler.disconnect();
			return Promise.reject(err);
		});
	}

	Handler.getFileStreamFromGridFS = function (database, collection, filename) {
		return getGridFSBucket(database,collection).then((bucket) => {
			return bucket.find({filename}).toArray().then(file => {
				if(file.length === 0) {
					return Promise.reject(responseCodes.NO_FILE_FOUND);
				}
				return Promise.resolve({stream: bucket.openDownloadStream(file[0]._id), size: file[0].length});
			});
		});
	};

	Handler.insert = async function (database, colName, data) {
		const collection = await Handler.getCollection(database, colName);
		return collection.insert(data);
	};

	Handler.insertMany = async function (database, colName, data) {
		const collection = await Handler.getCollection(database, colName);
		return collection.insertMany(data);
	};

	Handler.getFileFromGridFS = function (database, collection, filename) {
		return Handler.getFileStreamFromGridFS(database, collection, filename).then((file) => {
			const fileStream = file.stream;
			return new Promise((resolve) => {
				const bufs = [];
				fileStream.on("data", function(d) {
					bufs.push(d);
				});

				fileStream.on("end", function() {
					resolve(Buffer.concat(bufs));
				});
			});
		});
	};

	Handler.storeFileInGridFS = function (database, collection, filename, buffer) {
		return getGridFSBucket(database, collection).then(bucket => {
			return new Promise(function(resolve, reject) {
				try {
					const stream = new PassThrough();
					stream
						.pipe(bucket.openUploadStream(filename))
						.on("error", function(error) {
							reject(error);
						})
						.on("finish", function() {
							resolve(filename);
						});

					stream.end(buffer);

				} catch (e) {
					reject(e);
				}
			});
		});
	};

	Handler.listCollections = function (database) {
		return Handler.getDB(database).then(dbConn => {
			return dbConn.listCollections().toArray();
		}).catch(err => {
			Handler.disconnect();
			return Promise.reject(err);
		});

	};

	Handler.remove = async function (database, colName, query) {
		const collection = await Handler.getCollection(database, colName);
		return collection.remove(query);
	};

	Handler.runCommand = function (database, cmd) {
		return Handler.getDB(database).then(dbConn => {
			return dbConn.command(cmd);
		}).catch(err => {
			Handler.disconnect();
			return Promise.reject(err);
		});
	};

	Handler.getSessionStore = function (session) {
		const MongoDBStore = require("connect-mongodb-session")(session);
		return new MongoDBStore({
			uri: getURL("admin"),
			collection: "sessions"
		});
	};

	Handler.update = async function (database, colName, query, data, upsert = false) {
		const collection = await Handler.getCollection(database, colName);
		const options = upsert ? { upsert } : undefined;
		return collection.update(query, data, options);
	};

	Handler.updateOne = async function (database, colName, query, data, upsert = false) {
		const collection = await Handler.getCollection(database, colName);
		const options = upsert ? { upsert } : undefined;
		return collection.updateOne(query, data, options);
	};

	Handler.count = async function (database, colName, query, data) {
		const collection = await Handler.getCollection(database, colName);
		return collection.count(query, data);
	};

	module.exports = Handler;
}());

