import * as Konva from 'konva';
import { SHAPE_TYPES } from '../shape/shape.constants';
import { cloud } from '../shape/shape.helpers';
import { MODE_OPERATION } from '../../screenshotDialog.helpers';

const circleProps = { radius: 1 };

const triangleProps = { sides: 3 };

const rectangleProps = { height: 1, width: 1 };

const cloudProps = {
	data: cloud.path,
	scaleX: 0,
	scaleY: 0
};

export const createShape = (shapeType, commonProps, initialPositionProps) => {
	const map = {
		[SHAPE_TYPES.CIRCLE]: new Konva.Circle({
			...commonProps,
			...initialPositionProps,
			...circleProps
		}),
		[SHAPE_TYPES.TRIANGLE]: new Konva.RegularPolygon({
			...commonProps,
			...initialPositionProps,
			...triangleProps
		}),
		[SHAPE_TYPES.RECTANGLE]: new Konva.Rect({
			...commonProps,
			...initialPositionProps,
			...rectangleProps
		}),
		[SHAPE_TYPES.LINE]: new Konva.Line({
			...commonProps
		}),
		[SHAPE_TYPES.CLOUD]: new Konva.Path({
			...commonProps,
			...initialPositionProps,
			...cloudProps
		})
	};

	return map[shapeType];
};

export const createDrawnLine = (stroke, strokeWidth, position, mode) => {
	return new Konva.Line({
		stroke,
		strokeWidth,
		points: [position.x, position.y],
		lineCap: 'round',
		globalCompositeOperation: MODE_OPERATION[mode],
		draggable: true
	});
};

export const getDrawFunction = (shapeType, shape, initialPos, currentPos) => {
	const distance = Math.hypot(initialPos.x - currentPos.x, initialPos.y - currentPos.y);
	const map = {
		[SHAPE_TYPES.CIRCLE]: () => {
			shape.radius(distance);
		},
		[SHAPE_TYPES.TRIANGLE]: () => {
			shape.radius(distance);
		},
		[SHAPE_TYPES.RECTANGLE]: () => {
			shape.height(currentPos.y - initialPos.y);
			shape.width(currentPos.x - initialPos.x);
		},
		[SHAPE_TYPES.LINE]: () => {
			shape.points([initialPos.x, initialPos.y, currentPos.x, currentPos.y]);
		},
		[SHAPE_TYPES.CLOUD]: () => {
			const scaleX = Math.abs(initialPos.x - currentPos.x) / cloud.width;
			const scaleY = Math.abs(initialPos.y - currentPos.y) / cloud.height;
			shape.scale({
				x: currentPos.x > initialPos.x ? scaleX : -scaleX,
				y: currentPos.y > initialPos.y ? scaleY : -scaleY
			});
		}
	};

	return map[shapeType];
};