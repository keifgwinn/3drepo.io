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

import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { createStructuredSelector } from 'reselect';

import { selectGisLayers } from '../../modules/gis';
import { selectModelsToIgnoreOverrides } from '../../modules/groups';
import { selectPins as selectIssuePins } from '../../modules/issues';
import { selectPins as selectMeasurementPins } from '../../modules/measurements';
import { selectGISCoordinates, selectHasGISCoordinates } from '../../modules/model';
import { selectPins as selectRiskPins } from '../../modules/risks';
import { selectAllTransparencyOverrides, selectColorOverrides, TreeActions } from '../../modules/tree';
import { withViewer } from '../../services/viewer/viewer';
import { ViewerCanvas } from './viewerCanvas.component';

const mapStateToProps = createStructuredSelector({
	colorOverrides: selectColorOverrides,
	modelsToIgnoreOverrides: selectModelsToIgnoreOverrides,
	transparencies: selectAllTransparencyOverrides,
	issuePins: selectIssuePins,
	riskPins: selectRiskPins,
	measurementPins: selectMeasurementPins,
	gisCoordinates: selectGISCoordinates,
	hasGisCoordinates: selectHasGISCoordinates,
	gisLayers: selectGisLayers
});

export const mapDispatchToProps = (dispatch) => bindActionCreators({
	handleTransparencyOverridesChange: TreeActions.handleTransparencyOverridesChange
}, dispatch);

export default withViewer(connect(mapStateToProps, mapDispatchToProps)(ViewerCanvas));
