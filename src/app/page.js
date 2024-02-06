'use client'

import dynamic from 'next/dynamic';
import { useState, createContext, useRef } from 'react';
import { useEffect } from 'react';
import shpjs from 'shpjs';
import { kml } from '@mapbox/togeojson';
import Layers from './components/layers';
import basemaps from './data/basemap.json' assert { type: 'json' }
import Image from './components/image';
import reprojectGeoJSON from 'reproject-geojson';
import { area } from '@turf/turf';

// Context
export const Context = createContext();

// Import map canvas leaflet without SSR
const MapCanvas = dynamic(() => import('./components/map'), {
  ssr: false,
  loading: () => <LoadingMap />
})

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
    dialogColor, setDialogColor
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
        modal({ dialogRef, setDialogText, setDialogColor }, true, 'Processing data...', 'blue');

        const file = e.dataTransfer.files[0];
        const fileName = file.name.split('.');
        const name = fileName.at(0);
        const format = fileName.at(-1);
        const geojson = await convert(file, format);
        setGeojson(geojson);

        // Close modal
        modal({ dialogRef, setDialogText, setDialogColor }, false);
      } catch (error) {
        // Show error
        modal({ dialogRef, setDialogText, setDialogColor }, true, error.message, 'red');
      }
      
    };
  }, []);

  return (
    <>
      <Context.Provider value={states}>

        <dialog ref={dialogRef} id='modal' className='flexible vertical' style={{ color: dialogColor }} onClick={() => dialogRef.current.close()}>
          {dialogText}
        </dialog>
        
        <div className='flexible gap vertical' id='float'>
          <Layers />
          <Image />
        </div>

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
 * @returns {import('@turf/turf').FeatureCollection}
 */
async function convert(file, type){
  let geojson;

  switch (type){
    case 'json':
    case 'geojson':
      // Parse geojson
      const json = JSON.parse(await file.text());

      // Projection name
      const geojsonProjection = json.crs.properties.name;

      // Projection id
      const crs = geojsonProjection.split(':').at(-1);

      // Reproject
      geojson = reprojectGeoJSON(json, {
        from: 'EPSG:' + crs,
        to: 'EPSG:4326'
      });               
      break;
    case 'zip':
      geojson = await shpjs(await file.arrayBuffer());
      break;
    case 'kml':
    case 'kmz':
      geojson = kml(new DOMParser().parseFromString(await file.text(), 'text/xml'));
      break;
    default:
      throw new Error('Format is not supported');
  }

  // Check geojson area
  const areaGeojson = area(geojson);

  // If the area is bigger than 1_000_000 km square then it will be canceled
  if ((areaGeojson / 1e6 ) > 1e6){
    throw new Error('Area is too big!')
  }

  return geojson;
}

/**
 * @param {Boolean} open If true then the modal dialog is opened, if false then it will be closed
 * @param {String} text 
 * @param {String} color
 * @returns {VoidFunction}
 */
export function modal({ dialogRef, setDialogText, setDialogColor }, open, text, color){
  // Dialog components
  const dialog = dialogRef.current;

  if (!open) {
    dialog.close();
  } else {
    setDialogText(text);
    setDialogColor(color);
    dialog.showModal();
  }
}