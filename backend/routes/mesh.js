var express = require('express');
var router = express.Router({mergeParams: true});
var middlewares = require('./middlewares');
//var dbInterface = require("../db/db_interface.js");
var config = require('../config');
var C = require("../constants");
var responseCodes = require('../response_codes.js');
var Mesh = require('../models/mesh');
var utils = require('../utils');
var srcEncoder = require('../encoders/src_encoder');

router.get('/:uid.src.:subformat?', middlewares.hasReadAccessToProject, findByUID);
router.get('/revision/:rid/:sid.src.:subformat?', middlewares.hasReadAccessToProject, findByRevision);

function _getStashOptions(dbCol, format, url){

	if(config.disableCache){
		return false;
	} else {
		return { format, filename: `/${dbCol.account}/${dbCol.project}${url}` };
	}
	
}

function findByUID(req, res, next){
	'use strict';
	
	let dbCol =  {account: req.params.account, project: req.params.project, logger: req[C.REQ_REPO].logger};
	let place = utils.APIInfo(req);
	let options = {};
	options.stash = _getStashOptions(dbCol, 'src', req.url);

	Mesh.findByUID(dbCol, req.params.uid, options).then(mesh => {
		
		req.params.format = 'src';
		let renderedObj = mesh;

		if(!options.stash){
			// generate src format if obj not from stash
			renderedObj = srcEncoder.render(req.params.project, mesh, req.query.tex_uuid || null, req.params.subformat, req[C.REQ_REPO].logger);
		}

		responseCodes.respond(place, req, res, next, responseCodes.OK, renderedObj);

	}).catch(err => {
		console.log(err.stack);
		responseCodes.respond(place, req, res, next, err.resCode || utils.mongoErrorToResCode(err), err.resCode ? {} : err);
	});
}

function findByRevision(req, res, next){
	'use strict';

	let dbCol =  {account: req.params.account, project: req.params.project, logger: req[C.REQ_REPO].logger};
	let place = utils.APIInfo(req);
	let options = {};
	options.stash = _getStashOptions(dbCol, 'src', req.url);

	Mesh.findByRevision(dbCol, req.params.rid, req.params.sid, options).then(mesh => {

		req.params.format = 'src';
		let renderedObj = mesh;
		if(!options.stash){
			// generate src format if obj not from stash
			renderedObj = srcEncoder.render(req.params.project, mesh, req.query.tex_uuid || null, req.params.subformat, req[C.REQ_REPO].logger);
		}

		responseCodes.respond(place, req, res, next, responseCodes.OK, renderedObj);
	}).catch(err => {
		console.log(err.stack);
		responseCodes.respond(place, req, res, next, err.resCode || utils.mongoErrorToResCode(err), err.resCode ? {} : err);
	});
}

module.exports = router;
