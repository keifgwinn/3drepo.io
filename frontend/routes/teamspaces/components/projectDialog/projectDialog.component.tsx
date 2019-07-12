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

import Button from '@material-ui/core/Button';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import FormControl from '@material-ui/core/FormControl';
import InputLabel from '@material-ui/core/InputLabel';
import TextField from '@material-ui/core/TextField';
import { Field, Form, Formik } from 'formik';
import React from 'react';
import memoizeOne from 'memoize-one';

import * as Yup from 'yup';

import { CellSelect } from '../../../components/customTable/components/cellSelect/cellSelect.component';

const ProjectSchema = Yup.object().shape({
	name: Yup.string().required().matches(/^[^/?=#+]{0,119}[^/?=#+ ]{1}$/),
	teamspace: Yup.string().required()
});

interface IProps {
	name?: string;
	teamspace?: string;
	teamspaces: any[];
	handleResolve: (project) => void;
	handleClose: () => void;
}

const getTeamspacesItems = memoizeOne((teamspaces) => teamspaces.map(({ account }) => ({
	value: account,
	name: account
})));

export class ProjectDialog extends React.PureComponent<IProps, any> {
	public static defaultProps = {
		name: '',
		teamspace: ''
	};

	public handleProjectSave = (values) => {
		this.props.handleResolve(values);
	}

	public render() {
		const { name, teamspace, handleClose } = this.props;
		const teamspaces = getTeamspacesItems(this.props.teamspaces);

		return (
			<Formik
				initialValues={{name, teamspace}}
				validationSchema={ProjectSchema}
				onSubmit={this.handleProjectSave}
			>
				<Form>
					<DialogContent>
						<FormControl fullWidth required>
							<InputLabel shrink htmlFor="teamspace-select">Teamspace</InputLabel>
							<Field name="teamspace" render={ ({ field, form }) => (
								<CellSelect
									{...field}
									error={Boolean(form.touched.teamspace && form.errors.teamspace)}
									helperText={form.touched.teamspace && (form.errors.teamspace || '')}
									items={teamspaces}
									placeholder="Select teamspace"
									disabled={Boolean(this.props.name)}
									disabledPlaceholder
									inputId="teamspace-select"
								/>
							)} />
						</FormControl>
						<Field name="name" render={ ({ field, form }) => (
							<TextField
								{...field}
								error={Boolean(form.touched.name && form.errors.name)}
								helperText={form.touched.name && (form.errors.name || '')}
								label="Name"
								margin="normal"
								required
								fullWidth
							/>
						)} />
					</DialogContent>

					<DialogActions>
						<Button
							onClick={handleClose}
							color="secondary"
						>
							Cancel
						</Button>
						<Field render={ ({ form }) => (
							<Button
								type="submit"
								variant="raised"
								color="secondary"
								disabled={!form.isValid || form.isValidating}
							>
								Save
							</Button>
						)} />
					</DialogActions>
				</Form>
			</Formik>
		);
	}
}
