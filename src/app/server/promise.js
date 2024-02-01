'use server';

import 'node-self';
import ee from '@google/earthengine';
import pify from 'pify';

// Callback option
const callback = { multiArgs: true, errorFirst: false };

// Function to promisfy
export const authenticateViaPrivateKey = pify(ee.data.authenticateViaPrivateKey);
export const initialize = pify(ee.initialize);
export const mapid  = pify(ee.data.getMapId, callback);