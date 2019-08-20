/**
 *  Copyright (C) 2014 3D Repo Ltd
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
import { dispatch } from '../../../helpers/migration';
import { AuthActions } from '../../../modules/auth';

export class AuthInterceptor {
	public static $inject: string[] = [
		'$injector'
	];

	private dialogOpen = false;

	constructor(
		private $injector: any
	) {}

	public responseError = (response) => {
		const invalidMessages = ['Authentication error', 'You are not logged in'] as any;
		const notLogin = response.data.place !== 'GET /login';
		const unauthorized = response.status === 401 &&
			invalidMessages.includes(response.data.message);

		const sessionHasExpired = unauthorized && notLogin;
		if (sessionHasExpired) {
			this.sessionExpired();
		} else {
			throw response;
		}

	}

	public request = (config) => {
		return config;
	}

	public requestError = (config) => {
		return config;
	}

	public response = (res) => {
		return res;
	}

	public sessionExpired = () => {
		dispatch(AuthActions.sessionExpired());
	}
}

export const AuthInterceptorModule = angular
	.module('3drepo')
	.service('AuthInterceptor', AuthInterceptor);