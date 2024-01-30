'use client'

import dynamic from 'next/dynamic';
import { useState, createContext, useRef } from 'react';
import { useEffect } from 'react';
import shpjs from 'shpjs';
import { kml } from '@mapbox/togeojson';
import Layers from './components/layers';
import basemaps from './data/basemap.json' assert { type: 'json' }

// Context
export const Context = createContext();

// Import map canvas leaflet without SSR
const MapCanvas = dynamic(() => import('./components/map'), {
  ssr: false,
  loading: () => <LoadingMap />
})

// Main react components
export default function Home() {
  // States
  // Map ref
  const mapRef = useRef();

  // GeoJSON data to add to map
  const [ geojson, setGeojson ] = useState(undefined);

  // Basemap selected
  const [ basemap, setBasemap ] = useState(basemaps[0]);

  // All the states
  const states = {
    mapRef,
    geojson, setGeojson,
    basemap, setBasemap
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
        const file = e.dataTransfer.files[0];
        const fileName = file.name.split('.');
        const name = fileName.at(0);
        const format = fileName.at(-1);
        const geojson = await convert(file, format);
        console.log(geojson);
      } catch (error) {
        console.log(error.message);
      }
      
    };
  }, []);

  /**
   * Function to convert shapefile or KML to geojson
   * @param {Blob} file 
   * @param {string} type 
   */
  async function convert(file, type){
    let geojson;

    switch (type){
      case 'json':
      case 'geojson':
        geojson = JSON.parse(await file.text());
        break;
      case 'zip':
        geojson = await shpjs(await file.arrayBuffer());
        break;
      case 'kml':
      case 'kmz':
        geojson = kml(new DOMParser(await file.text()));
        break;
      default:
        throw new Error('Format is not supported');
    }

    return geojson;
  }

  return (
    <>
      <Context.Provider value={states}>
        
        <div>
          <Layers/>
        </div>

        <MapCanvas />

      </Context.Provider>
    </>
  );
}

// Loading div
function LoadingMap() {
  return (
    <div id='loading' className='flexible center1 center2'>
      Loading...
    </div>  
  )
}
