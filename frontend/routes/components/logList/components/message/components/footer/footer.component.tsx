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

import { DATE_TIME_FORMAT } from '../../../../../../../services/formatting/formatDate';
import { DateTime } from '../../../../../dateTime/dateTime.component';
import { Container, Date, Username } from './footer.styles';

interface IProps {
	name: string;
	created: any;
}

export const Footer = ({ name, created, ...props }: IProps) => {
	return (
		<Container>
			<Username>{name}</Username>
			<Date>
				<DateTime value={created} format={DATE_TIME_FORMAT} />
			</Date>
		</Container>
	);
};
