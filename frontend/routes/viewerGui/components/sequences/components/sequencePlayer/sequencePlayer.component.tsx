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

import { Grid, IconButton, MenuItem, Select } from '@material-ui/core';
import StepForwardIcon from '@material-ui/icons/FastForward';
import StepBackIcon from '@material-ui/icons/FastRewind';
import PlayArrow from '@material-ui/icons/PlayArrow';
import Stop from '@material-ui/icons/Stop';

import DayJsUtils from '@date-io/dayjs';

import { MuiPickersUtilsProvider } from 'material-ui-pickers';
import React from 'react';
import { STEP_SCALE } from '../../../../../../constants/sequences';
import { getDate, getDays } from '../../../../../../helpers/dateTime';
import { NAMED_MONTH_DATE_FORMAT } from '../../../../../../services/formatting/formatDate';
import { DatePicker, IntervalRow, SequencePlayerColumn,
	SequencePlayerContainer, SequenceRow, SequenceSlider, StepInput } from '../../sequences.styles';

interface IProps {
	max: Date;
	min: Date;
	onChange?: (date: Date) => void;
	value?: Date;
	stepInterval?: number;
	stepScale?: STEP_SCALE;
	onChangeStepInterval?: (value: number) => void;
	onChangeStepScale?: (value: STEP_SCALE) => void;
}

interface IState {
	value?: Date;
	playing: boolean;
	intervalId: number;
	stepInterval: number;
	stepScale: STEP_SCALE;
}

export class SequencePlayer extends React.PureComponent<IProps, IState> {
	public state: IState = {
		value: null,
		playing: false,
		intervalId: 0,
		stepInterval: 1,
		stepScale: STEP_SCALE.DAY
	};

	get currentDay() {
		return getDays(this.props.min, this.state.value);
	}

	get totalDays() {
		return getDays(this.props.min, this.props.max);
	}

	get isFirstDay() {
		return this.currentDay === 0;
	}

	get isLastDay() {
		return this.currentDay === this.totalDays;
	}

	public setValue = (newValue: Date) => {
		const maxDate = new Date(this.props.max).setHours(0, 0, 0, 0);
		const minDate = new Date(this.props.min).setHours(0, 0, 0, 0);
		newValue = new Date(Math.min(maxDate, Math.max(minDate, newValue.valueOf())));

		if (this.props.onChange) {
			this.props.onChange(newValue);
		}

		this.setState({value: newValue});
	}

	public setDayNumber = (dayNumber) => {
		const newValue = getDate(this.props.min, dayNumber);
		this.setValue(newValue);
	}

	public isDateOusideRange = (date) => {
		const {max, min} = this.props;
		const maxDate = new Date(max).setHours(0, 0, 0, 0);
		const minDate = new Date(min).setHours(0, 0, 0, 0);
		return maxDate < date || minDate > date;
	}

	public goTo = (val) => {
		this.stop();
		this.setDayNumber(val);
	}

	public gotoDate = (val) => {
		this.stop();
		this.setValue(val);
	}

	public componentDidUpdate(prevProps: IProps) {
		if (prevProps.value !== this.props.value) {
			this.setState({value: this.props.value});
		}

		if (prevProps.stepScale !== this.props.stepScale) {
			this.setState({stepScale: this.props.stepScale});
		}

		if (prevProps.stepInterval !== this.props.stepInterval) {
			this.setState({stepInterval: this.props.stepInterval});
		}
	}

	public onClickPlayStop = () => {
		if (this.state.playing) {
			this.stop();
		} else {
			this.play();
		}
	}

	public onChangeStepInterval = (e) => {
		let stepInterval = parseInt(e.target.value, 10);
		stepInterval = isNaN(stepInterval) ? 1 : Math.max(1, Math.min(100, stepInterval));
		this.setState({stepInterval});
		if (this.props.onChangeStepInterval) {
			this.props.onChangeStepInterval(stepInterval);
		}
	}

