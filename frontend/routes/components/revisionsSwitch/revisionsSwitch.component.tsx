/**
 *  Copyright (C) 2019 3D Repo Ltd
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

import * as React from 'react';
import CircularProgress from '@material-ui/core/CircularProgress';
import ArrowDownIcon from '@material-ui/icons/KeyboardArrowDown';

import { Container, DisplayedText, ProgressWrapper } from './revisionsSwitch.styles';
import { formatDate, LONG_DATE_TIME_FORMAT } from '../../../services/formatting/formatDate';
import { renderWhenTrue } from '../../../helpers/rendering';
import { runAngularTimeout } from '../../../helpers/migration';

interface IProps {
	className?: string;
	currentRevision?: string;
	modelName?: string;
	revisions?: any[];
	history: any;
	location: any;
	hideDialog: () => void;
	showRevisionsDialog: (config) => void;
}

export class RevisionsSwitch extends React.PureComponent<IProps, any> {
	public get currentRevisionName() {
		return this.props.currentRevision || this.getRevisionDisplayedName(this.props.revisions[0]);
	}

	public get currentRevisionId() {
		const currentRevision = this.props.revisions.find((revision) =>
			this.currentRevisionName === revision.tag ||
			this.currentRevisionName === formatDate(revision.timestamp, LONG_DATE_TIME_FORMAT)
		);

		return currentRevision._id;
	}

	public get revisionDataExists() {
		return Boolean(this.props.modelName && this.currentRevisionName);
	}

	public getRevisionDisplayedName = (revision) => {
		return revision.tag || formatDate(revision.timestamp, LONG_DATE_TIME_FORMAT);
	}

	public getRevisionTag = (revision) => {
		return revision.tag || revision._id;
	}

	public renderCurrentSwitchState = renderWhenTrue(() => (
		<DisplayedText>
			{`${this.props.modelName} - ${this.currentRevisionName}`}
			{this.props.revisions.length > 1 && <ArrowDownIcon fontSize="small" />}
		</DisplayedText>)
	);

	public renderIndicator = renderWhenTrue(() => (
		<ProgressWrapper>
			<CircularProgress size={10} color="inherit" />
		</ProgressWrapper>
		)
	);

	public setNewRevision = (revision) => {
		const { pathname } = this.props.location;
		const [, , , , currentRevisionInPath] = pathname.split('/');
		const newPathnameBase = currentRevisionInPath ? pathname.substr(0, pathname.lastIndexOf('\/')) : pathname;
		const newPathname = `${newPathnameBase}/${revision.tag || revision._id}`;

		runAngularTimeout(() => {
			this.props.history.push(newPathname);
		});

		this.props.hideDialog();
	}

	public handleClick = () => {
		if (this.props.revisions.length <= 1) {
			return;
		}

		this.props.showRevisionsDialog({
			title: `Revisions - ${this.props.modelName}`,
			data: {
				currentRevisionName: this.currentRevisionName,
				currentRevisionId: this.currentRevisionId,
				currentModelName: this.props.modelName,
				revisions: this.props.revisions,
				handleSetNewRevision: this.setNewRevision
			}
		});
	}

	public render() {
		return (
			<Container className={this.props.className} onClick={this.handleClick}>
				{this.renderIndicator(!this.revisionDataExists)}
				{this.renderCurrentSwitchState(this.revisionDataExists)}
			</Container>
		);
	}
}
