'use client'

import dynamic from 'next/dynamic';
import { useState, createContext, useRef } from 'react';
import { useEffect } from 'react';
import shpjs from 'shpjs';
import { kml } from '@mapbox/togeojson';
import basemaps from './data/basemap.json' assert { type: 'json' }
import reproject from 'reproject';
import epsg from 'epsg';
import { area } from '@turf/turf';
import { modal } from './components/dialog';

// Context
export const Context = createContext();

// Import map canvas leaflet without SSR
const MapCanvas = dynamic(() => import('./components/map'), {
  ssr: false,
  loading: () => <LoadingMap />
});

// Import panel without SSR
const Panel = dynamic(() => import('./components/panel'), {
  ssr: false,
});

// Import Dialog without SSR
const Dialog = dynamic(() => import('./components/dialog'), {
  ssr: false,
});

/**
 * Main react components
 * @returns {import('react').ReactComponentElement}
 */
export default function Home() {
  // States
  // Map ref
  const mapRef = useRef();

  // GeoJSON ref
  const geojsonRef = useRef();

  // Dialog ref
  const dialogRef = useRef();

  // GeoJSON data to add to map
  const [ geojson, setGeojson ] = useState(undefined);

  // Basemap selected
  const [ basemap, setBasemap ] = useState(basemaps[0]);

  // Url
  const [ imageUrl, setImageUrl ] = useState('');

  // Image id
  const [ imageId, setImageId ] = useState(undefined);

  // Image opacity
  const [ imageOpacity, setImageOpacity ] = useState(1);

  // Dialog background color
  const [ dialogColor, setDialogColor ] = useState('blue');

  // Dialog text
  const [ dialogText, setDialogText ] = useState('');

  // All the states
  const states = {
    mapRef,
    geojsonRef,
    dialogRef,
    geojson, setGeojson,
    basemap, setBasemap,
    imageUrl, setImageUrl,
    imageOpacity, setImageOpacity,
    dialogText, setDialogText,
    dialogColor, setDialogColor,
    imageId, setImageId
  };

  // Use effect to disable window default process
  // Also set geojson from data
  useEffect(() => {
    window.ondragover = e => {
      e.preventDefault();
    };

    // Process dropped file
    window.ondrop = async e => {
      e.preventDefault();

      // Try to process the file
      try {
        // Show modal that say the data is being processed
        modal({ dialogRef, setDialogText }, true, 'Processing data...');

        const file = e.dataTransfer.files[0];
        const fileName = file.name.split('.');
        const name = fileName.at(0);
        const format = fileName.at(-1);
        const geojson = await convert(file, format);
        setGeojson(geojson);

        // Close modal
        modal({ dialogRef, setDialogText }, false);
      } catch (error) {
        // Show error
        modal({ dialogRef, setDialogText }, true, error.message, true);
      }
      
    };
  }, []);

  return (
    <>
      <Context.Provider value={states}>

        <Dialog />
        
        <Panel />

        <MapCanvas />

      </Context.Provider>
    </>
  );
}

/**
 * Loading div
 * @returns {import('react').ReactComponentElement}
 */
function LoadingMap() {
  return (
    <div id='loading' className='flexible center1 center2'>
      Loading...
    </div> 
  )
}

/**
 * Function to convert shapefile or KML to geojson
 * @param {Blob} file 
 * @param {String} type 
 * @returns {Promise.<import('@turf/turf').FeatureCollection>}
 */
async function convert(file, type){
  let geojson;

  // Set all the type to lowercase
  type = type.toLowerCase();

  switch (type){
    case 'json':
    case 'geojson':
      // Parse geojson
      const json = JSON.parse(await file.text());
      geojson = reproject.toWgs84(json, undefined, epsg);    
      break;
    case 'zip':
      geojson = await shpjs(await file.arrayBuffer());
      break;
    case 'kml':
    case 'kmz':
      geojson = kml(new DOMParser().parseFromString(await file.text(), 'text/xml'));
      break;
    default:
      throw new Error('Format is not supported!');
  }

  // Check geojson area
  const areaGeojson = area(geojson);

  // If the area is bigger than 1_000_000 km square then it will be canceled
  if ((areaGeojson / 1e6 ) > 1e6){
    throw new Error('Area is too big!')
  }

  return geojson;
}