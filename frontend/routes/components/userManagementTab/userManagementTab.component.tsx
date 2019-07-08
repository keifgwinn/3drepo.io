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

import * as React from 'react';

import { Container, Content, Footer } from './userManagementTab.styles';

interface IProps {
	children: React.ReactChild;
	footerLabel?: string;
	withHeader?: boolean;
}

export const UserManagementTab = (props: IProps) => {
	const {footerLabel, children} = props;
	return (
		<>
			<Container
				container={true}
				direction="column"
				alignItems="stretch"
				wrap="nowrap"
				justify="space-between"
			>
				<Content item={true} withHeader={props.withHeader}>{children}</Content>
				{footerLabel && (<Footer item={true}>{footerLabel}</Footer>)}
			</Container>
		</>
	);
};
