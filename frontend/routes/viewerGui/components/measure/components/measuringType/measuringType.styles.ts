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

import styled from 'styled-components';

import SvgIcon from '@material-ui/core/SvgIcon';

export const StyledSvgIcon = styled(SvgIcon)`
	cursor: pointer;
	margin: 0 3px;

	.wall {
		fill: #dadada;
	}

	.cube {
		fill: none;
		stroke: #b2b2b2;
		stroke-miterlimit: 10;
		stroke-width: 8px;
	}

	.stroke-dash {
		stroke-dasharray: 12;
	}
`;

export const Icon = styled.img`
	max-height: 40px;
	max-width: 40px;
`;
