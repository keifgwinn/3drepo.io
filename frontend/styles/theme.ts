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

import { createMuiTheme } from '@material-ui/core/styles';
import { COLOR } from './colors';
import { FONT_WEIGHT } from './fonts';
import * as mixins from './mixins';

export const theme = {
	colors: COLOR,
	fontWeights: FONT_WEIGHT,
	mixins
};

export const MuiTheme = createMuiTheme({
	palette: {
		primary: {
			main: theme.colors.PRIMARY_MAIN,
			light: theme.colors.PRIMARY_LIGHT,
			dark: theme.colors.PRIMARY_DARK,
			contrastText: theme.colors.WHITE
		},
		secondary: {
			main: theme.colors.SECONDARY_MAIN,
			light: theme.colors.SECONDARY_LIGHT,
			dark: theme.colors.SECONDARY_DARK,
			contrastText: theme.colors.WHITE
		}
	},
	overrides: {
		MuiInput: {
			root: {
				fontSize: '14px'
			},
			underline: {
				'&:before': {
					borderBottomColor: 'rgba(0, 0, 0, .12) !important'
				}
			}
		},
		MuiFormControlLabel: {
			label: {
				fontSize: '14px',
				color: theme.colors.BLACK_60
			}
		},
		MuiFormLabel: {
			root: {
				fontSize: '14px',
				color: theme.colors.BLACK_60
			}
		},
		MuiDialogTitle: {
			root: {
				background: '#08203a',
				padding: '15px 24px 15px',
				color: theme.colors.WHITE,
				fontSize: '20px'
			}
		},
		MuiDialogContent: {
			root: {
				padding: '24px'
			}
		},
		MuiDialog: {
			paper: {
				background: '#fafafa'
			}
		},
		MuiSelect: {
			root: {
				fontSize: '14px',
				color: theme.colors.BLACK_60
			}
		},
		MuiTab: {
			root: {
				minWidth: '0 !important'
			}
		},
		MuiSnackbarContent: {
			root: {
				backgroundColor: theme.colors.PRIMARY_MAIN,
				color: theme.colors.WHITE_87
			},
			action: {
				marginRight: '-16px'
			}
		},
		MuiMenuItem: {
			root: {
				fontSize: '14px',
				color: theme.colors.BLACK_60
			}
		},
		MuiTypography: {
			title: {
				fontSize: 20,
				fontWeight: 400
			}
		},
		MuiToolbar: {
			root: {
				backgroundColor: theme.colors.PRIMARY_MAIN,
				color: theme.colors.WHITE_87
			},
			regular: {
				/* tslint:disable */
				height: 40,
				minHeight: 40,
				'@media (min-width: 600px)': {
					minHeight: 0
				}
				/* tslint:enable */
			}
		},
		MuiDrawer: {
			paper: {
				backgroundColor: 'rgb(250,250,250)',
				boxShadow: '0px 0px 15px 0px rgba(0,0,0,0.2)'
			}
		},
		MuiListItemText: {
			root: {
				minWidth: 10
			},
			primary: {
				overflow: 'hidden',
				textOverflow: 'ellipsis',
				whiteSpace: 'nowrap'
			},
			secondary: {
				overflow: 'hidden',
				textOverflow: 'ellipsis',
				whiteSpace: 'nowrap'
			}
		},
		MuiBadge: {
			badge: {
				width: 20,
				height: 20,
				top: 1,
				right: -4,
				pointerEvents: 'none'
			},
			colorPrimary: {
				backgroundColor: '#e8004e'
			},
			colorSecondary: { // Secondary color is used to make the badge disappear
				backgroundColor: 'transparent',
				color: 'transparent'
			}
		},
		MuiIcon: {
			fontSizeLarge: {
				fontSize: 35
			}
		}
	}
});
