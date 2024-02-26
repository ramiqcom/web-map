'use server';

import 'node-self';
import ee from '@google/earthengine';
import pify from 'pify';

// Callback option
const callback = { multiArgs: true, errorFirst: false };

// Function to promisfy
/**
 * Function to authenticate
 * @param {PrivateKeyObject} key 
 * @returns {Promise.Void>}
 */
export const authenticateViaPrivateKey = (key) => new Promise((resolve, reject) => {
	ee.data.authenticateViaPrivateKey(key, () => resolve(), err => reject(new Error(err)));
});

/**
 * Function to initialize
 * @returns {Promise.Void>}
 */
export const initialize = () => new Promise((resolve, reject) => {
	ee.initialize(null, null, () => resolve(), err => reject(new Error(err)));
});

export const getMapId = pify(ee.data.getMapId, callback);