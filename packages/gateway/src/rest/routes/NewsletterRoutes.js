/********************************************************************************
 * Copyright (c) 2020 Cedalo AG
 *
 * This program and the accompanying materials are made available under the 
 * terms of the Eclipse Public License 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0.
 *
 * SPDX-License-Identifier: EPL-2.0
 *
 ********************************************************************************/
const httpError = require('http-errors');
const axios = require('axios');
const FormData = require('form-data');
const logger = require('../../utils/logger').create({ name: 'Newsletter' });
const { URLSearchParams } = require('url');

// this URL is fixed and intentionally cannot be changed using environment variables
const URL = 'https://cedalo.us19.list-manage.com/subscribe/post';

module.exports = class NewsletterRoutes {
	static subscribe(request, response, next) {
		switch (request.method) {
			case 'POST': {
				const user = request.body;

				const params = new URLSearchParams({
					u: '4cb1e6d733caee48574fbc0b8',
					id: 'd0bbeaf7b2',
					MERGE0: user.email,
					MERGE1: user.firstName,
					MERGE2: user.lastName
				});

				const headers = {
					'Content-Type': 'application/x-www-form-urlencoded'
				  };
				axios
					.post(URL, params.toString(), {
						headers
					})
					.then(() => {
						response.status(200).json({
							newsletter: true
						});
					})
					.catch((error) => {
						logger.error('Error when trying to subscribe for newsletter.');
						logger.error(error);
					});
				break;
			}
			default:
				response.set('allow', 'GET', 'POST');
				next(new httpError.MethodNotAllowed());
				break;
		}
	}

};
