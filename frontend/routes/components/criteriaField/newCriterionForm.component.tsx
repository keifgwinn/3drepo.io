import * as React from 'react';
import * as Yup from 'yup';
import { get } from 'lodash';

import { Form, Field, withFormik, connect } from 'formik';
import InputLabel from '@material-ui/core/InputLabel';
import MenuItem from '@material-ui/core/MenuItem';
import Button from '@material-ui/core/Button';
import InfoIcon from '@material-ui/icons/InfoOutlined';
import { Tooltip } from '@material-ui/core';

import { SelectField, FormControl, NewCriterionFooter, OperatorSubheader } from './criteriaField.styles';
import { CriteriaValueField } from './components/criteriaValueField/criteriaValueField.component';
import {
	CRITERIA_LIST, VALUE_FIELD_MAP, VALUE_DATA_TYPES, REGEX_INFO_URL, CRITERIA_OPERATORS_TYPES, REGEX_INFO_TEXT
} from '../../../constants/criteria';
import { AutosuggestField } from '../autosuggestField/autosuggestField.component';
import { schema, VALIDATIONS_MESSAGES } from '../../../services/validation';
import { renderWhenTrue } from '../../../helpers/rendering';
import { RegexInfoLink } from './components/criteriaValueField/criteriaValueField.styles';

const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
const PaperPropsStyle = {
	maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
	width: 250,
	transform: 'translate3d(0, 0, 0)'
};

const CriterionSchema = Yup.object().shape({
	field: Yup.string().required(),
	operator: Yup.string().required(),
	values: Yup.array().when('operator', (operator, arraySchema) => {
		const dataType = get(VALUE_FIELD_MAP[operator], 'dataType');

		if (!dataType) {
			return arraySchema;
		}

		if (dataType === VALUE_DATA_TYPES.NUMBER) {
			return Yup.array().of(schema.measureNumberDecimal.nullable()).required(VALIDATIONS_MESSAGES.REQUIRED);
		}

		return arraySchema.of(Yup.string().required(VALIDATIONS_MESSAGES.REQUIRED));
	})
});

interface IProps {
	values: any;
	criterion: any;
	fieldNames: any[];
	formik: any;
	setState: (criterionForm) => void;
	onSubmit: (values) => void;
	handleSubmit: () => void;
}

class NewCreaterionFormComponent extends React.PureComponent<IProps, any> {
	public renderOperator = ({ operator, label }) => (
		<MenuItem key={operator} value={operator}>
			{label}
		</MenuItem>
	)

	public renderOperators = () =>
		CRITERIA_LIST.map(({ name, operators }) => [
				(<OperatorSubheader>{name}</OperatorSubheader>),
				operators.map(this.renderOperator)
			]
		)

	public componentWillUnmount() {
		this.props.setState(this.props.values);
	}

	public renderRegexInfo = renderWhenTrue(() => (
		<RegexInfoLink href={REGEX_INFO_URL} target="_blank">
			<Tooltip title={REGEX_INFO_TEXT} placement="right"><InfoIcon color="secondary" /></Tooltip>
		</RegexInfoLink>
	));

	public render() {
		const { operator: selectedOperator, _id: selectedId } = this.props.formik.values;

		return (
			<Form>
				<FormControl>
					<InputLabel shrink>Field</InputLabel>
					<Field name="field" render={({ field }) => (
						<AutosuggestField
							{...field}
							suggestions={this.props.fieldNames}
						/>
					)} />
				</FormControl>

				<FormControl>
					<InputLabel shrink>Operation</InputLabel>
					<Field name="operator" render={({ field }) => (
						<SelectField
							{...field}
							MenuProps={{ PaperProps: { style: PaperPropsStyle } }}
						>
							{this.renderOperators()}
						</SelectField>
					)} />
				</FormControl>

				<Field name="values" render={({ field, form }) => {
					return (
						<FormControl>
							<CriteriaValueField
								{...field}
								value={field.value}
								selectedOperator={selectedOperator}
								selectedId={selectedId}
								error={Boolean(form.errors.values)}
								helperText={form.errors.values}
								touched={form.touched.values}
								setTouched={form.setTouched}
							/>
						</FormControl>
					);
				}} />

				<NewCriterionFooter spaced={selectedOperator === CRITERIA_OPERATORS_TYPES.REGEX}>
					{this.renderRegexInfo(selectedOperator === CRITERIA_OPERATORS_TYPES.REGEX)}
					<Field render={({ form }) => (
						<Button
							type="button"
							variant="raised"
							color="secondary"
							onClick={this.props.handleSubmit}
							disabled={!form.isValid || form.isValidating}
						>
							{this.props.criterion._id ? 'Update' : 'Add'}
						</Button>
					)} />
				</NewCriterionFooter>
			</Form>
		);
	}
}

export const NewCriterionForm = withFormik({
	mapPropsToValues: ({ criterion }) => ({
		field: criterion.field,
		operator: criterion.operator,
		values: criterion.values,
		_id: criterion._id
	}),
	handleSubmit: (values, { props, resetForm }) => {
		(props as IProps).onSubmit(values);
		resetForm();
	},
	enableReinitialize: true,
	validationSchema: CriterionSchema
})(connect(NewCreaterionFormComponent as any)) as any;
