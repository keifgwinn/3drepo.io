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

import React from 'react';
import { formatShortDate } from '../../../../../../services/formatting/formatDate';
import { SequenceTasksListContainer, SequenceTasksListItem, TaskListLabel } from '../../sequences.styles';
import { ITask, Tasks } from './sequenceTasks.component';

interface IProps {
	tasks: ITask[];
	minDate: Date;
	maxDate: Date;
}

interface IState {
	collapsed: boolean;
}

const equalsDate = (dateA: Date, dateB: Date) =>
	(!dateA && !dateB) || (
		dateA.getDate() === dateB.getDate() &&
		dateA.getMonth() === dateB.getMonth() &&
		dateA.getFullYear() === dateB.getFullYear()
	);

export class TasksList extends React.PureComponent<IProps, IState> {
	public state: IState = {
		collapsed: true
	};

	public get durationLabel() {
		const  {  minDate, maxDate } = this.props;

		return 'Showing activities ' + ( equalsDate(minDate, maxDate) ?
			'on ' + formatShortDate(maxDate) :
			'from ' + formatShortDate(minDate) + ' to ' + formatShortDate(maxDate));
	}

	public toggleCollapse = () => {
		this.setState({collapsed: !this.state.collapsed});
	}

	public render = () => {
		const { tasks } = this.props;
		return (
			<SequenceTasksListContainer>
				<TaskListLabel>{this.durationLabel}</TaskListLabel>
				{tasks.map((t) => (
					<SequenceTasksListItem  key={t._id}>
						<Tasks tasks={[t]} />
					</SequenceTasksListItem>
				))}
			</SequenceTasksListContainer>
		);
	}
}