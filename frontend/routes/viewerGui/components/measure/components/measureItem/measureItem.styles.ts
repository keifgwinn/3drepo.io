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

import styled, { css } from 'styled-components';

import Checkbox from '@material-ui/core/Checkbox';

import { COLOR } from '../../../../../../styles';
import { ColorSelect } from '../../../../../components/colorPicker/colorPicker.styles';
import { CheckboxCell } from '../../../../../components/customTable/customTable.styles';
import { TextField } from '../../../../../components/textField/textField.component';
import { ActionsLine, MutableActionsLine } from '../../../../../components/textField/textField.styles';
import { Name } from '../../../tree/components/treeNode/treeNode.styles';

interface IContainer {
	nodeType: string;
	expandable: boolean;
	selected: boolean;
	highlighted: boolean;
	expanded: boolean;
	level: number;
	active: boolean;
	hasFederationRoot: boolean;
}

export const MeasurementPoint = styled.div`
	width: 120px;
	text-align: right;
	padding-right: 10px;
`;

const sumUnitsStyle = css`
	width: auto;
	padding-right: 93px;
	padding-left: 3px;
`;

export const Units = styled.div`
	width: 30px;
	text-align: right;
	padding-right: 10px;
	${({ sum }: any) => sum && sumUnitsStyle};
`;

export const MeasurementValue = styled.div`
	width: auto;
	text-align: right;
	padding-right: 10px;
`;

export const Actions = styled.div`
	display: flex;
	justify-content: flex-end;
	align-items: center;
	align-self: center;
	font-size: 12px;

	${ColorSelect} {
		width: auto;
		border-bottom: none;
	}
`;

export const Container = styled.li<IContainer>`
	color: ${COLOR.BLACK_60};
	border-bottom: 1px solid ${COLOR.BLACK_6};
	background-color: ${COLOR.WHITE};
	display: flex;
	justify-content: space-between;
	align-items: center;
	height: ${({ tall }: any) => tall ? '56px' : '40px'};
	box-sizing: border-box;

	&:last-of-type {
		border-bottom: none;
	}
`;

export const StyledCheckbox = styled(Checkbox)`
	&& {
		padding: 6px;
	}
`;

export const StyledCheckboxCell = styled(CheckboxCell)`
	padding: 0;
	margin-left: 36px;
`;

export const StyledName = styled(Name)`
	margin-left: ${(props) => props.left ? '78px' : '6px'};
`;

export const StyledTextField = styled(TextField)`
	width: 100%;

	${ActionsLine} {
		bottom: 8px;
	}

	${MutableActionsLine} {
		bottom: 0;
	}
`;
