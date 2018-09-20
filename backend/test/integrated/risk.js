"use strict";

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

const request = require("supertest");
const expect = require("chai").expect;
const app = require("../../services/api.js").createApp(
	{ session: require("express-session")({ secret: "testing", resave: false, saveUninitialized: false }) }
	);
const responseCodes = require("../../response_codes.js");
const async = require("async");

describe("Risks", function () {

	let server;
	let agent;

	const username = "issue_username";
	const username2 = "issue_username2";
	const password = "password";

	const projectAdminUser = "imProjectAdmin";

	const model = "project1";

	const pngBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAFUlEQVR42mPUjrj6n4EIwDiqkL4KAV6SF3F1FmGrAAAAAElFTkSuQmCC";
	const baseRisk = {
		"safetibase_id":"12456-abcdef",
		"associated_activity":"replacement",
		"desc":"Sample description",
		"viewpoint":{
			"up":[0,1,0],
			"position":[38,38 ,125.08011914810137],
			"look_at":[0,0,-163.08011914810137],
			"view_dir":[0,0,-1],
			"right":[1,0,0],
			"unityHeight":3.537606904422707,
			"fov":2.1124830653010416,
			"aspect_ratio":0.8750189337327384,
			"far":276.75612077194506 ,
			"near":76.42411012233212,
			"clippingPlanes":[]
		},
		"assigned_roles":["jobB"],
		"category":"other issue",
		"likelihood":"0",
		"consequence":"0",
		"level_of_risk":"0",
		"mitigation_status":"proposed",
		"mitigation_desc":"Task123"
	};

	before(function(done) {

		server = app.listen(8080, function () {
			console.log("API test server is listening on port 8080!");

			agent = request.agent(server);
			agent.post("/login")
				.send({ username, password })
				.expect(200, function(err, res) {
					expect(res.body.username).to.equal(username);
					done(err);
				});
		});
	});

	after(function(done) {
		server.close(function() {
			console.log("API test server is closed");
			done();
		});
	});

	describe("Creating a risk", function() {

		it("should succeed", function(done) {

			const risk = Object.assign({"name":"Risk test"}, baseRisk);
			let riskId;

			async.series([
				function(done) {
					agent.post(`/${username}/${model}/risks.json`)
						.send(risk)
						.expect(200, function(err, res) {

							riskId = res.body._id;

							expect(res.body.name).to.equal(risk.name);
							expect(res.body.safetibase_id).to.equal(risk.safetibase_id);
							expect(res.body.associated_activity).to.equal(risk.associated_activity);
							expect(res.body.desc).to.equal(risk.desc);
							expect(res.body.viewpoint.up).to.deep.equal(risk.viewpoint.up);
							expect(res.body.viewpoint.position).to.deep.equal(risk.viewpoint.position);
							expect(res.body.viewpoint.look_at).to.deep.equal(risk.viewpoint.look_at);
							expect(res.body.viewpoint.view_dir).to.deep.equal(risk.viewpoint.view_dir);
							expect(res.body.viewpoint.clippingPlanes).to.deep.equal(risk.viewpoint.clippingPlanes);
							expect(res.body.assigned_roles).to.deep.equal(risk.assigned_roles);
							expect(res.body.category).to.equal(risk.category);
							expect(res.body.likelihood).to.equal(risk.likelihood);
							expect(res.body.consequence).to.equal(risk.consequence);
							expect(res.body.level_of_risk).to.equal(risk.level_of_risk);
							expect(res.body.mitigation_status).to.equal(risk.mitigation_status);
							expect(res.body.mitigation_desc).to.equal(risk.mitigation_descy);

							return done(err);
						});
				},

				function(done) {
					agent.get(`/${username}/${model}/risks/${riskId}.json`).expect(200, function(err, res) {

						expect(res.body.name).to.equal(risk.name);
						expect(res.body.safetibase_id).to.equal(risk.safetibase_id);
						expect(res.body.associated_activity).to.equal(risk.associated_activity);
						expect(res.body.desc).to.equal(risk.associated_activity);
						expect(res.body.viewpoint.up).to.deep.equal(risk.viewpoint.up);
						expect(res.body.viewpoint.position).to.deep.equal(risk.viewpoint.position);
						expect(res.body.viewpoint.look_at).to.deep.equal(risk.viewpoint.look_at);
						expect(res.body.viewpoint.view_dir).to.deep.equal(risk.viewpoint.view_dir);
						expect(res.body.viewpoint.clippingPlanes).to.deep.equal(risk.viewpoint.clippingPlanes);
						expect(res.body.assigned_roles).to.deep.equal(risk.assigned_roles);
						expect(res.body.category).to.equal(risk.category);
						expect(res.body.likelihood).to.equal(risk.likelihood);
						expect(res.body.consequence).to.equal(risk.consequence);
						expect(res.body.level_of_risk).to.equal(risk.level_of_risk);
						expect(res.body.mitigation_status).to.equal(risk.mitigation_status);
						expect(res.body.mitigation_desc).to.equal(risk.mitigation_descy);

						return done(err);
					});
				}
			], done);
		});

		it("with screenshot should succeed", function(done) {

			const risk = Object.assign({"name":"Risk test"}, baseRisk);
			risk.viewpoint.screenshot = pngBase64;

			let riskId;

			async.series([
				function(done) {
					agent.post(`/${username}/${model}/risks.json`)
						.send(risk)
						.expect(200, function(err, res) {
							riskId = res.body._id;
							return done(err);
						});
				},

				function(done) {
					agent.get(`/${username}/${model}/risks/${riskId}.json`).expect(200, function(err, res) {
						expect(res.body.viewpoint.screenshot).to.equal(`${username}/${model}/risks/${riskId}/screenshot.png`);
						return done(err);
					});
				}
			], done);
		});

		it("without name should fail", function(done) {

			const risk = baseRisk;

			agent.post(`/${username}/${model}/risks.json`)
				.send(risk)
				.expect(400, function(err, res) {
					expect(res.body.value).to.equal(responseCodes.RISK_NO_NAME.value);
					done(err);
				});
		});

		it("with invalid risk likelihood should fail", function(done) {

			const risk = Object.assign({}, baseRisk, {"name":"Risk test", "likelihood":"abc"});

			agent.post(`/${username}/${model}/risks.json`)
				.send(risk)
				.expect(400, function(err, res) {
					expect(res.body.value).to.equal(responseCodes.RISK_LIKELIHOOD_INVALID.value);
					done(err);
				});
		});

		it("with invalid risk consequence should fail", function(done) {

			const risk = Object.assign({}, baseRisk, {"name":"Risk test", "consequence":"abc"});

			agent.post(`/${username}/${model}/risks.json`)
				.send(risk)
				.expect(400, function(err, res) {
					expect(res.body.value).to.equal(responseCodes.RISK_CONSEQUENCE_INVALID.value);
					done(err);
				});
		});

		it("with invalid mitigation status", function(done) {

			const risk = Object.assign({}, baseRisk, {"name":"Risk test", "mitigation_status":"abc"});

			agent.post(`/${username}/${model}/risks.json`)
				.send(risk)
				.expect(200, function(err, res) {
					done(err);
				});
		});

		it("with pin should succeed and pin info is saved", function(done) {

			const risk = Object.assign({
				"name":"Risk test",
				"norm": [0.9999999319099296, 0.00006146719401852714, -0.000363870746590937],
				"position": [33.167440465643935, 12.46054749529149, -46.997271893235435]
			}, baseRisk);

			let riskId;

			async.series([
				function(done) {
					agent.post(`/${username}/${model}/risks.json`)
						.send(risk)
						.expect(200 , function(err, res) {
							riskId = res.body._id;
							expect(res.body.norm).to.deep.equal(risk.norm);
							expect(res.body.position).to.deep.equal(risk.position);
							return done(err);

						});
				},
				function(done) {
					agent.get(`/${username}/${model}/risks/${riskId}.json`).expect(200, function(err, res) {
						expect(res.body.norm).to.deep.equal(risk.norm);
						expect(res.body.position).to.deep.equal(risk.position);
						done(err);
					});
				}
			], done);
		});

		it("change safetibase_id should succeed", function(done) {

			const risk = Object.assign({"name":"Issue test"}, baseRisk);
			let riskId;

			const safetibaseId = { safetibase_id: "another_id" };

			async.series([
				function(done) {
					agent.post(`/${username}/${model}/risks.json`)
						.send(risk)
						.expect(200, function(err, res) {
							riskId = res.body._id;
							return done(err);
						});
				},
				function(done) {
					agent.put(`/${username}/${model}/risks/${riskId}.json`)
						.send(safetibaseId)
						.expect(200, done);
				},
				function(done) {
					agent.get(`/${username}/${model}/risks/${riskId}.json`)
						.expect(200, function(err, res) {
							expect(res.body.safetbase_id = safetibaseId.safetibase_id);
							done(err);
						});
				}
			], done);
		});

		it("change associated_activity should succeed", function(done) {

			const risk = Object.assign({"name":"Issue test"}, baseRisk);
			let riskId;

			const associatedActivity = { associated_activity: "cleaning and maintenance" };

			async.series([
				function(done) {
					agent.post(`/${username}/${model}/risks.json`)
						.send(risk)
						.expect(200, function(err, res) {
							riskId = res.body._id;
							return done(err);
						});
				},
				function(done) {
					agent.put(`/${username}/${model}/risks/${riskId}.json`)
						.send(associatedActivity)
						.expect(200, done);
				},
				function(done) {
					agent.get(`/${username}/${model}/risks/${riskId}.json`)
						.expect(200, function(err, res) {
							expect(res.body.associated_activity = associatedActivity.associated_activity);
							done(err);
						});
				}
			], done);
		});

		it("change description should succeed", function(done) {

			const risk = Object.assign({"name":"Issue test"}, baseRisk);
			let riskId;

			const description = { desc: "new description" };

			async.series([
				function(done) {
					agent.post(`/${username}/${model}/risks.json`)
						.send(risk)
						.expect(200, function(err, res) {
							riskId = res.body._id;
							return done(err);
						});
				},
				function(done) {
					agent.put(`/${username}/${model}/risks/${riskId}.json`)
						.send(description)
						.expect(200, done);
				},
				function(done) {
					agent.get(`/${username}/${model}/risks/${riskId}.json`)
						.expect(200, function(err, res) {
							expect(res.body.desc = description.desc);
							done(err);
						});
				}
			], done);
		});

		it("change assigned_roles should succeed", function(done) {

			const risk = Object.assign({"name":"Issue test"}, baseRisk);
			let riskId;

			const assignedRoles = { assigned_roles: ["jobC"] };

			async.series([
				function(done) {
					agent.post(`/${username}/${model}/risks.json`)
						.send(risk)
						.expect(200, function(err, res) {
							riskId = res.body._id;
							return done(err);
						});
				},
				function(done) {
					agent.put(`/${username}/${model}/risks/${riskId}.json`)
						.send(assignedRoles)
						.expect(200, done);
				},
				function(done) {
					agent.get(`/${username}/${model}/risks/${riskId}.json`)
						.expect(200, function(err, res) {
							expect(res.body.assigned_roles).to.deep.equal(assignedRoles.assigned_roles);
							done(err);
						});
				}
			], done);
		});

		it("change category should succeed", function(done) {

			const risk = Object.assign({"name":"Issue test"}, baseRisk);
			let riskId;

			const category = { category: "environmental issue" };

			async.series([
				function(done) {
					agent.post(`/${username}/${model}/risks.json`)
						.send(risk)
						.expect(200, function(err, res) {
							riskId = res.body._id;
							return done(err);
						});
				},
				function(done) {
					agent.put(`/${username}/${model}/risks/${riskId}.json`)
						.send(category)
						.expect(200, done);
				},
				function(done) {
					agent.get(`/${username}/${model}/risks/${riskId}.json`)
						.expect(200, function(err, res) {
							expect(res.body.category = category.category);
							done(err);
						});
				}
			], done);
		});

		it("change likelihood should succeed", function(done) {

			const risk = Object.assign({"name":"Issue test"}, baseRisk);
			let riskId;

			const likelihood = { likelihood: "high" };

			async.series([
				function(done) {
					agent.post(`/${username}/${model}/risks.json`)
						.send(risk)
						.expect(200, function(err, res) {
							riskId = res.body._id;
							return done(err);
						});
				},
				function(done) {
					agent.put(`/${username}/${model}/risks/${riskId}.json`)
						.send(likelihood)
						.expect(200, done);
				},
				function(done) {
					agent.get(`/${username}/${model}/risks/${riskId}.json`)
						.expect(200, function(err, res) {
							expect(res.body.likelihood).to.equal(likelihood.likelihood);
							done(err);
						});
				}
			], done);
		});

		it("change consequence should succeed", function(done) {

			const risk = Object.assign({"name":"Issue test"}, baseRisk);
			let riskId;

			const consequence = { consequence: "low" };

			async.series([
				function(done) {
					agent.post(`/${username}/${model}/risks.json`)
						.send(risk)
						.expect(200, function(err, res) {
							riskId = res.body._id;
							return done(err);
						});
				},
				function(done) {
					agent.put(`/${username}/${model}/risks/${riskId}.json`)
						.send(consequence)
						.expect(200, done);
				},
				function(done) {
					agent.get(`/${username}/${model}/risks/${riskId}.json`)
						.expect(200, function(err, res) {
							expect(res.body.consequence).to.equal(consequence.consequence);
							done(err);
						});
				}
			], done);
		});

		it("change mitigation status should succeed", function(done) {

			const risk = Object.assign({"name":"Issue test"}, baseRisk);
			let riskId;

			const mitigationStatus = { mitigation_status: "approved" };

			async.series([
				function(done) {
					agent.post(`/${username}/${model}/risks.json`)
						.send(risk)
						.expect(200, function(err, res) {
							riskId = res.body._id;
							return done(err);
						});
				},
				function(done) {
					agent.put(`/${username}/${model}/risks/${riskId}.json`)
						.send(mitigationStatus)
						.expect(200, done);
				},
				function(done) {
					agent.get(`/${username}/${model}/risks/${riskId}.json`)
						.expect(200, function(err, res) {
							expect(res.body.mitigation_status).to.equal(mitigationStatus.mitigation_status);
							done(err);
						});
				}
			], done);
		});

		it("change mitigation should succeed", function(done) {

			const risk = Object.assign({"name":"Issue test"}, baseRisk);
			let riskId;

			const mitigation = { mitigation_desc: "Done ABC" };

			async.series([
				function(done) {
					agent.post(`/${username}/${model}/risks.json`)
						.send(risk)
						.expect(200, function(err, res) {
							riskId = res.body._id;
							return done(err);
						});
				},
				function(done) {
					agent.put(`/${username}/${model}/risks/${riskId}.json`)
						.send(mitigation)
						.expect(200, done);
				},
				function(done) {
					agent.get(`/${username}/${model}/risks/${riskId}.json`)
						.expect(200, function(err, res) {
							expect(res.body.mitigation_desc).to.equal(mitigation.mitigation_desc);
							done(err);
						});
				}
			], done);
		});
	});
});

