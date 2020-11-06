/**
 *  Copyright (C) 2019 3D Repo Ltd
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

// @ts-ignore
import { useIntercom, IntercomProvider } from 'react-use-intercom';
import { clientConfigService } from '../../../services/clientConfig';

interface IProps {
	currentUser: any;
}

export class Intercom extends React.PureComponent<IProps, any> {
	public setNameAndMail = () => {
		try {
			const { update } = useIntercom();

			const {firstName, lastName, email } = this.props.currentUser;

			if (!email) {
				return;
			}

			const name = `${firstName || ''} ${lastName || ''}`.trim();
			// @ts-ignore
			update( {
					name: name, // Full name
					email: email, // Email address
					alignment: 'left'
				}
			);

		} catch (e) {
			console.debug('Intercom api error: ' + e);
		}
	}

	public componentDidUpdate(prevProps) {
		this.setNameAndMail(); // I don't know how to make this conditional
	}

	public render() {
		const haveLicense: boolean = Boolean(clientConfigService.intercomLicense);
		const IntercomPage = () => {
			const { boot, shutdown, hide, show, update } = useIntercom();
			// shutdown();
			hide();
			update(
					{
						alignment: 'left'
					}
			);
			this.setNameAndMail();
			return <div />;
		};
		return (
			<>{haveLicense &&
			<IntercomProvider appId={clientConfigService.intercomLicense} autoBoot>
				<IntercomPage />
			</IntercomProvider>}</>
		);
	}
}
