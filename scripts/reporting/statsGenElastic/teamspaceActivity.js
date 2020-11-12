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

const Utils = require('./utils');
const Elastic = require('./elastic');

const getNewIssuesByMonth = async (db, model) => {
	const issues = await db.collection(`${model}.issues`).find({}, {created: 1, _id: -1}).toArray();

	const res = [];
	issues.forEach((issue) => {
		const date = new Date(issue.created);
		const month = date.getMonth() + 1;
		const year = date.getFullYear();

		if(!res[year]) res[year] = {};

		if(!res[year][month]) {
			res[year][month] = 1
		} else {
			++res[year][month];
		}
	});

	return res;
}

const getNewRevisionsByMonth = async (db, model) => {
	const revs = await db.collection(`${model}.history`).find({}, {timestamp: 1, _id: -1}).toArray();

	const res = [];
	revs.forEach((rev) => {
		const date = rev.timestamp;
		const month = date.getMonth() + 1;
		const year = date.getFullYear();

		if(!res[year]) res[year] = {};

		if(!res[year][month]) {
			res[year][month] = 1
		} else {
			++res[year][month];
		}
	});

	return res;
}

const getStatsForModel = (db, model) => {
	return Promise.all([
		getNewIssuesByMonth(db, model),
		getNewRevisionsByMonth(db, model)
	]).then((res) => ({issues: res[0], revisions: res[1]}));
}

const accumulateStats = (total, current) => {
	const toProcess = [current.issues, current.revisions];

	for(let i = 0; i < toProcess.length; ++i) {
		const isIssues = i === 0;
		const data = isIssues? current.issues : current.revisions;
		const type = isIssues? 'issues' : 'revisions';

		for(let year in data) {
			if(!total[year]) total[year] = {};
			for(let month in data[year]) {
				if(!total[year][month]) {
					total[year][month] = {issues : 0, revisions: 0};
					total[year][month][type] = data[year][month];
				} else {
					total[year][month][type] += data[year][month];
				}
			}
		}
	}
	return total;
}

const printEmptyRows = async (ElasticClient, ts, licenseType, currentM, currentY, month, year) => {
	if(currentM !== -1) {
		let nextM = currentM === 12? 1 : currentM +1;
		let nextY = currentM === 12? currentY + 1: currentY;

		while(!(nextM === month && nextY === year)) {

			const elasticBody =  {
				"Teamspace" : ts,
				"licenseType" : licenseType,
				"Year" : year, 
				"Month" : month, 
				"DateTime" : new Date(year,month).toISOString(),
				"Issues" : 0, 
				"Model Revisions" : 0, 
			}
			await Elastic.createElasticRecord(ElasticClient, Utils.teamspaceIndexPrefix + '-activity', elasticBody )
			nextY = nextM === 12? nextY + 1: nextY;
			nextM = nextM === 12? 1 : nextM +1;
		}
	}
}

const printStatsToElastic = async (ElasticClient, data, ts, licenseType) => {

	let lastYear = -1, lastMonth = -1;
	Object.keys(data).forEach((_year) => {
		const year = parseInt(_year);
		Object.keys(data[year]).forEach((_month) => {
			const month = parseInt(_month);

			printEmptyRows(ElasticClient, ts, licenseType, lastMonth, lastYear, month, year);
			const elasticBody =  {
				"Teamspace" : ts,
				"licenseType" : licenseType,
				"Year" : year, 
				"Month" : month, 
				"DateTime" : new Date(year,month).toISOString(),
				"Issues" : data[year][month].issues, 
				"Model Revisions" : data[year][month].revisions, 
			}
			Elastic.createElasticRecord(ElasticClient, Utils.teamspaceIndexPrefix + '-activity', elasticBody )
			lastMonth = month;
			lastYear = year;
		});
	});

	const now = new Date();
	const targetDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
	printEmptyRows(ElasticClient, ts, licenseType, lastMonth, lastYear, targetDate.getMonth()+1, targetDate.getFullYear());
	Promise.resolve()
}

const reportActivity = async (db, ElasticClient, ts, licenseType) => {
	const modelSettings = await db.collection('settings').find({},{_id: 1}).toArray();

	const modelProm = [];
	modelSettings.forEach((model) => {
		modelProm.push(getStatsForModel(db, model._id));
	});

	const stats = await Promise.all(modelProm);

	const finalStats = stats.reduce(accumulateStats, {});
	printStatsToElastic(ElasticClient, finalStats, ts, licenseType);

}

const TS = {};

TS.createTeamspaceActivityReport = (dbConn, ElasticClient, ts, licenseType) =>{
	return new Promise((resolve, reject) => {
		reportActivity(dbConn.db(ts), ElasticClient, ts, licenseType).then(() => {
				console.log('[DB] TeamspaceActivityReport created');
				resolve();
			}).catch((err) => {
				reject(err);
			});
		});
}

module.exports = TS;