	public onChangeStepScale = (e) => {
		const stepScale = parseInt(e.target.value, 10);
		this.setState({ stepScale });
		if (this.props.onChangeStepScale) {
			this.props.onChangeStepScale(stepScale);
		}
	}

	public moveStep = (direction) => {
		if (this.state.stepScale === STEP_SCALE.DAY) {
			this.setDayNumber(this.currentDay + this.state.stepInterval * direction);
		}

		if (this.state.stepScale === STEP_SCALE.MONTH) {
			const newValue = new Date(this.state.value);
			newValue.setMonth(newValue.getMonth() + this.state.stepInterval * direction);

			this.setValue(newValue);
		}

		if (this.state.stepScale === STEP_SCALE.YEAR) {
			const newValue = new Date(this.state.value);
			newValue.setFullYear(newValue.getFullYear() + this.state.stepInterval * direction);
			this.setValue(newValue);
		}

		if (this.isLastDay) {
			this.stop();
		}
	}

	public nextStep = this.moveStep.bind(this, 1);

	public prevStep = this.moveStep.bind(this, -1);

	public play() {
		this.stop();
		const intervalId = (setInterval(this.nextStep, 1000) as unknown) as number;
		this.setState({
			playing: true,
			value: this.isLastDay ? this.props.min : this.state.value,
			intervalId
		});
	}

	public stop() {
		clearInterval(this.state.intervalId);
		this.setState({playing: false});
	}

	public componentDidMount() {
		if (this.props.value) {
			this.setState({value: this.props.value});
		}

		if (this.props.stepInterval) {
			this.setState({stepInterval: this.props.stepInterval});
		}

		if (this.props.stepScale) {
			this.setState({stepScale: this.props.stepScale});
		}

	}

	public componentWillUnmount() {
		this.stop();
	}

	public rewind = () => {
		this.stop();
		this.prevStep();
	}

	public forward =  () => {
		this.stop();
		this.nextStep();
	}

	public render() {
		const {value, playing, stepScale , stepInterval} = this.state;

		return (
			<SequencePlayerContainer>
				<SequencePlayerColumn>
					<MuiPickersUtilsProvider utils={DayJsUtils}>
						<SequenceRow>
							<Grid item>
								<IconButton disabled={this.isFirstDay} onClick={this.rewind}><StepBackIcon fontSize="large" /></IconButton>
							</Grid>
							<Grid item>
								<DatePicker
									shouldDisableDate={(date) => this.isDateOusideRange(date.$d)}
									name="date"
									inputId="1"
									value={value}
									format={NAMED_MONTH_DATE_FORMAT}
									onChange={(e) => this.gotoDate(new Date(e.target.value))}
									placeholder="date"
								/>
							</Grid>
							<Grid item>
								<IconButton disabled={this.isLastDay} onClick={this.forward}><StepForwardIcon fontSize="large" /></IconButton>
							</Grid>
						</SequenceRow>
						<IntervalRow>
							Step interval: <StepInput value={stepInterval} onChange={this.onChangeStepInterval} />
							&nbsp;
							<Select value={stepScale} onChange={this.onChangeStepScale} >
								<MenuItem value={STEP_SCALE.DAY}>day(s)</MenuItem>
								<MenuItem value={STEP_SCALE.MONTH}>month(s)</MenuItem>
								<MenuItem value={STEP_SCALE.YEAR}>year(s)</MenuItem>
							</Select>
						</IntervalRow>
						<SequenceRow>
							<Grid item>
								<IconButton onClick={this.onClickPlayStop} >{!playing && <PlayArrow />}{playing &&  <Stop />}</IconButton>
							</Grid>
							<Grid item>
								<SequenceSlider max={this.totalDays} step={1} value={this.currentDay} onChange={(e, val) => this.goTo(val)} />
							</Grid>
						</SequenceRow>
					</MuiPickersUtilsProvider>
				</SequencePlayerColumn>
			</SequencePlayerContainer>
		);
	}
}