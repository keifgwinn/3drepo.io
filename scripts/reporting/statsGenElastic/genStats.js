/**
*	Copyright (C) 2020 3D Repo Ltd
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

'use strict'
const MongoClient = require('mongodb').MongoClient;
const UserList = require('./userList');
const DBStats = require('./dbStats');
const Utils = require('./utils');

try {
	for (let i=0; i<10; i++) {
	}
  
	if (errors.length > 0) {
	  throw errors; 
	}
  
  } catch(e) {
	  for (let i=0; i<e.length; i++) {
		console.log(e[i]);
	  }
  }

var errors = [];

try {
	if ( Utils.clean(process.env.ELASTIC_CLOUD_AUTH === undefined ) ) { errors.push(new Error('ELASTIC_CLOUD_AUTH is not set')); } 
	if ( Utils.clean(process.env.ELASTIC_CLOUD_ID === undefined ) ) { errors.push(new Error('ELASTIC_CLOUD_ID is not set')); }
	if ( errors.length > 0 ) { throw errors }
} catch (e) {
    for (let i=0; i<e.length; i++) {
		console.log(e[i].message);
	  }
	process.exit(-1);
}

try {
	process.env.ELASTIC_CLOUD_AUTH.split(":")
} catch (error) {
	console.log("Error: Failed to split ELASTIC_CLOUD_AUTH, check format " + process.env.ELASTIC_CLOUD_AUTH)
	process.exit(-1);
}

process.on("unhandledRejection", (error) => {
	console.error(error); // This prints error with stack included (as for normal errors)
	throw error; // Following best practices re-throw error and let the process exit with error code
  })

const { Client } = require('@elastic/elasticsearch')
const ELASTIC_CLOUD_AUTH = process.env.ELASTIC_CLOUD_AUTH.split(":")
const ElasticClient = new Client({
	cloud: {
	  id: process.env.ELASTIC_CLOUD_ID
	},
	auth: {
	  username: ELASTIC_CLOUD_AUTH[0],
	  password: ELASTIC_CLOUD_AUTH[1]
	},
	reload_connections: true,
	maxRetries: 5,
	request_timeout: 60
  });
  
ElasticClient.cluster.health({},function(err,resp,status) {  
	console.log("[ELASTIC] -- Client Health --",resp);
});

if(process.argv.length < 5) {
	console.error('Not enough arguments: \n\tUsage: node genStats.js <mongo host:port> <username> <password>');
	process.exit(-1);
}

const url = `mongodb://${process.argv[3]}:${process.argv[4]}@${process.argv[2]}/admin`;
const client = new MongoClient(url, { useUnifiedTopology: true });

start();

async function start() {
	console.log(`Trying to connect to ${url}...`);
	try {
		const db = await client.connect();
		console.log('Connected successfully!');

		// initialise indicies if missing

		const activityMapping = {
			"Teamspace" : { 'type': 'keyword' },
			"licenseType" : { 'type': 'text' },
			"Year" : { 'type': 'text' },
			"Month" : { 'type': 'text' }, 
			"DateTime" : { 'type': 'date' },
			"Issues" :  { 'type': 'double' }, 
			"Model Revisions" : { 'type': 'double' }, 
		}
		await Utils.createElasticIndex(ElasticClient,Utils.teamspaceIndexPrefix + "-activity",activityMapping)

		const quotaMapping = {
			"Teamspace" : { 'type': 'keyword' },
			"Type" : { 'type': 'text' }, 
			"User Count" : { 'type': 'double' }, 
			"Max Users" : { 'type': 'double' }, 
			"Max Data(GB)" :  { 'type': 'double' }, 
			"Expiry Date" : { 'type': 'date' }, 
			"Expired" : { 'type': 'boolean' }, 
		}
		await Utils.createElasticIndex(ElasticClient,Utils.teamspaceIndexPrefix + "-quota",quotaMapping)

		const usersMapping = {
			"Teamspace" : { 'type': 'keyword' },
			"Email" : { 'type': 'text' }, 
			"First Name" : { 'type': 'text' }, 
			"Last Name" : { 'type': 'text' }, 
			"Country" : { 'type': 'text' }, 
			"Company" : { 'type': 'text' }, 
			"Date Created" : { 'type': 'text' },
			"DateTime" : { 'type': 'date' },
			"Mail Optout" : { 'type': 'text' }, 
			"Verified" : { 'type': 'boolean' }, 
		}
		await Utils.createElasticIndex(ElasticClient,Utils.teamspaceIndexPrefix + "-users",usersMapping)

		const loginMapping = {
			"Teamspace" : { 'type': 'keyword' },
			"Last Login" : { 'type': 'text' },
			"DateTime" : { 'type': 'date' },
		}
		await Utils.createElasticIndex(ElasticClient,Utils.teamspaceIndexPrefix + "-login",loginMapping)

		const statsMapping = {
			"Month" : { 'type': 'text' },
			"Year" :{ 'type': 'text' },
			"Count" : { 'type': 'double' }, 
			"Total" :{ 'type': 'double' }, 
			"DateTime" : { 'type': 'date' },
		}
		await Utils.createElasticIndex(ElasticClient,Utils.statsIndexPrefix,statsMapping)

		// if we're running on a daily basis to keep the stats up to date we don't want to run the full DB Report

		if ( Utils.clean(process.env.STATS_RUN_DAILY ) ){
			await UserList.createUsersReport(db, ElasticClient) 
		} else { 		
			await Promise.all([
				UserList.createUsersReport(db, ElasticClient),
				DBStats.createDBReport(db, ElasticClient)
			]);
		}

		await client.close();
	} catch (err) {
		console.error('Connecting failed', err);
	}
}
