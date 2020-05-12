/**
 *  Copyright (C) 2017 3D Repo Ltd
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

import { selectTeamspaceUsers } from '../../../../modules/comments';
import { DialogActions } from '../../../../modules/dialog';
import { selectIssuesMap } from '../../../../modules/issues';
import { MeasurementsActions } from '../../../../modules/measurements';
import { selectIsModelLoaded } from '../../../../modules/viewerGui';
import { withViewer } from '../../../../services/viewer/viewer';
import { NewCommentForm } from './newCommentForm.component';

const mapStateToProps = createStructuredSelector({
	isModelLoaded: selectIsModelLoaded,
	teamspaceUsers: selectTeamspaceUsers,
	issues: selectIssuesMap,
});

export const mapDispatchToProps = (dispatch) => bindActionCreators({
	showScreenshotDialog: DialogActions.showScreenshotDialog,
	setDisabled: MeasurementsActions.setDisabled,
	deactivateMeasure: MeasurementsActions.deactivateMeasure,
}, dispatch);

export default withViewer(connect(mapStateToProps, mapDispatchToProps)(NewCommentForm));
