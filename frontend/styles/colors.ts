import { mapValues } from 'lodash';

import { hexToRgba, hexToPinColor } from '../helpers/colors';

const BLACK = '#00000';
const WHITE = '#ffffff';

export const COLOR = {
	PRIMARY_MAIN: '#0c2f54',
	PRIMARY_LIGHT: '#3c5876',
	PRIMARY_DARK: '#08203a',
	SECONDARY_MAIN: '#06563c',
	SECONDARY_LIGHT: '#377763',
	SECONDARY_DARK: '#043827',

	WHITE,
	WHITE_87: hexToRgba(WHITE, 0.87),

	BLACK,
	BLACK_6: hexToRgba(BLACK, .06),
	BLACK_20: hexToRgba(BLACK, .2),
	BLACK_30: hexToRgba(BLACK, .3),
	BLACK_40: hexToRgba(BLACK, .4),
	BLACK_50: hexToRgba(BLACK, .5),
	BLACK_60: hexToRgba(BLACK, .6),
	BLACK_80: hexToRgba(BLACK, .8),
	BLACK_87: hexToRgba(BLACK, .87),

	GRAY: '#f0f0f0',
	WARNING_LIGHT: '#ffefef',
	WARNING: '#ffd5d5',
	YELLOW: '#ffff36',
	MAROON: '#800000',
	CRIMSON: '#dc143c',
	DARK_ORANGE: '#ff8c00',
	ORANGE: '#ffa500',
	GREEN: '#008000',
	MED_SEA_GREEN: '#3cb371',
	LIME_GREEN: '#32cd32',
	LIGHT_GREEN: '#90ee90',
	RED: '#FF0000'
};

export const PIN_COLORS = mapValues({
	BLUE: COLOR.PRIMARY_MAIN,
	YELLOW: COLOR.YELLOW,
	RED: COLOR.RED,
	MAROON: COLOR.MAROON,
	CRIMSON: COLOR.CRIMSON,
	DARK_ORANGE: COLOR.DARK_ORANGE,
	ORANGE: COLOR.ORANGE,
	GREEN: COLOR.GREEN,
	MED_SEA_GREEN: COLOR.MED_SEA_GREEN,
	LIME_GREEN: COLOR.LIME_GREEN,
	LIGHT_GREEN: COLOR.LIGHT_GREEN
}, hexToPinColor);

PIN_COLORS.LEMON_CHIFFON = [255 / 255, 255 / 255, 0];
PIN_COLORS.LIGHT_YELLOW = [255 / 255, 255 / 255, 100];
